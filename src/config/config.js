/**
 * Configuration settings for the application
 */

// Load environment variables from .env file
require('dotenv').config();
require('../utils/logger')

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Admin configuration
  admin: {
    password: process.env.ADMIN_PASSWORD || '123456', // Default for development
    jwtSecret: process.env.JWT_SECRET || 'indep-bauges-secret-key', // Default for development
    jwtExpiry: '24h'
  },

  // Paths configuration
  paths: {
    root: require('path').join(__dirname, '../..'),
    get dist() { return require('path').join(this.root, 'dist'); },
    get sections() { return require('path').join(this.root, 'src/sections'); },
    get index() { return require('path').join(this.dist, 'index.html'); }
  }
};
