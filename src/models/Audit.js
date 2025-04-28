/**
 * MongoDB model for audit logs of content changes
 */

const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  // The filename of the section that was changed
  filename: {
    type: String,
    required: true,
    trim: true
  },
  
  // The element ID that was changed
  elementId: {
    type: String,
    required: true
  },
  
  // The type of element that was changed
  elementType: {
    type: String,
    required: true
  },
  
  // The previous content
  previousContent: {
    type: String
  },
  
  // The new content
  newContent: {
    type: String,
    required: true
  },
  
  // The admin who made the change
  adminName: {
    type: String,
    default: 'unknown'
  },
  
  // IP address of the client
  ipAddress: {
    type: String
  },
  
  // User agent of the client
  userAgent: {
    type: String
  },
  
  // Timestamp of the change
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add a method to get recent changes
AuditSchema.statics.getRecentChanges = async function(limit = 10) {
  return this.find({})
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Audit', AuditSchema);
