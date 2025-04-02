/**
 * Simple local database implementation using localStorage
 * Handles storing and retrieving proposals
 */

import { v4 as uuidv4 } from 'uuid';

// Database name in localStorage
const DB_KEY = 'aikira_proposals_db';

/**
 * Initialize the database
 * @returns {boolean} Success status
 */
export const initializeDb = () => {
  try {
    // Check if DB exists already
    const existingDb = localStorage.getItem(DB_KEY);
    
    if (!existingDb) {
      // Create empty database structure
      const initialDb = {
        proposals: [],
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

/**
 * Get the entire database
 * @returns {Object|null} Database object or null if error
 */
export const getDb = () => {
  try {
    const dbString = localStorage.getItem(DB_KEY);
    return dbString ? JSON.parse(dbString) : null;
  } catch (error) {
    console.error('Failed to get database:', error);
    return null;
  }
};

/**
 * Save the database
 * @param {Object} db - Database object
 * @returns {boolean} Success status
 */
export const saveDb = (db) => {
  try {
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return true;
  } catch (error) {
    console.error('Failed to save database:', error);
    return false;
  }
};

/**
 * Get all proposals
 * @returns {Array} Array of proposal objects
 */
export const getProposals = () => {
  const db = getDb();
  return db ? db.proposals : [];
};

/**
 * Get proposals filtered by tag
 * @param {string} tag - Tag to filter by
 * @returns {Array} Filtered array of proposal objects
 */
export const getProposalsByTag = (tag) => {
  const proposals = getProposals();
  
  if (!tag || tag.toLowerCase() === 'all') {
    return proposals;
  }
  
  return proposals.filter(proposal => 
    proposal.tag && proposal.tag.toLowerCase() === tag.toLowerCase()
  );
};

/**
 * Add a new proposal
 * @param {Object} proposal - Proposal data
 * @returns {string|null} New proposal ID or null if error
 */
export const addProposal = (proposal) => {
  try {
    const db = getDb();
    if (!db) return null;
    
    // Create new proposal with ID and timestamp
    const newProposal = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...proposal
    };
    
    // Add to database
    db.proposals.unshift(newProposal); // Add at beginning for newest first
    saveDb(db);
    
    return newProposal.id;
  } catch (error) {
    console.error('Failed to add proposal:', error);
    return null;
  }
};

/**
 * Update a proposal
 * @param {string} id - Proposal ID
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success status
 */
export const updateProposal = (id, updates) => {
  try {
    const db = getDb();
    if (!db) return false;
    
    const index = db.proposals.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    // Update the proposal
    db.proposals[index] = {
      ...db.proposals[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    saveDb(db);
    return true;
  } catch (error) {
    console.error('Failed to update proposal:', error);
    return false;
  }
};

/**
 * Delete a proposal
 * @param {string} id - Proposal ID
 * @returns {boolean} Success status
 */
export const deleteProposal = (id) => {
  try {
    const db = getDb();
    if (!db) return false;
    
    const initialLength = db.proposals.length;
    db.proposals = db.proposals.filter(p => p.id !== id);
    
    // Only save if something was actually removed
    if (db.proposals.length !== initialLength) {
      saveDb(db);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to delete proposal:', error);
    return false;
  }
};

/**
 * Export database to JSON file
 * @returns {boolean} Success status
 */
export const exportDb = () => {
  try {
    const db = getDb();
    if (!db) return false;
    
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `aikira_proposals_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    return true;
  } catch (error) {
    console.error('Failed to export database:', error);
    return false;
  }
};

/**
 * Import database from JSON string
 * @param {string} jsonData - JSON data to import
 * @returns {boolean} Success status
 */
export const importDb = (jsonData) => {
  try {
    const importedDb = JSON.parse(jsonData);
    
    // Validate basic structure
    if (!importedDb || !Array.isArray(importedDb.proposals)) {
      throw new Error('Invalid database format');
    }
    
    // Save to localStorage
    localStorage.setItem(DB_KEY, JSON.stringify({
      ...importedDb,
      lastUpdated: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to import database:', error);
    return false;
  }
};

// Initialize the database when this module is imported
initializeDb();