# Database-Driven Pages Implementation

This implementation adds a database-driven page system to the existing site, allowing users to create custom pages with URL slugs through an admin interface.

## 🚀 Features Implemented

### Phase 1: Database Page Foundation
- ✅ **Page Model** (`src/models/Page.js`) - MongoDB schema for pages with slug-based routing
- ✅ **Page Middleware** (`src/middleware/page.middleware.js`) - Dynamic routing from database
- ✅ **Template Engine** (`src/utils/template-engine.js`) - Handlebars rendering system

### Phase 2: Admin Interface
- ✅ **Admin API** (`src/routes/admin/pages.js`) - Complete CRUD operations for pages
- ✅ **Admin Frontend** (`src/scripts/admin-pages.js`) - Page management interface
- ✅ **Page Templates** - Multiple page templates (default, contact, landing, full-width)

### Phase 3: Template System
- ✅ **Layouts** - Reusable layouts (default, full-width, admin)
- ✅ **Partials** - Converted existing sections to Handlebars partials
- ✅ **SEO Support** - Meta tags, Open Graph, Twitter Cards

## 🏗️ Architecture

### Routing Priority
```
1. Home route (/) -> Legacy sections system (unchanged)
2. API routes (/api/*) -> Express API routes
3. Database pages -> Page.findBySlug(slug)
4. Static files -> Express static middleware
5. 404 handler
```

### File Structure
```
src/
├── models/
│   └── Page.js                 # Page database model
├── middleware/
│   └── page.middleware.js      # Database page routing
├── routes/admin/
│   └── pages.js               # Admin page management API
├── templates/
│   ├── layouts/
│   │   ├── default.hbs        # Standard layout
│   │   ├── full-width.hbs     # Full-width layout
│   │   └── admin.hbs          # Admin layout
│   ├── pages/
│   │   ├── default.hbs        # Default page template
│   │   ├── contact.hbs        # Contact page template
│   │   └── landing.hbs        # Landing page template
│   └── partials/
│       ├── header.hbs         # Site header
│       ├── footer.hbs         # Site footer
│       ├── head-styles.hbs    # CSS and styles
│       └── admin-scripts.hbs  # Admin scripts
├── scripts/
│   └── admin-pages.js         # Frontend page management
└── utils/
    └── template-engine.js     # Handlebars template system
```

## 🧪 Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Legacy System
```bash
npm run build
```

### 3. Create Test Pages
```bash
npm run create-test-pages
```

### 4. Start Server
```bash
npm run dev
```

### 5. Test Database Pages
Visit these URLs to test the database-driven pages:
- http://localhost:3000/co-working-spaces
- http://localhost:3000/about-us
- http://localhost:3000/contact-us
- http://localhost:3000/welcome

### 6. Test Admin Interface
1. Go to http://localhost:3000/ (home page)
2. Login as admin (existing admin system)
3. Look for the "Pages" button in the admin toolbar
4. Create, edit, and manage pages through the interface

## 📋 Page Management Features

### Admin Interface
- **Create Pages**: Custom slug, title, content, template selection
- **Edit Pages**: Full WYSIWYG editing with live preview
- **Page Templates**: Choose from default, contact, landing, full-width
- **SEO Management**: Meta description, keywords, Open Graph images
- **Navigation Control**: Show/hide pages in site navigation
- **Status Management**: Draft, published, archived
- **Duplicate Pages**: One-click page duplication
- **Search & Filter**: Find pages by title, slug, or content

### Page Features
- **Custom URLs**: Any slug like `/co-working-spaces`, `/about-us`
- **Template System**: Multiple page layouts and templates
- **SEO Optimized**: Proper meta tags, Open Graph, Twitter Cards
- **Responsive Design**: Mobile-friendly templates
- **Navigation Integration**: Pages can appear in site navigation
- **Content Editing**: Rich HTML content with inline editing support

## 🔧 Configuration

### Available Templates
- `default` - Standard page with container
- `contact` - Contact page with form
- `landing` - Hero section with call-to-action
- `full-width` - Full-width content without container

### Available Layouts
- `default` - Standard layout with header/footer
- `full-width` - Full-width layout
- `admin` - Admin interface layout

### Page Schema
```javascript
{
  slug: String,           // URL slug (e.g., "co-working-spaces")
  title: String,          // Page title
  content: String,        // HTML content
  template: String,       // Template to use
  layout: String,         // Layout to use
  meta: {
    description: String,  // SEO description
    keywords: [String],   // SEO keywords
    ogImage: String       // Social media image
  },
  status: String,         // published, draft, archived
  settings: {
    showInNavigation: Boolean,
    navigationOrder: Number,
    customCSS: String,
    customJS: String
  }
}
```

## 🔄 Legacy Compatibility

The implementation maintains **100% backward compatibility**:

- ✅ Home page (`/`) continues to use the existing section system
- ✅ All existing functionality remains unchanged
- ✅ Admin inline editing still works for sections
- ✅ Build process for sections is preserved
- ✅ All existing routes and APIs continue to work

## 🚀 Next Steps

This implementation provides the foundation for:

1. **Plugin System** - Extensible architecture for features like member pages
2. **Content Versioning** - Track changes and enable rollbacks
3. **Media Management** - File upload and management system
4. **Advanced SEO** - Structured data, sitemaps, analytics
5. **Performance Optimization** - Caching, CDN integration

## 🐛 Troubleshooting

### Common Issues

1. **Pages not loading**: Check MongoDB connection and ensure pages are published
2. **Templates not found**: Verify template files exist in `src/templates/`
3. **Admin interface not showing**: Ensure you're logged in as admin
4. **Styling issues**: Check that CSS files are loading correctly

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 📚 API Reference

### Page Management API

#### GET `/api/admin/pages`
List all pages with optional filtering
- Query params: `status`, `search`

#### POST `/api/admin/pages`
Create new page
- Body: `{ slug, title, content, template, layout, meta, settings }`

#### PUT `/api/admin/pages/:id`
Update existing page
- Body: `{ title, content, template, layout, meta, settings, status }`

#### DELETE `/api/admin/pages/:id`
Delete page

#### POST `/api/admin/pages/:id/duplicate`
Duplicate existing page

---

The database-driven page system is now ready for testing! 🎉