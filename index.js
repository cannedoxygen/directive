// Using CommonJS syntax instead of ES modules
const React = require('react');
const ReactDOM = require('react-dom/client');
const ProposalSystem = require('./components/ProposalSystem.jsx');
const ProposalButton = require('./components/ProposalButton.jsx');

// Import CSS - handled by webpack loaders
require('./assets/styles/main.css');
require('./assets/styles/terminal.css');

/**
 * Initialize the Aikira Proposal System
 * This can be called to mount the proposal button or full system
 * 
 * @param {string} buttonElementId - DOM element ID for mounting the button
 * @param {string} systemElementId - DOM element ID for mounting the system
 */
const initAikiraProposals = (buttonElementId, systemElementId) => {
  // Debug logging
  console.log('Initializing Aikira Proposal System');
  
  // Check if button element exists
  const buttonElement = document.getElementById(buttonElementId);
  if (buttonElement) {
    console.log('Button element found, rendering ProposalButton');
    
    // For React 18, use createRoot
    const buttonRoot = ReactDOM.createRoot(buttonElement);
    buttonRoot.render(
      React.createElement(ProposalButton, {
        onClick: () => {
          // Find the system element
          const systemElement = document.getElementById(systemElementId);
          
          // Toggle visibility
          if (systemElement) {
            systemElement.style.display = 
              systemElement.style.display === 'none' ? 'block' : 'none';
            
            // Scroll to proposal system if showing
            if (systemElement.style.display === 'block') {
              systemElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      })
    );
  } else {
    console.log(`Button element with ID "${buttonElementId}" not found`);
  }
  
  // Check if system element exists
  const systemElement = document.getElementById(systemElementId);
  if (systemElement) {
    console.log('System element found, rendering ProposalSystem');
    
    // Initially hide the system
    systemElement.style.display = 'none';
    
    // For React 18, use createRoot
    const systemRoot = ReactDOM.createRoot(systemElement);
    systemRoot.render(
      React.createElement(ProposalSystem, null)
    );
  } else {
    console.log(`System element with ID "${systemElementId}" not found`);
  }
};

// Automatically initialize if these elements exist
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking for Aikira elements');
  
  // Check if elements exist on the page
  const buttonExists = document.getElementById('aikira-proposal-button');
  const systemExists = document.getElementById('aikira-proposal-system');
  
  console.log('Button element exists:', !!buttonExists);
  console.log('System element exists:', !!systemExists);
  
  initAikiraProposals('aikira-proposal-button', 'aikira-proposal-system');
});

// Export for manual initialization
module.exports = initAikiraProposals;

// If using as a module directly in HTML
if (typeof window !== 'undefined') {
  window.initAikiraProposals = initAikiraProposals;
}