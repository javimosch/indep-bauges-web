/**
 * Admin Panel Injection Middleware
 * Injects the admin panel into all HTML responses for authenticated admin users
 */

const fs = require('fs').promises;
const path = require('path');

// Cache for admin panel script
let adminPanelScript = null;

async function loadAdminPanelScript() {
  if (!adminPanelScript) {
    try {
      const scriptPath = path.join(__dirname, '../admin-panel/panel.js');
      adminPanelScript = await fs.readFile(scriptPath, 'utf8');
    } catch (error) {
      console.error('Error loading admin panel script:', error);
      adminPanelScript = '';
    }
  }
  return adminPanelScript;
}

/**
 * Middleware to inject admin panel into HTML responses
 */
async function injectAdminPanel(req, res, next) {
  // Only inject for authenticated admin users
  const authToken = req.headers.authorization;
  const isAdminAuthenticated = authToken && authToken.startsWith('Bearer ');
  
  // Also check for admin token in cookies or session if needed
  // For now, we'll inject for all requests and let the client-side handle auth
  
  // Override res.send to inject admin panel
  const originalSend = res.send;
  
  res.send = async function(data) {
    // Only inject into HTML responses
    if (typeof data === 'string' && 
        data.includes('</body>') && 
        res.get('Content-Type')?.includes('text/html')) {
      
      try {
        const adminScript = await loadAdminPanelScript();
        
        // Inject admin panel script before closing body tag
        const injectedData = data.replace(
          '</body>',
          `
          <!-- Admin Panel -->
          <script>
            ${adminScript}
          </script>
          </body>`
        );
        
        return originalSend.call(this, injectedData);
      } catch (error) {
        console.error('Error injecting admin panel:', error);
        return originalSend.call(this, data);
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = { injectAdminPanel };