interface Card {
  id: number;
  front: string;
  back: string;
  category: string;
}

const STORAGE_KEY = 'flashcards_data';
const STORAGE_VERSION = '2.0'; // Updated version for category support

// Default sample cards for new users
const DEFAULT_CARDS: Card[] = [
  {
    id: 1,
    front: "noxious",
    back: "(formal) poisonous or harmful",
    category: "Vocabulary"
  },
  {
    id: 2,
    front: "Eloquent",
    back: "Fluent and persuasive in speaking or writing",
    category: "Vocabulary"
  },
  {
    id: 3,
    front: "Pristine",
    back: "In its original condition; unspoiled; perfectly clean",
    category: "Vocabulary"
  },
  {
    id: 4,
    front: "Resilient",
    back: "Able to recover quickly from difficult conditions",
    category: "Vocabulary"
  },
  {
    id: 5,
    front: "Meticulous",
    back: "Showing great attention to detail; very careful",
    category: "Vocabulary"
  }
];

interface StorageData {
  version: string;
  cards: Card[];
  lastModified: number;
}

/**
 * Save flashcards to localStorage
 */
export const saveCards = (cards: Card[]): boolean => {
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      cards: cards,
      lastModified: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log(`✅ Saved ${cards.length} flashcards to localStorage`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save flashcards:', error);
    return false;
  }
};

/**
 * Load flashcards from localStorage
 */
export const loadCards = (): Card[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (!storedData) {
      console.log('📦 No saved flashcards found, using default cards');
      return DEFAULT_CARDS;
    }
    
    const parsedData: StorageData = JSON.parse(storedData);
    
    // Validate data structure
    if (!parsedData.cards || !Array.isArray(parsedData.cards)) {
      console.warn('⚠️ Invalid flashcard data structure, using default cards');
      return DEFAULT_CARDS;
    }
    
    // Validate each card and add default category if missing (for backward compatibility)
    const validCards = parsedData.cards.filter(card => 
      card && 
      typeof card.id === 'number' && 
      typeof card.front === 'string' && 
      typeof card.back === 'string' &&
      card.front.trim() !== '' &&
      card.back.trim() !== ''
    ).map(card => ({
      ...card,
      category: card.category || 'General' // Default category for backward compatibility
    }));
    
    if (validCards.length === 0) {
      console.log('📦 No valid flashcards found, using default cards');
      return DEFAULT_CARDS;
    }
    
    console.log(`✅ Loaded ${validCards.length} flashcards from localStorage`);
    return validCards;
    
  } catch (error) {
    console.error('❌ Failed to load flashcards:', error);
    console.log('📦 Using default flashcards instead');
    return DEFAULT_CARDS;
  }
};

/**
 * Clear all saved flashcards (useful for reset functionality)
 */
export const clearCards = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared all saved flashcards');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear flashcards:', error);
    return false;
  }
};

/**
 * Get storage info (for debugging or user info)
 */
export const getStorageInfo = (): { hasData: boolean; cardCount: number; lastModified?: Date } => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (!storedData) {
      return { hasData: false, cardCount: 0 };
    }
    
    const parsedData: StorageData = JSON.parse(storedData);
    
    return {
      hasData: true,
      cardCount: parsedData.cards?.length || 0,
      lastModified: parsedData.lastModified ? new Date(parsedData.lastModified) : undefined
    };
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
    return { hasData: false, cardCount: 0 };
  }
};

/**
 * Export flashcards as JSON (for backup/sharing)
 */
export const exportCards = (cards: Card[]): string => {
  const exportData = {
    version: STORAGE_VERSION,
    exportDate: new Date().toISOString(),
    cards: cards,
    appName: 'Flashy'
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Import flashcards from JSON string
 */
export const importCards = (jsonString: string): Card[] | null => {
  try {
    const importData = JSON.parse(jsonString);
    
    if (!importData.cards || !Array.isArray(importData.cards)) {
      throw new Error('Invalid import format: no cards array found');
    }
    
    // Validate and clean imported cards
    const validCards = importData.cards.filter((card: any) => 
      card && 
      typeof card.front === 'string' && 
      typeof card.back === 'string' &&
      card.front.trim() !== '' &&
      card.back.trim() !== ''
    ).map((card: any, index: number) => ({
      id: card.id || index + 1,
      front: card.front.trim(),
      back: card.back.trim(),
      category: card.category || 'General'
    }));
    
    if (validCards.length === 0) {
      throw new Error('No valid cards found in import data');
    }
    
    console.log(`✅ Successfully imported ${validCards.length} flashcards`);
    return validCards;
    
  } catch (error) {
    console.error('❌ Failed to import flashcards:', error);
    return null;
  }
}; 