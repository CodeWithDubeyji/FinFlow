'use client'
import { useState, useEffect, useTransition } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command'
import { Button } from './ui/button'
import { Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { searchStocks } from '@/lib/actions/finnhub.actions'
import { getCurrentUserWatchlistSymbols } from '@/lib/actions/watchlist.actions'
import { useDebounce } from '@/hooks/useDebounce'
import { StarButton } from './StarButton'

type StockWithWatchlistStatus = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  isInWatchlist: boolean;
};

export function SearchCommand ({
  renderAs = 'text',
  label = 'Add stocks',
  initialStocks = [],
  className = ''
}: {
  renderAs?: 'button' | 'text';
  label?: string;
  initialStocks?: StockWithWatchlistStatus[];
  className?: string;
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks)
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const isSearchMode = !!searchTerm.trim()

  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Fetch user's watchlist symbols when modal opens
  useEffect(() => {
    if (open) {
      const fetchWatchlistSymbols = async () => {
        try {
          const symbols = await getCurrentUserWatchlistSymbols()
          setWatchlistSymbols(new Set(symbols))
        } catch (error) {
          console.error('Error fetching watchlist symbols:', error)
        }
      }

      fetchWatchlistSymbols()
    }
  }, [open])

  const handleSearchStocks = async () => {
    if (!searchTerm.trim()) {
      return setStocks(initialStocks)
    }

    setLoading(true)
    try {
      const results = await searchStocks(searchTerm.trim())
      // Update watchlist status based on user's actual watchlist
      const updatedResults = results.map(stock => ({
        ...stock,
        isInWatchlist: watchlistSymbols.has(stock.symbol.toUpperCase())
      }))
      setStocks(updatedResults)
    } catch (e) {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(handleSearchStocks, 300)

  useEffect(() => {
    debouncedSearch()
  }, [searchTerm, watchlistSymbols])

  // Update watchlist status when watchlist symbols change
  useEffect(() => {
    if (stocks.length > 0) {
      const updatedStocks = stocks.map(stock => ({
        ...stock,
        isInWatchlist: watchlistSymbols.has(stock.symbol.toUpperCase())
      }))
      setStocks(updatedStocks)
    }
  }, [watchlistSymbols])

  const handleOpenModal = () => {
    setOpen(true)
  }

  const handleSelectStock = () => {
    setOpen(false)
    setSearchTerm('')
    setStocks(initialStocks)
  }

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    // Update the watchlist symbols set
    const newWatchlistSymbols = new Set(watchlistSymbols)
    if (isAdded) {
      newWatchlistSymbols.add(symbol.toUpperCase())
    } else {
      newWatchlistSymbols.delete(symbol.toUpperCase())
    }
    setWatchlistSymbols(newWatchlistSymbols)

    // Update the stock in the current list
    setStocks(prevStocks =>
      prevStocks.map(stock =>
        stock.symbol.toUpperCase() === symbol.toUpperCase()
          ? { ...stock, isInWatchlist: isAdded }
          : stock
      )
    )
  }

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={handleOpenModal} className='cursor-pointer'>
          {label}
        </span>
      ) : (
        <Button onClick={handleOpenModal} className={className}>{label}</Button>
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className='search-dialog'
      >
        <div className='search-field'>
          <CommandInput
            placeholder='Search stocks...'
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {loading && <Loader2 className='search-loader' />}
        </div>
        <CommandList className='search-list'>
          {loading ? (
            <CommandEmpty className='search-list-empty'>
              No results found.
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div>
              {isSearchMode ? 'No results found' : 'No stocks available'}
            </div>
          ) : (
            <ul>
              <li className='search-count'>
                {isSearchMode ? 'Search Results' : 'Popular Stocks'}
                {` `}({displayStocks?.length || 0})
              </li>
              {displayStocks.map((stock, i) => (
                <li key={stock.symbol} className='search-item'>
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className='search-item-link'
                  >
                    <TrendingUp className='h-4 w-4 text-gray-500' />
                    <div className='flex-1'>
                      <div className='search-item-name'>{stock.name}</div>
                      <div className='text-sm text-gray-500'>
                        {stock.symbol} &#8226; {stock.exchange} &#8226;{' '}
                        {stock.type}
                      </div>
                    </div>
                      <StarButton
                        symbol={stock.symbol}
                        company={stock.name}
                        isInWatchlist={stock.isInWatchlist}
                        onWatchlistChange={handleWatchlistChange}
                        size="md"
                      />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
