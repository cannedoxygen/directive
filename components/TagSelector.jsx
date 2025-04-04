const React = require('react');

function TagSelector({ 
  selectedTag, 
  onSelectTag,
  tags = ['Grants', 'Rewards', 'Trading', 'Marketing', 'Other']
}) {
  return React.createElement('div', { className: 'tag-selector' }, [
    React.createElement('div', { key: 'label', className: 'tag-selector-label' }, 'Select a category:'),
    React.createElement('div', { key: 'options', className: 'tag-options' }, 
      tags.map(tag => 
        React.createElement('button', {
          key: tag,
          className: `tag ${selectedTag === tag ? 'selected' : ''}`,
          onClick: () => onSelectTag(tag),
          type: 'button'
        }, tag)
      )
    )
  ]);
}

module.exports = TagSelector;