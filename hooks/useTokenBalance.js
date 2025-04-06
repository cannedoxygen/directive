// hooks/useTokenBalance.js
const { useState, useEffect } = require('react');
const { Contract, BrowserProvider, formatUnits } = require('ethers');

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
function useTokenBalance(
  walletAddress, 
  tokenAddress = '0xa884C16a93792D1E0156fF4C8A3B2C59b8d04C9A', // Replace with actual Aikira token address
  requiredAmount = 10000 // Minimum tokens required
) {
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
        console.log("Checking token balance for address:", walletAddress);
        
        // Initialize with defaults in case contract calls fail
        let decimals = 18; // ERC-20 standard default
        let symbol = 'AIKIRA';
        let balance = BigInt(0);
        
        // Connect to provider using window.ethereum
        const provider = new BrowserProvider(window.ethereum);
        console.log("Provider connected:", !!provider);
        
        // Create contract instance
        const tokenContract = new Contract(
          tokenAddress,
          ERC20_ABI,
          provider
        );
        console.log("Contract instance created for address:", tokenAddress);
        
        // Try to get decimals with fallback
        try {
          decimals = await tokenContract.decimals();
          console.log("Token decimals:", decimals);
        } catch (decimalError) {
          console.warn("Failed to get decimals, using default (18):", decimalError.message);
          // Continue with default decimals
        }
        
        // Try to get symbol with fallback
        try {
          symbol = await tokenContract.symbol();
          console.log("Token symbol:", symbol);
        } catch (symbolError) {
          console.warn("Failed to get symbol, using default (AIKIRA):", symbolError.message);
          // Continue with default symbol
        }
        
        // Try to get balance
        try {
          balance = await tokenContract.balanceOf(walletAddress);
          console.log("Raw balance:", balance.toString());
        } catch (balanceError) {
          console.error("Failed to get balance:", balanceError.message);
          // Continue with zero balance
        }
        
        // Format balance with proper decimals
        const formattedBalance = formatUnits(balance, decimals);
        console.log("Formatted balance:", formattedBalance);
        
        // Check if user has enough tokens
        const hasEnoughTokens = parseFloat(formattedBalance) >= requiredAmount;
        console.log("Has enough tokens:", hasEnoughTokens, 
                    `(${formattedBalance} >= ${requiredAmount})`);
        
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
}

module.exports = useTokenBalance;