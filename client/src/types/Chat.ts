export interface ChatHistoryMessage {
  role: 'user' |  'system' | 'assistant' | 'error';
  content: string;
  timestamp?: number;
}

export interface ChatState {
  messages: ChatHistoryMessage[];
}

export interface StoredMessage {
  message: string;
  role: 'user' | 'bot' | 'error';
  timestamp?: number;
}

export const STORAGE_KEY = 'mc3_chat_history';