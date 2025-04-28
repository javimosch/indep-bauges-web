/**
 * Add Data IDs Script
 *
 * This script automatically adds data-id attributes to HTML elements in section files
 * to make them editable in the admin interface.
 *
 * Usage:
 *   npm run add-data-ids        # Add data-id attributes to all eligible elements
 *   npm run add-data-ids:dry    # Dry run - show what would be changed without making changes
 *
 *   # Or run directly:
 *   node src/scripts/add-data-ids.js [--dry-run]
 *
 * Features:
 *   - Automatically adds data-id attributes to HTML elements in section files
 *   - Generates unique IDs based on file name, element type, and content
 *   - Skips elements that already have data-id attributes
 *   - Provides detailed statistics on elements processed
 *   - Supports dry run mode to preview changes
 *
 * The script targets the following elements by default:
 *   - Headings (h1-h6)
 *   - Paragraphs (p)
 *   - Links (a)
 *   - Buttons (button)
 *   - Spans (span)
 *   - Blockquotes (blockquote)
 *   - Images (img)
 *   - Text-centered divs (div.text-center)
 *
 * It generates smart IDs for special elements like:
 *   - Social media links
 *   - Navigation links
 *   - Email links
 *   - Logos
 *   - Submit buttons
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Configuration
const SECTIONS_DIR = path.join(__dirname, '../sections');
const TARGET_ELEMENTS = 'h1, h2, h3, h4, h5, h6, p, a, button, span, blockquote, img, div.text-center';
const IGNORE_ELEMENTS = [
  // Elements to ignore (e.g., elements that shouldn't be editable)
  'div.container',
  'div.grid',
  'div.flex',
  'div.bg-white',
  'div.relative',
  'div.absolute'
];

// Get a more specific element type for ID generation
function getSpecificElementType(element) {
  const tagName = element.tagName.toLowerCase();

  // For links, check if they have specific characteristics
  if (tagName === 'a') {
    // Check if it's a navigation link
    if (element.getAttribute('href')?.startsWith('#')) {
      return 'nav-link';
    }

    // Check if it's an email link
    if (element.getAttribute('href')?.startsWith('mailto:')) {
      return 'email-link';
    }

    // Check if it has social media icons
    const hasSocialIcon = element.innerHTML.match(/fa-(facebook|twitter|instagram|linkedin|youtube|github|pinterest)/i);
    if (hasSocialIcon) {
      return `social-${hasSocialIcon[1].toLowerCase()}`;
    }
  }

  // For images, check if they have specific roles
  if (tagName === 'img') {
    const alt = element.getAttribute('alt') || '';
    if (alt.toLowerCase().includes('logo')) {
      return 'logo';
    }
  }

  // For buttons, check their purpose
  if (tagName === 'button' || (tagName === 'a' && element.classList.contains('btn'))) {
    if (element.innerHTML.toLowerCase().includes('submit')) {
      return 'submit-btn';
    }
    if (element.innerHTML.toLowerCase().includes('contact')) {
      return 'contact-btn';
    }
  }

  // Default to the tag name
  return tagName;
}

// Process a single file
function processFile(filePath) {
  console.log(`add-data-ids.js processFile Processing file`, {data:{filePath}});

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

  // Track counts by tag type
  const tagCounts = {};

  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();

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

    // Skip empty elements or those with only whitespace (unless it's an image or blockquote)
    const textContent = element.textContent.trim();
    if (!textContent && tagName !== 'img' && tagName !== 'blockquote') {
      skippedCount++;
      return;
    }

    // Generate a data-id
    const specificType = getSpecificElementType(element);
    const dataId = `${fileName}-${specificType}-${crypto.randomBytes(3).toString('hex')}`;

    // Add the data-id attribute (or just log in dry run mode)
    if (!isDryRun) {
      element.setAttribute('data-id', dataId);
    }

    // Count by tag type
    tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;

    addedCount++;
  });

  // Save the modified HTML (unless in dry run mode)
  if (!isDryRun) {
    const modifiedContent = dom.serialize();
    fs.writeFileSync(filePath, modifiedContent);
  }

  // Log tag counts
  if (Object.keys(tagCounts).length > 0) {
    console.log('  Elements by tag type:');
    Object.entries(tagCounts).forEach(([tag, count]) => {
      console.log(`    - ${tag}: ${count}`);
    });
  } else {
    console.log('  No new elements to add data-id attributes to');
  }

  return { addedCount, skippedCount, tagCounts };
}

// Process all section files
function processAllFiles() {
  // Get all HTML files in the sections directory
  const files = fs.readdirSync(SECTIONS_DIR)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(SECTIONS_DIR, file));

  let totalAdded = 0;
  let totalSkipped = 0;
  const totalTagCounts = {};

  // Process each file
  files.forEach(file => {
    const { addedCount, skippedCount, tagCounts } = processFile(file);
    totalAdded += addedCount;
    totalSkipped += skippedCount;

    // Aggregate tag counts
    Object.entries(tagCounts).forEach(([tag, count]) => {
      totalTagCounts[tag] = (totalTagCounts[tag] || 0) + count;
    });

    console.log(`  - Added ${addedCount} data-id attributes`);
    console.log(`  - Skipped ${skippedCount} elements`);
  });

  // Mode indicator
  const modeText = isDryRun ? ' (DRY RUN - no changes made)' : '';

  console.log(`\nSummary${modeText}:`);
  console.log(`- Processed ${files.length} files`);
  console.log(`- Added ${totalAdded} data-id attributes`);
  console.log(`- Skipped ${totalSkipped} elements`);

  console.log('\nElements by tag type:');
  Object.entries(totalTagCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
    .forEach(([tag, count]) => {
      console.log(`  - ${tag}: ${count}`);
    });
}

// Run the script
console.log('Starting to add data-id attributes to section files...');
processAllFiles();
console.log('Finished adding data-id attributes.');
