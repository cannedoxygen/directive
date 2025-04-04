// Plain CommonJS style
const React = require('react');

// Define as a regular function, not an arrow function
function ProposalButton(props) {
  return React.createElement(
    'button',
    { 
      className: 'proposal-button',
      onClick: props.onClick
    },
    props.text || 'Submit Proposal'
  );
}

// Export the function directly
module.exports = ProposalButton;