import React, { useState, useRef, useEffect } from 'react';

/**
 * Terminal-style input component for proposal submissions
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Function called when proposal is submitted
 * @param {string} props.prompt - Terminal prompt text
 * @param {number} props.maxLength - Maximum character length
 */
const TerminalInput = ({ 
  onSubmit, 
  prompt = "Input your proposal below. The AI will evaluate.", 
  maxLength = 500 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  
  // Update character count when input changes
  useEffect(() => {
    setCharCount(inputValue.length);
  }, [inputValue]);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '100px'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [inputValue]);
  
  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    
    // Enforce max length
    if (value.length <= maxLength) {
      setInputValue(value);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (inputValue.trim() && onSubmit) {
      onSubmit(inputValue);
      setInputValue(''); // Clear input after submission
    }
  };
  
  return (
    <div className={`terminal-container ${isFocused ? 'focused' : ''}`}>
      <div className="terminal-header">
        <span className="terminal-prompt">{prompt}</span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="terminal-input"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type your proposal here..."
          rows={4}
        />
        
        <div className="terminal-footer">
          <div className="char-counter">
            <span className={charCount >= maxLength ? 'limit-reached' : ''}>
              {charCount}/{maxLength}
            </span>
          </div>
          
          <div className="terminal-actions">
            <span className="ownership-note">
              Ownership of $AIKIRA required to submit.
            </span>
            <button 
              type="submit" 
              className="submit-button"
              disabled={!inputValue.trim()}
            >
              Upload Proposal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TerminalInput;