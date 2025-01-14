import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage"; 
import { getCurrentUser } from "../amplify/auth";

interface Message {
  role: "user" | "assistant";
  message: string;
}

const Chat = () => {
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleChatBox = () => {
    setChatBoxOpen(!chatBoxOpen);
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  useEffect(() => {
    const button = document.getElementById("check-out-ai");
    if (button) {
      button.onclick = () => {
        setChatBoxOpen(true);
      };
    }
  }, []);
  
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      role: "user",
      message: inputMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      
      const user = await getCurrentUser();

      // API call to fetch assistant response
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          userId: user?.userId || "guest",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const newAssistantMessage: Message = {
        role: "assistant",
        message: data.message || "(No response)",
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: "Sorry, I encountered an error. Please try again." },
      ]);
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
    <>
      {/* Chat toggle button */}
            <div className="fixed bottom-0 right-0 mb-4 mr-4 z-50">
      <button
          onClick={() => {
            toggleChatBox();
          }}
          id="open-chat"
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 flex items-center"
        >
          {chatBoxOpen ? (
            <>
              <svg
                className="w-6 h-6 text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm7.707-3.707a1 1 0 0 0-1.414 1.414L10.586 12l-2.293 2.293a1 1 0 1 0 1.414 1.414L12 13.414l2.293 2.293a1 1 0 0 0 1.414-1.414L13.414 12l2.293-2.293a1 1 0 0 0-1.414-1.414L12 10.586 9.707 8.293Z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          ) : (
            <>
              <svg
                className="w-6 h-6text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.616l-2.88 2.592C8.537 20.461 7 19.776 7 18.477V17H5a2 2 0 0 1-2-2V6Zm4 2a1 1 0 0 0 0 2h5a1 1 0 1 0 0-2H7Zm8 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2Zm-8 3a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Zm5 0a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      </div>


      {/* Chatbox container */}
      {chatBoxOpen && (
        <div
          id="chat-container"
          className={`${
            isExpanded
              ? "fixed inset-0 w-full h-full"
              : "fixed bottom-16 right-4 sm:w-96 w-full h-[500px]"
          } bg-white shadow-md rounded-lg transition-all flex flex-col`}
          ref={chatboxRef}
        >
          {/* Chat header */}
          <div className="px-3 py-2 border-b bg-blue-500 text-white rounded-t-lg flex justify-between items-center">
            <p className="text-lg font-semibold">MC3 Cyber Assistant</p>
            <div className="flex space-x-2">
              <button
                onClick={toggleExpand}
                className="bg-white text-blue-500 px-2 py-1 rounded-md text-sm"
              >
                {isExpanded ? "Minimize" : "Maximize"}
              </button>
              <button
                onClick={toggleChatBox}
                className="bg-white text-red-500 px-2 py-1 rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>

          {/* Messages display */}
          <div id="chatbox" className="p-4 overflow-y-auto h-[calc(100%-120px)]">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} message={msg.message} />
            ))}
          </div>

          {/* Input box */}
          <div className="p-4 border-t flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
              className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300 disabled:bg-blue-300"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
