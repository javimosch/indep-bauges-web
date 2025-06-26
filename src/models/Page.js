/**
 * MongoDB model for database-driven pages
 */

const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 100
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
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
    description: {
      type: String,
      maxlength: 160
    },
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
    showInNavigation: { 
      type: Boolean, 
      default: false 
    },
    navigationOrder: { 
      type: Number, 
      default: 0 
    },
    requireAuth: { 
      type: Boolean, 
      default: false 
    },
    customCSS: String,
    customJS: String
  }
}, {
  timestamps: true
});

// Index for faster slug lookups
PageSchema.index({ slug: 1, status: 1 });

// Static method to find published page by slug
PageSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, status: 'published' });
};

// Static method to get navigation pages
PageSchema.statics.getNavigationPages = function() {
  return this.find({ 
    status: 'published', 
    'settings.showInNavigation': true 
  }).sort({ 'settings.navigationOrder': 1, title: 1 });
};

// Pre-save middleware to validate slug
PageSchema.pre('save', function(next) {
  // Ensure slug is URL-friendly
  if (this.slug) {
    this.slug = this.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Page', PageSchema);