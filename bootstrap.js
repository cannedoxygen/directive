const React = require('react');
const ReactDOM = require('react-dom/client');

// Import components with proper logging to debug issues
let ProposalButton, ProposalSystem;
try {
  ProposalButton = require('./components/ProposalButton');
  console.log("ProposalButton imported as:", typeof ProposalButton);
} catch (err) {
  console.error("Failed to import ProposalButton:", err);
}

try {
  ProposalSystem = require('./components/ProposalSystem');
  console.log("ProposalSystem imported as:", typeof ProposalSystem);
} catch (err) {
  console.error("Failed to import ProposalSystem:", err);
}

// Import CSS
require('./assets/styles/main.css');
require('./assets/styles/terminal.css');
require('./assets/styles/enhanced-cards.css');
require('./assets/styles/scroll-animations.css');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bootstrapping Aikira application...');
  
  const buttonEl = document.getElementById('aikira-proposal-button');
  const systemEl = document.getElementById('aikira-proposal-system');
  
  if (buttonEl && typeof ProposalButton === 'function') {
    console.log('Rendering ProposalButton to button container');
    const root = ReactDOM.createRoot(buttonEl);
    root.render(React.createElement(ProposalButton, {
      onClick: () => {
        if (systemEl) {
          systemEl.style.display = systemEl.style.display === 'none' ? 'block' : 'none';
          if (systemEl.style.display === 'block') {
            systemEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
      text: 'Submit Proposal'
    }));
  } else {
    console.error('ProposalButton not available as a function');
  }
  
  if (systemEl && typeof ProposalSystem === 'function') {
    console.log('Rendering ProposalSystem to system container');
    systemEl.style.display = 'none';
    
    const root = ReactDOM.createRoot(systemEl);
    root.render(React.createElement(ProposalSystem));
  } else {
    console.error('ProposalSystem not available as a function');
  }
});