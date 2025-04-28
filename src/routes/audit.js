/**
 * Audit log routes
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth.middleware');
const { Audit } = require('../models');

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB is not connected'
      });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (req.query.adminName) {
      filter.adminName = req.query.adminName;
    }

    if (req.query.elementType) {
      filter.elementType = req.query.elementType;
    }

    if (req.query.filename) {
      filter.filename = req.query.filename;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filter.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.timestamp = { $lte: new Date(req.query.endDate) };
    }

    // Get audit logs from MongoDB
    const totalCount = await Audit.countDocuments(filter);
    const auditLogs = await Audit.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Get unique admin names and element types for filters
    const uniqueAdminNames = await Audit.distinct('adminName');
    const uniqueElementTypes = await Audit.distinct('elementType');
    const uniqueFilenames = await Audit.distinct('filename');

    res.json({
      success: true,
      data: {
        logs: auditLogs,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit)
        },
        filters: {
          adminNames: uniqueAdminNames,
          elementTypes: uniqueElementTypes,
          filenames: uniqueFilenames
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs: ' + error.message
    });
  }
});

module.exports = router;
