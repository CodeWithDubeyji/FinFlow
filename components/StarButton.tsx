'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions'
import { toast } from 'sonner'

interface StarButtonProps {
  symbol: string
  company: string
  isInWatchlist: boolean
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StarButton({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist,
  onWatchlistChange,
  className = '',
  size = 'md'
}: StarButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist)
  const [isPending, startTransition] = useTransition()

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    startTransition(async () => {
      try {
        const currentStatus = isInWatchlist
        const newStatus = !currentStatus

        // Optimistic update
        setIsInWatchlist(newStatus)

        let result
        if (newStatus) {
          result = await addToWatchlist(symbol, company)
        } else {
          result = await removeFromWatchlist(symbol)
        }

        if (!result.success) {
          // Revert optimistic update on failure
          setIsInWatchlist(currentStatus)
          toast.error(result.message)
        } else {
          toast.success(result.message)
          // Notify parent component of the change
          onWatchlistChange?.(symbol, newStatus)
        }
      } catch (error) {
        // Revert optimistic update on error
        const currentStatus = isInWatchlist
        setIsInWatchlist(currentStatus)
        toast.error('Failed to update watchlist')
      }
    })
  }

  return (
    <Star
      className={`${sizeClasses[size]} cursor-pointer rounded-full p-1 transition-all hover:bg-gray-100 ${
        isInWatchlist
          ? 'fill-yellow-400 text-yellow-400'
          : 'text-gray-400 hover:text-yellow-400'
      } ${className}`}
      onClick={handleToggleWatchlist}
    />
  )
}