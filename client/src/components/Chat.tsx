import { useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";
import { getClientSchema } from "../amplify/schema";
import { getCurrentUser, User, ListenData } from "../amplify/auth";
import { initFlowbite } from "flowbite";
import { Hub } from "aws-amplify/utils";
import { getAmplify } from "../amplify/amplify";
import Spinner from "./Spinner";

export interface ChatHistoryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [chatBoxOpen, setChatBoxOpen] = useState<boolean>(false);
  const [client] = useState(getClientSchema());
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEvents, setAuthEvents] = useState<ListenData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentMessage, setCurrentMessage] = useState<string>("");

  useEffect(() => {
    getAmplify();
    Hub.listen("auth", (data: ListenData) => {
      setAuthEvents(data);
    });

    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error checking user session:", error);
        setCurrentUser(null);
      }
    };

    checkUser();
    initFlowbite();
    setLoading(false);
  }, [authEvents]);

  useEffect(() => {
    const button = document.getElementById("check-out-ai");
    if (button) {
      button.onclick = () => {
        setChatBoxOpen(true);
      };
    }
  });

  const toggleChatBox = () => {
    setChatBoxOpen(!chatBoxOpen);
  };

  const handleCurrentMessageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentMessage(event.target.value);
  };

  const handleChatSubmit = async (): Promise<void> => {
    try {
      const currentMessages = messages;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: currentMessage },
      ]);

      const response = await client.queries.gptCompletion({
        messages: JSON.stringify([
          ...currentMessages,
          { role: "user", content: currentMessage },
        ]),
      });

      if (response.data) {
        const parsedMessages = JSON.parse(
          JSON.parse(response.data as string)
        ) as ChatHistoryMessage[];
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <>
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
      <div
        id="chat-container"
        className={`fixed bottom-16 right-4 sm:w-96 w-max z-50 ${
          chatBoxOpen ? `` : `hidden `
        }`}
      >
        <div className="bg-white shadow-md rounded-lg max-w-lg w-full">
          <div className="px-3 py-2 border-b bg-blue-500 text-white rounded-t-lg flex justify-between items-center">
            <p className="text-lg font-semibold">MC3 Cyber Assistant</p>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <div>
              <div id="chatbox" className="p-4 h-80 overflow-y-auto">
                {currentUser ? (
                  <>
                    <ChatMessage
                      role="assistant"
                      message="Hello! How can I assist you today?"
                    />
                    {messages.map((message, key) => (
                      <ChatMessage
                        key={key}
                        role={message.role}
                        message={message.content}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    <ChatMessage
                      role="assistant"
                      message="Please log in to use our MC3 chat bot!"
                    />
                  </>
                )}
              </div>

              <div className="p-4 border-t flex">
                <input
                  value={currentMessage}
                  onChange={handleCurrentMessageChange}
                  id="user-input"
                  type="text"
                  placeholder="Type a message"
                  className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {currentMessage.length > 0 && currentUser ? (
                  <>
                    <button
                      id="send-button"
                      className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300"
                      onClick={() => {
                        handleChatSubmit();
                      }}
                    >
                      Send
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      id="send-button"
                      className="bg-gray-500 text-white px-4 py-2 rounded-r-md hover:bg-gray-600 transition duration-300"
                    >
                      Send
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Chat;
