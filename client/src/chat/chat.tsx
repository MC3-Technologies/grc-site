import { useEffect, useState, useRef } from "react";
import ChatMessage from "../components/ChatMessage";
import "../index.css";
import { getCurrentUser } from "../amplify/auth";

interface Message {
  role: "user" | "assistant";
  message: string;
}

export function FullScreenChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedInput = localStorage.getItem("inputMessage");

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (err) {
        console.error("Could not parse localStorage chatMessages:", err);
      }
    }
    if (savedInput) {
      setInputMessage(savedInput);
    }
  }, []);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // Add listener for storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "chatMessages" && e.newValue) {
        try {
          const newMessages = JSON.parse(e.newValue);
          setMessages(newMessages);
        } catch (err) {
          console.error("Error parsing storage messages:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      role: "user",
      message: inputMessage,
    };
    
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const user = await getCurrentUser();
      
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userId: user?.userId || "guest",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch chat response.");

      const data = await response.json();
      const updatedMessages = [...newMessages, { 
        role: data.role as "assistant",
        message: data.message || "(No response)" 
      }];
      
      setMessages(updatedMessages);
      // Update localStorage with new messages
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessages = [...newMessages, { 
        role: "assistant" as const,
        message: "Sorry, I encountered an error. Please try again." 
      }];
      setMessages(errorMessages);
      localStorage.setItem("chatMessages", JSON.stringify(errorMessages));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-500 p-4">
        <h1 className="text-white text-xl font-bold">MC3 Cyber Assistant</h1>
      </div>

      <div 
        ref={chatboxRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} message={msg.message} />
        ))}
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
