import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

async function testDatabaseConnection() {
  console.log(`${colors.blue}🔍 Starting database connection test...${colors.reset}\n`)

  // Step 1: Check if MONGODB_URI exists
  console.log(`${colors.yellow}Step 1: Checking environment variables...${colors.reset}`)
  if (!MONGODB_URI) {
    console.error(`${colors.red}❌ MONGODB_URI is not defined in .env file${colors.reset}`)
    process.exit(1)
  }
  console.log(`${colors.green}✅ MONGODB_URI found${colors.reset}`)

  // Step 2: Attempt connection
  console.log(`${colors.yellow}Step 2: Connecting to MongoDB...${colors.reset}`)
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    })
    console.log(`${colors.green}✅ Successfully connected to MongoDB!${colors.reset}`)
    console.log(`   Database: ${mongoose.connection.db?.databaseName}${colors.reset}`)
    console.log(`   Host: ${mongoose.connection.host}${colors.reset}\n`)
  } catch (error) {
    console.error(`${colors.red}❌ Failed to connect to MongoDB${colors.reset}`)
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`)
    process.exit(1)
  }

  // Step 3: Close connection
  console.log(`${colors.yellow}Step 3: Closing connection...${colors.reset}`)
  await mongoose.connection.close()
  console.log(`${colors.green}✅ Connection closed successfully${colors.reset}\n`)

  // Final summary
  console.log(`${colors.green}═══════════════════════════════════════${colors.reset}`)
  console.log(`${colors.green}🎉 All tests passed successfully!${colors.reset}`)
  console.log(`${colors.green}Your database connection is working perfectly.${colors.reset}`)
  console.log(`${colors.green}═══════════════════════════════════════${colors.reset}`)

  process.exit(0)
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error(`${colors.red}❌ Unexpected error:${colors.reset}`, error)
  process.exit(1)
})