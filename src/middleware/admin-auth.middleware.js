/**
 * Admin Authentication Middleware for Admin Routes
 * Handles both token-based and session-based authentication
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to check admin authentication for admin routes
 */
function requireAdminAuth(req, res, next) {
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // If no token in header, check for token in cookies or session
  if (!token && req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }
  
  if (!token) {
    // For API routes, return 401
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // For admin pages, redirect to login
    return res.redirect('/admin/login');
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    // For API routes, return 401
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    // For admin pages, redirect to login
    return res.redirect('/admin/login');
  }
}

/**
 * Middleware to inject admin token into requests from client-side storage
 */
function injectAdminToken(req, res, next) {
  // Override res.send to inject token handling script
  const originalSend = res.send;
  
  res.send = function(data) {
    // Only inject into HTML responses for admin routes
    if (typeof data === 'string' && 
        data.includes('</body>') && 
        req.path.startsWith('/admin') &&
        res.get('Content-Type')?.includes('text/html')) {
      
      const tokenScript = `
        <script>
          // Inject admin token into requests
          (function() {
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
              // Add authorization header for API calls
              if (url.startsWith('/api/')) {
                const token = getAdminToken();
                if (token) {
                  options.headers = options.headers || {};
                  options.headers['Authorization'] = 'Bearer ' + token;
                }
              }
              return originalFetch(url, options);
            };
            
            function getAdminToken() {
              try {
                const authData = JSON.parse(localStorage.getItem('admin_auth_token') || '{}');
                return authData.data?.token || authData.token || '';
              } catch (error) {
                return '';
              }
            }
            
            // Set token as cookie for server-side access
            const token = getAdminToken();
            if (token) {
              document.cookie = 'admin_token=' + token + '; path=/admin; SameSite=Strict';
            }
          })();
        </script>
      `;
      
      data = data.replace('</body>', tokenScript + '</body>');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = { 
  requireAdminAuth, 
  injectAdminToken 
};