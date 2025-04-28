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
    const { elementId, content, adminName = 'unknown', attributes = {} } = req.body;

    if (!elementId || content === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find the element in section files
    const result = await updateElementInSections(elementId, content, adminName, req, attributes);

    if (result.success) {
      // Trigger rebuild
      triggerRebuild((error) => {
        if (error) {
          return res.status(500).json({ success: false, message: 'Error rebuilding site' });
        }

        res.json({
          success: true,
          message: 'Content updated successfully',
          mongoSync: result.mongoSync
        });
      });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
