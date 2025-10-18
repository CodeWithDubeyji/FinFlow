'use server'

import { cache } from 'react'
import {
  getDateRange,
  validateArticle,
  formatArticle
} from '@/lib/utils'

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY

/**
 * Fetch JSON from a URL with optional caching
 * @param url - Full URL to fetch
 * @param revalidateSeconds - Optional revalidation time in seconds
 * @returns Parsed JSON response
 */
async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> {
  const options: RequestInit = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' }

  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${response.statusText} for ${url}`
    )
  }

  return response.json()
}

/**
 * Get news articles - personalized if symbols provided, general market news otherwise
 * @param symbols - Optional array of stock symbols
 * @returns Array of up to 6 news articles
 */
export async function getNews(
  symbols?: string[]
): Promise<MarketNewsArticle[]> {
  try {
    if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not configured')
    }

    // Date range: last 5 days
    const { from, to } = getDateRange(5)

    // If symbols provided, fetch company news round-robin style
    if (symbols && symbols.length > 0) {
      // Clean and uppercase symbols
      const cleanedSymbols = symbols
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)

      if (cleanedSymbols.length === 0) {
        // Fall back to general news if all symbols invalid
        return getGeneralNews(from, to)
      }

      const articles: MarketNewsArticle[] = []
      const maxRounds = 6
      let symbolIndex = 0

      // Track raw Finnhub IDs to prevent duplicates
      const rawIdSet = new Set<string>()

      // Round-robin through symbols, max 6 iterations
      for (let round = 0; round < maxRounds && articles.length < 6; round++) {
        const symbol = cleanedSymbols[symbolIndex % cleanedSymbols.length]

        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`
          const newsData = await fetchJSON<RawNewsArticle[]>(url)

          // Find first valid article we haven't added yet using raw Finnhub ID
          const validArticle = newsData.find(
            article =>
              validateArticle(article) &&
              !rawIdSet.has(String(article.id))
          )

          if (validArticle) {
            // Add raw ID to prevent future duplicates
            rawIdSet.add(String(validArticle.id))
            // Format and add the article
            articles.push(formatArticle(validArticle, true, symbol, round))
          }
        } catch (error) {
          console.error(`Error fetching news for symbol ${symbol}:`, error)
        }

        symbolIndex++
      }

      // Sort by datetime (newest first)
      const sortedArticles = articles.sort((a, b) => b.datetime - a.datetime)

      // If symbols were requested but no articles found, fall back to general news
      if (sortedArticles.length === 0) {
        return getGeneralNews(from, to)
      }

      return sortedArticles
    }

    // No symbols - fetch general market news
    return getGeneralNews(from, to)
  } catch (error) {
    console.error('Error in getNews:', error)
    throw new Error('Failed to fetch news')
  }
}

/**
 * Get general market news when no symbols are provided
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @returns Array of up to 6 deduplicated news articles
 */
async function getGeneralNews(
  from: string,
  to: string
): Promise<MarketNewsArticle[]> {
  const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`
  const newsData = await fetchJSON<RawNewsArticle[]>(url)

  // Deduplicate by id, url, and headline
  const seenIdentifiers = new Set<string>()
  const uniqueArticles: MarketNewsArticle[] = []

  for (let index = 0; index < newsData.length; index++) {
    const article = newsData[index]
    
    if (!validateArticle(article)) continue

    const identifier = `${article.id}-${article.url}-${article.headline}`

    if (!seenIdentifiers.has(identifier)) {
      seenIdentifiers.add(identifier)
      uniqueArticles.push(formatArticle(article, false, undefined, index))
    }

    // Stop once we have 6 articles
    if (uniqueArticles.length >= 6) break
  }

  // Sort by datetime (newest first)
  return uniqueArticles.sort((a, b) => b.datetime - a.datetime)
}

// Types for stock search functionality
interface FinnhubSearchResult {
  symbol: string
  description: string
  displaySymbol: string
  type: string
  exchange?: string
}

interface FinnhubSearchResponse {
  result: FinnhubSearchResult[]
}

interface StockWithWatchlistStatus {
  symbol: string
  name: string
  exchange: string
  type: string
  isInWatchlist: boolean
}

// Popular stock symbols for default search
const POPULAR_STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'BABA', 'ORCL'
]

/**
 * Search for stocks using Finnhub API
 * @param query - Optional search query
 * @returns Array of stocks with watchlist status
 */
export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not configured')
    }

    let searchResults: FinnhubSearchResult[] = []

    if (!query) {
      // No query - fetch top 10 popular symbols
      const topSymbols = POPULAR_STOCK_SYMBOLS.slice(0, 10)

      for (const symbol of topSymbols) {
        try {
          const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`
          const profile = await fetchJSON<any>(url, 3600)

          if (profile && profile.name) {
            searchResults.push({
              symbol,
              description: profile.name,
              displaySymbol: symbol,
              type: 'Common Stock',
              exchange: profile.exchange || 'US'
            })
          }
        } catch (error) {
          console.error(`Error fetching profile for ${symbol}:`, error)
        }
      }
    } else {
      // Query provided - search Finnhub
      const trimmedQuery = query.trim()
      if (trimmedQuery) {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmedQuery)}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`
        const response = await fetchJSON<FinnhubSearchResponse>(url, 1800)
        searchResults = response.result || []
      }
    }

    // Map to StockWithWatchlistStatus and limit to 15
    const stocks: StockWithWatchlistStatus[] = searchResults
      .slice(0, 15)
      .map(result => ({
        symbol: result.symbol.toUpperCase(),
        name: result.description,
        exchange: result.displaySymbol || 'US',
        type: result.type || 'Stock',
        isInWatchlist: false
      }))

    return stocks
  } catch (error) {
    console.error('Error in stock search:', error)
    return []
  }
})


