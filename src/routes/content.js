/**
 * Content editing routes
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth.middleware');
const { updateElementInSections } = require('../utils/content');
const { triggerRebuild } = require('../utils/build');

/**
 * @route   POST /api/save-content
 * @desc    Save content changes
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.debug('content.js router.post Received content update request', { body: req.body });
    const { elementId, content, adminName = 'unknown', attributes = {} } = req.body;

    if (!elementId || content === undefined) {
      console.debug('content.js router.post Validation failed - missing required fields', { elementId, content });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    console.debug('content.js router.post Validation passed', { elementId, contentLength: content?.length });

    // Find the element in section files
    console.debug('content.js router.post Calling updateElementInSections', { elementId, adminName, attributes });
    const result = await updateElementInSections(elementId, content, adminName, req, attributes);

    if (result.success) {
      console.debug('content.js router.post updateElementInSections succeeded', { result });
      // Trigger rebuild
      console.debug('content.js router.post Triggering site rebuild');
      triggerRebuild((error) => {
        if (error) {
          console.debug('content.js router.post Rebuild failed', { error: error.message });
          return res.status(500).json({ success: false, message: 'Error rebuilding site' });
        }
        console.debug('content.js router.post Rebuild completed successfully');

        console.debug('content.js router.post Sending success response', { mongoSync: result.mongoSync });
        res.json({
          success: true,
          message: 'Content updated successfully',
          mongoSync: result.mongoSync
        });
      });
    } else {
      console.debug('content.js router.post updateElementInSections failed', { message: result.message });
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.log('content.js router.post Error saving content', {message: error.message, stack: error.stack});
    console.error('Error saving content:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
