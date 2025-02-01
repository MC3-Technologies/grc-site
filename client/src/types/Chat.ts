export interface ChatHistoryMessage {
    role: "system" | "user" | "assistant" | "error";
    content: string;
  }
  
  export const STORAGE_KEY = 'mc3_chat_history';