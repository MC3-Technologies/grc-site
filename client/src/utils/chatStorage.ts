// Path: src/utils/chatStorage.ts

import { ChatHistoryMessage, STORAGE_KEY } from "../types/Chat";

export const saveToLocalStorage = (messages: ChatHistoryMessage[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat to local storage:", error);
  }
};

export const loadFromLocalStorage = (): ChatHistoryMessage[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as ChatHistoryMessage[];
  } catch (error) {
    console.error("Error loading chat from local storage:", error);
    return null;
  }
};

export const clearChatHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};
