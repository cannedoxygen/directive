// Complete Bootstrap file with enhanced proposal cards and voting - FIXED VERSION
const React = require('react');
const { useState, useEffect, useRef } = React;
const ReactDOM = require('react-dom/client');

// Import CSS
require('./assets/styles/main.css');
require('./assets/styles/terminal.css');
// Import enhanced card styles - make sure these files exist in your project
require('./assets/styles/enhanced-cards.css');
require('./assets/styles/scroll-animations.css');

// Development mode flag - set to false to enable wallet checks
const DEV_MODE = false;

// Aikira token configuration
const AIKIRA_TOKEN_ADDRESS = '0xa884C16a93792D1E0156fF4C8A3B2C59b8d04C9A';
const REQUIRED_TOKEN_AMOUNT = 100;

// Enhanced localStorage implementation for proposal storage with voting
const ProposalDB = {
  init: () => {
    if (!localStorage.getItem('aikira_proposals')) {
      localStorage.setItem('aikira_proposals', JSON.stringify([]));
    }
  },
  
  getAll: () => {
    const data = localStorage.getItem('aikira_proposals');
    return data ? JSON.parse(data) : [];
  },
  
  add: (proposal) => {
    const proposals = ProposalDB.getAll();
    const newProposal = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'pending',
      upvotes: 0,
      downvotes: 0,
      votes: {},
      ...proposal
    };
    proposals.unshift(newProposal); // Add to beginning
    localStorage.setItem('aikira_proposals', JSON.stringify(proposals));
    return newProposal;
  },
  
  vote: (proposalId, userId, voteType) => {
    try {
      const proposals = ProposalDB.getAll();
      const proposalIndex = proposals.findIndex(p => p.id === proposalId);
      
      if (proposalIndex === -1) return false;
      
      // Get the proposal
      const proposal = proposals[proposalIndex];
      
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
      
      // Update proposal in the array
      proposals[proposalIndex] = proposal;
      
      // Save DB
      localStorage.setItem('aikira_proposals', JSON.stringify(proposals));
      
      return true;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      return false;
    }
  },
  
  getUserVote: (proposalId, userId) => {
    const proposals = ProposalDB.getAll();
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal || !proposal.votes) return null;
    
    return proposal.votes[userId] || null;
  }
};

// Initialize DB
ProposalDB.init();

// Enhanced ProposalCard Component
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
  
  return React.createElement('div', { 
    className: `proposal-card ${proposal.status || 'pending'}`
  }, [
    // Card Header
    React.createElement('div', { key: 'header', className: 'card-header' }, [
      React.createElement('span', { 
        key: 'tag', 
        className: 'proposal-tag' 
      }, proposal.tag),
      React.createElement('span', { 
        key: 'date', 
        className: 'submission-date' 
      }, formatDate(proposal.timestamp))
    ]),
    
    // Proposal Content
    React.createElement('div', { 
      key: 'content', 
      className: 'proposal-content' 
    }, [
      React.createElement('p', {}, truncateText(proposal.proposal))
    ]),
    
    // Card Footer
    React.createElement('div', { 
      key: 'footer', 
      className: 'card-footer' 
    }, [
      React.createElement('div', { 
        key: 'submitter', 
        className: 'submitter-info' 
      }, [
        React.createElement('span', { 
          key: 'icon', 
          className: 'wallet-icon' 
        }, '💳'),
        React.createElement('span', { 
          key: 'address', 
          className: 'wallet-address' 
        }, formatWalletAddress(proposal.walletAddress))
      ]),
      React.createElement('div', { 
        key: 'status', 
        className: `proposal-status ${proposal.status || 'pending'}` 
      }, getStatusText(proposal.status))
    ]),
    
    // Voting Section
    React.createElement('div', { 
      key: 'voting', 
      className: 'proposal-voting' 
    }, [
      // Upvote button
      React.createElement('button', {
        key: 'upvote',
        className: `vote-button upvote ${userVote === 'up' ? 'active' : ''}`,
        onClick: () => handleVote('up'),
        disabled: proposal.status !== 'pending',
        'aria-label': 'Upvote'
      }, [
        React.createElement('span', { 
          key: 'icon', 
          className: 'vote-icon' 
        }, '👍'),
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
        disabled: proposal.status !== 'pending',
        'aria-label': 'Downvote'
      }, [
        React.createElement('span', { 
          key: 'icon', 
          className: 'vote-icon' 
        }, '👎'),
        React.createElement('span', {
          key: 'count',
          className: `vote-count ${isAnimating && userVote === 'down' ? 'changed' : ''}`
        }, downvotes)
      ])
    ])
  ]);
};

