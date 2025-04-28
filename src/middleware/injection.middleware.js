/**
 * Middleware for injecting scripts and styles into HTML responses
 */

const fs = require('fs');
const { JSDOM } = require('jsdom');
const config = require('../config/config');
const { getActiveInjectionsByLocation } = require('../db/injection');

/**
 * Middleware to inject scripts and styles into HTML responses
 */
const injectScriptsAndStyles = async (req, res, next) => {
  // Only intercept HTML requests for the main route
  if (req.path === '/' || req.path.endsWith('.html')) {
    let body = fs.readFileSync(config.paths.index, 'utf8');

    // Only process string responses that look like HTML
    if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
      try {
        // Parse the HTML
        const dom = new JSDOM(body);
        const document = dom.window.document;

        // Inject head scripts/styles
        const headInjections = await getActiveInjectionsByLocation('before-head-close');
        const headElement = document.querySelector('head');

        if (headElement && headInjections.length > 0) {
          for (const injection of headInjections) {
            // Create an ID for the injection to avoid duplicates
            const elementId = `injection-${injection.injectionId}`;

            // Check if this injection is already present
            if (!document.getElementById(elementId)) {
              if (injection.type === 'script') {
                const script = document.createElement('script');
                script.id = elementId;
                script.textContent = injection.code;
                headElement.appendChild(script);
              } else if (injection.type === 'style') {
                const style = document.createElement('style');
                style.id = elementId;
                style.textContent = injection.code;
                headElement.appendChild(style);
              }
            }
          }
        }

        // Inject body scripts/styles
        const bodyInjections = await getActiveInjectionsByLocation('before-body-close');
        const bodyElement = document.querySelector('body');

        if (bodyElement && bodyInjections.length > 0) {
          for (const injection of bodyInjections) {
            // Create an ID for the injection to avoid duplicates
            const elementId = `injection-${injection.injectionId}`;

            // Check if this injection is already present
            if (!document.getElementById(elementId)) {
              if (injection.type === 'script') {
                const script = document.createElement('script');
                script.id = elementId;
                script.textContent = injection.code;
                bodyElement.appendChild(script);
              } else if (injection.type === 'style') {
                const style = document.createElement('style');
                style.id = elementId;
                style.textContent = injection.code;
                bodyElement.appendChild(style);
              }
            }
          }
        }

        // Serialize the modified HTML
        body = dom.serialize();
      } catch (error) {
        console.error('Error injecting scripts/styles:', error);
        // Continue with the original HTML if there was an error
      }
    }

    res.send(body);
    return;
  }

  next();
};

module.exports = {
  injectScriptsAndStyles
};
