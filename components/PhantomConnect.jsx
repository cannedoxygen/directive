import React, { useState, useEffect } from 'react';

/**
 * Component for connecting to Phantom wallet on Base network
 * @param {Object} props - Component props
 * @param {Function} props.onConnect - Callback when wallet connection is successful
 * @param {Function} props.onDisconnect - Callback when wallet disconnects
 */
const PhantomConnect = ({ onConnect, onDisconnect }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  // Check if Phantom is available
  const checkForPhantom = () => {
    return window.ethereum && window.ethereum.isPhantom;
  };
  
  // Initialize on component mount
  useEffect(() => {
    const init = async () => {
      // Check if user was previously connected
      if (checkForPhantom()) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', handleAccountsChanged);
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };
    
    init();
    
    // Cleanup
    return () => {
      if (window.ethereum && window.ethereum.isPhantom) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setWalletAddress('');
      if (onDisconnect) onDisconnect();
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
      // Ensure Base network is set
      await switchToBaseNetwork();
      
      // Request accounts access
      const accounts = await window.ethereum.request({
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
  
  // Switch to Base network
  const switchToBaseNetwork = async () => {
    try {
      // Try to switch to Base network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base Mainnet
      });
    } catch (error) {
      // If the chain is not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
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
        throw error;
      }
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    if (onDisconnect) onDisconnect();
  };
  
  // Render wallet button or status
  return (
    <div className="wallet-container">
      {!walletAddress ? (
        <>
          <button 
            className="connect-wallet-button"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
          </button>
          
          {error && <p className="error-message">{error}</p>}
        </>
      ) : (
        <div className="wallet-info">
          <p className="wallet-address">
            <span>Connected:</span> 
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          <button 
            className="disconnect-button"
            onClick={disconnectWallet}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default PhantomConnect;