// Enhanced ProposalShowcase Component
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
          React.createElement(ProposalCard, { 
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

// Tag selector component
const TagSelector = (props) => {
  const tags = ['Grants', 'Rewards', 'Trading', 'Marketing', 'Other'];
  
  return React.createElement('div', { className: 'tag-selector' }, [
    React.createElement('div', { key: 'label', className: 'tag-selector-label' }, 'Select a category:'),
    React.createElement('div', { key: 'options', className: 'tag-options' }, 
      tags.map(tag => 
        React.createElement('button', {
          key: tag,
          className: `tag ${props.selectedTag === tag ? 'selected' : ''}`,
          onClick: () => props.onSelectTag(tag),
          type: 'button'
        }, tag)
      )
    )
  ]);
};

// Status indicator component
const StatusIndicator = (props) => {
  const getStatusContent = () => {
    switch (props.status) {
      case 'uploading':
        return React.createElement('div', { className: 'status-uploading' }, [
          React.createElement('div', { key: 'spinner', className: 'upload-animation' }, 
            React.createElement('div', { className: 'upload-pulse' })
          ),
          React.createElement('p', { key: 'message' }, 'Processing your proposal...')
        ]);
      case 'success':
        return React.createElement('div', { className: 'status-success' }, [
          React.createElement('div', { key: 'icon', className: 'status-icon' },
            React.createElement('div', { className: 'status-dot success' })
          ),
          React.createElement('p', { key: 'message' }, 'Your suggestion has been recorded. Review pending during next treasury unlock.')
        ]);
      case 'error':
        return React.createElement('div', { className: 'status-error' }, [
          React.createElement('div', { key: 'icon', className: 'status-icon' },
            React.createElement('div', { className: 'status-dot error' })
          ),
          React.createElement('p', { key: 'message' }, 'Unable to submit your proposal. Please try again.')
        ]);
      default:
        return null;
    }
  };
  
  return React.createElement('div', { className: `status-indicator ${props.status}` }, getStatusContent());
};

// Create a simplified PhantomConnect component that works with the existing wallet
const PhantomConnect = (props) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  const connectWallet = async () => {
    // Check if Phantom is available
    if (!window.ethereum || !window.ethereum.isPhantom) {
      setError('Phantom wallet not detected. Please install Phantom.');
      return;
    }
    
    setIsConnecting(true);
    setError('');
    
    try {
      console.log("Initiating Phantom connection...");
      
      // Request access to accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      // Set up event listeners
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          if (props.onDisconnect) {
            props.onDisconnect();
          }
        } else {
          // User switched accounts
          if (props.onConnect) {
            props.onConnect(accounts[0]);
          }
        }
      });
      
      console.log("Connection successful. Address:", accounts[0]);
      
      if (props.onConnect) {
        props.onConnect(accounts[0]);
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Error connecting to wallet');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnectWallet = () => {
    // Remove event listeners
    if (window.ethereum && window.ethereum.isPhantom) {
      window.ethereum.removeListener('accountsChanged', () => {});
    }
    
    if (props.onDisconnect) {
      props.onDisconnect();
    }
  };
  
  // If already connected
  if (props.address) {
    return React.createElement('div', { className: 'wallet-info' }, [
      React.createElement('p', { key: 'address', className: 'wallet-address' }, [
        React.createElement('span', { key: 'label' }, 'Connected:'),
        ` ${props.address.slice(0, 6)}...${props.address.slice(-4)}`
      ]),
      React.createElement('button', { 
        key: 'disconnect',
        className: 'disconnect-button',
        onClick: disconnectWallet
      }, 'Disconnect')
    ]);
  }
  
  // Not connected yet
  return React.createElement('div', { className: 'wallet-container' }, [
    React.createElement('button', {
      key: 'connect',
      className: 'connect-wallet-button',
      onClick: connectWallet,
      disabled: isConnecting
    }, isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'),
    
    error && React.createElement('p', { 
      key: 'error',
      className: 'error-message' 
    }, error)
  ]);
};

// Create a ProposalButton component
const ProposalButton = (props) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return React.createElement(
    'button',
    {
      className: `proposal-button ${isHovered ? 'hovered' : ''}`,
      onClick: props.onClick,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false)
    },
    props.text || 'Submit Proposal'
  );
};

