import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook for managing proposals in local storage
 * @returns {Object} Proposal data and functions
 */
const useProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load proposals from local storage on initial mount
  useEffect(() => {
    const loadProposals = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get proposals from localStorage
        const storedProposals = localStorage.getItem('aikira_proposals');
        
        if (storedProposals) {
          // Parse and sort by timestamp (newest first)
          const parsedProposals = JSON.parse(storedProposals);
          const sortedProposals = parsedProposals.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );
          
          setProposals(sortedProposals);
        } else {
          // Initialize with empty array if no proposals found
          setProposals([]);
        }
      } catch (err) {
        console.error('Error loading proposals:', err);
        setError('Failed to load proposals');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProposals();
  }, []);
  
  // Save proposals to local storage whenever they change
  useEffect(() => {
    if (proposals.length > 0) {
      try {
        localStorage.setItem('aikira_proposals', JSON.stringify(proposals));
      } catch (err) {
        console.error('Error saving proposals:', err);
        setError('Failed to save proposals');
      }
    }
  }, [proposals]);
  
  // Add a new proposal
  const addProposal = useCallback((proposalData) => {
    const newProposal = {
      id: uuidv4(), // Generate unique ID
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...proposalData
    };
    
    setProposals(prevProposals => [newProposal, ...prevProposals]);
    return newProposal.id; // Return ID for reference
  }, []);
  
  // Get proposals filtered by tag
  const getProposalsByTag = useCallback((tag) => {
    if (!tag || tag === 'All') {
      return proposals;
    }
    
    return proposals.filter(proposal => proposal.tag === tag);
  }, [proposals]);
  
  // Update proposal status
  const updateProposalStatus = useCallback((id, status) => {
    setProposals(prevProposals => 
      prevProposals.map(proposal => 
        proposal.id === id 
          ? { ...proposal, status } 
          : proposal
      )
    );
  }, []);
  
  // Delete a proposal
  const deleteProposal = useCallback((id) => {
    setProposals(prevProposals => 
      prevProposals.filter(proposal => proposal.id !== id)
    );
  }, []);
  
  // Export proposals to JSON
  const exportProposals = useCallback(() => {
    try {
      const dataStr = JSON.stringify(proposals, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create download link
      const exportFileDefaultName = `aikira_proposals_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      return true;
    } catch (err) {
      console.error('Error exporting proposals:', err);
      setError('Failed to export proposals');
      return false;
    }
  }, [proposals]);
  
  // Import proposals from JSON file
  const importProposals = useCallback((jsonData) => {
    try {
      const importedProposals = JSON.parse(jsonData);
      
      // Validate imported data
      if (!Array.isArray(importedProposals)) {
        throw new Error('Invalid proposal data format');
      }
      
      // Merge with existing proposals, avoiding duplicates by ID
      const existingIds = proposals.map(p => p.id);
      const newProposals = importedProposals.filter(p => !existingIds.includes(p.id));
      
      setProposals(prevProposals => [...prevProposals, ...newProposals]);
      return true;
    } catch (err) {
      console.error('Error importing proposals:', err);
      setError('Failed to import proposals: ' + err.message);
      return false;
    }
  }, [proposals]);
  
  return {
    proposals,
    isLoading,
    error,
    addProposal,
    getProposalsByTag,
    updateProposalStatus,
    deleteProposal,
    exportProposals,
    importProposals
  };
};

export default useProposals;