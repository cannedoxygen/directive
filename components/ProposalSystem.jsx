// components/ProposalSystem.jsx
const React = require('react');
const { useState, useEffect } = React;
const PhantomConnect = require('./PhantomConnect');
const TagSelector = require('./TagSelector');
const StatusIndicator = require('./StatusIndicator');
const ProposalShowcase = require('./ProposalShowcase');
const localDb = require('../db/localDb');
const useTokenBalance = require('../hooks/useTokenBalance');

// Development mode flag - set to false
const DEV_MODE = false;

// Aikira token configuration
const AIKIRA_TOKEN_ADDRESS = '0xa884C16a93792D1E0156fF4C8A3B2C59b8d04C9A';
const REQUIRED_TOKEN_AMOUNT = 10000;

function ProposalSystem() {
  // State
  const [walletAddress, setWalletAddress] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showProposals, setShowProposals] = useState(false);
  const [allProposals, setAllProposals] = useState([]);
  const [userId, setUserId] = useState(() => {
    // Use stored ID or generate a new one
    const storedId = localStorage.getItem('aikira_user_id');
    return storedId || `user-${Date.now()}`;
  });
  
  // Use token balance hook
  const tokenInfo = useTokenBalance(
    walletAddress,
    AIKIRA_TOKEN_ADDRESS,
    REQUIRED_TOKEN_AMOUNT
  );
  
  // Determine if user has enough tokens
  const hasTokens = DEV_MODE || tokenInfo.hasEnoughTokens;
  
  // Save userId to localStorage
  useEffect(() => {
    localStorage.setItem('aikira_user_id', userId);
  }, [userId]);
  
  // Load proposals on mount
  useEffect(() => {
    try {
      const proposals = localDb.getProposals();
      
      // Process proposals to add userVote property
      const processedProposals = proposals.map(proposal => ({
        ...proposal,
        userVote: localDb.getUserVote(proposal.id, userId)
      }));
      
      setAllProposals(processedProposals || []);
    } catch (err) {
      console.error('Error loading proposals:', err);
      setAllProposals([]);
    }
  }, [userId]);
  
  // Handle wallet connection
  const handleConnect = (address) => {
    console.log("Wallet connected:", address);
    setWalletAddress(address);
  };
  
  // Handle proposal submission
  const handleSubmitProposal = () => {
    if (!proposalText.trim() || !selectedTag) return;
    
    setSubmissionStatus('uploading');
    
    // Create proposal object
    const newProposal = {
      proposal: proposalText,
      tag: selectedTag,
      walletAddress: walletAddress || 'Anonymous'
    };
    
    try {
      // Add to local database
      const proposalId = localDb.addProposal(newProposal);
      
      if (proposalId) {
        // Update local state with new proposal
        const updatedProposal = {
          ...newProposal,
          id: proposalId,
          timestamp: new Date().toISOString(),
          status: 'pending',
          upvotes: 0,
          downvotes: 0,
          userVote: null
        };
        
        setAllProposals(prev => [updatedProposal, ...prev]);
        setSubmissionStatus('success');
        
        // Reset form
        setProposalText('');
        setSelectedTag('');
        
        // Clear success state after delay
        setTimeout(() => {
          setSubmissionStatus(null);
        }, 5000);
      } else {
        throw new Error('Failed to save proposal');
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setSubmissionStatus('error');
      
      // Clear error state after delay
      setTimeout(() => {
        setSubmissionStatus(null);
      }, 5000);
    }
  };
  
  // Handle proposal voting
  const handleVote = (proposalId, voteType) => {
    try {
      const success = localDb.voteOnProposal(proposalId, userId, voteType);
      
      if (success) {
        // Update proposals in state to reflect the vote
        setAllProposals(prevProposals => 
          prevProposals.map(proposal => {
            if (proposal.id === proposalId) {
              // Get updated votes
              const proposals = localDb.getProposals();
              const updatedProposal = proposals.find(p => p.id === proposalId);
              
              if (updatedProposal) {
                return {
                  ...updatedProposal,
                  userVote: localDb.getUserVote(proposalId, userId)
                };
              }
            }
            return proposal;
          })
        );
      }
    } catch (err) {
      console.error('Error voting on proposal:', err);
    }
  };
  
  // Handle tag selection
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
  };
  
  // Handle text input
  const handleProposalTextChange = (e) => {
    setProposalText(e.target.value);
  };
  
  // Render different views based on connection & token status
  const renderContent = () => {
    // If not connected to wallet
    if (!walletAddress && !DEV_MODE) {
      return React.createElement('div', { className: 'connection-required' }, [
        React.createElement('h2', { key: 'title' }, 'Connect Wallet to Submit Proposals'),
        React.createElement('p', { key: 'info' }, 'Ownership of $AIKIRA tokens is required to participate.'),
        
        React.createElement(PhantomConnect, {
          key: 'connect',
          onConnect: handleConnect
        })
      ]);
    }
    
    // If connected but not enough tokens (and not in dev mode)
    if (walletAddress && !hasTokens && !DEV_MODE) {
      return React.createElement('div', { className: 'tokens-required' }, [
        React.createElement('h2', { key: 'title' }, '$AIKIRA Tokens Required'),
        React.createElement('p', { key: 'info' }, `You need at least ${REQUIRED_TOKEN_AMOUNT} $AIKIRA tokens to submit proposals.`),
        React.createElement('p', { key: 'balance' }, `Current balance: ${tokenInfo.formattedBalance} ${tokenInfo.symbol}`),
        
        // Only show the "Get AIKIRA" button when they need more tokens
        React.createElement('div', { key: 'actions', className: 'token-actions' }, [
          React.createElement('a', {
            key: 'buy',
            href: 'https://app.uniswap.org/',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'buy-link'
          }, 'Get $AIKIRA')
        ])
      ]);
    }
    
    // Main interface - either connected with tokens or in dev mode
    return React.createElement('div', { className: 'proposal-container' }, [
      React.createElement('div', { key: 'toggle', className: 'view-toggle' }, [
        React.createElement('button', {
          key: 'submit-toggle',
          className: `toggle-button ${!showProposals ? 'active' : ''}`,
          onClick: () => setShowProposals(false)
        }, 'Submit'),
        React.createElement('button', {
          key: 'view-toggle',
          className: `toggle-button ${showProposals ? 'active' : ''}`,
          onClick: () => setShowProposals(true)
        }, 'View Proposals')
      ]),
      
      showProposals 
        ? React.createElement(ProposalShowcase, { 
            key: 'showcase',
            proposals: allProposals,
            onVote: handleVote
          })
        : React.createElement('div', { key: 'form', className: 'submission-form' }, [
            // Wallet status display
            walletAddress 
              ? React.createElement('div', { key: 'wallet', className: 'wallet-status' }, [
                  React.createElement('span', { key: 'address' }, `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`),
                  React.createElement('div', { key: 'token', className: 'token-status' },
                    React.createElement('span', {}, `Balance: ${tokenInfo.formattedBalance} ${tokenInfo.symbol}`)
                  )
                ])
              : DEV_MODE && React.createElement('div', { key: 'dev-wallet', className: 'dev-mode-wallet' }, 
                  React.createElement('span', { key: 'dev-message' }, 'Development Mode: Wallet Connection Bypassed')
                ),
            
            // Tag selector
            React.createElement(TagSelector, {
              key: 'tags',
              selectedTag: selectedTag,
              onSelectTag: handleTagSelect
            }),
            
            // Terminal input
            React.createElement('textarea', {
              key: 'input',
              className: 'terminal-input',
              placeholder: 'Type your proposal here...',
              value: proposalText,
              onChange: handleProposalTextChange,
              rows: 4
            }),
            
            // Submit button
            React.createElement('button', {
              key: 'submit',
              className: 'submit-proposal-button',
              onClick: handleSubmitProposal,
              disabled: !proposalText.trim() || !selectedTag
            }, 'Submit Proposal'),
            
            // Status indicator
            submissionStatus && React.createElement(StatusIndicator, {
              key: 'status',
              status: submissionStatus
            }),
            
            // Flavor text
            React.createElement('div', { key: 'flavor', className: 'aikira-flavor-text' }, 
              React.createElement('p', { key: 'flavor-text' }, '"I do not promise approval. I promise consideration."')
            )
          ])
    ]);
  };
  
  return React.createElement('div', { className: 'proposal-system' }, [
    React.createElement('h1', { key: 'title', className: 'system-title' }, 'Aikira Community Proposals'),
    renderContent(),
    DEV_MODE && React.createElement('div', { key: 'dev-banner', className: 'dev-mode-banner' },
      React.createElement('p', { key: 'banner-text' }, 'Development Mode Active: Wallet and token requirements bypassed for testing')
    )
  ]);
}

module.exports = ProposalSystem;