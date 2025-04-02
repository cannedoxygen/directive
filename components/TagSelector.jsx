import React from 'react';

/**
 * Component for selecting proposal category tags
 * @param {Object} props - Component props
 * @param {string} props.selectedTag - Currently selected tag
 * @param {Function} props.onSelectTag - Function called when a tag is selected
 * @param {Array} props.tags - Array of available tags (optional)
 */
const TagSelector = ({ 
  selectedTag, 
  onSelectTag,
  tags = ['Grants', 'Rewards', 'Trading', 'Marketing', 'Other']
}) => {
  return (
    <div className="tag-selector">
      <div className="tag-selector-label">Select a category:</div>
      
      <div className="tag-options">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag ${selectedTag === tag ? 'selected' : ''}`}
            onClick={() => onSelectTag(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagSelector;