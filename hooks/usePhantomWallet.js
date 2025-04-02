import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for Phantom wallet integration with Base network
 * @returns {Object} Wallet state and functions
 */
const usePhantomWallet = () => {
  const [wallet, setWallet] = useState({
    address: '',
    isConnected: false,
    isConnecting: false,
    error: null,
    isPhantomInstalled: false
  });
  
  // Check if Phantom is installed
  useEffect(() => {
    const checkPhantom = () => {
      const isPhantomInstalled = window.ethereum && window.ethereum.isPhantom;
      setWallet(prev => ({ ...prev, isPhantomInstalled }));
      
      if (isPhantomInstalled) {
        // Check if already connected
        window.ethereum.request({ method: 'eth_accounts' })
          .then(accounts => {
            if (accounts.length > 0) {
              setWallet(prev => ({
                ...prev,
                address: accounts[0],
                isConnected: true
              }));
            }
          })
          .catch(err => {
            console.error('Failed to get accounts:', err);
          });
          
        // Set up event listeners for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
    };
    
    checkPhantom();
    
    // Cleanup event listeners
    return () => {
      if (window.ethereum && window.ethereum.isPhantom) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setWallet(prev => ({
        ...prev,
        address: '',
        isConnected: false
      }));
    } else {
      // User switched accounts
      setWallet(prev => ({
        ...prev,
        address: accounts[0],
        isConnected: true
      }));
    }
  }, []);
  
  // Handle chain changes
  const handleChainChanged = useCallback(() => {
    // Reload the page when the chain changes
    window.location.reload();
  }, []);
  
  // Connect to wallet
  const connect = useCallback(async () => {
    if (!wallet.isPhantomInstalled) {
      setWallet(prev => ({
        ...prev,
        error: 'Phantom wallet not installed. Please install Phantom.'
      }));
      return;
    }
    
    setWallet(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));
    
    try {
      // Switch to Base network
      await switchToBaseNetwork();
      
      // Request accounts access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0) {
        setWallet(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          isConnecting: false
        }));
      }
    } catch (error) {
      console.error('Connection error:', error);
      setWallet(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false
      }));
    }
  }, [wallet.isPhantomInstalled]);
  
  // Switch to Base network
  const switchToBaseNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base chainId
      });
    } catch (error) {
      // If the chain is not added to Phantom
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
  
  // Disconnect wallet (just for UI state - doesn't actually disconnect)
  const disconnect = useCallback(() => {
    setWallet(prev => ({
      ...prev,
      address: '',
      isConnected: false
    }));
  }, []);
  
  return {
    address: wallet.address,
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    error: wallet.error,
    isPhantomInstalled: wallet.isPhantomInstalled,
    connect,
    disconnect
  };
};

export default usePhantomWallet;