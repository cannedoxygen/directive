// components/PhantomConnect.jsx
const React = require('react');
const { useState, useEffect } = React;

/**
 * Component for connecting to Phantom wallet on Base network
 * @param {Object} props - Component props
 * @param {Function} props.onConnect - Callback when wallet connection is successful
 */
function PhantomConnect({ onConnect }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
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
    
    // Cleanup
    return () => {
      const provider = window.phantom 
        ? window.phantom.ethereum 
        : (window.ethereum && window.ethereum.isPhantom ? window.ethereum : null);
        
      if (provider) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setWalletAddress('');
      // Removed onDisconnect call
    } else {
      setWalletAddress(accounts[0]);
      if (onConnect) onConnect(accounts[0]);
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
      
      // Request accounts access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });
      
      handleAccountsChanged(accounts);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Error connecting to wallet');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Render wallet button or status
  if (!walletAddress) {
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
  }
  
  // Connected state - Just show the wallet address without any disconnect button
  return React.createElement('div', { className: 'wallet-info' }, 
    React.createElement('p', { className: 'wallet-address' }, [
      React.createElement('span', { key: 'label' }, 'Connected:'),
      ` ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    ])
  );
}

module.exports = PhantomConnect;