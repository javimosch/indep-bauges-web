/**
 * Express server for serving the static website
 * Includes admin API for inline content editing
 * Includes MongoDB integration for persisting changes
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { JSDOM } = require('jsdom');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// MongoDB connection and models
const connectDB = require('./db/mongoose');
const { saveSectionToMongo, saveAuditLog, syncFromMongo, initializeMongo } = require('./db/sync');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Proxy endpoint (NocoDB)
app.all('/proxy/:url(*)', async (req, res) => {
  const axios = require('axios')
  try {
    const targetUrl = req.params.url;

    // Validate URL
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'Invalid URL: Must include http:// or https://' });
    }

    const targetHeaders =  {
      'xc-token': process.env.NOCODB_TOKEN
    }

    if(!req.url.includes('noco')){
      return res.status(404).send('Not found');
    }

    console.debug('Target headers:', {
      method: req.method,
      url: targetUrl,
      headers: targetHeaders,
      body: req.body
    });

    // Forward the request
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: targetHeaders,
      data: req.body,
      // Prevent axios from throwing on non-2xx status codes
      validateStatus: () => true
    });

    console.debug('Response headers:', response.headers);

    // Forward response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send response
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Admin configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456'; // Default for development
const JWT_SECRET = process.env.JWT_SECRET || 'indep-bauges-secret-key'; // Default for development

// Log configuration (but not sensitive values)
console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Admin authentication is ${ADMIN_PASSWORD ? 'configured' : 'not configured'}`);
console.log(`JWT signing is ${JWT_SECRET ? 'configured' : 'not configured'}`);

// Connect to MongoDB and initialize
(async () => {
  const connected = await connectDB();
  if (connected) {
    await initializeMongo();
  }
})();

// Middleware for parsing JSON
app.use(express.json());

// Define paths
const rootDir = path.join(__dirname, '..');
const distPath = path.join(rootDir, 'dist');
const sectionsPath = path.join(rootDir, 'src/sections');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Check if index.html exists in dist directory
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found in dist directory. Please run "npm run build" first.');
  process.exit(1);
}

// Serve static files from the dist directory
app.use(express.static(distPath));

//target /src/public folder
app.use(express.static(path.join(process.cwd(), 'src', 'public')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

// Authentication endpoint
app.post('/api/auth', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Token verification endpoint
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Token is valid' });
});

// API endpoint for syncing from MongoDB
app.post('/api/sync-from-mongo', authenticateToken, async (req, res) => {
  try {
    const { adminName = 'unknown' } = req.body;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB is not connected'
      });
    }

    console.log(`Sync from MongoDB requested by admin: ${adminName}`);

    // Sync from MongoDB to filesystem
    const syncedFiles = await syncFromMongo();

    if (syncedFiles.length > 0) {
      // Create audit log entry for the sync
      await saveAuditLog({
        filename: 'system',
        elementId: 'sync-from-mongo',
        elementType: 'system',
        previousContent: 'N/A',
        newContent: `Synced ${syncedFiles.length} files from MongoDB`,
        adminName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Trigger rebuild
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error(`Build error: ${error.message}`);
          return res.status(500).json({
            success: false,
            message: 'Error rebuilding site after sync'
          });
        }

        console.log(`Build output: ${stdout}`);
        if (stderr) console.error(`Build stderr: ${stderr}`);

        res.json({
          success: true,
          message: 'Successfully synced from MongoDB',
          syncedFiles
        });
      });
    } else {
      res.json({
        success: true,
        message: 'No files to sync from MongoDB',
        syncedFiles: []
      });
    }
  } catch (error) {
    console.error('Error syncing from MongoDB:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing from MongoDB: ' + error.message
    });
  }
});

// API endpoint for fetching audit logs
app.get('/api/audit-logs', authenticateToken, async (req, res) => {
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
    const { Audit } = require('./models');
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

// API endpoint for saving content changes
app.post('/api/save-content', authenticateToken, async (req, res) => {
  try {
    const { elementId, content, adminName = 'unknown', attributes = {} } = req.body;

    if (!elementId || content === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find the element in section files
    const result = await updateElementInSections(elementId, content, adminName, req, attributes);

    if (result.success) {
      // Trigger rebuild
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error(`Build error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Error rebuilding site' });
        }

        console.log(`Build output: ${stdout}`);
        if (stderr) console.error(`Build stderr: ${stderr}`);

        res.json({
          success: true,
          message: 'Content updated successfully',
          mongoSync: result.mongoSync
        });
      });
    } else {
      res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Function to update element in section files
async function updateElementInSections(elementId, newContent, adminName, req, attributes = {}) {
  // Get all section files
  const sectionFiles = fs.readdirSync(sectionsPath)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(sectionsPath, file));

  for (const filePath of sectionFiles) {
    try {
      const filename = path.basename(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const dom = new JSDOM(content);
      const document = dom.window.document;

      // Find element with matching data-id
      const element = document.querySelector(`[data-id="${elementId}"]`);

      if (element) {
        // Get previous content for audit log
        const previousContent = element.innerHTML;

        // Get element type
        const elementType = element.tagName.toLowerCase();

        // Initialize attribute tracking
        const previousAttributes = {};
        const newAttributes = {};

        // For links, always track href and target attributes even if they're not being changed
        if (elementType === 'a') {
          // Save previous attributes
          previousAttributes.href = element.getAttribute('href') || '';
          previousAttributes.target = element.getAttribute('target') || '';

          // Set new attributes (defaults to current values if not being changed)
          newAttributes.href = attributes.href !== undefined ? attributes.href : previousAttributes.href;
          newAttributes.target = attributes.target !== undefined ? attributes.target : previousAttributes.target;
        }

        // Update element content
        element.innerHTML = newContent;

        // Update element attributes if provided
        if (Object.keys(attributes).length > 0) {
          // Handle specific element types
          if (elementType === 'a') {
            // Update href attribute
            if (attributes.href !== undefined) {
              element.setAttribute('href', attributes.href);
            }

            // Update target attribute
            if (attributes.target !== undefined) {
              if (attributes.target) {
                element.setAttribute('target', attributes.target);
              } else {
                element.removeAttribute('target');
              }
            }
          }

          // Handle other element types with attributes as needed
        }

        // Get updated content
        const updatedContent = dom.serialize();

        // Save updated file to filesystem
        fs.writeFileSync(filePath, updatedContent);

        // Save to MongoDB if connected
        let mongoSync = false;
        try {
          if (mongoose.connection.readyState === 1) { // 1 = connected
            // Save section to MongoDB
            await saveSectionToMongo(filename, updatedContent, adminName);

            // Create audit log with additional attribute information
            const auditData = {
              filename,
              elementId,
              elementType,
              previousContent,
              newContent,
              adminName,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            };

            // Add attribute changes to audit log for links
            if (elementType === 'a') {
              // Always include attribute changes for links, even if they didn't change
              auditData.attributeChanges = {
                previous: previousAttributes,
                new: {
                  href: attributes.href !== undefined ? attributes.href : previousAttributes.href,
                  target: attributes.target !== undefined ? attributes.target : previousAttributes.target
                }
              };
            } else if (Object.keys(attributes).length > 0 && Object.keys(previousAttributes).length > 0) {
              // For other element types, only include if attributes were provided
              auditData.attributeChanges = {
                previous: previousAttributes,
                new: attributes
              };
            }

            await saveAuditLog(auditData);

            mongoSync = true;
          }
        } catch (mongoError) {
          console.error('MongoDB sync error:', mongoError);
          // Continue even if MongoDB sync fails
        }

        return {
          success: true,
          message: 'Element updated successfully',
          mongoSync
        };
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  return { success: false, message: 'Element not found in any section file' };
}

// Serve index.html for all routes to support SPA-like navigation
app.get('/', (req, res) => {
  res.sendFile(indexPath);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${distPath}`);
});
