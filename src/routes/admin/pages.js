/**
 * Admin page management routes
 */

const express = require('express');
const router = express.Router();
const Page = require('../../models/Page');
const { authenticateToken } = require('../../middleware/auth.middleware');

// List all pages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pages = await Page.find(query)
      .sort({ updatedAt: -1 })
      .select('slug title status author updatedAt settings.showInNavigation createdAt');
    
    res.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, message: 'Error fetching pages' });
  }
});

// Get single page
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    res.json({ success: true, page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, message: 'Error fetching page' });
  }
});

// Create new page
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { slug, title, content, template, layout, meta, settings, status } = req.body;
    
    // Validate required fields
    if (!slug || !title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: slug, title, content' 
      });
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug must contain only lowercase letters, numbers, and hyphens' 
      });
    }
    
    // Check if slug already exists
    const existingPage = await Page.findOne({ slug });
    if (existingPage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Page with this slug already exists' 
      });
    }
    
    // Create new page
    const page = new Page({
      slug,
      title,
      content,
      template: template || 'default',
      layout: layout || 'default',
      meta: meta || {},
      settings: settings || {},
      status: status || 'draft',
      author: req.user.name || 'admin'
    });
    
    await page.save();
    
    res.json({ success: true, page, message: 'Page created successfully' });
    
  } catch (error) {
    console.error('Error creating page:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Page with this slug already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Error creating page' });
    }
  }
});

// Update existing page
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, template, layout, meta, settings, status } = req.body;
    
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    // Update page fields
    if (title) page.title = title;
    if (content !== undefined) page.content = content;
    if (template) page.template = template;
    if (layout) page.layout = layout;
    if (meta) page.meta = { ...page.meta, ...meta };
    if (settings) page.settings = { ...page.settings, ...settings };
    if (status) page.status = status;
    
    page.author = req.user.name || 'admin';
    
    await page.save();
    
    res.json({ success: true, page, message: 'Page updated successfully' });
    
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ success: false, message: 'Error updating page' });
  }
});

// Delete page
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    await page.deleteOne();
    
    res.json({ success: true, message: 'Page deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, message: 'Error deleting page' });
  }
});

// Duplicate page
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalPage = await Page.findById(req.params.id);
    if (!originalPage) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    
    // Create new slug
    let newSlug = `${originalPage.slug}-copy`;
    let counter = 1;
    
    while (await Page.findOne({ slug: newSlug })) {
      newSlug = `${originalPage.slug}-copy-${counter}`;
      counter++;
    }
    
    // Create duplicate
    const duplicatedPage = new Page({
      slug: newSlug,
      title: `${originalPage.title} (Copy)`,
      content: originalPage.content,
      template: originalPage.template,
      layout: originalPage.layout,
      meta: originalPage.meta,
      settings: {
        ...originalPage.settings,
        showInNavigation: false // Don't show copies in navigation by default
      },
      status: 'draft',
      author: req.user.name || 'admin'
    });
    
    await duplicatedPage.save();
    
    res.json({ success: true, page: duplicatedPage, message: 'Page duplicated successfully' });
    
  } catch (error) {
    console.error('Error duplicating page:', error);
    res.status(500).json({ success: false, message: 'Error duplicating page' });
  }
});

// Get available templates and layouts
router.get('/meta/templates', authenticateToken, async (req, res) => {
  try {
    const templates = [
      { value: 'default', label: 'Default Page' },
      { value: 'contact', label: 'Contact Page' },
      { value: 'full-width', label: 'Full Width' },
      { value: 'landing', label: 'Landing Page' },
      { value: 'home', label: 'Home Page' }
    ];
    
    const layouts = [
      { value: 'default', label: 'Default Layout' },
      { value: 'full-width', label: 'Full Width Layout' },
      { value: 'admin', label: 'Admin Layout' }
    ];
    
    res.json({ success: true, templates, layouts });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Error fetching templates' });
  }
});

module.exports = router;