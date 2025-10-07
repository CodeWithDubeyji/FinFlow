'use server'

import { connectToDatabase } from '@/database/mongoose'
import Watchlist from '@/database/models/watchlist.model'

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
    const user = await db.collection('users').findOne(
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