// Main ProposalSystem component
const ProposalSystem = () => {
  // User ID for tracking votes
  const [userId, setUserId] = useState(() => {
    const savedId = localStorage.getItem('aikira_user_id');
    return savedId || Date.now().toString();
  });
  
  // Wallet and token states
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState('AIKIRA');
  const [hasEnoughTokens, setHasEnoughTokens] = useState(DEV_MODE);
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  // Proposal states
  const [proposalText, setProposalText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showProposals, setShowProposals] = useState(false);
  const [allProposals, setAllProposals] = useState(() => {
    // Process proposals to add userVote property
    const proposals = ProposalDB.getAll();
    return proposals.map(proposal => ({
      ...proposal,
      userVote: ProposalDB.getUserVote(proposal.id, userId)
    }));
  });
  
  // Save userId to localStorage
  useEffect(() => {
    localStorage.setItem('aikira_user_id', userId);
  }, [userId]);
  
  // Check token balance when wallet connects
  const checkTokenBalance = async (address) => {
    if (DEV_MODE) {
      setHasEnoughTokens(true);
      return;
    }
    
    setIsCheckingToken(true);
    setTokenError('');
    
    try {
      // You would typically call a contract method here
      // For testing, we'll assume the user has enough tokens
      console.log("Checking token balance for", address);
      
      // Simple mock token check - in production you would check the actual balance
      // Demo values - replace with actual token check
      const mockBalance = "1000";
      const mockSymbol = "AIKIRA";
      
      setTokenBalance(mockBalance);
      setTokenSymbol(mockSymbol);
      setHasEnoughTokens(true);
      
    } catch (error) {
      console.error('Error checking token balance:', error);
      setTokenError('Failed to check token balance');
      setHasEnoughTokens(false);
    } finally {
      setIsCheckingToken(false);
    }
  };
  
  // Handle wallet connection
  const handleConnect = async (address) => {
    console.log("Wallet connected:", address);
    setWalletAddress(address);
    await checkTokenBalance(address);
  };
  
  // Handle wallet disconnection
  const handleDisconnect = () => {
    console.log("Wallet disconnected");
    setWalletAddress('');
    setTokenBalance(0);
    setHasEnoughTokens(DEV_MODE);
  };
  
  // Set up wallet event handlers
  useEffect(() => {
    window.onWalletDisconnect = handleDisconnect;
    window.onWalletChanged = handleConnect;
    
    return () => {
      window.onWalletDisconnect = null;
      window.onWalletChanged = null;
    };
  }, []);
  
  // Handle voting
  const handleVote = (proposalId, voteType) => {
    const success = ProposalDB.vote(proposalId, userId, voteType);
    
    if (success) {
      // Update proposals in state to reflect the vote
      setAllProposals(prevProposals => 
        prevProposals.map(proposal => {
          if (proposal.id === proposalId) {
            // Get updated proposal from DB
            const updatedProposals = ProposalDB.getAll();
            const updatedProposal = updatedProposals.find(p => p.id === proposalId);
            
            if (updatedProposal) {
              return {
                ...updatedProposal,
                userVote: ProposalDB.getUserVote(proposalId, userId)
              };
            }
          }
          return proposal;
        })
      );
    }
  };
  
  // Handle proposal submission
  const handleSubmitProposal = () => {
    if (!proposalText.trim() || !selectedTag) return;
    
    // Check if connected and has tokens (unless in dev mode)
    if (!DEV_MODE && (!walletAddress || !hasEnoughTokens)) {
      setSubmissionStatus('error');
      setTimeout(() => setSubmissionStatus(null), 5000);
      return;
    }
    
    setSubmissionStatus('uploading');
    
    // Create proposal object
    const newProposal = {
      proposal: proposalText,
      tag: selectedTag,
      walletAddress: walletAddress || 'Anonymous'
    };
    
    try {
      // Add to database
      const savedProposal = ProposalDB.add(newProposal);
      
      // Add userVote property
      savedProposal.userVote = null;
      
      // Update local state
      setAllProposals(prevProposals => [savedProposal, ...prevProposals]);
      setSubmissionStatus('success');
      
      // Reset form
      setProposalText('');
      setSelectedTag('');
      
      // Clear success state after delay
      setTimeout(() => {
        setSubmissionStatus(null);
      }, 5000);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setSubmissionStatus('error');
      
      // Clear error state after delay
      setTimeout(() => {
        setSubmissionStatus(null);
      }, 5000);
    }
  };
  
  // Render based on wallet & token status
  const renderContent = () => {
    // If not connected and not in dev mode
    if (!walletAddress && !DEV_MODE) {
      return React.createElement('div', { className: 'connection-required' }, 
        React.createElement('div', { key: 'content' }, [
          React.createElement('h2', { key: 'title' }, 'Connect Wallet to Submit Proposals'),
          React.createElement('p', { key: 'info' }, 'Ownership of $AIKIRA tokens is required to participate.'),
          
          React.createElement(PhantomConnect, {
            key: 'connect',
            onConnect: handleConnect,
            onDisconnect: handleDisconnect
          })
        ])
      );
    }
    
    // If connected but not enough tokens (and not in dev mode)
    if (walletAddress && !hasEnoughTokens && !DEV_MODE) {
      return React.createElement('div', { className: 'tokens-required' },
        React.createElement('div', { key: 'content' }, [
          React.createElement('h2', { key: 'title' }, '$AIKIRA Tokens Required'),
          React.createElement('p', { key: 'info' }, `You need at least ${REQUIRED_TOKEN_AMOUNT} $AIKIRA tokens to submit proposals.`),
          React.createElement('p', { key: 'balance' }, `Current balance: ${tokenBalance} ${tokenSymbol}`),
          
          React.createElement('div', { key: 'actions', className: 'token-actions' }, [
            React.createElement('a', {
              key: 'buy',
              href: 'https://app.uniswap.org/',
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'buy-link'
            }, 'Get $AIKIRA'),
            React.createElement('button', {
              key: 'disconnect',
              className: 'disconnect-button',
              onClick: handleDisconnect
            }, 'Disconnect Wallet')
          ])
        ])
      );
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
                  React.createElement('button', { 
                    key: 'disconnect',
                    className: 'disconnect-button',
                    onClick: handleDisconnect
                  }, 'Disconnect')
                ])
              : React.createElement('div', { key: 'dev-wallet', className: 'dev-mode-wallet' }, 
                  React.createElement('span', {}, 'Development Mode: Wallet Connection Bypassed')
                ),
            
            // Token status if connected
            walletAddress && React.createElement('div', { key: 'token', className: 'token-status' }, 
              React.createElement('span', {}, `Balance: ${tokenBalance} ${tokenSymbol}`)
            ),
            
            // Tag selector
            React.createElement(TagSelector, {
              key: 'tags',
              selectedTag: selectedTag,
              onSelectTag: (tag) => setSelectedTag(tag)
            }),
            
            // Terminal input
            React.createElement('div', { key: 'terminal', className: 'terminal-container' }, [
              React.createElement('div', { key: 'header', className: 'terminal-header' }, 
                React.createElement('span', { className: 'terminal-prompt' }, 'Input your proposal below.')
              ),
              React.createElement('textarea', {
                key: 'input',
                className: 'terminal-input',
                placeholder: 'Type your proposal here...',
                value: proposalText,
                onChange: (e) => setProposalText(e.target.value),
                rows: 4
              }),
              React.createElement('div', { key: 'footer', className: 'terminal-footer' }, [
                React.createElement('div', { key: 'counter', className: 'char-counter' }, 
                  React.createElement('span', {}, `${proposalText.length}/500`)
                ),
                React.createElement('div', { key: 'actions', className: 'terminal-actions' }, [
                  React.createElement('span', { key: 'note', className: 'ownership-note' }, 
                    'Ownership of $AIKIRA required to submit.'
                  ),
                  React.createElement('button', {
                    key: 'submit',
                    className: 'submit-button',
                    disabled: !proposalText.trim() || !selectedTag,
                    onClick: handleSubmitProposal
                  }, 'Upload Proposal')
                ])
              ])
            ]),
            
            // Status indicator
            submissionStatus && React.createElement(StatusIndicator, {
              key: 'status',
              status: submissionStatus
            }),
            
            // Flavor text
            React.createElement('div', { key: 'flavor', className: 'aikira-flavor-text' }, 
              React.createElement('p', {}, '"I do not promise approval. I promise consideration."')
            )
          ])
    ]);
  };
  
  return React.createElement('div', { className: 'proposal-system' }, [
    React.createElement('h1', { key: 'title', className: 'system-title' }, 'Aikira Community Proposals'),
    renderContent(),
    DEV_MODE && React.createElement('div', { key: 'dev-banner', className: 'dev-mode-banner' },
      React.createElement('p', {}, 'Development Mode Active: Wallet and token requirements bypassed for testing')
    )
  ]);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bootstrapping Aikira application...');
  
  const buttonEl = document.getElementById('aikira-proposal-button');
  const systemEl = document.getElementById('aikira-proposal-system');
  
  if (buttonEl) {
    console.log('Rendering ProposalButton to button container');
    const root = ReactDOM.createRoot(buttonEl);
    root.render(React.createElement(ProposalButton, {
      onClick: () => {
        if (systemEl) {
          // Toggle system visibility
          systemEl.style.display = systemEl.style.display === 'none' ? 'block' : 'none';
          
          // Scroll to system if showing
          if (systemEl.style.display === 'block') {
            systemEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
      text: 'Submit Proposal'
    }));
  }
  
  if (systemEl) {
    console.log('Rendering ProposalSystem to system container');
    // Initially hide the system
    systemEl.style.display = 'none';
    
    const root = ReactDOM.createRoot(systemEl);
    root.render(React.createElement(ProposalSystem));
  }
});

// Expose to window for debugging
window.AikiraDebug = {
  React,
  ReactDOM,
  ProposalDB
};