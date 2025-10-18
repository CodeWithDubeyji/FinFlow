import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

let cached = global.mongooseCache

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null }
}

export const connectToDatabase = async () => {
  if (!MONGODB_URI) throw new Error(' MONGODB_URI must be set within .env ')

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }
  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  console.log(
    `Connected to Database ${process.env.NODE_ENV} - ${
      cached.conn.connection.db?.databaseName || 'unknown'
    }`
  )

  return cached.conn
}
