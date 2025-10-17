'use server'

import { connectToDatabase } from '@/database/mongoose'
import Watchlist from '@/database/models/watchlist.model'
import { auth } from '@/lib/better-auth/auth'
import { headers } from 'next/headers'

/**
 * Get all watchlist symbols for a user by their email
 * @param email - User's email address
 * @returns Array of stock symbols (strings) or empty array if user not found
 */
export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    // Connect to database
    const mongoose = await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      console.error('Database connection not established')
      return []
    }

    // Find user by email in Better Auth's users collection
    const user = await db.collection('user').findOne(
      { email },
      { projection: { _id: 1, id: 1 } }
    )

    if (!user) {
      console.log(`No user found with email: ${email}`)
      return []
    }

    // Get userId (Better Auth uses 'id' field, fallback to '_id')
    const userId = user.id || user._id?.toString()

    if (!userId) {
      console.error('User found but no valid ID')
      return []
    }

    // Query watchlist for this user
    const watchlistItems = await Watchlist.find(
      { userId },
      { symbol: 1, _id: 0 }
    ).lean()

    // Extract and return just the symbols
    return watchlistItems.map(item => item.symbol)
  } catch (error) {
    console.error('Error fetching watchlist symbols by email:', error)
    return []
  }
}

/**
 * Add a stock to user's watchlist
 * @param symbol - Stock symbol
 * @param company - Company name
 * @returns Success status and message
 */
export const addToWatchlist = async (
  symbol: string,
  company: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.email) {
      return { success: false, message: 'User not authenticated' }
    }

    const email = session.user.email

    // Connect to database
    const mongoose = await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      return { success: false, message: 'Database connection failed' }
    }

    // Find user by email
    const user = await db.collection('user').findOne(
      { email },
      { projection: { _id: 1, id: 1 } }
    )

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    const userId = user.id || user._id?.toString()

    if (!userId) {
      return { success: false, message: 'Invalid user ID' }
    }

    // Add to watchlist (will fail if already exists due to unique index)
    await Watchlist.create({
      userId,
      symbol: symbol.toUpperCase().trim(),
      company: company.trim()
    })

    return { success: true, message: 'Stock added to watchlist' }
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error
      return { success: false, message: 'Stock already in watchlist' }
    }
    console.error('Error adding to watchlist:', error)
    return { success: false, message: 'Failed to add stock to watchlist' }
  }
}

/**
 * Remove a stock from user's watchlist
 * @param symbol - Stock symbol
 * @returns Success status and message
 */
export const removeFromWatchlist = async (
  symbol: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.email) {
      return { success: false, message: 'User not authenticated' }
    }

    const email = session.user.email

    // Connect to database
    const mongoose = await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      return { success: false, message: 'Database connection failed' }
    }

    // Find user by email
    const user = await db.collection('user').findOne(
      { email },
      { projection: { _id: 1, id: 1 } }
    )

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    const userId = user.id || user._id?.toString()

    if (!userId) {
      return { success: false, message: 'Invalid user ID' }
    }

    // Remove from watchlist
    const result = await Watchlist.deleteOne({
      userId,
      symbol: symbol.toUpperCase().trim()
    })

    if (result.deletedCount === 0) {
      return { success: false, message: 'Stock not found in watchlist' }
    }

    return { success: true, message: 'Stock removed from watchlist' }
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return { success: false, message: 'Failed to remove stock from watchlist' }
  }
}

/**
 * Get watchlist symbols for the current authenticated user
 * @returns Array of stock symbols (strings) or empty array if user not found
 */
export const getCurrentUserWatchlistSymbols = async (): Promise<string[]> => {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.email) {
      return []
    }

    return getWatchlistSymbolsByEmail(session.user.email)
  } catch (error) {
    console.error('Error fetching current user watchlist symbols:', error)
    return []
  }
}

/**
 * Get all watchlist items for the current user
 * @returns Array of watchlist items with symbol, company, and addedAt
 */
export const getWatchlistItems = async (): Promise<Array<{
  symbol: string
  company: string
  addedAt: Date
}>> => {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.email) {
      return []
    }

    const email = session.user.email

    // Connect to database
    const mongoose = await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      return []
    }

    // Find user by email
    const user = await db.collection('user').findOne(
      { email },
      { projection: { _id: 1, id: 1 } }
    )

    if (!user) {
      return []
    }

    const userId = user.id || user._id?.toString()

    if (!userId) {
      return []
    }

    // Get watchlist items
    const watchlistItems = await Watchlist.find(
      { userId },
      { symbol: 1, company: 1, addedAt: 1, _id: 0 }
    ).sort({ addedAt: -1 }).lean() // Most recent first

    return watchlistItems.map(item => ({
      symbol: item.symbol,
      company: item.company,
      addedAt: item.addedAt
    }))
  } catch (error) {
    console.error('Error fetching watchlist items:', error)
    return []
  }
}
