/**
 * HTML Concatenation Script
 *
 * This script takes src/sections/index.html as a template and injects other HTML files
 * from the sections folder based on comment patterns like <!-- Include file.html -->
 * The final compiled file is written to dist/index.html
 */

const fs = require('fs');
const path = require('path');

/**
 * Read a file and return its contents
 * @param {string} filePath - Path to the file
 * @returns {string|null} - File contents or null if error
 */
function readFile(filePath) {
  try {
    console.log(`Reading file: ${filePath}`);
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Find include comments in content
 * @param {string} content - HTML content to search
 * @returns {Array} - Array of objects with fullMatch, filename, and index
 */
function findIncludeComments(content) {
  // Match pattern: <!-- Include file.html -->
  const regex = /<!--\s*Include\s+([^\s>]+\.html)\s*-->/gi;
  const matches = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      filename: match[1],
      index: match.index
    });
  }

  console.log(`Found ${matches.length} includes`);
  return matches;
}

/**
 * Process includes recursively
 * @param {string} content - HTML content to process
 * @param {string} sectionsPath - Path to sections folder
 * @param {Set} processedFiles - Set of already processed files to prevent circular includes
 * @returns {string} - Processed content with includes replaced
 */
function processIncludes(content, sectionsPath, processedFiles = new Set()) {
  const includes = findIncludeComments(content);

  // Process each include
  for (const include of includes) {
    const includePath = path.join(sectionsPath, include.filename);
    console.log(`Processing include: ${include.filename}`);

    // Prevent infinite recursion
    if (processedFiles.has(includePath)) {
      console.warn(`Warning: Circular include detected: ${include.filename}`);
      continue;
    }

    if (!fs.existsSync(includePath)) {
      console.warn(`Warning: Include file not found: ${include.filename}`);
      continue;
    }

    let includeContent = readFile(includePath);
    if (includeContent) {
      // Mark this file as processed
      processedFiles.add(includePath);

      // Recursively process includes in the included file
      includeContent = processIncludes(includeContent, sectionsPath, processedFiles);

      // Replace the include comment with the processed content
      content = content.replace(include.fullMatch, includeContent);
      console.log(`Replaced include: ${include.filename}`);
    }
  }

  return content;
}

/**
 * Main function to compile the HTML
 */
function compileHTML() {
  console.log('Starting HTML compilation process');

  // Define paths
  const rootDir = path.resolve(__dirname, '../..');
  const sectionsDir = path.join(rootDir, 'src/sections');
  const indexPath = path.join(sectionsDir, 'index.html');
  const outputPath = path.join(rootDir, 'dist/index.html');
  const scriptsDir = path.join(rootDir, 'src/scripts');
  const distScriptsDir = path.join(rootDir, 'dist/scripts');

  // Ensure dist directory exists
  const distDir = path.dirname(outputPath);
  if (!fs.existsSync(distDir)) {
    console.log(`Creating directory: ${distDir}`);
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Ensure dist/scripts directory exists
  if (!fs.existsSync(distScriptsDir)) {
    console.log(`Creating directory: ${distScriptsDir}`);
    fs.mkdirSync(distScriptsDir, { recursive: true });
  }

  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error(`Error: Template file not found: ${indexPath}`);
    process.exit(1);
  }

  // Read the index file
  let indexContent = readFile(indexPath);
  if (!indexContent) {
    console.error(`Error: Failed to read template file: ${indexPath}`);
    process.exit(1);
  }

  // Process includes recursively
  indexContent = processIncludes(indexContent, sectionsDir);

  // Write the final compiled file
  try {
    console.log(`Writing compiled file: ${outputPath}`);
    fs.writeFileSync(outputPath, indexContent);
    console.log(`Compilation successful! Output: ${outputPath}`);

    // Copy admin.js to dist/scripts
    const adminJsPath = path.join(scriptsDir, 'admin.js');
    if (fs.existsSync(adminJsPath)) {
      const adminJsContent = fs.readFileSync(adminJsPath, 'utf8');
      const distAdminJsPath = path.join(distScriptsDir, 'admin.js');
      fs.writeFileSync(distAdminJsPath, adminJsContent);
      console.log(`Copied admin.js to ${distAdminJsPath}`);
    } else {
      console.warn(`Warning: admin.js not found at ${adminJsPath}`);
    }
  } catch (error) {
    console.error(`Error in compilation process:`, error.message);
    process.exit(1);
  }
}

// Run the script
try {
  compileHTML();
} catch (error) {
  console.error(`Fatal error in compilation process:`, error.message);
  process.exit(1);
}