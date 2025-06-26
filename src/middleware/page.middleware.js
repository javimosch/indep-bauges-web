/**
 * Database-driven page routing middleware
 */

const Page = require('../models/Page');
const { renderPage } = require('../utils/template-engine');

/**
 * Database-driven page routing middleware
 * This middleware checks if a URL matches a database page and renders it
 */
async function pageMiddleware(req, res, next) {
  // Skip if it's an API route, static asset, or has file extension
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/scripts/') || 
      req.path.includes('.') ||
      req.path.startsWith('/admin/') ||
      req.path.endsWith('.html')) {
    return next();
  }
  
  // Skip home page (handled by legacy system)
  if (req.path === '/') {
    return next();
  }
  
  try {
    // Extract slug from URL (remove leading slash)
    const slug = req.path.slice(1);
    
    // Look up page in database
    const page = await Page.findBySlug(slug);
    
    if (!page) {
      // No page found, continue to next middleware (plugins, static files, 404)
      return next();
    }
    
    // Check if page requires authentication
    if (page.settings.requireAuth && !req.user) {
      return res.redirect('/admin/login');
    }
    
    // Render page using template engine
    const html = await renderPage(page, req);
    
    // Set appropriate headers
    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    
    // Send rendered page
    res.send(html);
    
  } catch (error) {
    console.error('Error rendering page:', error);
    // Continue to next middleware instead of throwing error
    next();
  }
}

module.exports = { pageMiddleware };