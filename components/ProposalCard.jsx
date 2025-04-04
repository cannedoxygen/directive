import React, { useState, useEffect } from 'react';
import { updateProposal } from '../db/localDb';

/**
 * Enhanced proposal card component with animations and voting
 * @param {Object} props - Component props
 * @param {Object} props.proposal - Proposal data object
 * @param {Function} props.onVote - Function called when vote is cast
 */
const ProposalCard = ({ proposal, onVote }) => {
  // Local state for votes
  const [upvotes, setUpvotes] = useState(proposal.upvotes || 0);
  const [downvotes, setDownvotes] = useState(proposal.downvotes || 0);
  const [userVote, setUserVote] = useState(proposal.userVote || null); // 'up', 'down', or null
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
    if (proposal.status !== 'pending') return;
    
    // Animate the vote count
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // If user clicks the same vote type they already selected, remove their vote
    if (userVote === voteType) {
      if (voteType === 'up') {
        setUpvotes(prevUpvotes => prevUpvotes - 1);
      } else {
        setDownvotes(prevDownvotes => prevDownvotes - 1);
      }
      setUserVote(null);
      
      // Call parent component's onVote callback
      if (onVote) {
        onVote(proposal.id, null);
      }
      return;
    }
    
    // If user is changing their vote
    if (userVote === 'up' && voteType === 'down') {
      setUpvotes(prevUpvotes => prevUpvotes - 1);
      setDownvotes(prevDownvotes => prevDownvotes + 1);
    } else if (userVote === 'down' && voteType === 'up') {
      setDownvotes(prevDownvotes => prevDownvotes - 1);
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
    if (onVote) {
      onVote(proposal.id, voteType);
    }
  };
  
  return (
    <div className={`proposal-card ${proposal.status || 'pending'}`}>
      {/* Card Header */}
      <div className="card-header">
        <span className="proposal-tag">{proposal.tag}</span>
        <span className="submission-date">{formatDate(proposal.timestamp)}</span>
      </div>
      
      {/* Proposal Content */}
      <div className="proposal-content">
        <p>{truncateText(proposal.proposal)}</p>
      </div>
      
      {/* Card Footer */}
      <div className="card-footer">
        <div className="submitter-info">
          <span className="wallet-icon">💳</span>
          <span className="wallet-address">{formatWalletAddress(proposal.walletAddress)}</span>
        </div>
        <div className={`proposal-status ${proposal.status || 'pending'}`}>
          {getStatusText(proposal.status)}
        </div>
      </div>
      
      {/* Voting Section */}
      <div className="proposal-voting">
        {/* Upvote button */}
        <button
          className={`vote-button upvote ${userVote === 'up' ? 'active' : ''}`}
          onClick={() => handleVote('up')}
          disabled={proposal.status !== 'pending'}
          aria-label="Upvote"
        >
          <span className="vote-icon">👍</span>
          <span className={`vote-count ${isAnimating && userVote === 'up' ? 'changed' : ''}`}>
            {upvotes}
          </span>
        </button>
        
        {/* Downvote button */}
        <button
          className={`vote-button downvote ${userVote === 'down' ? 'active' : ''}`}
          onClick={() => handleVote('down')}
          disabled={proposal.status !== 'pending'}
          aria-label="Downvote"
        >
          <span className="vote-icon">👎</span>
          <span className={`vote-count ${isAnimating && userVote === 'down' ? 'changed' : ''}`}>
            {downvotes}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProposalCard;