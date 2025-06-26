# Database-Driven Multiple Views Implementation Plan

## Current System Analysis

The current system is a single-page application that:
- Uses a section-based architecture where HTML components are stored in `src/sections/`
- Compiles all sections into a single `dist/index.html` file using `src/scripts/concat.js`
- Supports inline content editing with MongoDB persistence
- Uses Express.js for serving static files and API endpoints

### Current Architecture Components:
1. **Build System**: `src/scripts/concat.js` processes `src/sections/index.html` template and includes other sections
2. **Content Management**: Sections are stored as individual HTML files with data-id attributes for editing
3. **Server**: Express.js serves the compiled static file and provides admin APIs
4. **Database**: MongoDB stores section content and audit logs

## New Database-Driven Architecture

### Core Principles:
1. **Legacy Compatibility**: Existing `src/sections/` system remains fully functional for home page
2. **Database-Driven Routing**: Pages stored in MongoDB with custom URL slugs
3. **User-Managed Pages**: Admin interface for creating/editing pages
4. **Plugin System**: Extensible architecture for features like member pages
5. **Template Engine**: Flexible templating with layout inheritance

### 1. Database-Driven Page System

**Objective**: Create a flexible page management system where users can create pages with custom URL slugs.

**Database Schema**:
```javascript
// Page Model
{
  _id: ObjectId,
  slug: String,           // e.g., "co-working-spaces", "about-us"
  title: String,          // Page title
  content: String,        // Page content (HTML or Markdown)
  template: String,       // Template to use (default, custom, etc.)
  layout: String,         // Layout to use (default, full-width, etc.)
  meta: {
    description: String,  // SEO description
    keywords: [String],   // SEO keywords
    ogImage: String       // Social media image
  },
  status: String,         // published, draft, archived
  author: String,         // Admin who created/edited
  createdAt: Date,
  updatedAt: Date,
  settings: {
    showInNavigation: Boolean,
    navigationOrder: Number,
    requireAuth: Boolean,
    customCSS: String,
    customJS: String
  }
}
```

**Implementation**:
- Dynamic route resolution from database
- URL slug validation and uniqueness
- Page template system with inheritance
- SEO and meta tag management

**Files to create**:
- `src/models/Page.js` - Page database model
- `src/utils/page-router.js` - Database-driven router
- `src/middleware/page.middleware.js` - Page routing middleware

### 2. Admin Page Management Interface

**Objective**: Create an intuitive admin interface for managing pages.

**Features**:
- Create new pages with custom slugs
- Edit existing pages with live preview
- Manage page templates and layouts
- SEO settings and meta tag management
- Page status management (draft/published/archived)

**Admin Interface Components**:
```
/admin/pages/
├── list                    # List all pages
├── create                  # Create new page
├── edit/:id               # Edit existing page
├── preview/:id            # Preview page
└── settings               # Global page settings
```

**Files to create**:
- `src/routes/admin/pages.js` - Page management API routes
- `src/templates/admin/pages/` - Admin page templates
- `src/scripts/admin-pages.js` - Frontend page management

### 3. Template System with Layouts

**Objective**: Flexible template system supporting multiple layouts and custom templates.

**Template Structure**:
```
src/templates/
├── layouts/
│   ├── default.hbs        # Standard layout with header/footer
│   ├── full-width.hbs     # Full-width layout
│   ├── landing.hbs        # Landing page layout
│   └── admin.hbs          # Admin interface layout
├── pages/
│   ├── default.hbs        # Default page template
│   ├── contact.hbs        # Contact page template
│   └── custom/            # Custom page templates
└── partials/
    ├── header.hbs         # Site header
    ├── footer.hbs         # Site footer
    ├── navigation.hbs     # Navigation menu
    └── seo-meta.hbs       # SEO meta tags
```

**Implementation**:
- Handlebars template engine with layout inheritance
- Dynamic template selection based on page settings
- Partial reuse from existing sections
- Custom template upload capability

