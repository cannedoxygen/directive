/**
 * Simple local database implementation using localStorage
 * Handles storing and retrieving proposals
 */

// Simple UUID generation that works in all browsers
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Database name in localStorage
const DB_KEY = 'aikira_proposals_db';

/**
 * Initialize the database
 * @returns {boolean} Success status
 */
function initializeDb() {
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
}

/**
 * Get the entire database
 * @returns {Object|null} Database object or null if error
 */
function getDb() {
  try {
    const dbString = localStorage.getItem(DB_KEY);
    return dbString ? JSON.parse(dbString) : null;
  } catch (error) {
    console.error('Failed to get database:', error);
    return null;
  }
}

/**
 * Save the database
 * @param {Object} db - Database object
 * @returns {boolean} Success status
 */
function saveDb(db) {
  try {
    db.lastUpdated = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return true;
  } catch (error) {
    console.error('Failed to save database:', error);
    return false;
  }
}

/**
 * Get all proposals
 * @returns {Array} Array of proposal objects
 */
function getProposals() {
  const db = getDb();
  return db ? db.proposals : [];
}

/**
 * Get proposals filtered by tag
 * @param {string} tag - Tag to filter by
 * @returns {Array} Filtered array of proposal objects
 */
function getProposalsByTag(tag) {
  const proposals = getProposals();
  
  if (!tag || tag.toLowerCase() === 'all') {
    return proposals;
  }
  
  return proposals.filter(proposal => 
    proposal.tag && proposal.tag.toLowerCase() === tag.toLowerCase()
  );
}

/**
 * Add a new proposal
 * @param {Object} proposal - Proposal data
 * @returns {string|null} New proposal ID or null if error
 */
function addProposal(proposal) {
  try {
    const db = getDb();
    if (!db) return null;
    
    // Create new proposal with ID and timestamp
    const newProposal = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      upvotes: 0,
      downvotes: 0,
      votes: {},
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
}

/**
 * Update a proposal
 * @param {string} id - Proposal ID
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success status
 */
function updateProposal(id, updates) {
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
}

/**
 * Delete a proposal
 * @param {string} id - Proposal ID
 * @returns {boolean} Success status
 */
function deleteProposal(id) {
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
}

/**
 * Export database to JSON file
 * @returns {boolean} Success status
 */
function exportDb() {
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
}

/**
 * Import database from JSON string
 * @param {string} jsonData - JSON data to import
 * @returns {boolean} Success status
 */
function importDb(jsonData) {
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
}

/**
 * Record a vote on a proposal
 * @param {string} id - Proposal ID
 * @param {string} userId - User ID
 * @param {string|null} voteType - 'up', 'down', or null to remove vote
 * @returns {boolean} Success status
 */
function voteOnProposal(id, userId, voteType) {
  try {
    const db = getDb();
    if (!db) return false;
    
    const index = db.proposals.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    const proposal = db.proposals[index];
    
    // Initialize voting properties if they don't exist
    if (!proposal.upvotes) proposal.upvotes = 0;
    if (!proposal.downvotes) proposal.downvotes = 0;
    if (!proposal.votes) proposal.votes = {};
    
    // Check if user has already voted
    const previousVote = proposal.votes[userId];
    
    // Remove previous vote if exists
    if (previousVote) {
      if (previousVote === 'up') {
        proposal.upvotes = Math.max(0, proposal.upvotes - 1);
      } else {
        proposal.downvotes = Math.max(0, proposal.downvotes - 1);
      }
    }
    
    // Add new vote if not removing vote
    if (voteType !== null) {
      // Add new vote
      if (voteType === 'up') {
        proposal.upvotes += 1;
      } else {
        proposal.downvotes += 1;
      }
      
      // Store user's vote
      proposal.votes[userId] = voteType;
    } else {
      // Clear user's vote
      delete proposal.votes[userId];
    }
    
    // Update proposal
    db.proposals[index] = proposal;
    saveDb(db);
    
    return true;
  } catch (error) {
    console.error('Failed to vote on proposal:', error);
    return false;
  }
}

/**
 * Get user's vote on a proposal
 * @param {string} id - Proposal ID
 * @param {string} userId - User ID
 * @returns {string|null} Vote type or null if no vote
 */
function getUserVote(id, userId) {
  try {
    const db = getDb();
    if (!db) return null;
    
    const proposal = db.proposals.find(p => p.id === id);
    if (!proposal || !proposal.votes) return null;
    
    return proposal.votes[userId] || null;
  } catch (error) {
    console.error('Failed to get user vote:', error);
    return null;
  }
}

// Initialize the database when this module is imported
initializeDb();

// Export functions using CommonJS
module.exports = {
  initializeDb,
  getDb,
  saveDb,
  getProposals,
  getProposalsByTag,
  addProposal,
  updateProposal,
  deleteProposal,
  exportDb,
  importDb,
  voteOnProposal,
  getUserVote
};