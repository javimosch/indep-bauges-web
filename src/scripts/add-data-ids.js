/**
 * Add Data IDs Script
 * 
 * This script automatically adds data-id attributes to HTML elements in section files
 * to make them editable in the admin interface.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');

// Configuration
const SECTIONS_DIR = path.join(__dirname, '../sections');
const TARGET_ELEMENTS = 'h1, h2, h3, h4, h5, h6, p, a, button, span, img, div.text-center';
const IGNORE_ELEMENTS = [
  // Elements to ignore (e.g., elements that shouldn't be editable)
  'div.container', 
  'div.grid', 
  'div.flex',
  'div.bg-white',
  'div.relative',
  'div.absolute'
];

// Generate a short unique ID
function generateShortId(prefix, element, index) {
  // Create a base for the ID using element type and content
  const elementType = element.tagName.toLowerCase();
  const contentHash = crypto.createHash('md5')
    .update(element.innerHTML.substring(0, 50))
    .digest('hex')
    .substring(0, 6);
  
  return `${prefix}-${elementType}-${contentHash}`;
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Parse the HTML
  const dom = new JSDOM(content);
  const { document } = dom.window;
  
  // Get the section name from the file name
  const fileName = path.basename(filePath, '.html');
  
  // Find all target elements
  const elements = document.querySelectorAll(TARGET_ELEMENTS);
  
  let addedCount = 0;
  let skippedCount = 0;
  
  elements.forEach((element, index) => {
    // Skip elements that already have a data-id
    if (element.hasAttribute('data-id')) {
      skippedCount++;
      return;
    }
    
    // Skip elements that match the ignore list
    const shouldIgnore = IGNORE_ELEMENTS.some(selector => {
      try {
        return element.matches(selector);
      } catch (e) {
        return false;
      }
    });
    
    if (shouldIgnore) {
      skippedCount++;
      return;
    }
    
    // Skip empty elements or those with only whitespace
    const textContent = element.textContent.trim();
    if (!textContent && element.tagName.toLowerCase() !== 'img') {
      skippedCount++;
      return;
    }
    
    // Generate a data-id
    const dataId = generateShortId(fileName, element, index);
    
    // Add the data-id attribute
    element.setAttribute('data-id', dataId);
    addedCount++;
  });
  
  // Save the modified HTML
  const modifiedContent = dom.serialize();
  fs.writeFileSync(filePath, modifiedContent);
  
  return { addedCount, skippedCount };
}

// Process all section files
function processAllFiles() {
  // Get all HTML files in the sections directory
  const files = fs.readdirSync(SECTIONS_DIR)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(SECTIONS_DIR, file));
  
  let totalAdded = 0;
  let totalSkipped = 0;
  
  // Process each file
  files.forEach(file => {
    const { addedCount, skippedCount } = processFile(file);
    totalAdded += addedCount;
    totalSkipped += skippedCount;
    
    console.log(`  - Added ${addedCount} data-id attributes`);
    console.log(`  - Skipped ${skippedCount} elements`);
  });
  
  console.log('\nSummary:');
  console.log(`- Processed ${files.length} files`);
  console.log(`- Added ${totalAdded} data-id attributes`);
  console.log(`- Skipped ${totalSkipped} elements`);
}

// Run the script
console.log('Starting to add data-id attributes to section files...');
processAllFiles();
console.log('Finished adding data-id attributes.');
