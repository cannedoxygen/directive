import React, { useState, useEffect } from 'react';
import PhantomConnect from './PhantomConnect.jsx';
import TerminalInput from './TerminalInput.jsx';
import TagSelector from './TagSelector.jsx';
import StatusIndicator from './StatusIndicator.jsx';
import ProposalShowcase from './ProposalShowcase.jsx';
import usePhantomWallet from '../hooks/usePhantomWallet.js';
import useTokenBalance from '../hooks/useTokenBalance.js';
import { addProposal, getProposals } from '../db/localDb.js';

// Development mode flag - set to true to bypass token requirements for testing
const DEV_MODE = true;

// Aikira token configuration - will need a real address for production
const AIKIRA_TOKEN_ADDRESS = '0xa884C16a93792D1E0156fF4C8A3B2C59b8d04C9A'; // Use the one from useTokenBalance hook
const REQUIRED_TOKEN_AMOUNT = 10000; // Minimum tokens required to submit proposals

/**
 * Main component that orchestrates the proposal submission system
 */
const ProposalSystem = () => {
  // State
  const [proposalText, setProposalText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showProposals, setShowProposals] = useState(false);
  const [allProposals, setAllProposals] = useState([]);
  
  // Custom hooks
  const { 
    address, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect,
    isPhantomInstalled
  } = usePhantomWallet();
  
  // Use the token balance hook with the configured address
  const tokenInfo = useTokenBalance(
    address,
    AIKIRA_TOKEN_ADDRESS,
    REQUIRED_TOKEN_AMOUNT
  );
  
  // Override token check in development mode
  const hasTokens = DEV_MODE ? true : tokenInfo.hasEnoughTokens;
  
  // Load proposals on mount
  useEffect(() => {
    const proposals = getProposals();
    setAllProposals(proposals);
  }, []);
  
  // Handle proposal submission
  const handleSubmitProposal = async () => {
    if (!proposalText.trim() || !selectedTag) return;
    
    setSubmissionStatus('uploading');
    
    // Create proposal object
    const newProposal = {
      proposal: proposalText,
      tag: selectedTag,
      walletAddress: address
    };
    
    try {
      // Add to local database
      const proposalId = addProposal(newProposal);
      
      if (proposalId) {
        // Update local state with new proposal
        const updatedProposal = {
          ...newProposal,
          id: proposalId,
          timestamp: new Date().toISOString(),
          status: 'pending'
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
  
  // Handle tag selection
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
  };
  
  // Handle text input
  const handleProposalTextChange = (text) => {
    setProposalText(text);
  };
  
  // Toggle proposal showcase view
  const toggleShowProposals = () => {
    setShowProposals(prev => !prev);
  };
  
  // Render different views based on connection & token status
  const renderContent = () => {
    // If not connected to wallet
    if (!isConnected && !DEV_MODE) {
      return (
        <div className="connection-required">
          <h2>Connect Wallet to Submit Proposals</h2>
          <p>Ownership of $AIKIRA tokens is required to participate.</p>
          
          {!isPhantomInstalled ? (
            <div className="phantom-not-installed">
              <p>Phantom wallet not detected. Please install Phantom to continue.</p>
              <a 
                href="https://phantom.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="install-link"
              >
                Install Phantom
              </a>
            </div>
          ) : (
            <PhantomConnect 
              onConnect={connect} 
              onDisconnect={disconnect}
            />
          )}
          
          {DEV_MODE && (
            <div className="dev-mode-notice">
              <p>Development Mode Active: Token verification bypassed</p>
            </div>
          )}
        </div>
      );
    }
    
    // If connected but not enough tokens (and not in dev mode)
    if (!hasTokens && !DEV_MODE) {
      return (
        <div className="tokens-required">
          <h2>$AIKIRA Tokens Required</h2>
          <p>You need at least {REQUIRED_TOKEN_AMOUNT} $AIKIRA tokens to submit proposals.</p>
          <p>Current balance: {tokenInfo.formattedBalance} {tokenInfo.symbol}</p>
          
          <div className="token-actions">
            <a 
              href="https://app.uniswap.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="buy-link"
            >
              Get $AIKIRA
            </a>
            <button 
              className="disconnect-button"
              onClick={disconnect}
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      );
    }
    
    // If connected with enough tokens, or in dev mode, show the submission form or proposals
    return (
      <div className="proposal-container">
        <div className="view-toggle">
          <button 
            className={`toggle-button ${!showProposals ? 'active' : ''}`}
            onClick={() => setShowProposals(false)}
          >
            Submit
          </button>
          <button 
            className={`toggle-button ${showProposals ? 'active' : ''}`}
            onClick={() => setShowProposals(true)}
          >
            View Proposals
          </button>
        </div>
        
        {showProposals ? (
          <ProposalShowcase proposals={allProposals} />
        ) : (
          <div className="submission-form">
            {isConnected ? (
              <div className="wallet-status">
                <span>Connected: {address.slice(0, 6)}...{address.slice(-4)}</span>
                <button 
                  className="disconnect-button"
                  onClick={disconnect}
                >
                  Disconnect
                </button>
              </div>
            ) : DEV_MODE && (
              <div className="dev-mode-wallet">
                <span>Development Mode: Wallet Connection Bypassed</span>
              </div>
            )}
            
            {isConnected && (
              <div className="token-status">
                <span>Balance: {tokenInfo.formattedBalance} {tokenInfo.symbol}</span>
              </div>
            )}
            
            <TagSelector 
              selectedTag={selectedTag}
              onSelectTag={handleTagSelect}
            />
            
            <TerminalInput 
              onSubmit={handleProposalTextChange}
              value={proposalText}
            />
            
            <button 
              className="submit-proposal-button"
              onClick={handleSubmitProposal}
              disabled={!proposalText.trim() || !selectedTag}
            >
              Submit Proposal
            </button>
            
            {submissionStatus && (
              <StatusIndicator status={submissionStatus} />
            )}
            
            <div className="aikira-flavor-text">
              <p>"I do not promise approval. I promise consideration."</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="proposal-system">
      <h1 className="system-title">Aikira Community Proposals</h1>
      {renderContent()}
      {DEV_MODE && (
        <div className="dev-mode-banner">
          <p>Development Mode Active: Wallet and token requirements bypassed for testing</p>
        </div>
      )}
    </div>
  );
};

export default ProposalSystem;