**Files to create**:
- `src/utils/template-engine.js` - Template rendering system
- `src/templates/` - Template directory structure
- `src/utils/layout-manager.js` - Layout management utilities

### 4. Plugin System Architecture

**Objective**: Extensible plugin system for adding features like member pages, events, etc.

**Plugin Structure**:
```javascript
// Plugin Definition
{
  name: "members",
  version: "1.0.0",
  description: "Member directory and profiles",
  routes: [
    { path: "/members", handler: "listMembers" },
    { path: "/members/:id", handler: "memberDetail" }
  ],
  models: ["Member"],
  templates: ["member-list", "member-detail"],
  adminPages: [
    { path: "/admin/members", title: "Manage Members" }
  ],
  hooks: {
    beforePageRender: "addMemberNavigation",
    afterInstall: "createSampleMembers"
  }
}
```

**Implementation**:
- Plugin discovery and registration system
- Dynamic route registration from plugins
- Plugin-specific database models
- Template and asset management per plugin
- Plugin lifecycle hooks

**Files to create**:
- `src/plugins/` - Plugin directory
- `src/utils/plugin-manager.js` - Plugin management system
- `src/models/Plugin.js` - Plugin metadata model
- `src/routes/admin/plugins.js` - Plugin management API

### 5. Legacy System Integration

**Objective**: Maintain existing section system while adding database-driven pages.

**Routing Priority**:
```
1. Home route (/) -> Legacy sections system
2. Database pages -> Dynamic page lookup
3. Static assets -> Express static middleware
4. 404 handler -> Custom 404 page or default
```

**Implementation**:
- Keep existing section build process for home page
- Add database page middleware before static serving
- Support inline editing for both systems
- Shared navigation between legacy and new pages

**Files to modify**:
- `src/server.js` - Add database page routing middleware
- `src/utils/content.js` - Extend for page content editing
- `src/middleware/route-resolver.js` - Handle routing precedence

### 6. Content Management System

**Objective**: Unified content management for both legacy sections and database pages.

**Features**:
- Inline editing for database pages (similar to sections)
- Rich text editor for page content
- Media management and file uploads
- Version history and rollback
- Content scheduling and publishing

**Implementation**:
- Extend existing admin interface
- Add WYSIWYG editor for page content
- Implement content versioning
- Add media library integration

**Files to create**:
- `src/routes/admin/content.js` - Content management API
- `src/utils/content-editor.js` - Rich text editing utilities
- `src/models/ContentVersion.js` - Content versioning model
- `src/scripts/admin-content-editor.js` - Frontend editor

## Implementation Phases

### Phase 1: Database-Driven Page Foundation
1. Create Page database model with slug-based routing
2. Implement database page router middleware
3. Install and configure Handlebars template engine
4. Create basic admin interface for page management
5. Update server.js with new routing system

### Phase 2: Template System & Admin Interface
1. Create template and layout system
2. Build admin page creation/editing interface
3. Implement page preview functionality
4. Add SEO and meta tag management
5. Test page creation and rendering

### Phase 3: Plugin System Architecture
1. Design and implement plugin management system
2. Create plugin discovery and registration
3. Implement plugin lifecycle hooks
4. Add plugin admin interface
5. Test plugin installation and activation

### Phase 4: Members Plugin (Working Example)
1. Create members plugin as proof of concept
2. Implement member data models and routes
3. Create member templates and admin interface
4. Test dynamic member page generation
5. Demonstrate plugin extensibility

### Phase 5: Content Management & Integration
1. Extend inline editing for database pages
2. Add rich text editor and media management
3. Implement content versioning
4. Ensure legacy system integration
5. Performance optimization and caching

## Working Example: Database-Driven Pages & Members Plugin

### System Architecture Example
```
Database Pages:
├── /co-working-spaces         # Custom page created by admin
├── /about-us                  # Custom page created by admin
├── /services                  # Custom page created by admin
└── /contact                   # Custom page created by admin

Members Plugin:
├── /members                   # Plugin-generated listing page
├── /members/marie-durand      # Plugin-generated member detail
└── /members/thomas-bertrand   # Plugin-generated member detail

Legacy System:
└── /                          # Home page (existing sections)
```

