// components/PhantomConnect.jsx
const React = require('react');
const { useState, useEffect } = React;

/**
 * Component for connecting to Phantom wallet on Base network with dark theme
 * @param {Object} props - Component props
 * @param {Function} props.onConnect - Callback when wallet connection is successful
 */
function PhantomConnect({ onConnect }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Check if Phantom is available
  const checkForPhantom = () => {
    // Specifically look for Phantom wallet
    if (window.phantom && window.phantom.ethereum) {
      return true;
    }
    
    // Check if window.ethereum is Phantom
    if (window.ethereum && window.ethereum.isPhantom) {
      return true;
    }
    
    return false;
  };
  
  // Initialize on component mount
  useEffect(() => {
    const init = async () => {
      // Check if user was previously connected
      if (checkForPhantom()) {
        try {
          // Use phantom-specific provider
          const provider = window.phantom 
            ? window.phantom.ethereum 
            : window.ethereum;
          
          const accounts = await provider.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
          
          // Listen for account changes
          provider.on('accountsChanged', handleAccountsChanged);
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };
    
    init();
    
    // Add dark mode class to body when component mounts
    document.body.classList.add('wallet-dark-mode');
    
    // Cleanup
    return () => {
      const provider = window.phantom 
        ? window.phantom.ethereum 
        : (window.ethereum && window.ethereum.isPhantom ? window.ethereum : null);
        
      if (provider) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
      }
      
      // Remove dark mode class when component unmounts
      document.body.classList.remove('wallet-dark-mode');
    };
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setWalletAddress('');
    } else {
      setWalletAddress(accounts[0]);
      if (onConnect) onConnect(accounts[0]);
    }
    
    // Close modal after connection
    setShowModal(false);
    
    // Remove connecting class
    document.body.classList.remove('wallet-connect-open');
    
    // Remove any transitional overlay that might be present
    const overlay = document.querySelector('.wallet-connection-pending');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };
  
  // Connect to Base network
  const connectWallet = async () => {
    if (!checkForPhantom()) {
      setError('Phantom wallet not detected. Please install Phantom.');
      return;
    }
    
    setIsConnecting(true);
    setError('');
    setShowModal(true);
    
    // Add classes to body for styling
    document.body.classList.add('wallet-connect-open', 'connecting-wallet');
    
    // Create a transitional overlay for the connection process
    const overlay = document.createElement('div');
    overlay.className = 'wallet-connection-pending';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(18, 18, 33, 0.95);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    const content = document.createElement('div');
    content.className = 'wallet-connection-pending-content';
    content.style.cssText = `
      background-color: #1a1a2e;
      border-radius: 16px;
      padding: 24px;
      color: #f0f0f0;
      border: 1px solid rgba(217, 194, 240, 0.2);
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 5px rgba(217, 194, 240, 0.3);
    `;
    
    // Create a loading animation
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 4px solid rgba(217, 194, 240, 0.3);
      border-radius: 50%;
      border-top: 4px solid #d9c2f0;
      width: 40px;
      height: 40px;
      margin: 0 auto 20px;
      animation: spin 1s linear infinite;
    `;
    
    // Add keyframes for spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Add content to overlay
    const title = document.createElement('h3');
    title.textContent = 'Connecting to Phantom';
    title.style.cssText = `color: #f0f0f0; margin-bottom: 10px; font-size: 18px;`;
    
    const message = document.createElement('p');
    message.textContent = 'Please approve the connection request in your wallet...';
    message.style.cssText = `color: #f0f0f0; margin-bottom: 0; font-size: 14px;`;
    
    content.appendChild(spinner);
    content.appendChild(title);
    content.appendChild(message);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    try {
      // Use phantom-specific provider
      const provider = window.phantom 
        ? window.phantom.ethereum 
        : window.ethereum;
      
      // Ensure Base network is set
      try {
        // Try to switch to Base network
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base Mainnet
        });
      } catch (error) {
        // If the chain is not added, add it
        if (error.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        } else {
          console.warn("Network switching error:", error.message);
          // Continue anyway
        }
      }
      
      // Add a special style tag to override any iframe styles
      const iframeStyle = document.createElement('style');
      iframeStyle.textContent = `
        iframe {
          background-color: #1a1a2e !important;
        }
        body > div > iframe,
        div[role="dialog"] iframe {
          background-color: #1a1a2e !important;
        }
        div[role="dialog"] {
          background-color: #1a1a2e !important;
          color: #f0f0f0 !important;
          border-color: rgba(217, 194, 240, 0.2) !important;
        }
      `;
      document.head.appendChild(iframeStyle);
      
      // Request accounts access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });
      
      handleAccountsChanged(accounts);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Error connecting to wallet');
      setShowModal(false);
      
      // Remove the overlay and classes on error
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      document.body.classList.remove('wallet-connect-open', 'connecting-wallet');
      
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setIsConnecting(false);
    document.body.classList.remove('wallet-connect-open');
    
    // Remove any transitional overlay that might be present
    const overlay = document.querySelector('.wallet-connection-pending');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };
  
  // Render wallet connection modal
  const renderModal = () => {
    if (!showModal) return null;
    
    return React.createElement('div', { 
      className: 'wallet-connection-overlay',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(18, 18, 33, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }
    },
      React.createElement('div', { 
        className: 'wallet-modal',
        style: {
          backgroundColor: '#1a1a2e',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 5px rgba(217, 194, 240, 0.3)',
          maxWidth: '400px',
          width: '100%',
          color: '#f0f0f0',
          border: '1px solid rgba(217, 194, 240, 0.2)'
        }
      }, [
        React.createElement('div', { 
          key: 'header', 
          className: 'wallet-modal-header',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(217, 194, 240, 0.2)',
            paddingBottom: '10px'
          }
        }, [
          React.createElement('h3', { 
            key: 'title', 
            className: 'wallet-modal-title',
            style: {
              fontSize: '18px',
              fontWeight: 600,
              color: '#f7d1e4'
            }
          }, 'Connect to Phantom'),
          React.createElement('button', {
            key: 'close',
            className: 'wallet-modal-close',
            onClick: handleCloseModal,
            style: {
              background: 'none',
              border: 'none',
              color: '#f0f0f0',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px'
            }
          }, '×')
        ]),
        React.createElement('p', { 
          key: 'info',
          style: {
            color: '#f0f0f0'
          }
        }, 'Please approve the connection request in your Phantom wallet.'),
        isConnecting && React.createElement('div', { 
          key: 'loading', 
          className: 'loading-spinner',
          style: {
            margin: '20px auto',
            border: '4px solid rgba(217, 194, 240, 0.3)',
            borderRadius: '50%',
            borderTop: '4px solid #d9c2f0',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite'
          }
        })
      ])
    );
  };
  
  // Render wallet button or status
  if (!walletAddress) {
    return React.createElement(React.Fragment, {}, [
      React.createElement('div', { 
        key: 'container', 
        className: 'wallet-container',
        style: {
          padding: '24px',
          textAlign: 'center',
          display: 'block',
          margin: '20px auto',
          maxWidth: '300px',
          backgroundColor: '#1a1a2e',
          borderRadius: '12px',
          boxShadow: '0 0 5px rgba(217, 194, 240, 0.3)',
          border: '1px solid rgba(217, 194, 240, 0.2)',
          color: '#f0f0f0'
        }
      }, [
        React.createElement('button', {
          key: 'connect',
          className: 'connect-wallet-button',
          onClick: connectWallet,
          disabled: isConnecting,
          style: {
            background: 'linear-gradient(135deg, #f7d1e4, #d9c2f0)',
            color: '#121221',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '25px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'inline-block',
            margin: '10px auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }
        }, isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'),
        
        error && React.createElement('p', { 
          key: 'error',
          className: 'error-message',
          style: {
            color: '#ff6b6b',
            marginTop: '10px',
            fontSize: '14px',
            textAlign: 'center'
          }
        }, error)
      ]),
      renderModal()
    ]);
  }
  
  // Connected state - Just show the wallet address without any disconnect button
  return React.createElement('div', { 
    className: 'wallet-info',
    style: {
      marginTop: '15px',
      padding: '15px',
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid rgba(217, 194, 240, 0.15)',
      boxShadow: '0 0 5px rgba(217, 194, 240, 0.2)'
    }
  }, 
    React.createElement('p', { 
      className: 'wallet-address',
      style: {
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#121221',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #2c2c44',
        color: '#f0f0f0'
      }
    }, [
      React.createElement('span', { 
        key: 'label',
        style: {
          color: '#d9c2f0',
          fontWeight: 'bold'
        }
      }, 'Connected:'),
      ` ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    ])
  );
}

module.exports = PhantomConnect;