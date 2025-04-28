/**
 * MongoDB utilities for script/styles injections
 */

const { Injection } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new injection
 * @param {Object} injectionData - The injection data
 * @param {string} adminName - The name of the admin who created the injection
 * @returns {Promise<Object>} - The created injection document
 */
const createInjection = async (injectionData, adminName = 'system') => {
  try {
    console.log(`injection.js createInjection Creating new injection`, {data: injectionData});
    
    // Generate a unique ID if not provided
    const injectionId = injectionData.injectionId || `injection-${uuidv4()}`;
    
    // Create new injection
    const newInjection = new Injection({
      ...injectionData,
      injectionId,
      createdBy: adminName,
      updatedAt: new Date()
    });
    
    await newInjection.save();
    return newInjection;
  } catch (err) {
    console.log(`injection.js createInjection Error creating injection`, {message: err.message, stack: err.stack});
    throw err;
  }
};

/**
 * Update an existing injection
 * @param {string} injectionId - The ID of the injection to update
 * @param {Object} updateData - The data to update
 * @param {string} adminName - The name of the admin who updated the injection
 * @returns {Promise<Object>} - The updated injection document
 */
const updateInjection = async (injectionId, updateData, adminName = 'system') => {
  try {
    console.log(`injection.js updateInjection Updating injection`, {data: {injectionId, updateData}});
    
    // Check if injection exists and is not a system injection if trying to modify content
    const existingInjection = await Injection.findOne({ injectionId });
    
    if (!existingInjection) {
      throw new Error(`Injection with ID ${injectionId} not found`);
    }
    
    // Check if it's a system injection and if we're trying to modify it
    if (existingInjection.origin === 'system' && (updateData.code || updateData.type || updateData.location)) {
      throw new Error('Cannot modify content of system injections');
    }
    
    // Update the injection
    Object.keys(updateData).forEach(key => {
      if (key !== 'injectionId' && key !== 'origin' && key !== 'createdBy' && key !== 'createdAt') {
        existingInjection[key] = updateData[key];
      }
    });
    
    existingInjection.updatedAt = new Date();
    
    await existingInjection.save();
    return existingInjection;
  } catch (err) {
    console.log(`injection.js updateInjection Error updating injection`, {message: err.message, stack: err.stack});
    throw err;
  }
};

/**
 * Delete an injection
 * @param {string} injectionId - The ID of the injection to delete
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
const deleteInjection = async (injectionId) => {
  try {
    console.log(`injection.js deleteInjection Deleting injection`, {data: {injectionId}});
    
    // Check if injection exists and is not a system injection
    const existingInjection = await Injection.findOne({ injectionId });
    
    if (!existingInjection) {
      throw new Error(`Injection with ID ${injectionId} not found`);
    }
    
    if (existingInjection.origin === 'system') {
      throw new Error('Cannot delete system injections');
    }
    
    await Injection.deleteOne({ injectionId });
    return true;
  } catch (err) {
    console.log(`injection.js deleteInjection Error deleting injection`, {message: err.message, stack: err.stack});
    throw err;
  }
};

/**
 * Get all injections with optional filtering
 * @param {Object} filters - Filters to apply (type, location, origin, isActive)
 * @returns {Promise<Array>} - Array of injection documents
 */
const getInjections = async (filters = {}) => {
  try {
    console.log(`injection.js getInjections Getting injections with filters`, {data: filters});
    
    const query = {};
    
    // Apply filters if provided
    if (filters.type) query.type = filters.type;
    if (filters.location) query.location = filters.location;
    if (filters.origin) query.origin = filters.origin;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    
    const injections = await Injection.find(query).sort({ createdAt: -1 });
    return injections;
  } catch (err) {
    console.log(`injection.js getInjections Error getting injections`, {message: err.message, stack: err.stack});
    throw err;
  }
};

/**
 * Get a single injection by ID
 * @param {string} injectionId - The ID of the injection to get
 * @returns {Promise<Object>} - The injection document
 */
const getInjectionById = async (injectionId) => {
  try {
    console.log(`injection.js getInjectionById Getting injection by ID`, {data: {injectionId}});
    
    const injection = await Injection.findOne({ injectionId });
    
    if (!injection) {
      throw new Error(`Injection with ID ${injectionId} not found`);
    }
    
    return injection;
  } catch (err) {
    console.log(`injection.js getInjectionById Error getting injection`, {message: err.message, stack: err.stack});
    throw err;
  }
};

/**
 * Get all active injections for a specific location (for rendering)
 * @param {string} location - The location to get injections for
 * @returns {Promise<Array>} - Array of injection documents
 */
const getActiveInjectionsByLocation = async (location) => {
  try {
    console.log(`injection.js getActiveInjectionsByLocation Getting active injections for location`, {data: {location}});
    
    return await Injection.findActiveByLocation(location);
  } catch (err) {
    console.log(`injection.js getActiveInjectionsByLocation Error getting active injections`, {message: err.message, stack: err.stack});
    throw err;
  }
};

module.exports = {
  createInjection,
  updateInjection,
  deleteInjection,
  getInjections,
  getInjectionById,
  getActiveInjectionsByLocation
};
