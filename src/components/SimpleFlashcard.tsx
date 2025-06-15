import { useState } from 'react';

type FlashcardProps = {
  question: string;
  answer: string;
};

const SimpleFlashcard = ({ question, answer }: FlashcardProps) => {
  const [flipped, setFlipped] = useState(false);

  const cardContainerStyle = {
    perspective: '1000px',
    width: '450px',
    height: '250px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))',
  };

  const cardInnerStyle = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    textAlign: 'center' as const,
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    transformStyle: 'preserve-3d' as const,
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const cardFaceStyle = {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden' as const,
    border: 'none',
    borderRadius: '20px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  };

  const frontFaceStyle = {
    ...cardFaceStyle,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  };

  const backFaceStyle = {
    ...cardFaceStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    transform: 'rotateY(180deg)',
  };

  return (
    <div style={cardContainerStyle} onClick={() => setFlipped(!flipped)}>
      <div style={cardInnerStyle}>
        {/* Front face (question) */}
        <div style={frontFaceStyle}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#2d3748', lineHeight: '1.4' }}>{question}</h2>
          <p style={{ fontStyle: 'italic', color: '#718096', margin: '0', fontSize: '14px', fontWeight: '500' }}>
            (Click to see answer)
          </p>
        </div>
        
        {/* Back face (answer) */}
        <div style={backFaceStyle}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: 'white', lineHeight: '1.4' }}>{answer}</h2>
          <p style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.8)', margin: '0', fontSize: '14px', fontWeight: '500' }}>
            (Click to see question)
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleFlashcard;
