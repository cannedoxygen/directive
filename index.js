import React from 'react';
import ReactDOM from 'react-dom';
import ProposalSystem from './components/ProposalSystem';
import ProposalButton from './components/ProposalButton';
import './assets/styles/main.css';

/**
 * Initialize the Aikira Proposal System
 * This can be called to mount the proposal button or full system
 * 
 * @param {string} buttonElementId - DOM element ID for mounting the button
 * @param {string} systemElementId - DOM element ID for mounting the system
 */
const initAikiraProposals = (buttonElementId, systemElementId) => {
  // Check if button element exists
  const buttonElement = document.getElementById(buttonElementId);
  if (buttonElement) {
    ReactDOM.render(
      <ProposalButton 
        onClick={() => {
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
        }}
      />,
      buttonElement
    );
  }
  
  // Check if system element exists
  const systemElement = document.getElementById(systemElementId);
  if (systemElement) {
    // Initially hide the system
    systemElement.style.display = 'none';
    
    ReactDOM.render(
      <ProposalSystem />,
      systemElement
    );
  }
};

// Automatically initialize if these elements exist
document.addEventListener('DOMContentLoaded', () => {
  initAikiraProposals('aikira-proposal-button', 'aikira-proposal-system');
});

// Export for manual initialization
export default initAikiraProposals;

// If using as a module directly in HTML
if (typeof window !== 'undefined') {
  window.initAikiraProposals = initAikiraProposals;
}