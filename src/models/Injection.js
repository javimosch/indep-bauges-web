/**
 * MongoDB model for script/styles injections
 */

const mongoose = require('mongoose');

const InjectionSchema = new mongoose.Schema({
  // Unique identifier for the injection
  injectionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Name/description for the injection
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Type of injection: 'script' or 'style'
  type: {
    type: String,
    required: true,
    enum: ['script', 'style'],
    default: 'script'
  },

  // The code content to be injected
  code: {
    type: String,
    required: true
  },

  // Where to inject: 'before-body-close' or 'before-head-close'
  location: {
    type: String,
    required: true,
    enum: ['before-body-close', 'before-head-close'],
    default: 'before-body-close'
  },

  // Who created the injection: 'user' or 'system'
  origin: {
    type: String,
    required: true,
    enum: ['user', 'system'],
    default: 'user'
  },

  // Is the injection active
  isActive: {
    type: Boolean,
    default: true
  },

  // The admin who created the injection
  createdBy: {
    type: String,
    default: 'system'
  },

  // Timestamp of creation
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Timestamp of last update
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add a method to find active injections by location
InjectionSchema.statics.findActiveByLocation = async function(location) {
  return this.find({
    location,
    isActive: true
  }).sort({ createdAt: 1 });
};

module.exports = mongoose.model('Injection', InjectionSchema);