### Database Structure Example
```javascript
// Pages Collection
{
  _id: ObjectId("..."),
  slug: "co-working-spaces",
  title: "Espaces de Co-working",
  content: "<h1>Nos Espaces de Travail Partagé</h1><p>Découvrez nos espaces...</p>",
  template: "default",
  layout: "default",
  status: "published",
  meta: {
    description: "Espaces de co-working dans les Bauges",
    keywords: ["co-working", "bauges", "espace de travail"]
  },
  settings: {
    showInNavigation: true,
    navigationOrder: 2
  },
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-20T14:30:00Z"
}

// Members Collection (Plugin)
{
  _id: ObjectId("..."),
  slug: "marie-durand",
  name: "Marie Durand",
  title: "Graphiste & Illustratrice",
  description: "Spécialisée dans l'identité visuelle...",
  image: "https://...",
  skills: ["Design", "Illustration"],
  contact: { email: "marie@example.com" },
  bio: "<p>Passionnée par la nature...</p>",
  status: "active",
  createdAt: "2024-01-10T09:00:00Z"
}
```

### Example Implementation Files

#### `src/models/Page.js` - Database Page Model
```javascript
const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  template: {
    type: String,
    default: 'default',
    enum: ['default', 'full-width', 'landing', 'contact']
  },
  layout: {
    type: String,
    default: 'default',
    enum: ['default', 'full-width', 'admin']
  },
  meta: {
    description: String,
    keywords: [String],
    ogImage: String
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'published', 'archived']
  },
  author: {
    type: String,
    required: true
  },
  settings: {
    showInNavigation: { type: Boolean, default: false },
    navigationOrder: { type: Number, default: 0 },
    requireAuth: { type: Boolean, default: false },
    customCSS: String,
    customJS: String
  }
}, {
  timestamps: true
});

// Static method to find page by slug
PageSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'published' });
};

module.exports = mongoose.model('Page', PageSchema);
```

#### `src/middleware/page.middleware.js` - Database Page Router
```javascript
const Page = require('../models/Page');
const { renderPage } = require('../utils/template-engine');

/**
 * Database-driven page routing middleware
 */
async function pageMiddleware(req, res, next) {
  // Skip if it's an API route or static asset
  if (req.path.startsWith('/api/') || req.path.startsWith('/scripts/') || req.path.includes('.')) {
    return next();
  }
  
  // Skip home page (handled by legacy system)
  if (req.path === '/') {
    return next();
  }
  
  try {
    // Extract slug from URL (remove leading slash)
    const slug = req.path.slice(1);
    
    // Look up page in database
    const page = await Page.findBySlug(slug);
    
    if (!page) {
      // No page found, continue to next middleware (plugins, static files, 404)
      return next();
    }
    
    // Render page using template engine
    const html = await renderPage(page, req);
    
    // Set appropriate headers
    res.set('Content-Type', 'text/html');
    
    // Send rendered page
    res.send(html);
    
  } catch (error) {
    console.error('Error rendering page:', error);
    next(error);
  }
}

module.exports = { pageMiddleware };
```

