#!/usr/bin/env node

/**
 * CLI tool for syncing between MongoDB and filesystem
 * 
 * Usage:
 *   node src/scripts/sync-mongo.js --from-mongo  # Sync from MongoDB to filesystem
 *   node src/scripts/sync-mongo.js --to-mongo    # Sync from filesystem to MongoDB
 */

// Load environment variables
require('dotenv').config();

const connectDB = require('../db/mongoose');
const { syncFromMongo, syncToMongo } = require('../db/sync');

// Parse command line arguments
const args = process.argv.slice(2);
const fromMongo = args.includes('--from-mongo');
const toMongo = args.includes('--to-mongo');

// Main function
async function main() {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }
    
    // Determine sync direction
    if (fromMongo) {
      console.log('Syncing from MongoDB to filesystem...');
      const syncedFiles = await syncFromMongo();
      console.log(`Synced ${syncedFiles.length} files from MongoDB to filesystem`);
    } else if (toMongo) {
      console.log('Syncing from filesystem to MongoDB...');
      const syncedFiles = await syncToMongo();
      console.log(`Synced ${syncedFiles.length} files from filesystem to MongoDB`);
    } else {
      console.error('Please specify sync direction: --from-mongo or --to-mongo');
      process.exit(1);
    }
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  }
}

// Run the main function
main();
