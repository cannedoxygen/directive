// Enhanced ProposalShowcase with improved layout and animation support
const React = require('react');
const { useState, useEffect, useRef } = React;

/**
 * Enhanced component to display submitted proposals in a responsive grid layout
 * @param {Object} props - Component props
 * @param {Array} props.proposals - List of proposal objects
 * @param {Function} props.onTagFilter - Function called when a tag filter is selected
 * @param {Function} props.onVote - Function called when a proposal is voted on
 */
const ProposalShowcase = ({ proposals = [], onTagFilter, onVote }) => {
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [activeTag, setActiveTag] = useState('All');
  const showcaseRef = useRef(null);
  
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
  
  // Handle voting on proposals
  const handleVote = (proposalId, voteType) => {
    if (onVote) {
      onVote(proposalId, voteType);
    }
  };
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    // Skip if browser doesn't support IntersectionObserver
    if (!('IntersectionObserver' in window)) return;
    
    const options = {
      root: null, // Use viewport
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% of element is visible
    };
    
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing after animation
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, options);
    
    // Get all cards in the showcase
    if (showcaseRef.current) {
      const cards = showcaseRef.current.querySelectorAll('.proposal-card');
      cards.forEach(card => {
        card.classList.add('animate-on-scroll');
        observer.observe(card);
      });
    }
    
    return () => {
      // Clean up observer on unmount
      if (observer) {
        observer.disconnect();
      }
    };
  }, [filteredProposals]); // Re-run when filtered proposals change
  
  return React.createElement('div', { 
    className: 'proposal-showcase',
    ref: showcaseRef
  }, [
    React.createElement('h2', { key: 'title' }, 'Community Proposals'),
    
    // Tag filter buttons
    React.createElement('div', { key: 'filters', className: 'tag-filters' }, 
      tags.map(tag => 
        React.createElement('button', {
          key: tag,
          className: `tag-filter ${activeTag === tag ? 'active' : ''}`,
          onClick: () => handleTagSelect(tag)
        }, tag)
      )
    ),
    
    // Filtered proposals grid
    filteredProposals.length > 0 
      ? React.createElement('div', { 
          key: 'grid', 
          className: 'proposal-grid'
        },
        filteredProposals.map(proposal => 
          React.createElement(window.ProposalCard || ProposalCard, { 
            key: proposal.id, 
            proposal: proposal,
            onVote: handleVote
          })
        )
      )
      : React.createElement('div', { 
          key: 'empty', 
          className: 'no-proposals'
        },
        React.createElement('p', {}, 'No proposals found for this category.')
      ),
      
    // Aikira flavor message
    React.createElement('div', { 
      key: 'message', 
      className: 'aikira-message'
    },
      React.createElement('p', {}, 
        activeTag === 'All' 
          ? '"Community input detected. Analyzing..."' 
          : `"${activeTag} proposals are being evaluated for efficiency."`
      )
    )
  ]);
};

// Export for use in bootstrap.js
if (typeof module !== 'undefined') {
  module.exports = ProposalShowcase;
} else {
  window.ProposalShowcase = ProposalShowcase;
}