#### `src/utils/template-engine.js` - Template Rendering System
```javascript
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class TemplateEngine {
  constructor() {
    this.layouts = new Map();
    this.templates = new Map();
    this.partials = new Map();
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    // Load layouts
    await this.loadTemplates('src/templates/layouts', this.layouts);
    
    // Load page templates
    await this.loadTemplates('src/templates/pages', this.templates);
    
    // Load partials
    await this.loadPartials('src/templates/partials');
    
    this.initialized = true;
  }
  
  async loadTemplates(dir, cache) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const content = await fs.readFile(path.join(dir, file), 'utf8');
          const name = file.replace('.hbs', '');
          cache.set(name, handlebars.compile(content));
        }
      }
    } catch (error) {
      console.error(`Error loading templates from ${dir}:`, error);
    }
  }
  
  async loadPartials(dir) {
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const content = await fs.readFile(path.join(dir, file), 'utf8');
          const name = file.replace('.hbs', '');
          handlebars.registerPartial(name, content);
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
      throw new Error(`Layout not found: ${page.layout}`);
    }
    
    // Get page template
    const pageTemplate = this.templates.get(page.template || 'default');
    if (!pageTemplate) {
      throw new Error(`Template not found: ${page.template}`);
    }
    
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
      isAdmin: req.user?.isAdmin || false
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
}

const templateEngine = new TemplateEngine();

module.exports = {
  renderPage: (page, req) => templateEngine.renderPage(page, req),
  templateEngine
};
```

#### `src/templates/layouts/default.hbs` - Default Layout
```handlebars
<!DOCTYPE html>
<html lang="fr" data-theme="bauges" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} - Les Indép'en Bauges</title>
  <meta name="description" content="{{description}}">
  {{#if keywords}}
  <meta name="keywords" content="{{join keywords ', '}}">
  {{/if}}
  
  {{> head-styles}}
  
  {{#if customCSS}}
  <style>{{{customCSS}}}</style>
  {{/if}}
</head>
<body class="bg-bauges-light text-bauges-dark">
  {{> header}}
  
  <main>
    {{{body}}}
  </main>
  
  {{> footer}}
  {{> admin-scripts}}
  
  {{#if customJS}}
  <script>{{{customJS}}}</script>
  {{/if}}
</body>
</html>
```

#### `src/plugins/members/plugin.json` - Members Plugin Definition
```json
{
  "name": "members",
  "version": "1.0.0",
  "description": "Member directory and profile management",
  "author": "Les Indép'en Bauges",
  "main": "index.js",
  "routes": [
    {
      "path": "/members",
      "method": "GET",
      "handler": "listMembers",
      "template": "member-list"
    },
    {
      "path": "/members/:slug",
      "method": "GET", 
      "handler": "memberDetail",
      "template": "member-detail"
    }
  ],
  "adminRoutes": [
    {
      "path": "/admin/members",
      "title": "Manage Members",
      "icon": "fas fa-users"
    }
  ],
  "models": ["Member"],
  "templates": ["member-list", "member-detail"],
  "hooks": {
    "beforePageRender": "addMemberNavigation",
    "afterInstall": "createSampleMembers"
  },
  "dependencies": {
    "mongoose": "^8.14.0"
  }
}
```

#### `src/plugins/members/index.js` - Members Plugin Implementation
```javascript
const Member = require('./models/Member');
const { renderTemplate } = require('../../utils/template-engine');

class MembersPlugin {
  constructor() {
    this.name = 'members';
    this.routes = new Map();
  }
  
  async initialize() {
    // Register route handlers
    this.routes.set('/members', this.listMembers.bind(this));
    this.routes.set('/members/:slug', this.memberDetail.bind(this));
  }
  
  async listMembers(req, res) {
    try {
      const members = await Member.find({ status: 'active' })
        .sort({ name: 1 });
      
      const context = {
        title: 'Nos Membres',
        description: 'Découvrez les talents de notre communauté',
        members,
        currentUrl: req.path
      };
      
      const html = await renderTemplate('member-list', 'default', context);
      res.send(html);
      
    } catch (error) {
      console.error('Error listing members:', error);
      res.status(500).send('Error loading members');
    }
  }
  
  async memberDetail(req, res) {
    try {
      const member = await Member.findOne({ 
        slug: req.params.slug, 
        status: 'active' 
      });
      
      if (!member) {
        return res.status(404).send('Member not found');
      }
      
      const context = {
        title: `${member.name} - Membre`,
        description: member.description,
        member,
        currentUrl: req.path
      };
      
      const html = await renderTemplate('member-detail', 'default', context);
      res.send(html);
      
    } catch (error) {
      console.error('Error loading member:', error);
      res.status(500).send('Error loading member');
    }
  }
  
  // Plugin lifecycle hooks
  async addMemberNavigation(context) {
    // Add members link to navigation
    if (!context.navigation) context.navigation = [];
    context.navigation.push({
      title: 'Membres',
      url: '/members',
      order: 3
    });
    return context;
  }
  
  async createSampleMembers() {
    // Create sample members on plugin installation
    const sampleMembers = [
      {
        slug: 'marie-durand',
        name: 'Marie Durand',
        title: 'Graphiste & Illustratrice',
        description: 'Spécialisée dans l\'identité visuelle...',
        status: 'active'
      }
    ];
    
    for (const memberData of sampleMembers) {
      const existingMember = await Member.findOne({ slug: memberData.slug });
      if (!existingMember) {
        await Member.create(memberData);
      }
    }
  }
}

module.exports = MembersPlugin;
```

