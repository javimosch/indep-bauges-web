/**
 * Bootstrap sync service
 * Handles syncing data from MongoDB at application startup
 */

const { syncFromMongo } = require('../db/sync');
const { exec } = require('child_process');

/**
 * Sync data from MongoDB at bootstrap
 * @returns {Promise<Array>} - Array of synced files
 */
const syncFromMongoAtBootstrap = async () => {
  try {
    console.log('bootstrapSync.js syncFromMongoAtBootstrap', { message: 'Starting sync from MongoDB at bootstrap' });
    
    // Sync from MongoDB to filesystem
    const syncedFiles = await syncFromMongo();
    
    if (syncedFiles.length > 0) {
      console.log('bootstrapSync.js syncFromMongoAtBootstrap', { 
        message: `Successfully synced ${syncedFiles.length} files from MongoDB at bootstrap`,
        syncedFiles 
      });
      
      // Trigger rebuild
      return new Promise((resolve, reject) => {
        exec('npm run build', (error, stdout, stderr) => {
          if (error) {
            console.log('bootstrapSync.js syncFromMongoAtBootstrap rebuild error', {
              message: error.message,
              stack: error.stack
            });
            reject(error);
            return;
          }
          
          console.log('bootstrapSync.js syncFromMongoAtBootstrap rebuild success', {
            message: 'Site rebuilt successfully after MongoDB sync',
            stdout
          });
          
          if (stderr) {
            console.error('bootstrapSync.js syncFromMongoAtBootstrap rebuild stderr', { stderr });
          }
          
          resolve(syncedFiles);
        });
      });
    } else {
      console.log('bootstrapSync.js syncFromMongoAtBootstrap', { 
        message: 'No files to sync from MongoDB at bootstrap' 
      });
      return syncedFiles;
    }
  } catch (error) {
    console.log('bootstrapSync.js syncFromMongoAtBootstrap error', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  syncFromMongoAtBootstrap
};
