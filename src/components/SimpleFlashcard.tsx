import { useState } from 'react';

type FlashcardProps = {
  question: string;
  answer: string;
};

const SimpleFlashcard = ({ question, answer }: FlashcardProps) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        border: '2px solid #333',
        borderRadius: '10px',
        padding: '30px',
        width: '300px',
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        background: flipped ? '#f0f0f0' : '#fff',
        transition: '0.3s ease',
      }}
    >
      <h2>{flipped ? answer : question}</h2>
      <p style={{ fontStyle: 'italic', color: '#888' }}>
        (Click to {flipped ? 'see question' : 'see answer'})
      </p>
    </div>
  );
};

export default SimpleFlashcard;
