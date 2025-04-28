/**
 * Utility functions for content editing
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const mongoose = require('mongoose');
const config = require('../config/config');
const { saveSectionToMongo, saveAuditLog } = require('../db/sync');

/**
 * Update an element in section files
 * @param {string} elementId - The ID of the element to update
 * @param {string} newContent - The new content for the element
 * @param {string} adminName - The name of the admin making the change
 * @param {object} req - The request object
 * @param {object} attributes - Optional attributes to update
 * @returns {object} Result of the update operation
 */
async function updateElementInSections(elementId, newContent, adminName, req, attributes = {}) {
  // Get all section files
  const sectionFiles = fs.readdirSync(config.paths.sections)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(config.paths.sections, file));

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

module.exports = {
  updateElementInSections
};
