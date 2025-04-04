const React = require('react');
const { useState } = React;

/**
 * Button component that opens the Aikira proposal system
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when button is clicked
 * @param {string} props.text - Button text (optional)
 */
const ProposalButton = ({ onClick, text = 'Submit Proposal' }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    React.createElement(
      'button',
      { 
        className: `proposal-button ${isHovered ? 'hovered' : ''}`,
        onClick: onClick,
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false)
      },
      text
    )
  );
};

// Use CommonJS export
module.exports = ProposalButton;