/**
 * Express server for serving the static website
 * Includes admin API for inline content editing
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { JSDOM } = require('jsdom');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

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

// API endpoint for saving content changes
app.post('/api/save-content', async (req, res) => {
  try {
    const { elementId, content } = req.body;

    if (!elementId || content === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find the element in section files
    const result = await updateElementInSections(elementId, content);

    if (result.success) {
      // Trigger rebuild
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error(`Build error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Error rebuilding site' });
        }

        console.log(`Build output: ${stdout}`);
        if (stderr) console.error(`Build stderr: ${stderr}`);

        res.json({ success: true, message: 'Content updated successfully' });
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
async function updateElementInSections(elementId, newContent) {
  // Get all section files
  const sectionFiles = fs.readdirSync(sectionsPath)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(sectionsPath, file));

  for (const filePath of sectionFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dom = new JSDOM(content);
      const document = dom.window.document;

      // Find element with matching data-id
      const element = document.querySelector(`[data-id="${elementId}"]`);

      if (element) {
        // Update element content
        element.innerHTML = newContent;

        // Save updated file
        fs.writeFileSync(filePath, dom.serialize());

        return { success: true, message: 'Element updated successfully' };
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  return { success: false, message: 'Element not found in any section file' };
}

// Serve index.html for all routes to support SPA-like navigation
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${distPath}`);
});
