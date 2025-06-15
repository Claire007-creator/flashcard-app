import SimpleFlashcard from './components/SimpleFlashcard';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import FlashCard from './components/FlashCard';
import CardForm from './components/CardForm';
import TestReport from './components/TestReport';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
import { loadCards, saveCards, getStorageInfo } from './utils/storage';

interface Card {
  id: number;
  front: string;
  back: string;
  category: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

function App() {
  const flashcards = [
    { question: 'What is the capital of France?', answer: 'Paris' },
    { question: 'What is 2 + 2?', answer: '4' },
    { question: 'What language is used in React?', answer: 'JavaScript' },
  ];

  const resultRef = useRef<HTMLDivElement | null>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  
  // Load flashcards from localStorage on app start
  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = loadCards();
    console.log('🚀 App started with', savedCards.length, 'flashcards');
    return savedCards;
  });

  // Authentication state
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('flashy_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthFormOpen, setIsAuthFormOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // State for card management
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<boolean[]>(new Array(cards.length).fill(false));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Progressive reveal states
  const [revealStage, setRevealStage] = useState<number>(1);
  const [scrollCount, setScrollCount] = useState<number>(0);

  // Category filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Test mode states
  const [testMode, setTestMode] = useState<boolean>(false);
  const [testDirection, setTestDirection] = useState<'definition-to-word' | 'word-to-definition'>('definition-to-word');
  const [testOrder, setTestOrder] = useState<'sequential' | 'random'>('sequential');
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{correct: number; total: number}>({correct: 0, total: 0});
  
  // New test report states
  const [testAnswers, setTestAnswers] = useState<{
    word: string;
    definition: string;
    userAnswer: string;
    isCorrect: boolean;
  }[]>([]);
  const [showTestReport, setShowTestReport] = useState(false);

  // Effect to scroll to result when test answer is shown
  useEffect(() => {
    if (showResult && resultRef.current && !userScrolled) {
      // Add a small delay to prevent immediate scroll and allow user interaction
      const scrollTimeout = setTimeout(() => {
        if (!userScrolled) { // Double-check user hasn't scrolled during the timeout
          resultRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center' // Center the element to show both content and buttons
          });
        }
      }, 100);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [showResult, userScrolled]);

  // Track user scroll interaction to prevent auto-scroll conflicts
  useEffect(() => {
    const handleScroll = () => {
      if (showResult) {
        setUserScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showResult]);

  // Get unique categories from cards
  const categories = ['All', ...Array.from(new Set(cards.map(card => card.category)))];
  
  // Filter cards by selected category
  const filteredCards = selectedCategory === 'All' 
    ? cards 
    : cards.filter(card => card.category === selectedCategory);

  // Utility function to shuffle array
  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get the current card index based on test order
  const getCurrentCardIndex = (): number => {
    if (testOrder === 'random' && shuffledIndices.length > 0) {
      return shuffledIndices[activeCardIndex] || 0;
    }
    return activeCardIndex;
  };

  // Get current card for test mode
  const currentTestCard = filteredCards[getCurrentCardIndex()];

  // Text comparison utilities for test mode
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
  };

  const calculateSimilarity = (userText: string, correctText: string): number => {
    const user = normalizeText(userText);
    const correct = normalizeText(correctText);
    
    if (user === correct) return 1;
    if (user.length === 0) return 0;
    
    // For single words, be more strict about exact matches
    const userWords = user.split(/\s+/);
    const correctWords = correct.split(/\s+/);
    
         // If both are single words, require exact match or very high similarity
     if (userWords.length === 1 && correctWords.length === 1) {
       if (user === correct) return 1;
       
       // For single words, only allow very minor typos for very short words
       const lengthDiff = Math.abs(user.length - correct.length);
       
       // If length difference is > 0, it means missing/extra characters - be very strict
       if (lengthDiff > 0) {
         // Only allow length differences for very short words (≤ 4 characters)
         // and only if it's a single character difference
         if (user.length <= 4 && correct.length <= 4 && lengthDiff === 1) {
           const distance = levenshteinDistance(user, correct);
           return distance === 1 ? 1 : 0;
         }
         return 0; // No length differences allowed for longer words
       }
       
               // If same length, only allow 1 character substitution for very short words
        if (user.length <= 4) {
          const distance = levenshteinDistance(user, correct);
          return distance === 1 ? 1 : 0;
        }
        
        // For words longer than 4 characters, require exact match
        return 0;
     }
    
    // For phrases, use the old algorithm but be stricter
    const maxLength = Math.max(user.length, correct.length);
    let matches = 0;
    
    for (let i = 0; i < Math.min(user.length, correct.length); i++) {
      if (user[i] === correct[i]) matches++;
    }
    
    const similarity = matches / maxLength;
    // Be stricter for phrases too - require 90% similarity
    return similarity >= 0.9 ? similarity : 0;
  };

  // Helper function to calculate Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    // Create matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const highlightDifferences = (userText: string, correctText: string) => {
    const user = userText.trim();
    const correct = correctText.trim();
    
    if (normalizeText(user) === normalizeText(correct)) {
      return <span className="correct-answer">{user}</span>;
    }
    
    // Split into characters for detailed comparison
    const userChars = user.split('');
    const correctChars = correct.split('');
    const maxLength = Math.max(userChars.length, correctChars.length);
    
    const result = [];
    for (let i = 0; i < maxLength; i++) {
      const userChar = userChars[i] || '';
      const correctChar = correctChars[i] || '';
      
      if (userChar && correctChar && userChar.toLowerCase() === correctChar.toLowerCase()) {
        // Character matches
        result.push(<span key={i} className="correct-char">{userChar}</span>);
      } else if (userChar && correctChar) {
        // Character exists but wrong
        result.push(<span key={i} className="incorrect-char">{userChar}</span>);
      } else if (userChar) {
        // Extra character in user's answer
        result.push(<span key={i} className="incorrect-char">{userChar}</span>);
      } else if (correctChar) {
        // Missing character (show as placeholder)
        result.push(<span key={i} className="missing-char">_</span>);
      }
    }
    
    return <span className="user-answer-highlighted">{result}</span>;
  };

  // Scroll detection for progressive reveal
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollThreshold = 100; // Minimum scroll distance to trigger next stage

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      // Only count significant scroll movements
      if (scrollDelta > scrollThreshold) {
        setScrollCount(prev => {
          const newCount = prev + 1;
          
          // Update reveal stage based on scroll count
          if (newCount === 1 && revealStage < 2) {
            setRevealStage(2); // Show subtitle
          } else if (newCount === 2 && revealStage < 3) {
            setRevealStage(3); // Show instructions
          } else if (newCount >= 3 && revealStage < 4) {
            setRevealStage(4); // Show flashcards
          }
          
          return newCount;
        });
        
        lastScrollY = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [revealStage]);

  // Effect to handle body scrolling when test report modal is open
  useEffect(() => {
    if (showTestReport) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Compensate for scrollbar
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showTestReport]);

  // Auto-save cards whenever they change
  useEffect(() => {
    if (cards.length > 0) {
      setSaveStatus('saving');
      const success = saveCards(cards);
      
      if (success) {
        setSaveStatus('saved');
        // Hide save status after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('error');
        // Show error longer (5 seconds)
        setTimeout(() => setSaveStatus(null), 5000);
      }
    }
  }, [cards]);

  // Update flipped cards array when cards change
  useEffect(() => {
    setFlippedCards(new Array(cards.length).fill(false));
    // Adjust active card index if it's out of bounds
    if (activeCardIndex >= cards.length && cards.length > 0) {
      setActiveCardIndex(0);
    }
  }, [cards.length, activeCardIndex]);

  // Handle keyboard events at the app level
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't handle keyboard events when form is open
      if (isFormOpen) return;
      
      // Test mode has its own keyboard handling
      if (testMode) return;
      
      if (event.key === 'Enter' || event.key === 'Return') {
        if (filteredCards.length === 0) return;
        
        const currentCardIsFlipped = flippedCards[activeCardIndex];
        
        if (!currentCardIsFlipped) {
          // Card is showing front side (A) - flip to back side (B) and stay there
          const newFlippedCards = [...flippedCards];
          newFlippedCards[activeCardIndex] = true;
          setFlippedCards(newFlippedCards);
        } else {
          // Card is showing back side (B) - advance to next card
          // First, flip current card back to front
          const newFlippedCards = [...flippedCards];
          newFlippedCards[activeCardIndex] = false;
          setFlippedCards(newFlippedCards);
          
          // Then advance to next card after a short delay for smooth transition
          setTimeout(() => {
            setActiveCardIndex((prevIndex) => {
              const nextIndex = (prevIndex + 1) % filteredCards.length;
              return nextIndex;
            });
          }, 300); // Shorter delay for quicker progression
        }
      }
    };

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeCardIndex, flippedCards, cards.length, isFormOpen]);

  const handleCardFlip = (cardIndex: number) => {
    // Update flipped state when card is clicked
    const newFlippedCards = [...flippedCards];
    newFlippedCards[cardIndex] = !newFlippedCards[cardIndex];
    setFlippedCards(newFlippedCards);
    
    // Set this card as the active one
    setActiveCardIndex(cardIndex);
  };

  const handleAddCard = () => {
    setEditingCard(null);
    setIsFormOpen(true);
  };

  const handleEditCard = (cardIndex: number) => {
    setEditingCard(cards[cardIndex]);
    setIsFormOpen(true);
  };

  const handleDeleteCard = (cardIndex: number) => {
    const newCards = cards.filter((_, index) => index !== cardIndex);
    setCards(newCards);
    
    // Adjust active card index if necessary
    if (activeCardIndex >= newCards.length && newCards.length > 0) {
      setActiveCardIndex(newCards.length - 1);
    } else if (newCards.length === 0) {
      setActiveCardIndex(0);
    }
  };

  const handleSaveCard = (cardData: { front: string; back: string; category: string; id?: number }) => {
    if (editingCard) {
      // Update existing card
      const newCards = cards.map(card => 
        card.id === editingCard.id 
          ? { ...card, front: cardData.front, back: cardData.back, category: cardData.category }
          : card
      );
      setCards(newCards);
    } else {
      // Add new card
      const newId = Math.max(...cards.map(c => c.id), 0) + 1;
      const newCard: Card = {
        id: newId,
        front: cardData.front,
        back: cardData.back,
        category: cardData.category
      };
      setCards([...cards, newCard]);
    }
  };

  // Handle clearing all data
  const handleClearData = () => {
    setCards([]);
    setActiveCardIndex(0);
    setFlippedCards([]);
  };

  // Test mode handlers
  const handleTestModeToggle = () => {
    const newTestMode = !testMode;
    setTestMode(newTestMode);
    setTestDirection('definition-to-word');
    setUserAnswer('');
    setShowResult(false);
    setUserScrolled(false); // Reset scroll tracking when toggling test mode
    setActiveCardIndex(0);
    setFlippedCards(new Array(cards.length).fill(false));
    setTestAnswers([]);
    setTestResults({correct: 0, total: 0});
    setShowTestReport(false);
    
    // Initialize shuffled indices when entering test mode
    if (newTestMode && testOrder === 'random') {
      const indices = Array.from({ length: filteredCards.length }, (_, i) => i);
      setShuffledIndices(shuffleArray(indices));
    }
  };

  const handleTestDirectionChange = (direction: 'definition-to-word' | 'word-to-definition') => {
    setTestDirection(direction);
    setUserAnswer('');
    setShowResult(false);
    setActiveCardIndex(0);
    setTestResults({correct: 0, total: 0});
    setTestAnswers([]);
    setShowTestReport(false);
  };

  const handleTestOrderChange = (order: 'sequential' | 'random') => {
    setTestOrder(order);
    setActiveCardIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setTestResults({correct: 0, total: 0});
    setTestAnswers([]);
    
    // Generate new shuffled indices if switching to random
    if (order === 'random') {
      const indices = Array.from({ length: filteredCards.length }, (_, i) => i);
      setShuffledIndices(shuffleArray(indices));
    } else {
      setShuffledIndices([]);
    }
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const correctAnswer = testDirection === 'definition-to-word' ? currentTestCard.front : currentTestCard.back;
    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    const isCorrect = similarity === 1;
    
    // Add the answer to testAnswers
    setTestAnswers(prev => [...prev, {
      word: currentTestCard.front,
      definition: currentTestCard.back,
      userAnswer: userAnswer.trim(),
      isCorrect
    }]);
    
    setTestResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    
    setTimeout(() => {
      setShowResult(true);
    }, 0);
  };

  const handleNextTestCard = () => {
    setUserAnswer('');
    setShowResult(false);
    setUserScrolled(false); // Reset scroll tracking for the next card
    
    if (activeCardIndex < filteredCards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    } else {
      // Show test report when all cards are completed
      setShowTestReport(true);
    }
  };

  const handleCloseTestReport = () => {
    setShowTestReport(false);
    setTestMode(false);
    setTestAnswers([]);
    setTestResults({ correct: 0, total: 0 });
    setActiveCardIndex(0);
  };

  const handleTestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResult) {
        handleNextTestCard();
      } else {
        handleSubmitAnswer();
      }
    }
  };

  // Authentication handlers
  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    console.log('🔐 User authenticated:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('flashy_user');
    console.log('🔓 User logged out');
  };

  const handleOpenAuth = () => {
    setIsAuthFormOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthFormOpen(false);
  };

  // Get storage info for user feedback
  const storageInfo = getStorageInfo();

  
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>Flashcard App 🧠</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {flashcards.map((card, index) => (
          <SimpleFlashcard
            key={index}
            question={card.question}
            answer={card.answer}
          />
        ))}
      </div>
    </div>
  );
  
}

export default App;