/**
 * Migration script to convert legacy sections to database-driven home page
 */

const mongoose = require('mongoose');
require('dotenv').config();

const HomeMigration = require('./src/utils/migration');

async function runMigration() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indep-bauges');
    console.log('✅ Connected to MongoDB');

    // Create migration instance
    const migration = new HomeMigration();

    // Check current status
    console.log('📊 Checking current migration status...');
    const status = await migration.getStatus();
    
    if (status.migrated) {
      console.log('ℹ️  Home page is already migrated:');
      console.log(`   - Title: ${status.page.title}`);
      console.log(`   - Status: ${status.page.status}`);
      console.log(`   - Template: ${status.page.template}`);
      console.log(`   - Sections: ${status.page.sectionsCount}`);
      console.log(`   - Migrated: ${status.page.migratedAt}`);
      console.log('');
      
      const shouldRemigrate = true; // For demo purposes, always remigrate
      if (shouldRemigrate) {
        console.log('🔄 Re-running migration...');
        await migration.migrate();
      } else {
        console.log('✅ Migration already completed');
      }
    } else {
      console.log('🚀 Starting fresh migration...');
      await migration.migrate();
    }

  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
  // Rollback migration
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indep-bauges');
      const migration = new HomeMigration();
      await migration.rollback();
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    } finally {
      await mongoose.disconnect();
    }
  })();
} else if (args.includes('--status')) {
  // Check status only
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indep-bauges');
      const migration = new HomeMigration();
      const status = await migration.getStatus();
      
      console.log('📊 Migration Status:');
      if (status.migrated) {
        console.log('✅ Home page is migrated');
        console.log(`   - Title: ${status.page.title}`);
        console.log(`   - Status: ${status.page.status}`);
        console.log(`   - Template: ${status.page.template}`);
        console.log(`   - Sections: ${status.page.sectionsCount}`);
        console.log(`   - Migrated: ${status.page.migratedAt}`);
      } else {
        console.log('❌ Home page is not migrated');
        if (status.usingLegacy) {
          console.log('   - Using legacy sections system');
        }
        if (status.error) {
          console.log(`   - Error: ${status.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Status check failed:', error);
    } finally {
      await mongoose.disconnect();
    }
  })();
} else {
  // Run migration
  runMigration();
}