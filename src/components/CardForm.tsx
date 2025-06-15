import React, { useState, useEffect, useRef } from 'react';
import './CardForm.css';

interface CardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: { front: string; back: string; category: string; id?: number }) => void;
  editingCard?: { id: number; front: string; back: string; category: string } | null;
}

// Common categories for quick selection
const COMMON_CATEGORIES = [
  'Vocabulary',
  'Spanish',
  'French',
  'German',
  'SAT Prep',
  'GRE Prep',
  'Medical Terms',
  'Science',
  'History',
  'General'
];

const CardForm: React.FC<CardFormProps> = ({ isOpen, onClose, onSave, editingCard }) => {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [category, setCategory] = useState('Vocabulary');
  const [errors, setErrors] = useState({ front: '', back: '', category: '' });
  const modalContentRef = useRef<HTMLDivElement>(null);
  const backTextRef = useRef<HTMLTextAreaElement>(null);

  // Load editing card data when editing
  useEffect(() => {
    if (editingCard) {
      setFrontText(editingCard.front);
      setBackText(editingCard.back);
      setCategory(editingCard.category || 'Vocabulary');
    } else {
      setFrontText('');
      setBackText('');
      setCategory('Vocabulary');
    }
    setErrors({ front: '', back: '', category: '' });
  }, [editingCard, isOpen]);

  const validateForm = () => {
    const newErrors = { front: '', back: '', category: '' };
    let isValid = true;

    if (!frontText.trim()) {
      newErrors.front = 'Word/phrase is required';
      isValid = false;
    } else if (frontText.trim().length > 100) {
      newErrors.front = 'Word/phrase must be less than 100 characters';
      isValid = false;
    }

    if (!backText.trim()) {
      newErrors.back = 'Definition is required';
      isValid = false;
    } else if (backText.trim().length > 500) {
      newErrors.back = 'Definition must be less than 500 characters';
      isValid = false;
    }

    if (!category.trim()) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const cardData = {
        front: frontText.trim(),
        back: backText.trim(),
        category: category.trim(),
        ...(editingCard && { id: editingCard.id })
      };
      
      onSave(cardData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFrontText('');
    setBackText('');
    setCategory('Vocabulary');
    setErrors({ front: '', back: '', category: '' });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Improved overlay click handler that prevents closing during paste operations
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on its children
    if (e.target === e.currentTarget) {
      // Add a small delay to prevent closing during paste operations
      setTimeout(() => {
        // Check if any input is currently focused (user might be pasting)
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        
        if (!isInputFocused) {
          handleClose();
        }
      }, 50);
    }
  };

  // Handle paste events specifically
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Prevent event bubbling that might trigger modal close
    e.stopPropagation();
    
    // Get pasted text
    const pastedText = e.clipboardData.getData('text');
    
    // Check if pasted text would exceed character limit
    const currentText = backText;
    const newText = currentText + pastedText;
    
    if (newText.length > 500) {
      e.preventDefault();
      // Truncate to fit within limit
      const remainingChars = 500 - currentText.length;
      const truncatedText = pastedText.substring(0, remainingChars);
      setBackText(currentText + truncatedText);
      
      // Show a brief warning
      setErrors(prev => ({
        ...prev,
        back: `Content was truncated to fit the 500 character limit`
      }));
      
      // Clear the error after 3 seconds
      setTimeout(() => {
        setErrors(prev => ({
          ...prev,
          back: ''
        }));
      }, 3000);
    }
  };

  // Handle textarea changes with better event handling
  const handleBackTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    setBackText(e.target.value);
    
    // Clear any existing errors when user starts typing
    if (errors.back && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, back: '' }));
    }
  };

  // Handle front text changes
  const handleFrontTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setFrontText(e.target.value);
    
    // Clear any existing errors when user starts typing
    if (errors.front && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, front: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="modal-content" 
        ref={modalContentRef}
        onClick={(e) => e.stopPropagation()} 
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2>{editingCard ? '✏️ Edit Flashcard' : '➕ Add New Flashcard'}</h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card-form">
          <div className="form-group">
            <label htmlFor="front-text">
              <strong>Word/Phrase</strong>
              <span className="required">*</span>
            </label>
            <input
              id="front-text"
              type="text"
              value={frontText}
              onChange={handleFrontTextChange}
              placeholder="Enter the word or phrase..."
              className={errors.front ? 'error' : ''}
              maxLength={100}
              autoFocus
            />
            {errors.front && <span className="error-message">{errors.front}</span>}
            <div className="character-count">{frontText.length}/100</div>
          </div>

          <div className="form-group">
            <label htmlFor="category">
              <strong>Category</strong>
              <span className="required">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={errors.category ? 'error' : ''}
            >
              {COMMON_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
            <div className="form-hint">Choose a category to organize your cards</div>
          </div>

          <div className="form-group">
            <label htmlFor="back-text">
              <strong>Definition/Translation</strong>
              <span className="required">*</span>
            </label>
            <textarea
              id="back-text"
              ref={backTextRef}
              value={backText}
              onChange={handleBackTextChange}
              onPaste={handlePaste}
              placeholder="Enter the definition, translation, or explanation..."
              className={errors.back ? 'error' : ''}
              maxLength={500}
              rows={4}
            />
            {errors.back && <span className="error-message">{errors.back}</span>}
            <div className="character-count">{backText.length}/500</div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              {editingCard ? 'Update Card' : 'Create Card'}
            </button>
          </div>
        </form>

        <div className="form-tips">
          <p><strong>💡 Tips:</strong></p>
          <ul>
            <li>Keep words/phrases concise and clear</li>
            <li>Write definitions in your own words for better memory</li>
            <li>You can paste content - it will be truncated if too long</li>
            <li>Press <kbd>Esc</kbd> to close this dialog</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CardForm; 