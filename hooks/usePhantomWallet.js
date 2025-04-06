// hooks/usePhantomWallet.js
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
      console.log("Phantom wallet detected:", isPhantomInstalled);
      setWallet(prev => ({ ...prev, isPhantomInstalled }));
      
      if (isPhantomInstalled) {
        // Check if already connected
        window.ethereum.request({ method: 'eth_accounts' })
          .then(accounts => {
            console.log("Existing accounts:", accounts);
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
    console.log("Accounts changed:", accounts);
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
    console.log("Chain changed, reloading page");
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
      
      console.log("Requesting account access");
      // Request accounts access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      console.log("Accounts granted:", accounts);
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
      console.log("Attempting to switch to Base network");
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base chainId
      });
      console.log("Successfully switched to Base network");
      
      // Verify current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Current chainId after switch:", chainId);
    } catch (error) {
      console.warn("Error during network switch:", error.code, error.message);
      
      // If the chain is not added to Phantom
      if (error.code === 4902) {
        console.log("Base network not found, attempting to add it");
        try {
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
          console.log("Base network added successfully");
        } catch (addError) {
          console.error("Failed to add Base network:", addError);
          throw addError;
        }
      } else {
        throw error;
      }
    }
  };
  
  // Disconnect wallet (just for UI state - doesn't actually disconnect)
  const disconnect = useCallback(() => {
    console.log("Disconnecting wallet from UI");
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