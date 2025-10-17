'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions'
import { PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

interface WatchlistButtonProps {
  symbol: string
  company: string
  isInWatchlist: boolean
}

export default function WatchlistButton({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist)
  const [isPending, startTransition] = useTransition()

  const handleToggleWatchlist = () => {
    startTransition(async () => {
      try {
        // Optimistic update
        const newState = !isInWatchlist
        setIsInWatchlist(newState)

        let result
        if (newState) {
          // Adding to watchlist
          result = await addToWatchlist(symbol, company)
        } else {
          // Removing from watchlist
          result = await removeFromWatchlist(symbol)
        }

        if (!result.success) {
          // Revert optimistic update on failure
          setIsInWatchlist(!newState)
          toast.error(result.message)
        } else {
          toast.success(result.message)
        }
      } catch (error) {
        // Revert optimistic update on error
        setIsInWatchlist(!isInWatchlist)
        toast.error('Failed to update watchlist')
      }
    })
  }

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={isPending}
      variant="ghost"
      size="sm"
      className={`w-full gap-2 ${
        isInWatchlist
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-yellow-500 hover:bg-yellow-600 text-black'
      }`}
    >
      {isInWatchlist ? (
        <>
          <XIcon className="w-4 h-4" />
          Remove from Watchlist
        </>
      ) : (
        <>
          <PlusIcon className="w-4 h-4" />
          Add to Watchlist
        </>
      )}
    </Button>
  )
}