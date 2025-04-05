// components/ProposalCard.jsx
const React = require('react');
const { useState, useEffect } = React;
const localDb = require('../db/localDb');

/**
 * Enhanced proposal card component with animations and voting
 * @param {Object} props - Component props
 * @param {Object} props.proposal - Proposal data object
 * @param {Function} props.onVote - Function called when vote is cast
 */
const ProposalCard = ({ proposal = {}, onVote }) => {
  // Add default values to prevent undefined errors
  const safeProposal = {
    id: '',
    proposal: '',
    tag: '',
    walletAddress: '',
    timestamp: '',
    status: 'pending',
    upvotes: 0,
    downvotes: 0,
    userVote: null,
    ...proposal // Merge with actual proposal data if present
  };
  
  // Local state for votes with safe defaults
  const [upvotes, setUpvotes] = useState(safeProposal.upvotes || 0);
  const [downvotes, setDownvotes] = useState(safeProposal.downvotes || 0);
  const [userVote, setUserVote] = useState(safeProposal.userVote || null); // 'up', 'down', or null
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };
  
  // Truncate proposal text if it's too long
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return 'Anonymous';
    if (typeof address !== 'string') return 'Invalid Address';
    
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get status display text
  const getStatusText = (status) => {
    switch(status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };
  
  // Handle vote button click
  const handleVote = (voteType) => {
    // Don't allow voting if proposal is not pending
    if (safeProposal.status !== 'pending') return;
    
    // Animate the vote count
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // If user clicks the same vote type they already selected, remove their vote
    if (userVote === voteType) {
      if (voteType === 'up') {
        setUpvotes(prevUpvotes => Math.max(0, prevUpvotes - 1));
      } else {
        setDownvotes(prevDownvotes => Math.max(0, prevDownvotes - 1));
      }
      setUserVote(null);
      
      // Call parent component's onVote callback
      if (onVote && safeProposal.id) {
        onVote(safeProposal.id, null);
      }
      return;
    }
    
    // If user is changing their vote
    if (userVote === 'up' && voteType === 'down') {
      setUpvotes(prevUpvotes => Math.max(0, prevUpvotes - 1));
      setDownvotes(prevDownvotes => prevDownvotes + 1);
    } else if (userVote === 'down' && voteType === 'up') {
      setDownvotes(prevDownvotes => Math.max(0, prevDownvotes - 1));
      setUpvotes(prevUpvotes => prevUpvotes + 1);
    } else if (voteType === 'up') {
      // New upvote
      setUpvotes(prevUpvotes => prevUpvotes + 1);
    } else {
      // New downvote
      setDownvotes(prevDownvotes => prevDownvotes + 1);
    }
    
    setUserVote(voteType);
    
    // Call parent component's onVote callback
    if (onVote && safeProposal.id) {
      onVote(safeProposal.id, voteType);
    }
  };
  
  // If there's no valid proposal object at all, show a fallback
  if (!proposal || typeof proposal !== 'object') {
    return React.createElement('div', { className: 'proposal-card error' },
      React.createElement('p', {}, 'Error loading proposal data')
    );
  }
  
  return React.createElement('div', { 
    className: `proposal-card ${safeProposal.status || 'pending'}`
  }, [
    // Card Header
    React.createElement('div', { key: 'header', className: 'card-header' }, [
      React.createElement('span', { key: 'tag', className: 'proposal-tag' }, safeProposal.tag || 'Uncategorized'),
      React.createElement('span', { key: 'date', className: 'submission-date' }, formatDate(safeProposal.timestamp))
    ]),
    
    // Proposal Content
    React.createElement('div', { key: 'content', className: 'proposal-content' }, 
      React.createElement('p', {}, truncateText(safeProposal.proposal))
    ),
    
    // Card Footer
    React.createElement('div', { key: 'footer', className: 'card-footer' }, [
      React.createElement('div', { key: 'submitter', className: 'submitter-info' }, [
        React.createElement('span', { key: 'icon', className: 'wallet-icon' }, '💳'),
        React.createElement('span', { key: 'address', className: 'wallet-address' }, 
          formatWalletAddress(safeProposal.walletAddress)
        )
      ]),
      React.createElement('div', { 
        key: 'status', 
        className: `proposal-status ${safeProposal.status || 'pending'}`
      }, getStatusText(safeProposal.status))
    ]),
    
    // Voting Section
    React.createElement('div', { key: 'voting', className: 'proposal-voting' }, [
      // Upvote button
      React.createElement('button', {
        key: 'upvote',
        className: `vote-button upvote ${userVote === 'up' ? 'active' : ''}`,
        onClick: () => handleVote('up'),
        disabled: safeProposal.status !== 'pending',
        'aria-label': 'Upvote'
      }, [
        React.createElement('span', { key: 'icon', className: 'vote-icon' }, '👍'),
        React.createElement('span', { 
          key: 'count',
          className: `vote-count ${isAnimating && userVote === 'up' ? 'changed' : ''}`
        }, upvotes)
      ]),
      
      // Downvote button
      React.createElement('button', {
        key: 'downvote',
        className: `vote-button downvote ${userVote === 'down' ? 'active' : ''}`,
        onClick: () => handleVote('down'),
        disabled: safeProposal.status !== 'pending',
        'aria-label': 'Downvote'
      }, [
        React.createElement('span', { key: 'icon', className: 'vote-icon' }, '👎'),
        React.createElement('span', { 
          key: 'count',
          className: `vote-count ${isAnimating && userVote === 'down' ? 'changed' : ''}`
        }, downvotes)
      ])
    ])
  ]);
};

// Export the module using CommonJS syntax
module.exports = ProposalCard;