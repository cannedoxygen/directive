// Create a simplified PhantomConnect component that works with the existing Phantom wallet
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