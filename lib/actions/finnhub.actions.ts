'use server'

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
