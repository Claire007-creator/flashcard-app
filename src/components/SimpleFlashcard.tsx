import { useState } from 'react';

type FlashcardProps = {
  question: string;
  answer: string;
};

const SimpleFlashcard = ({ question, answer }: FlashcardProps) => {
  const [flipped, setFlipped] = useState(false);

  const cardContainerStyle = {
    perspective: '1000px',
    width: '300px',
    height: '200px',
    cursor: 'pointer',
    userSelect: 'none' as const,
  };

  const cardInnerStyle = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    textAlign: 'center' as const,
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d' as const,
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const cardFaceStyle = {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden' as const,
    border: '2px solid #333',
    borderRadius: '10px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box' as const,
  };

  const frontFaceStyle = {
    ...cardFaceStyle,
    background: '#fff',
  };

  const backFaceStyle = {
    ...cardFaceStyle,
    background: '#f0f0f0',
    transform: 'rotateY(180deg)',
  };

  return (
    <div style={cardContainerStyle} onClick={() => setFlipped(!flipped)}>
      <div style={cardInnerStyle}>
        {/* Front face (question) */}
        <div style={frontFaceStyle}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>{question}</h2>
          <p style={{ fontStyle: 'italic', color: '#888', margin: '0', fontSize: '14px' }}>
            (Click to see answer)
          </p>
        </div>
        
        {/* Back face (answer) */}
        <div style={backFaceStyle}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>{answer}</h2>
          <p style={{ fontStyle: 'italic', color: '#666', margin: '0', fontSize: '14px' }}>
            (Click to see question)
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleFlashcard;
