/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth
 * @desc    Authenticate admin and get token
 * @access  Public
 */
router.post('/', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (password !== config.admin.password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ role: 'admin' }, config.admin.jwtSecret, { expiresIn: config.admin.jwtExpiry });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.post('/verify', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Token is valid' });
});

module.exports = router;
