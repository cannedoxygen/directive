import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Simplified ERC20 ABI with just the functions we need
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

/**
 * Custom hook to check Aikira token balance on Base network
 * @param {string} walletAddress - User's wallet address
 * @param {string} tokenAddress - Aikira token contract address
 * @param {number} requiredAmount - Minimum amount required for access
 * @returns {Object} Token balance information
 */
const useTokenBalance = (
  walletAddress, 
  tokenAddress = '0xYourAikiraTokenAddressHere', // Replace with actual Aikira token address
  requiredAmount = 100 // Minimum tokens required
) => {
  const [tokenInfo, setTokenInfo] = useState({
    balance: 0,
    formattedBalance: '0',
    symbol: 'AIKIRA',
    decimals: 18,
    hasEnoughTokens: false,
    isLoading: false,
    error: null
  });
  
  useEffect(() => {
    const checkBalance = async () => {
      // Reset if no wallet address
      if (!walletAddress) {
        setTokenInfo(prev => ({
          ...prev,
          balance: 0,
          formattedBalance: '0',
          hasEnoughTokens: false,
          isLoading: false,
          error: null
        }));
        return;
      }
      
      setTokenInfo(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Connect to provider using window.ethereum
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Create contract instance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          provider
        );
        
        // Get token decimals
        const decimals = await tokenContract.decimals();
        
        // Get token symbol
        const symbol = await tokenContract.symbol();
        
        // Get raw balance
        const balance = await tokenContract.balanceOf(walletAddress);
        
        // Format balance with proper decimals
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        
        // Check if user has enough tokens
        const hasEnoughTokens = parseFloat(formattedBalance) >= requiredAmount;
        
        setTokenInfo({
          balance,
          formattedBalance,
          symbol,
          decimals,
          hasEnoughTokens,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error checking token balance:', error);
        setTokenInfo(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to check token balance'
        }));
      }
    };
    
    checkBalance();
  }, [walletAddress, tokenAddress, requiredAmount]);
  
  return tokenInfo;
};

export default useTokenBalance;