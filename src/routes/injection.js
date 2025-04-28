/**
 * Injection management routes
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth.middleware');
const { 
  createInjection, 
  updateInjection, 
  deleteInjection, 
  getInjections, 
  getInjectionById 
} = require('../db/injection');

/**
 * @route   GET /api/injections
 * @desc    Get all injections with optional filtering
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { type, location, origin, isActive } = req.query;

    // Prepare filters object
    const filters = {};
    if (type) filters.type = type;
    if (location) filters.location = location;
    if (origin) filters.origin = origin;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const injections = await getInjections(filters);

    res.json({
      success: true,
      data: injections
    });
  } catch (error) {
    console.error('Error fetching injections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching injections: ' + error.message
    });
  }
});

/**
 * @route   GET /api/injections/:id
 * @desc    Get injection by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const injectionId = req.params.id;

    try {
      const injection = await getInjectionById(injectionId);
      res.json({
        success: true,
        data: injection
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error fetching injection:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

/**
 * @route   POST /api/injections
 * @desc    Create a new injection
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, code, location, origin, isActive } = req.body;
    const adminName = req.body.adminName || 'unknown';

    if (!name || !type || !code || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, code, and location are required'
      });
    }

    // Generate a unique ID
    const injectionId = `injection-${uuidv4()}`;

    const injectionData = {
      injectionId,
      name,
      type,
      code,
      location,
      origin: origin || 'user',
      isActive: isActive !== undefined ? isActive : true
    };

    const injection = await createInjection(injectionData, adminName);

    res.status(201).json({
      success: true,
      message: 'Injection created successfully',
      data: injection
    });
  } catch (error) {
    console.error('Error creating injection:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating injection: ' + error.message
    });
  }
});

/**
 * @route   PUT /api/injections/:id
 * @desc    Update an existing injection
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const injectionId = req.params.id;
    const { name, type, code, location, isActive } = req.body;
    const adminName = req.body.adminName || 'unknown';

    // Create update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (code !== undefined) updateData.code = code;
    if (location !== undefined) updateData.location = location;
    if (isActive !== undefined) updateData.isActive = isActive;

    try {
      const updatedInjection = await updateInjection(injectionId, updateData, adminName);

      res.json({
        success: true,
        message: 'Injection updated successfully',
        data: updatedInjection
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('system injections')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating injection:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating injection: ' + error.message
    });
  }
});

/**
 * @route   DELETE /api/injections/:id
 * @desc    Delete an injection
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const injectionId = req.params.id;

    try {
      await deleteInjection(injectionId);

      res.json({
        success: true,
        message: 'Injection deleted successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('system injections')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error deleting injection:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting injection: ' + error.message
    });
  }
});

module.exports = router;
