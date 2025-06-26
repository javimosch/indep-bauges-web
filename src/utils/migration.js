/**
 * Migration utility to convert legacy sections to database-driven home page
 */

const mongoose = require('mongoose');
const SectionExtractor = require('./section-extractor');
const Page = require('../models/Page');

class HomeMigration {
  constructor() {
    this.extractor = new SectionExtractor();
  }
  
  async migrate() {
    console.log('🚀 Starting home page migration...');
    
    try {
      // Step 1: Create backup of existing sections
      console.log('📦 Creating backup...');
      await this.extractor.createBackup();
      
      // Step 2: Check if home page already exists in database
      const existingHomePage = await Page.findOne({ slug: 'home' });
      if (existingHomePage) {
        console.log('⚠️  Home page already exists in database');
        const shouldOverwrite = await this.promptOverwrite();
        if (!shouldOverwrite) {
          console.log('❌ Migration cancelled by user');
          return false;
        }
      }
      
      // Step 3: Extract content from sections
      console.log('🔄 Extracting section content...');
      const extractedSections = await this.extractor.extractAllSections();
      
      // Step 4: Extract metadata
      console.log('📋 Extracting metadata...');
      const metadata = await this.extractor.extractMetadata();
      
      // Step 5: Generate home page data
      console.log('🏗️  Generating home page data...');
      const homePageData = this.extractor.generateHomePageData(extractedSections, metadata);
      
      // Step 6: Save to database
      console.log('💾 Saving to database...');
      if (existingHomePage) {
        // Update existing page
        Object.assign(existingHomePage, homePageData);
        await existingHomePage.save();
        console.log('✅ Home page updated in database');
      } else {
        // Create new page
        const homePage = new Page(homePageData);
        await homePage.save();
        console.log('✅ Home page created in database');
      }
      
      // Step 7: Verify migration
      console.log('🔍 Verifying migration...');
      const verificationResult = await this.verifyMigration();
      
      if (verificationResult.success) {
        console.log('🎉 Migration completed successfully!');
        console.log('📊 Migration summary:');
        console.log(`   - Sections migrated: ${Object.keys(extractedSections).length}`);
        console.log(`   - Home page slug: home`);
        console.log(`   - Template: home`);
        console.log(`   - Status: published`);
        console.log('');
        console.log('🌐 You can now access the new home page at: http://localhost:3000/');
        console.log('🔧 The legacy system is preserved as backup in src/sections-backup/');
        
        return true;
      } else {
        console.error('❌ Migration verification failed:', verificationResult.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
  }
  
  async promptOverwrite() {
    // In a real scenario, you might want to use a proper prompt library
    // For now, we'll default to true for automated migration
    console.log('   Overwriting existing home page...');
    return true;
  }
  
  async verifyMigration() {
    try {
      // Check if home page exists and has correct structure
      const homePage = await Page.findOne({ slug: 'home' });
      
      if (!homePage) {
        return { success: false, error: 'Home page not found in database' };
      }
      
      if (homePage.template !== 'home') {
        return { success: false, error: 'Home page template is not set to "home"' };
      }
      
      if (!homePage.sections || Object.keys(homePage.sections).length === 0) {
        return { success: false, error: 'Home page has no sections' };
      }
      
      if (homePage.status !== 'published') {
        return { success: false, error: 'Home page is not published' };
      }
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async rollback() {
    console.log('🔄 Rolling back migration...');
    
    try {
      // Remove home page from database
      const result = await Page.deleteOne({ slug: 'home' });
      
      if (result.deletedCount > 0) {
        console.log('✅ Home page removed from database');
        console.log('🔧 Legacy system will now handle the home page again');
        return true;
      } else {
        console.log('⚠️  No home page found in database to remove');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }
  
  async getStatus() {
    try {
      const homePage = await Page.findOne({ slug: 'home' });
      
      if (homePage) {
        return {
          migrated: true,
          page: {
            id: homePage._id,
            title: homePage.title,
            status: homePage.status,
            template: homePage.template,
            sectionsCount: Object.keys(homePage.sections || {}).length,
            migratedAt: homePage.migrationInfo?.migratedAt,
            migrationVersion: homePage.migrationInfo?.migrationVersion
          }
        };
      } else {
        return {
          migrated: false,
          usingLegacy: true
        };
      }
      
    } catch (error) {
      return {
        migrated: false,
        error: error.message
      };
    }
  }
}

module.exports = HomeMigration;