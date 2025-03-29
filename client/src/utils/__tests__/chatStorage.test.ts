import { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  clearChatHistory 
} from '../chatStorage';
import { STORAGE_KEY, ChatHistoryMessage } from "../../types/Chat";

// Mock localStorage since it's not available in Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Chat Storage Utilities', () => {
  // Sample chat message data for testing
  const sampleMessages: ChatHistoryMessage[] = [
    { role: 'user', content: 'Hello', timestamp: 1621087200000 },
    { role: 'assistant', content: 'Hi there', timestamp: 1621087260000 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('saveToLocalStorage', () => {
    test('should save messages to localStorage', () => {
      // Act
      saveToLocalStorage(sampleMessages);
      
      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY, 
        JSON.stringify(sampleMessages)
      );
    });

    test('should handle error gracefully', () => {
      // Arrange - mock error when setItem is called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      saveToLocalStorage(sampleMessages);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error saving chat to local storage:", 
        expect.any(Error)
      );
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadFromLocalStorage', () => {
    test('should load messages from localStorage', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sampleMessages));
      
      // Act
      const result = loadFromLocalStorage();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual(sampleMessages);
    });

    test('should return null when no data exists', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      
      // Act
      const result = loadFromLocalStorage();
      
      // Assert
      expect(result).toBeNull();
    });

    test('should handle error gracefully', () => {
      // Arrange - mock error when getItem is called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      const result = loadFromLocalStorage();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading chat from local storage:", 
        expect.any(Error)
      );
      expect(result).toBeNull();
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    test('should handle invalid JSON', () => {
      // Arrange - return invalid JSON
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Act
      const result = loadFromLocalStorage();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toBeNull();
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearChatHistory', () => {
    test('should remove chat history from localStorage', () => {
      // Act
      clearChatHistory();
      
      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    test('should handle error gracefully', () => {
      // Arrange - mock error when removeItem is called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Act
      clearChatHistory();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error clearing chat history:", 
        expect.any(Error)
      );
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
}); 