'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWatchlistItems} from '@/lib/actions/watchlist.actions'
import { toast } from 'sonner'
import Link from 'next/link'
import { StarButton } from './StarButton'

interface WatchlistItem {
  symbol: string
  company: string
  addedAt: Date
}

interface StockData {
  symbol: string
  company: string
}

export default function WatchlistTable() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([])
  const [stockData, setStockData] = useState<Record<string, StockData>>({})
  const [loading, setLoading] = useState(true)

  // Fetch watchlist items on mount
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const items = await getWatchlistItems()
        setWatchlistItems(items)
      } catch (error) {
        console.error('Error fetching watchlist:', error)
        toast.error('Failed to load watchlist')
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [])

  // Fetch stock data for watchlist items
  useEffect(() => {
    if (watchlistItems.length === 0) return

    const fetchStockData = async () => {
      const data: Record<string, StockData> = {}

      for (const item of watchlistItems) {
        try {
          // This would typically call a real-time stock API
          // For now, we'll use mock data
          data[item.symbol] = {
            symbol: item.symbol,
            company: item.company,
          }
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error)
        }
      }

      setStockData(data)
    }

    fetchStockData()
  }, [watchlistItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading watchlist...</div>
      </div>
    )
  }

  if (watchlistItems.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">Your watchlist is empty, add stocks in your watchlist.</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-gray-700 w-12"></th>
            <th className="text-left py-3 px-4 font-medium text-gray-200">Company</th>
            <th className="text-left py-3 px-4 font-medium text-gray-200">Symbol</th>
          </tr>
        </thead>
        <tbody>
          {watchlistItems.map((item) => {
            const data = stockData[item.symbol]

            return (
              <tr key={item.symbol} className="border-b">
                <td className="py-3 px-4">
                  <StarButton
                    symbol={item.symbol}
                    company={item.company}
                    isInWatchlist={true}
                    onWatchlistChange={(symbol, isAdded) => {
                      if (!isAdded) {
                        // Remove from local state when star is clicked (remove from watchlist)
                        setWatchlistItems(prev => prev.filter(item => item.symbol !== symbol))
                        setStockData(prev => {
                          const newData = { ...prev }
                          delete newData[symbol]
                          return newData
                        })
                      }
                    }}
                    size="md"
                  />
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/stocks/${item.symbol}`}
                  >
                    {item.company}
                  </Link>
                </td>
                <td className="py-3 px-4 font-medium">{item.symbol}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}