#### `src/routes/admin/pages.js` - Admin Page Management API
```javascript
const express = require('express');
const router = express.Router();
const Page = require('../../models/Page');
const { authenticateToken } = require('../../middleware/auth.middleware');

// List all pages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pages = await Page.find()
      .sort({ updatedAt: -1 })
      .select('slug title status author updatedAt settings.showInNavigation');
    
    res.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, message: 'Error fetching pages' });
  }
});

// Create new page
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { slug, title, content, template, layout, meta, settings } = req.body;
    
    // Validate required fields
    if (!slug || !title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: slug, title, content' 
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
      author: req.user.name || 'admin'
    });
    
    await page.save();
    
    res.json({ success: true, page });
    
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ success: false, message: 'Error creating page' });
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
    if (content) page.content = content;
    if (template) page.template = template;
    if (layout) page.layout = layout;
    if (meta) page.meta = { ...page.meta, ...meta };
    if (settings) page.settings = { ...page.settings, ...settings };
    if (status) page.status = status;
    
    page.author = req.user.name || 'admin';
    
    await page.save();
    
    res.json({ success: true, page });
    
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

module.exports = router;
```

## Quick Start Implementation Guide

### Step 1: Install Dependencies
```bash
npm install handlebars mongoose
```

### Step 2: Create Directory Structure
```bash
mkdir -p src/models src/middleware src/utils
mkdir -p src/templates/layouts src/templates/pages src/templates/partials
mkdir -p src/routes/admin src/plugins/members
```

### Step 3: Create Core Database Models
1. `src/models/Page.js` - Page model with slug-based routing
2. `src/models/Plugin.js` - Plugin metadata model
3. `src/plugins/members/models/Member.js` - Member model (plugin)

### Step 4: Implement Template Engine
1. `src/utils/template-engine.js` - Handlebars template system
2. `src/templates/layouts/default.hbs` - Default layout
3. `src/templates/partials/` - Convert existing sections to partials

### Step 5: Add Database Page Routing
1. `src/middleware/page.middleware.js` - Database page router
2. Update `src/server.js` to use page middleware
3. Create admin interface for page management

### Step 6: Test Database Pages
- Create `/co-working-spaces` page via admin interface
- Test page rendering and template system
- Verify legacy home page still works

### Step 7: Implement Members Plugin
1. Create members plugin structure
2. Test plugin installation and activation
3. Create sample member pages
4. Verify dynamic member routing works

## Technical Specifications

### Database-Driven Routing System
```
Routing Priority:
1. Home route (/) -> Legacy sections system
2. Database pages -> Page.findBySlug(slug)
3. Plugin routes -> Plugin route handlers
4. Static files -> Express static middleware
5. 404 handler -> Custom 404 page
```

### Page URL Structure
```
/                           -> Legacy home page (sections)
/co-working-spaces         -> Database page (slug: "co-working-spaces")
/about-us                  -> Database page (slug: "about-us")
/members                   -> Members plugin (listing)
/members/marie-durand      -> Members plugin (detail)
/admin/pages               -> Admin page management
/admin/plugins             -> Plugin management
```

