/**
 * MongoDB sync routes
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth.middleware');
const { syncFromMongo, saveAuditLog } = require('../db/sync');
const { triggerRebuild } = require('../utils/build');

/**
 * @route   POST /api/sync-from-mongo
 * @desc    Sync content from MongoDB to filesystem
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { adminName = 'unknown' } = req.body;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB is not connected'
      });
    }

    console.log(`Sync from MongoDB requested by admin: ${adminName}`);

    // Sync from MongoDB to filesystem
    const syncedFiles = await syncFromMongo();

    if (syncedFiles.length > 0) {
      // Create audit log entry for the sync
      await saveAuditLog({
        filename: 'system',
        elementId: 'sync-from-mongo',
        elementType: 'system',
        previousContent: 'N/A',
        newContent: `Synced ${syncedFiles.length} files from MongoDB`,
        adminName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Trigger rebuild
      triggerRebuild((error) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: 'Error rebuilding site after sync'
          });
        }

        res.json({
          success: true,
          message: 'Successfully synced from MongoDB',
          syncedFiles
        });
      });
    } else {
      res.json({
        success: true,
        message: 'No files to sync from MongoDB',
        syncedFiles: []
      });
    }
  } catch (error) {
    console.error('Error syncing from MongoDB:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing from MongoDB: ' + error.message
    });
  }
});

module.exports = router;
