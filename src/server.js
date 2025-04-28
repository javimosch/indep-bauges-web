/**
 * Express server for serving the static website
 * Includes admin API for inline content editing
 * Includes MongoDB integration for persisting changes
 */

// Import configuration
const config = require('./config/config');

// Import dependencies
const express = require('express');
const fs = require('fs');

// Import database connection
const connectDB = require('./db/mongoose');
const { initializeMongo } = require('./db/sync');

// Import middleware
const { injectScriptsAndStyles } = require('./middleware/injection.middleware');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const auditRoutes = require('./routes/audit');
const syncRoutes = require('./routes/sync');
const injectionRoutes = require('./routes/injection');

// Create Express app
const app = express();

// Log configuration (but not sensitive values)
console.log(`Server starting in ${config.server.env} mode`);
console.log(`Admin authentication is ${config.admin.password ? 'configured' : 'not configured'}`);
console.log(`JWT signing is ${config.admin.jwtSecret ? 'configured' : 'not configured'}`);

// Connect to MongoDB and initialize
(async () => {
  const connected = await connectDB();
  if (connected) {
    await initializeMongo();
  }
})();

// Middleware for parsing JSON
app.use(express.json());

// Check if dist directory exists
if (!fs.existsSync(config.paths.dist)) {
  console.error('Error: dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Check if index.html exists in dist directory
if (!fs.existsSync(config.paths.index)) {
  console.error('Error: index.html not found in dist directory. Please run "npm run build" first.');
  process.exit(1);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/save-content', contentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/sync-from-mongo', syncRoutes);
app.use('/api/injections', injectionRoutes);

// Inject scripts and styles into HTML responses
app.use(injectScriptsAndStyles);

// Serve static files from the dist directory
app.use(express.static(config.paths.dist));

// Start the server
app.listen(config.server.port, () => {
  console.log(`Server running at http://localhost:${config.server.port}`);
  console.log(`Serving files from: ${config.paths.dist}`);
});