### Template Engine: Handlebars
- **Layout inheritance**: Supports nested layouts and partials
- **Custom helpers**: Extensible with custom Handlebars helpers
- **Plugin templates**: Plugins can provide their own templates
- **Dynamic template selection**: Based on page/plugin configuration

### Plugin Architecture
```
Plugin Structure:
├── plugin.json            # Plugin metadata and configuration
├── index.js               # Main plugin class
├── models/                # Plugin-specific database models
├── templates/             # Plugin templates
├── routes/                # Plugin route handlers
└── admin/                 # Plugin admin interface
```

### Data Structure Example (Members)
```json
{
  "id": "marie-durand",
  "name": "Marie Durand",
  "title": "Graphiste & Illustratrice",
  "description": "Spécialisée dans l'identité visuelle...",
  "image": "https://...",
  "skills": ["Design", "Illustration", "Identité visuelle"],
  "contact": {
    "email": "marie@example.com",
    "website": "https://...",
    "linkedin": "https://..."
  },
  "portfolio": [...],
  "bio": "Detailed biography...",
  "location": "Bauges",
  "joinDate": "2023-01-15"
}
```

### Template Structure (Refined)
```
src/templates/
├── layouts/
│   ├── default.hbs        # Main layout (uses existing sections as partials)
│   ├── member.hbs         # Member-specific layout
│   └── admin.hbs          # Admin layout
├── pages/
│   ├── members-list.hbs   # Members listing page
│   ├── member-detail.hbs  # Member detail page
│   └── about.hbs          # About page (when migrated)
├── partials/
│   ├── head-styles.hbs    # Converted from sections/head.html
│   ├── header.hbs         # Converted from sections/navigation.html
│   ├── footer.hbs         # Converted from sections/footer.html
│   ├── admin-scripts.hbs  # Admin scripts partial
│   └── member-card.hbs    # Member card component
└── helpers/
    └── index.js           # Custom Handlebars helpers
```

## Migration Strategy (Refined)

### Coexistence Approach
- **Legacy System**: `src/sections/` continues to work for `/` route
- **New System**: `src/pages/` handles new routes like `/members/*`
- **Shared Components**: Convert sections to Handlebars partials for reuse
- **Admin Interface**: Extended to support both systems

### Implementation Steps
1. **Phase 1**: Add new system alongside existing one
2. **Phase 2**: Create member pages as proof of concept
3. **Phase 3**: Gradually convert other pages (optional)
4. **Phase 4**: Maintain both systems long-term or complete migration

### Zero-Downtime Deployment
- New routes don't affect existing functionality
- Legacy route (`/`) remains unchanged
- Gradual feature rollout with instant rollback capability

## Benefits of New Architecture

### For Developers
- **Scalability**: Easy to add new page types and content
- **Maintainability**: Cleaner separation of concerns
- **Flexibility**: Support for both static and dynamic content
- **Reusability**: Template components can be reused across pages

### For Content Managers
- **Consistency**: Uniform editing experience across all pages
- **Efficiency**: Bulk content management capabilities
- **Flexibility**: Easy to create new member profiles and pages

### For End Users
- **Performance**: Server-side rendering for better SEO and initial load
- **Navigation**: Clear URL structure for bookmarking and sharing
- **Accessibility**: Better semantic structure and navigation

## Risk Mitigation

### Technical Risks
- **Complexity**: Gradual implementation with thorough testing
- **Performance**: Caching strategies and optimization
- **Compatibility**: Maintain backward compatibility during transition

### Content Risks
- **Data Loss**: Comprehensive backup and migration testing
- **Downtime**: Blue-green deployment strategy
- **User Experience**: Maintain familiar interface during transition

## Success Metrics

### Technical Metrics
- Page load times remain under 2 seconds
- All existing functionality preserved
- New member pages generate successfully
- Admin editing works across all page types

