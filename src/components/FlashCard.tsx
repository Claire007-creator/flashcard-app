import React from 'react';
import './FlashCard.css';

interface FlashCardProps {
  frontText: string;
  backText: string;
  isFlipped: boolean;
  isActive: boolean;
  onFlip: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const FlashCard: React.FC<FlashCardProps> = ({
  frontText,
  backText,
  isFlipped,
  isActive,
  onFlip,
  onEdit,
  onDelete
}) => {
  return (
    <div 
      className={`flashcard ${isFlipped ? 'flipped' : ''} ${isActive ? 'active' : ''}`}
      onClick={onFlip}
      tabIndex={0}
      role="button"
      aria-label={`Flashcard: ${frontText}. Press Enter to flip.`}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <h2>{frontText}</h2>
          
          <div className="flashcard-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flashcard-action-btn edit-btn"
              onClick={onEdit}
              aria-label="Edit card"
              title="Edit card"
            >
              ✏️
            </button>
            <button 
              className="flashcard-action-btn delete-btn"
              onClick={onDelete}
              aria-label="Delete card"
              title="Delete card"
            >
              🗑
            </button>
          </div>
        </div>
        
        <div className="flashcard-back">
          <h2>Definition</h2>
          <p>{backText}</p>
          
          <div className="flashcard-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flashcard-action-btn edit-btn"
              onClick={onEdit}
              aria-label="Edit card"
              title="Edit card"
            >
              ✏️
            </button>
            <button 
              className="flashcard-action-btn delete-btn"
              onClick={onDelete}
              aria-label="Delete card"
              title="Delete card"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard; 