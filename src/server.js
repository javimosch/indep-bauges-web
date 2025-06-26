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
const { pageMiddleware } = require('./middleware/page.middleware');
const { injectAdminPanel } = require('./middleware/admin-panel.middleware');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const auditRoutes = require('./routes/audit');
const syncRoutes = require('./routes/sync');
const injectionRoutes = require('./routes/injection');
const adminPagesRoutes = require('./routes/admin/pages');
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminAuthRoutes = require('./routes/admin/auth');

// Create Express app
const app = express();

// Global variable to track if home page exists in database
let hasHomePage = false;

// Log configuration (but not sensitive values)
console.log(`Server starting in ${config.server.env} mode`);
console.log(`Admin authentication is ${config.admin.password ? 'configured' : 'not configured'}`);
console.log(`JWT signing is ${config.admin.jwtSecret ? 'configured' : 'not configured'}`);

// Connect to MongoDB and initialize
(async () => {
  const connected = await connectDB();
  if (connected) {
    await initializeMongo();
    
    // Check if home page exists in database at startup
    try {
      const Page = require('./models/Page');
      const homePage = await Page.findOne({ slug: 'home', status: 'published' });
      hasHomePage = !!homePage;
      
      if (hasHomePage) {
        console.log('Database-driven home page detected - static index.html will be bypassed');
      } else {
        console.log('No database home page found - will serve legacy static index.html');
      }
    } catch (error) {
      console.error('Error checking for home page:', error);
      hasHomePage = false;
    }
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
app.use('/api/admin/pages', adminPagesRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminDashboardRoutes);

// Inject scripts and styles into HTML responses
app.use(injectScriptsAndStyles);

// Inject admin panel into HTML responses
app.use(injectAdminPanel);

// Home page route (database-driven with legacy fallback)
app.get('/', async (req, res) => {
  try {
    // Always try to get home page from database (in case it was added after startup)
    const Page = require('./models/Page');
    const { renderPage } = require('./utils/template-engine');
    
    const homePage = await Page.findOne({ slug: 'home', status: 'published' });
    
    if (homePage) {
      console.log('Serving database-driven home page');
      // Render database-driven home page
      const html = await renderPage(homePage, req);
      res.send(html);
    } else {
      console.log('Serving legacy home page (fallback)');
      // Fallback to legacy system
      const path = require('path');
      res.sendFile(path.join(config.paths.dist, 'index.html'));
    }
  } catch (error) {
    console.error('Error rendering home page:', error);
    console.log('Serving legacy home page (error fallback)');
    // Fallback to legacy system on error
    const path = require('path');
    res.sendFile(path.join(config.paths.dist, 'index.html'));
  }
});

// Database-driven page routing (before static files)
app.use(pageMiddleware);

// Conditional static file serving (exclude index.html if we have database home page)
app.use((req, res, next) => {
  // If requesting index.html and we have a database home page, redirect to home
  if (req.path === '/index.html' && hasHomePage) {
    return res.redirect('/');
  }
  
  // For all other static files, serve normally
  express.static(config.paths.dist)(req, res, next);
});

// Start the server
app.listen(config.server.port, () => {
  console.log(`Server running at http://localhost:${config.server.port}`);
  console.log(`Serving files from: ${config.paths.dist}`);
});
