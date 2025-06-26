/**
 * Template rendering system using Handlebars
 */

const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class TemplateEngine {
  constructor() {
    this.layouts = new Map();
    this.templates = new Map();
    this.partials = new Map();
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Register custom helpers
      this.registerHelpers();
      
      // Load layouts
      await this.loadTemplates('src/templates/layouts', this.layouts);
      
      // Load page templates
      await this.loadTemplates('src/templates/pages', this.templates);
      
      // Load partials
      await this.loadPartials('src/templates/partials');
      
      this.initialized = true;
      console.log('Template engine initialized successfully');
      
    } catch (error) {
      console.error('Error initializing template engine:', error);
      throw error;
    }
  }
  
  registerHelpers() {
    // Helper to join arrays
    handlebars.registerHelper('join', function(array, separator) {
      if (Array.isArray(array)) {
        return array.join(separator || ', ');
      }
      return '';
    });
    
    // Helper for conditional equality
    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    // Helper for current year
    handlebars.registerHelper('currentYear', function() {
      return new Date().getFullYear();
    });
    
    // Helper for formatting dates
    handlebars.registerHelper('formatDate', function(date, format) {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString('fr-FR');
      }
      return d.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    });
  }
  
  async loadTemplates(dir, cache) {
    try {
      const fullPath = path.join(config.paths.root, dir);
      
      // Check if directory exists
      try {
        await fs.access(fullPath);
      } catch {
        console.log(`Template directory ${dir} does not exist, creating...`);
        await fs.mkdir(fullPath, { recursive: true });
        return;
      }
      
      const files = await fs.readdir(fullPath);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const content = await fs.readFile(path.join(fullPath, file), 'utf8');
          const name = file.replace('.hbs', '');
          cache.set(name, handlebars.compile(content));
          console.log(`Loaded template: ${name}`);
        }
      }
    } catch (error) {
      console.error(`Error loading templates from ${dir}:`, error);
    }
  }
  
  async loadPartials(dir) {
    try {
      const fullPath = path.join(config.paths.root, dir);
      
      // Check if directory exists
      try {
        await fs.access(fullPath);
      } catch {
        console.log(`Partials directory ${dir} does not exist, creating...`);
        await fs.mkdir(fullPath, { recursive: true });
        return;
      }
      
      const files = await fs.readdir(fullPath);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const content = await fs.readFile(path.join(fullPath, file), 'utf8');
          const name = file.replace('.hbs', '');
          handlebars.registerPartial(name, content);
          this.partials.set(name, content);
          console.log(`Loaded partial: ${name}`);
        }
      }
    } catch (error) {
      console.error(`Error loading partials from ${dir}:`, error);
    }
  }
  
  async renderPage(page, req = {}) {
    await this.initialize();
    
    // Get layout template
    const layoutTemplate = this.layouts.get(page.layout || 'default');
    if (!layoutTemplate) {
      throw new Error(`Layout not found: ${page.layout || 'default'}`);
    }
    
    // Get page template
    const pageTemplate = this.templates.get(page.template || 'default');
    if (!pageTemplate) {
      throw new Error(`Template not found: ${page.template || 'default'}`);
    }
    
    // Get navigation pages
    const Page = require('../models/Page');
    const navigationPages = await Page.getNavigationPages();
    
    // Prepare template context
    const context = {
      page,
      title: page.title,
      description: page.meta?.description || '',
      keywords: page.meta?.keywords || [],
      content: page.content,
      customCSS: page.settings?.customCSS || '',
      customJS: page.settings?.customJS || '',
      currentUrl: req.path || '',
      isAdmin: req.user?.isAdmin || false,
      navigation: navigationPages,
      site: {
        name: 'Les Indép\'en Bauges',
        description: 'Association de freelances et entrepreneurs indépendants'
      }
    };
    
    // Render page content
    const pageContent = pageTemplate(context);
    
    // Render with layout
    const html = layoutTemplate({
      ...context,
      body: pageContent
    });
    
    return html;
  }
  
  // Method to render template by name (for plugins)
  async renderTemplate(templateName, layoutName, context) {
    await this.initialize();
    
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    const layout = this.layouts.get(layoutName || 'default');
    if (!layout) {
      throw new Error(`Layout not found: ${layoutName || 'default'}`);
    }
    
    const pageContent = template(context);
    return layout({ ...context, body: pageContent });
  }
}

const templateEngine = new TemplateEngine();

module.exports = {
  renderPage: (page, req) => templateEngine.renderPage(page, req),
  renderTemplate: (templateName, layoutName, context) => templateEngine.renderTemplate(templateName, layoutName, context),
  templateEngine
};