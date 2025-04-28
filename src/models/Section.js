/**
 * MongoDB model for storing section content
 */

const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  // The filename of the section (e.g., 'hero.html', 'about.html')
  filename: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // The full content of the section file
  content: {
    type: String,
    required: true
  },
  
  // Last updated timestamp
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Last updated by (admin name)
  updatedBy: {
    type: String,
    default: 'system'
  }
});

// Add a method to get all section filenames
SectionSchema.statics.getAllFilenames = async function() {
  const sections = await this.find({}, 'filename');
  return sections.map(section => section.filename);
};

module.exports = mongoose.model('Section', SectionSchema);
