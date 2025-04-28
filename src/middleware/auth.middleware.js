/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, config.admin.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};
