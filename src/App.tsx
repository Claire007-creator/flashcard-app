import SimpleFlashcard from './components/SimpleFlashcard';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import FlashCard from './components/FlashCard';
import CardForm from './components/CardForm';
import TestReport from './components/TestReport';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
import { loadCards, saveCards, getStorageInfo } from './utils/storage';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

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

  // State to track current flashcard index
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Deck management state
  const [customDecks, setCustomDecks] = useState<{[key: string]: {question: string, answer: string}[]}>({
    'The Economist': flashcards,
    'Sample Deck': flashcards,
    'General': []
  });
  const [selectedDeck, setSelectedDeck] = useState<string>('The Economist');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showMyDecks, setShowMyDecks] = useState(false);
  
  // Form state for adding cards
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    category: ''
  });
  const [tempCards, setTempCards] = useState<{question: string, answer: string}[]>([]);
  
  // Edit card state
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [showEditCard, setShowEditCard] = useState(false);
  
  // Create new deck state
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);
  
  // Deck deletion confirmation state
  const [showDeleteDeckConfirm, setShowDeleteDeckConfirm] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

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

  // Get active flashcards from selected deck
  const activeFlashcards = customDecks[selectedDeck] || [];

  // Get current card for test mode - adapt to simple flashcard format
  const getCurrentTestCard = () => {
    const cardIndex = testOrder === 'random' && shuffledIndices.length > 0 
      ? shuffledIndices[activeCardIndex] || 0 
      : activeCardIndex;
    return activeFlashcards[cardIndex];
  };
  const currentTestCard = getCurrentTestCard();

  // Text comparison utilities for test mode
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
  };

  const calculateSimilarity = (userText: string, correctText: string): number => {
    const user = normalizeText(userText);
    const correct = normalizeText(correctText);
    
    if (user === correct) return 1;
    if (user.length === 0) return 0;
    
    // Check if both are numbers - require exact match for numbers
    const userIsNumber = /^\d+$/.test(user);
    const correctIsNumber = /^\d+$/.test(correct);
    
    if (userIsNumber && correctIsNumber) {
      return user === correct ? 1 : 0;
    }
    
    // For single words that aren't numbers, be more strict about exact matches
    const userWords = user.split(/\s+/);
    const correctWords = correct.split(/\s+/);
    
    // If both are single words, require exact match or very high similarity
    if (userWords.length === 1 && correctWords.length === 1) {
      if (user === correct) return 1;
      
      // For single words, only allow very minor typos for longer words (> 4 characters)
      const lengthDiff = Math.abs(user.length - correct.length);
      
      // If length difference is > 0, it means missing/extra characters - be very strict
      if (lengthDiff > 0) {
        // Only allow length differences for longer words (> 4 characters)
        // and only if it's a single character difference
        if (user.length > 4 && correct.length > 4 && lengthDiff === 1) {
          const distance = levenshteinDistance(user, correct);
          return distance === 1 ? 1 : 0;
        }
        return 0; // No length differences allowed for short words
      }
      
      // If same length, only allow 1 character substitution for longer words (> 4 characters)
      if (user.length > 4) {
        const distance = levenshteinDistance(user, correct);
        return distance === 1 ? 1 : 0;
      }
      
      // For words ≤ 4 characters, require exact match
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

  const highlightUserAnswer = (userText: string, correctText: string) => {
    const user = userText.trim();
    const correct = correctText.trim();
    
    if (normalizeText(user) === normalizeText(correct)) {
      return <span style={{ color: 'green' }}>{user}</span>;
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
        // Character matches - show in green
        result.push(<span key={i} style={{ color: 'green' }}>{userChar}</span>);
      } else if (userChar && correctChar) {
        // Character exists but wrong - show in red with underline
        result.push(<span key={i} style={{ color: 'red', textDecoration: 'underline', backgroundColor: '#ffeeee' }}>{userChar}</span>);
      } else if (userChar) {
        // Extra character in user's answer - show in red
        result.push(<span key={i} style={{ color: 'red', backgroundColor: '#ffeeee' }}>{userChar}</span>);
      } else if (correctChar) {
        // Missing character - show as red underscore
        result.push(<span key={i} style={{ color: 'red' }}>_</span>);
      }
    }
    
    return <span>{result}</span>;
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

  const handleAddFlashCard = () => {
    setEditingCard(null);
    setIsFormOpen(true);
  };

  const handleEditFlashCard = (cardIndex: number) => {
    setEditingCard(cards[cardIndex]);
    setIsFormOpen(true);
  };

  const handleDeleteFlashCard = (cardIndex: number) => {
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
      const indices = Array.from({ length: activeFlashcards.length }, (_, i) => i);
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
      const indices = Array.from({ length: activeFlashcards.length }, (_, i) => i);
      setShuffledIndices(shuffleArray(indices));
    } else {
      setShuffledIndices([]);
    }
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const correctAnswer = testDirection === 'definition-to-word' ? currentTestCard.question : currentTestCard.answer;
    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    const isCorrect = similarity === 1;
    
    // Add the answer to testAnswers
    setTestAnswers(prev => [...prev, {
      word: currentTestCard.question,
      definition: currentTestCard.answer,
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
    
    if (activeCardIndex < activeFlashcards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    } else {
      // Show test report when all cards are completed
      setShowTestReport(true);
    }
  };

  // Handle Enter key press for next question when result is showing
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (showResult && testMode && (event.key === 'Enter' || event.key === 'Return')) {
        handleNextTestCard();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showResult, testMode, handleNextTestCard]);

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

  // Deck management handlers
  const handleAddCard = () => {
    if (newCard.question.trim() && newCard.answer.trim()) {
      setTempCards([...tempCards, {
        question: newCard.question.trim(),
        answer: newCard.answer.trim()
      }]);
      setNewCard({ question: '', answer: '', category: newCard.category });
    }
  };

  const handleSaveDeck = () => {
    if (tempCards.length > 0) {
      const deckName = newCard.category.trim() || 'General';
      setCustomDecks(prev => ({
        ...prev,
        [deckName]: [...(prev[deckName] || []), ...tempCards]
      }));
      setTempCards([]);
      setNewCard({ question: '', answer: '', category: '' });
      setShowAddCard(false);
      setSelectedDeck(deckName);
    }
  };

  const handleSelectDeck = (deckName: string) => {
    setSelectedDeck(deckName);
    setCurrentCardIndex(0);
    setTestMode(false);
    setShowMyDecks(false);
  };

  const handleDeleteDeck = (deckName: string) => {
    if (deckName !== 'The Economist') {
      const newDecks = { ...customDecks };
      delete newDecks[deckName];
      setCustomDecks(newDecks);
      if (selectedDeck === deckName) {
        setSelectedDeck('The Economist');
      }
    }
  };

  const handleEditCard = (cardIndex: number) => {
    const cardToEdit = activeFlashcards[cardIndex];
    setEditingCardIndex(cardIndex);
    setNewCard({
      question: cardToEdit.question,
      answer: cardToEdit.answer,
      category: selectedDeck
    });
    setShowEditCard(true);
  };

  const handleSaveEditedCard = () => {
    if (editingCardIndex !== null && newCard.question.trim() && newCard.answer.trim()) {
      const updatedDecks = { ...customDecks };
      updatedDecks[selectedDeck][editingCardIndex] = {
        question: newCard.question.trim(),
        answer: newCard.answer.trim()
      };
      setCustomDecks(updatedDecks);
      setShowEditCard(false);
      setEditingCardIndex(null);
      setNewCard({ question: '', answer: '', category: '' });
    }
  };

  const handleDeleteCard = (cardIndex: number) => {
    const updatedDecks = { ...customDecks };
    updatedDecks[selectedDeck].splice(cardIndex, 1);
    setCustomDecks(updatedDecks);
    
    // Adjust current card index if necessary
    if (currentCardIndex >= updatedDecks[selectedDeck].length && updatedDecks[selectedDeck].length > 0) {
      setCurrentCardIndex(updatedDecks[selectedDeck].length - 1);
    } else if (updatedDecks[selectedDeck].length === 0) {
      setCurrentCardIndex(0);
    }
  };

  const handleDeleteCardClick = (cardIndex: number) => {
    setCardToDelete(cardIndex);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete !== null) {
      handleDeleteCard(cardToDelete);
      setCardToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleCreateNewDeck = () => {
    if (newDeckName.trim() && !customDecks[newDeckName.trim()]) {
      const deckName = newDeckName.trim();
      setCustomDecks(prev => ({
        ...prev,
        [deckName]: []
      }));
      setSelectedDeck(deckName);
      setNewDeckName('');
      setShowCreateDeck(false);
      setShowMyDecks(false);
    }
  };

  const handleDeleteDeckClick = (deckName: string) => {
    setDeckToDelete(deckName);
    setShowDeleteDeckConfirm(true);
  };

  const confirmDeleteDeck = () => {
    if (deckToDelete) {
      handleDeleteDeck(deckToDelete);
      setDeckToDelete(null);
      setShowDeleteDeckConfirm(false);
    }
  };

  
  // Navigation functions
  const goToPrevious = () => {
    if (activeFlashcards.length === 0) return;
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else {
      // Loop to last card when at the beginning
      setCurrentCardIndex(activeFlashcards.length - 1);
    }
  };

  const goToNext = () => {
    if (activeFlashcards.length === 0) return;
    if (currentCardIndex < activeFlashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Loop back to first card when at the end
      setCurrentCardIndex(0);
    }
  };

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  
  const [heroRef, heroInView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  const [animationRef, animationInView] = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  return (
    <div className="scroll-smooth bg-white">
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="min-h-screen flex flex-col justify-center items-center bg-white text-center px-8 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: heroInView ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h1 
            className="text-7xl md:text-8xl lg:text-9xl font-light text-black mb-6 leading-none tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: heroInView ? 0 : 100, opacity: heroInView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          >
            Learn Today.
          </motion.h1>
          <motion.h2 
            className="text-5xl md:text-6xl lg:text-7xl font-light text-black mb-16 leading-none tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: heroInView ? 0 : 100, opacity: heroInView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          >
            No Nonsense.
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: heroInView ? 0 : 50, opacity: heroInView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          >
            Master vocabulary with precision and elegance. From flashcards to fluency, 
            we craft learning experiences that transform knowledge into wisdom.
          </motion.p>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer"
          onClick={() => document.getElementById('animation-section')?.scrollIntoView({ behavior: 'smooth' })}
          initial={{ opacity: 0 }}
          animate={{ opacity: heroInView ? 1 : 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <motion.div 
            className="w-px h-16 bg-black mb-4"
            animate={{ scaleY: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-xs text-black font-medium uppercase tracking-widest">
            Scroll
          </span>
        </motion.div>
      </motion.section>

      {/* Animation Section */}
      <motion.section 
        id="animation-section"
        ref={animationRef}
        className="min-h-screen flex items-center justify-center bg-gray-50 px-8 py-20"
        style={{ y }}
      >
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: animationInView ? 1 : 0.8, opacity: animationInView ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Animated Flashcard Placeholder */}
          <motion.div 
            className="w-80 h-48 mx-auto mb-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center border border-gray-100"
            animate={{ 
              rotateY: animationInView ? [0, 180, 360] : 0,
              scale: animationInView ? [1, 1.05, 1] : 1
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatDelay: 2,
              ease: "easeInOut" 
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🧠</div>
              <p className="text-lg font-medium text-gray-700">Knowledge</p>
              <p className="text-sm text-gray-500">Transforms</p>
            </div>
          </motion.div>
          
          <motion.h3 
            className="text-4xl md:text-5xl font-light text-gray-800 mb-8 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: animationInView ? 0 : 50, opacity: animationInView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Every card tells a story.
            <br />
            Every flip reveals wisdom.
          </motion.h3>
        </motion.div>
      </motion.section>

      {/* Dark Quote Section */}
      <section className="min-h-screen bg-gray-900 flex items-center justify-center px-8 py-20">
        <motion.div 
          className="text-center max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <blockquote 
            className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-12"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "The beautiful thing about learning is that no one can take it away from you."
          </blockquote>
          <cite className="text-lg text-gray-400 font-light tracking-wider">
            — B.B. King
          </cite>
        </motion.div>
      </section>

      {/* Flashcard Section */}
      <section id="flashcards" className="min-h-screen bg-white flex items-center justify-center px-8 py-20">
        <div className="max-w-6xl w-full mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 
              className="text-5xl md:text-6xl lg:text-7xl font-light text-black mb-8 leading-none tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Learning Studio
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Curated collections of knowledge, designed for mastery.
            </p>
          </motion.div>
      
      {!testMode ? (
        // Study Mode
        <>
          {/* Deck Selection and Management */}
          <motion.div 
            className="bg-gray-50 rounded-3xl p-12 md:p-16 mb-16 border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 
              className="text-4xl md:text-5xl font-light text-black text-center mb-12 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {selectedDeck}
            </h3>
            <div className="flex flex-wrap gap-6 justify-center mb-12">
              <motion.button
                onClick={() => setShowMyDecks(true)}
                className="bg-black text-white px-10 py-4 font-light text-lg hover:bg-gray-800 transition-all duration-300 tracking-wide"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View Collections
              </motion.button>
              <motion.button
                onClick={() => setShowAddCard(true)}
                className="border border-black text-black hover:bg-black hover:text-white px-10 py-4 font-light text-lg transition-all duration-300 tracking-wide"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create Cards
              </motion.button>
            </div>
          </motion.div>

          {activeFlashcards.length === 0 ? (
            <motion.div 
              className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="text-6xl mb-8">✨</div>
              <h4 
                className="text-3xl md:text-4xl font-light text-black mb-6 tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ready to Begin?
              </h4>
              <p className="text-xl text-gray-600 font-light leading-relaxed">
                Your learning journey starts with a single card. Create your first collection to unlock the magic of knowledge.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Card counter */}
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <span className="bg-black text-white px-8 py-3 text-sm font-light uppercase tracking-widest">
                  {currentCardIndex + 1} of {activeFlashcards.length}
                </span>
              </motion.div>
              
              {/* Current flashcard */}
              <motion.div 
                className="flex justify-center mb-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="transform transition-all duration-500 hover:scale-105">
                  <SimpleFlashcard
                    key={currentCardIndex} // Key ensures component resets when card changes
                    question={activeFlashcards[currentCardIndex].question}
                    answer={activeFlashcards[currentCardIndex].answer}
                  />
                </div>
              </motion.div>
              
                            {/* Card Edit Controls */}
              <motion.div 
                className="flex gap-6 justify-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.button
                  onClick={() => handleEditCard(currentCardIndex)}
                  className="bg-gray-100 text-black px-8 py-3 font-light text-lg hover:bg-gray-200 transition-all duration-300 tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Edit
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteCardClick(currentCardIndex)}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-8 py-3 font-light text-lg transition-all duration-300 tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </motion.div>
            </>
          )}
          
          {activeFlashcards.length > 0 && (
            <>
              {/* Navigation buttons */}
              <motion.div 
                className="flex gap-6 justify-center mb-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <motion.button
                  onClick={goToPrevious}
                  className="w-16 h-16 bg-black text-white rounded-full font-light text-2xl hover:bg-gray-800 transition-all duration-300"
                  title="Previous card"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ←
                </motion.button>
                
                <motion.button
                  onClick={goToNext}
                  className="w-16 h-16 bg-black text-white rounded-full font-light text-2xl hover:bg-gray-800 transition-all duration-300"
                  title="Next card"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  →
                </motion.button>
              </motion.div>
              
              {/* Start Test Button */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <motion.button 
                  onClick={handleTestModeToggle}
                  className="bg-black text-white px-16 py-5 text-xl font-light hover:bg-gray-800 transition-all duration-300 tracking-wider"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Begin Assessment
                </motion.button>
              </motion.div>
            </>
          )}
        </>
      ) : (
        // Test Mode
        <>
          {/* Test Configuration */}
          <div style={{ marginBottom: '30px' }}>
            <h2>Test Mode</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Question {activeCardIndex + 1} of {activeFlashcards.length}
            </p>
            
            {/* Test Direction Toggle */}
            <div style={{ marginBottom: '20px' }}>
                             <button
                 onClick={() => handleTestDirectionChange('definition-to-word')}
                 style={{
                   padding: '8px 16px',
                   margin: '0 5px',
                   border: '2px solid #333',
                   borderRadius: '8px',
                   background: testDirection === 'definition-to-word' ? '#333' : '#fff',
                   color: testDirection === 'definition-to-word' ? '#fff' : '#333',
                   cursor: 'pointer',
                 }}
               >
                 Side B → Side A
               </button>
               <button
                 onClick={() => handleTestDirectionChange('word-to-definition')}
                 style={{
                   padding: '8px 16px',
                   margin: '0 5px',
                   border: '2px solid #333',
                   borderRadius: '8px',
                   background: testDirection === 'word-to-definition' ? '#333' : '#fff',
                   color: testDirection === 'word-to-definition' ? '#fff' : '#333',
                   cursor: 'pointer',
                 }}
               >
                 Side A → Side B
               </button>
            </div>
            
            {/* Test Order Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => handleTestOrderChange('sequential')}
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  background: testOrder === 'sequential' ? '#333' : '#fff',
                  color: testOrder === 'sequential' ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                📄 Sequential
              </button>
              <button
                onClick={() => handleTestOrderChange('random')}
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  background: testOrder === 'random' ? '#333' : '#fff',
                  color: testOrder === 'random' ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                🔀 Shuffled
              </button>
            </div>
          </div>
          
          {/* Test Question */}
          {!showResult ? (
            <div style={{ marginBottom: '30px' }}>
                             <div style={{ 
                 border: '2px solid #333', 
                 borderRadius: '10px', 
                 padding: '30px', 
                 marginBottom: '20px',
                 background: '#f9f9f9',
                 maxWidth: '500px',
                 margin: '0 auto 20px auto'
               }}>
                                 <h3 style={{ marginBottom: '20px' }}>
                   {testDirection === 'definition-to-word' ? 'Side A:' : 'Side B:'}
                 </h3>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {testDirection === 'definition-to-word' ? currentTestCard.answer : currentTestCard.question}
                </p>
              </div>
              
                             <input
                 type="text"
                 value={userAnswer}
                 onChange={(e) => setUserAnswer(e.target.value)}
                 onKeyPress={(e) => {
                   if (e.key === 'Enter' || e.key === 'Return') {
                     handleSubmitAnswer();
                   }
                 }}
                 placeholder="Type your answer here..."
                 style={{
                   padding: '12px',
                   fontSize: '16px',
                   border: '2px solid #ccc',
                   borderRadius: '8px',
                   width: '350px',
                   maxWidth: '350px',
                   marginRight: '10px',
                   display: 'block',
                   margin: '0 auto 20px auto',
                 }}
                 autoFocus
               />
              
                             <div style={{ textAlign: 'center' }}>
                 <button
                   onClick={handleSubmitAnswer}
                   disabled={!userAnswer.trim()}
                   style={{
                     padding: '12px 24px',
                     fontSize: '16px',
                     border: '2px solid #007bff',
                     borderRadius: '8px',
                     background: userAnswer.trim() ? '#007bff' : '#ccc',
                     color: '#fff',
                     cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                   }}
                 >
                   Submit (or press Enter)
                 </button>
               </div>
            </div>
          ) : (
                         // Test Result
             <div style={{ marginBottom: '30px' }}>
               <div style={{ 
                 border: '2px solid #333', 
                 borderRadius: '10px', 
                 padding: '30px', 
                 marginBottom: '20px',
                 background: '#f9f9f9'
               }}>
                 <div style={{ marginBottom: '20px' }}>
                   <h3 style={{ fontStyle: 'italic', color: '#666', margin: '0 0 10px 0' }}>Your Answer:</h3>
                   <p style={{ fontSize: '18px', margin: '0' }}>
                     {highlightUserAnswer(userAnswer, testDirection === 'definition-to-word' ? currentTestCard.question : currentTestCard.answer)}
                   </p>
                 </div>
                 
                 <div style={{ marginBottom: '20px' }}>
                   <h3 style={{ fontWeight: 'bold', color: '#333', margin: '0 0 10px 0' }}>Correct Answer:</h3>
                   <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff', margin: '0' }}>
                     {testDirection === 'definition-to-word' ? currentTestCard.question : currentTestCard.answer}
                   </p>
                 </div>
                 
                 <p style={{ 
                   fontSize: '20px', 
                   fontWeight: 'bold',
                   color: calculateSimilarity(userAnswer, testDirection === 'definition-to-word' ? currentTestCard.question : currentTestCard.answer) === 1 ? 'green' : 'red',
                   textAlign: 'center',
                   margin: '0'
                 }}>
                   {calculateSimilarity(userAnswer, testDirection === 'definition-to-word' ? currentTestCard.question : currentTestCard.answer) === 1 ? 'Correct! ✅' : 'Incorrect ❌'}
                 </p>
               </div>
              
                             <button
                 onClick={handleNextTestCard}
                 style={{
                   padding: '12px 24px',
                   fontSize: '16px',
                   border: '2px solid #007bff',
                   borderRadius: '8px',
                   background: '#007bff',
                   color: '#fff',
                   cursor: 'pointer',
                 }}
               >
                 {activeCardIndex < activeFlashcards.length - 1 ? 'Next Question (or press Enter)' : 'Finish Test (or press Enter)'}
               </button>
            </div>
          )}
          
          {/* Exit Test Mode */}
          <button
            onClick={handleTestModeToggle}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: '2px solid #dc3545',
              borderRadius: '8px',
              background: '#fff',
              color: '#dc3545',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            Exit Test Mode
          </button>
        </>
      )}
      
      {/* Test Report Modal */}
      {showTestReport && (
        <TestReport
          results={testAnswers}
          testDirection={testDirection}
          onClose={handleCloseTestReport}
          category="All"
        />
      )}

      {/* My Decks Modal */}
      {showMyDecks && (
        <div className="modal-overlay">
          <div className="modal-content">
             <div className="modal-header">
               <div className="modal-icon">📚</div>
               <h2 className="modal-title">My Decks</h2>
             </div>
             
             {/* Create New Deck Button */}
             <div style={{ textAlign: 'center', marginBottom: '20px' }}>
               <button
                 onClick={() => setShowCreateDeck(true)}
                 className="btn btn-primary"
               >
                 ➕ Create New Deck
               </button>
             </div>
             
             <div style={{ marginBottom: '20px' }}>
              {Object.entries(customDecks).map(([deckName, deckCards]) => (
                <div key={deckName} style={{
                  border: selectedDeck === deckName ? '3px solid #007bff' : '2px solid #ddd',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: selectedDeck === deckName ? '#f0f8ff' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {deckName} {selectedDeck === deckName && '(Current)'}
                      </h3>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        {deckCards.length} cards
                      </p>
                    </div>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       {selectedDeck !== deckName && (
                         <button
                           onClick={() => handleSelectDeck(deckName)}
                           style={{
                             padding: '8px 16px',
                             fontSize: '14px',
                             border: '2px solid #28a745',
                             borderRadius: '8px',
                             background: '#28a745',
                             color: '#fff',
                             cursor: 'pointer',
                           }}
                         >
                           Select
                         </button>
                       )}
                       {deckName !== 'The Economist' && selectedDeck !== deckName && (
                         <button
                           onClick={() => handleDeleteDeckClick(deckName)}
                           style={{
                             padding: '6px 10px',
                             fontSize: '12px',
                             border: '2px solid #dc3545',
                             borderRadius: '6px',
                             background: '#fff',
                             color: '#dc3545',
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '4px'
                           }}
                           title="Delete this deck"
                         >
                           🗑️ Delete
                         </button>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowMyDecks(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #6c757d',
                  borderRadius: '8px',
                  background: '#6c757d',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-icon">➕</div>
              <h2 className="modal-title">Add New Cards</h2>
            </div>
            
            {/* Category/Deck Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Deck Name:
              </label>
              <input
                type="text"
                value={newCard.category}
                onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                placeholder="Enter deck name or choose existing"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {Object.keys(customDecks).map(deckName => (
                  <button
                    key={deckName}
                    onClick={() => setNewCard({ ...newCard, category: deckName })}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: newCard.category === deckName ? '#007bff' : '#f8f9fa',
                      color: newCard.category === deckName ? '#fff' : '#333',
                      cursor: 'pointer',
                    }}
                  >
                    {deckName}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Side A */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Side A (Question/Term):
              </label>
              <textarea
                value={newCard.question}
                onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                placeholder="Enter the question or term"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Side B */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Side B (Answer/Definition):
              </label>
              <textarea
                value={newCard.answer}
                onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                placeholder="Enter the answer or definition"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Add to Temporary List Button */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={handleAddCard}
                disabled={!newCard.question.trim() || !newCard.answer.trim()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  background: newCard.question.trim() && newCard.answer.trim() ? '#28a745' : '#ccc',
                  color: '#fff',
                  cursor: newCard.question.trim() && newCard.answer.trim() ? 'pointer' : 'not-allowed',
                  marginRight: '10px'
                }}
              >
                Add Card to List
              </button>
            </div>
            
            {/* Temporary Cards List */}
            {tempCards.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Cards to Save ({tempCards.length}):</h3>
                <div style={{ 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  {tempCards.map((card, index) => (
                    <div key={index} style={{
                      backgroundColor: '#f8f9fa',
                      padding: '10px',
                      marginBottom: '10px',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}>
                      <strong>A:</strong> {card.question}<br />
                      <strong>B:</strong> {card.answer}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {tempCards.length > 0 && (
                <button
                  onClick={handleSaveDeck}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    border: '2px solid #007bff',
                    borderRadius: '8px',
                    background: '#007bff',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  💾 Save to {newCard.category.trim() || 'General'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddCard(false);
                  setNewCard({ question: '', answer: '', category: '' });
                  setTempCards([]);
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #6c757d',
                  borderRadius: '8px',
                  background: '#6c757d',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
                     </div>
         </div>
       )}

      {/* Edit Card Modal */}
      {showEditCard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>✏️ Edit Card</h2>
            
            {/* Side A */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Side A (Question/Term):
              </label>
              <textarea
                value={newCard.question}
                onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                placeholder="Enter the question or term"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Side B */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Side B (Answer/Definition):
              </label>
              <textarea
                value={newCard.answer}
                onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                placeholder="Enter the answer or definition"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Action Buttons */}
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={handleSaveEditedCard}
                disabled={!newCard.question.trim() || !newCard.answer.trim()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  background: newCard.question.trim() && newCard.answer.trim() ? '#28a745' : '#ccc',
                  color: '#fff',
                  cursor: newCard.question.trim() && newCard.answer.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                💾 Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditCard(false);
                  setEditingCardIndex(null);
                  setNewCard({ question: '', answer: '', category: '' });
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #6c757d',
                  borderRadius: '8px',
                  background: '#6c757d',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
                     </div>
         </div>
       )}

      {/* Create New Deck Modal */}
      {showCreateDeck && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>📚 Create New Deck</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Deck Name:
              </label>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Enter deck name"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px'
                }}
                autoFocus
              />
            </div>
            
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={handleCreateNewDeck}
                disabled={!newDeckName.trim() || !!customDecks[newDeckName.trim()]}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  background: newDeckName.trim() && !customDecks[newDeckName.trim()] ? '#28a745' : '#ccc',
                  color: '#fff',
                  cursor: newDeckName.trim() && !customDecks[newDeckName.trim()] ? 'pointer' : 'not-allowed',
                }}
              >
                Create Deck
              </button>
              <button
                onClick={() => {
                  setShowCreateDeck(false);
                  setNewDeckName('');
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #6c757d',
                  borderRadius: '8px',
                  background: '#6c757d',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗑️</div>
            <h2 style={{ marginBottom: '15px', color: '#333' }}>Delete Card</h2>
            <p style={{ marginBottom: '25px', color: '#666', fontSize: '16px' }}>
              Are you sure you want to delete this card? This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCardToDelete(null);
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #6c757d',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCard}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #dc3545',
                  borderRadius: '8px',
                  background: '#dc3545',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Delete
              </button>
            </div>
                     </div>
         </div>
       )}

      {/* Deck Deletion Confirmation Modal */}
      {showDeleteDeckConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '15px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
            <h2 style={{ marginBottom: '15px', color: '#333' }}>Delete Deck</h2>
            <p style={{ marginBottom: '10px', color: '#666', fontSize: '16px' }}>
              Are you sure you want to delete the deck <strong>"{deckToDelete}"</strong>?
            </p>
            <p style={{ marginBottom: '25px', color: '#999', fontSize: '14px' }}>
              This will permanently delete all {deckToDelete ? customDecks[deckToDelete]?.length || 0 : 0} cards in this deck. This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => {
                  setShowDeleteDeckConfirm(false);
                  setDeckToDelete(null);
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #6c757d',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDeck}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  border: '2px solid #dc3545',
                  borderRadius: '8px',
                  background: '#dc3545',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Delete Deck
              </button>
            </div>
          </div>
                 </div>
       )}
        </div>
      </section>
    </div>
  );
  
}

export default App;