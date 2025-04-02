import React from 'react';

/**
 * Component to display a single proposal in card format
 * @param {Object} props - Component props
 * @param {Object} props.proposal - Proposal data object
 * @param {string} props.proposal.id - Unique identifier
 * @param {string} props.proposal.proposal - Proposal content
 * @param {string} props.proposal.tag - Category tag
 * @param {string} props.proposal.walletAddress - Submitter's wallet address
 * @param {string} props.proposal.timestamp - Submission timestamp
 * @param {string} props.proposal.status - Current status (pending, approved, rejected)
 */
const ProposalCard = ({ proposal }) => {
  // Format the timestamp to a readable date
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
  
  return (
    <div className={`proposal-card ${proposal.status || 'pending'}`}>
      <div className="card-header">
        <span className="proposal-tag">{proposal.tag}</span>
        <span className="submission-date">{formatDate(proposal.timestamp)}</span>
      </div>
      
      <div className="proposal-content">
        <p>{truncateText(proposal.proposal)}</p>
      </div>
      
      <div className="card-footer">
        <div className="submitter-info">
          <span className="wallet-icon">💳</span>
          <span className="wallet-address">{formatWalletAddress(proposal.walletAddress)}</span>
        </div>
        
        <div className={`proposal-status ${proposal.status || 'pending'}`}>
          {getStatusText(proposal.status)}
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;