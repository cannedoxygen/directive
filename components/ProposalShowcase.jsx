import React, { useState, useEffect } from 'react';
import ProposalCard from './ProposalCard';

/**
 * Component to display submitted proposals in a grid layout
 * @param {Object} props - Component props
 * @param {Array} props.proposals - List of proposal objects
 * @param {Function} props.onTagFilter - Function called when a tag filter is selected
 */
const ProposalShowcase = ({ proposals = [], onTagFilter }) => {
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [activeTag, setActiveTag] = useState('All');
  
  // Available tags plus "All" option
  const tags = ['All', 'Grants', 'Rewards', 'Trading', 'Marketing', 'Other'];
  
  // Filter proposals when activeTag or proposals change
  useEffect(() => {
    if (activeTag === 'All') {
      setFilteredProposals(proposals);
    } else {
      setFilteredProposals(proposals.filter(proposal => proposal.tag === activeTag));
    }
  }, [activeTag, proposals]);
  
  // Handle tag selection
  const handleTagSelect = (tag) => {
    setActiveTag(tag);
    if (onTagFilter) {
      onTagFilter(tag);
    }
  };
  
  return (
    <div className="proposal-showcase">
      <h2>Community Proposals</h2>
      
      <div className="tag-filters">
        {tags.map(tag => (
          <button
            key={tag}
            className={`tag-filter ${activeTag === tag ? 'active' : ''}`}
            onClick={() => handleTagSelect(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      
      {filteredProposals.length > 0 ? (
        <div className="proposal-grid">
          {filteredProposals.map(proposal => (
            <ProposalCard 
              key={proposal.id} 
              proposal={proposal} 
            />
          ))}
        </div>
      ) : (
        <div className="no-proposals">
          <p>No proposals found for this category.</p>
        </div>
      )}
      
      {/* Aikira-flavored messages */}
      <div className="aikira-message">
        <p>
          {activeTag === 'All' 
            ? '"Community input detected. Analyzing..."' 
            : `"${activeTag} proposals are being evaluated for efficiency."`
          }
        </p>
      </div>
    </div>
  );
};

export default ProposalShowcase;