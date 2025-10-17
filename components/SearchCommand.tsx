import { useState, useEffect } from 'react'
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
import { set } from 'mongoose'
import { searchStocks } from '@/lib/actions/finnhub.actions'
import { useDebounce } from '@/hooks/useDebounce'

export function SearchCommand ({
  renderAs = 'text',
  label = 'Add stocks',
  initialStocks = []
}: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks)

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

  const handleSearchStocks = async () => {
    if (!searchTerm.trim()) {
      return setStocks(initialStocks)
    }

    setLoading(true)
    try {
      const results = await searchStocks(searchTerm.trim())
      setStocks(results)
    } catch (e) {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(handleSearchStocks, 300)

  useEffect(() => {
    debouncedSearch()
  }, [searchTerm])

  const handleOpenModal = () => {
    setOpen(true)
  }

  const handleSelectStock = () => {
    setOpen(false)
    setSearchTerm('')
    setStocks(initialStocks)
  }

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={handleOpenModal} className='cursor-pointer'>
          {label}
        </span>
      ) : (
        <Button onClick={handleOpenModal}>{label}</Button>
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
              <div className='search-count'>
                {isSearchMode ? 'Search Results' : 'Popular Stocks'}
                {` `}({displayStocks?.length || 0})
              </div>
              {displayStocks.map((stock, i) => (
                <li key={stock.symbol} className='search-item'>
                  <Link
                    href={`/stock/${stock.symbol}`}
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
