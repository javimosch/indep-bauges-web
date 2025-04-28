/**
 * MongoDB to filesystem sync utilities
 */

const fs = require('fs');
const path = require('path');
const { Section, Audit } = require('../models');

// Path to sections directory
const sectionsDir = path.join(__dirname, '../../src/sections');

/**
 * Save a section file to MongoDB
 * @param {string} filename - The filename of the section
 * @param {string} content - The content of the section file
 * @param {string} adminName - The name of the admin who made the change
 * @returns {Promise<Object>} - The saved section document
 */
const saveSectionToMongo = async (filename, content, adminName = 'system') => {
  try {
    // Check if section already exists
    const existingSection = await Section.findOne({ filename });
    
    if (existingSection) {
      // Update existing section
      existingSection.content = content;
      existingSection.updatedAt = new Date();
      existingSection.updatedBy = adminName;
      await existingSection.save();
      return existingSection;
    } else {
      // Create new section
      const newSection = new Section({
        filename,
        content,
        updatedBy: adminName
      });
      await newSection.save();
      return newSection;
    }
  } catch (error) {
    console.error(`Error saving section ${filename} to MongoDB:`, error);
    throw error;
  }
};

/**
 * Save an audit log entry
 * @param {Object} auditData - The audit data
 * @returns {Promise<Object>} - The saved audit document
 */
const saveAuditLog = async (auditData) => {
  try {
    const audit = new Audit(auditData);
    await audit.save();
    return audit;
  } catch (error) {
    console.error('Error saving audit log:', error);
    // Don't throw error to prevent blocking the main operation
    return null;
  }
};

/**
 * Sync all sections from MongoDB to filesystem
 * @returns {Promise<Array>} - Array of synced filenames
 */
const syncFromMongo = async () => {
  try {
    // Ensure sections directory exists
    if (!fs.existsSync(sectionsDir)) {
      fs.mkdirSync(sectionsDir, { recursive: true });
    }
    
    // Get all sections from MongoDB
    const sections = await Section.find({});
    
    if (sections.length === 0) {
      console.log('No sections found in MongoDB to sync');
      return [];
    }
    
    const syncedFiles = [];
    
    // Write each section to filesystem
    for (const section of sections) {
      const filePath = path.join(sectionsDir, section.filename);
      fs.writeFileSync(filePath, section.content);
      syncedFiles.push(section.filename);
      console.log(`Synced ${section.filename} from MongoDB to filesystem`);
    }
    
    return syncedFiles;
  } catch (error) {
    console.error('Error syncing from MongoDB:', error);
    throw error;
  }
};

/**
 * Sync all sections from filesystem to MongoDB
 * @returns {Promise<Array>} - Array of synced filenames
 */
const syncToMongo = async () => {
  try {
    // Ensure sections directory exists
    if (!fs.existsSync(sectionsDir)) {
      console.error('Sections directory not found');
      return [];
    }
    
    // Get all HTML files in sections directory
    const files = fs.readdirSync(sectionsDir)
      .filter(file => file.endsWith('.html'));
    
    if (files.length === 0) {
      console.log('No section files found in filesystem to sync');
      return [];
    }
    
    const syncedFiles = [];
    
    // Save each file to MongoDB
    for (const filename of files) {
      const filePath = path.join(sectionsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      await saveSectionToMongo(filename, content);
      syncedFiles.push(filename);
      console.log(`Synced ${filename} from filesystem to MongoDB`);
    }
    
    return syncedFiles;
  } catch (error) {
    console.error('Error syncing to MongoDB:', error);
    throw error;
  }
};

/**
 * Initialize MongoDB with sections from filesystem if they don't exist
 * @returns {Promise<void>}
 */
const initializeMongo = async () => {
  try {
    // Check if any sections exist in MongoDB
    const count = await Section.countDocuments();
    
    if (count === 0) {
      console.log('No sections found in MongoDB, initializing from filesystem');
      await syncToMongo();
    } else {
      console.log(`Found ${count} sections in MongoDB`);
    }
  } catch (error) {
    console.error('Error initializing MongoDB:', error);
  }
};

module.exports = {
  saveSectionToMongo,
  saveAuditLog,
  syncFromMongo,
  syncToMongo,
  initializeMongo
};