### Business Metrics
- Ability to add 10+ member detail pages
- Reduced time to add new content types
- Improved SEO rankings for member pages
- Enhanced user engagement with member profiles

## Quick Start Implementation Guide

### Step 1: Install Dependencies
```bash
npm install handlebars express-handlebars
```

### Step 2: Create Directory Structure
```bash
mkdir -p src/pages/members src/pages/_layouts
mkdir -p src/templates/layouts src/templates/pages src/templates/partials
mkdir -p src/data
```

### Step 3: Create Core Files
1. `src/utils/router.js` - File-system router
2. `src/middleware/pages.middleware.js` - Page routing middleware
3. `src/utils/data.js` - Data utilities
4. `src/data/members.json` - Sample member data

### Step 4: Update Server
Add page routing middleware to `src/server.js` before static file serving.

### Step 5: Test Member Pages
- Create `/members/marie-durand` route
- Test dynamic routing and template rendering
- Verify legacy system still works

## Next Steps

### Immediate Actions (Week 1)
1. **Install Handlebars**: Add template engine to project
2. **Create Router**: Implement file-system routing utility
3. **Setup Middleware**: Add page routing to Express server
4. **Create Sample Data**: Add member data structure

### Short Term (Week 2-3)
1. **Member Pages**: Implement working member detail pages
2. **Layout System**: Create reusable layouts and partials
3. **Testing**: Verify both legacy and new systems work
4. **Documentation**: Update development documentation

### Medium Term (Month 1-2)
1. **Content Management**: Extend admin interface for new pages
2. **Additional Pages**: Add more dynamic page types
3. **Optimization**: Implement caching and performance improvements
4. **SEO**: Add meta tags and structured data

## Questions for Stakeholders

1. **Priority**: Should we start with the basic database page system or the members plugin first?
2. **Timeline**: What's the preferred timeline for implementing the database-driven pages?
3. **Admin Interface**: What level of complexity do you want in the page management interface?
4. **Plugin System**: Are there other plugins you'd like to implement besides members (events, services, etc.)?
5. **Content Migration**: Should we migrate existing content to database pages or keep the legacy system?
6. **SEO Requirements**: Are there specific SEO features needed for the new pages?

## Success Criteria

### Phase 1 Success (Database Pages)
- [ ] Users can create pages with custom slugs via admin interface
- [ ] Pages render correctly with chosen templates and layouts
- [ ] Legacy home page continues to function normally
- [ ] SEO meta tags work properly for database pages

### Phase 2 Success (Plugin System)
- [ ] Members plugin can be installed and activated
- [ ] Dynamic member pages generate correctly (e.g., `/members/marie-durand`)
- [ ] Plugin admin interface allows member management
- [ ] Plugin system is extensible for future features

### Phase 3 Success (Integration)
- [ ] Both legacy sections and database pages work seamlessly
- [ ] Inline editing works for database page content
- [ ] Performance is comparable to current system
- [ ] Admin interface is intuitive and user-friendly

## Benefits of Database-Driven Architecture

### For Administrators
- **Flexibility**: Create any page with custom URL slug
- **Ease of Use**: No technical knowledge required to add pages
- **SEO Control**: Full control over meta tags and page settings
- **Content Management**: Rich text editing and media management

### For Developers
- **Extensibility**: Plugin system allows easy feature additions
- **Maintainability**: Clean separation between core system and plugins
- **Scalability**: Database-driven approach scales with content growth
- **Modern Architecture**: Template engine and plugin system follow modern patterns

### For End Users
- **Better URLs**: Clean, semantic URLs for all pages
- **Improved SEO**: Proper meta tags and structured content
- **Faster Navigation**: Server-side rendering for better performance
- **Consistent Experience**: Unified design across all pages

---

This completely redefined plan creates a modern, database-driven CMS with a plugin architecture while maintaining full backward compatibility with your existing section-based system. The approach allows users to create pages with custom slugs (like `/co-working-spaces`) through an admin interface, and provides a robust foundation for adding features like member pages through plugins.