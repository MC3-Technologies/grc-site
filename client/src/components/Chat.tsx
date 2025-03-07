import { useEffect, useState, useRef, KeyboardEvent } from "react";
import ChatMessage from "./ChatMessage";
import { getClientSchema } from "../amplify/schema";
import { getCurrentUser, User, ListenData } from "../amplify/auth";
import { initFlowbite } from "flowbite";
import { Hub } from "aws-amplify/utils";
import { getAmplify } from "../amplify/amplify";
import Spinner from "./Spinner";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearChatHistory,
} from "../utils/chatStorage";
import { ChatHistoryMessage } from "../types/Chat";

// Define the initial system message separately.
const initialSystemMessage: ChatHistoryMessage = {
  role: "system",
  content:
    "You are a Cybersecurity Maturity Model Certification (CMMC) Compliance Assistant. \
  Your role is to assist organizations in understanding and implementing CMMC requirements across Level 1, Level 2, and Level 3, ensuring compliance with Department of Defense (DoD) cybersecurity standards. \
  You provide guidance strictly based on official DoD sources, including: \
  - NIST SP 800-171 and 800-171A \
  - 32 CFR Part 170 (CMMC Final Rule) \
  - DFARS 252.204-7012, 7019, and 7020 \
  - CMMC Assessment and Scoping Guides for Levels 1, 2, and 3 \
  - DoDI 5200.48 (CUI guidance) \
  Your focus is on helping organizations prepare for *CMMC assessments* by explaining security controls, scoping considerations, assessment requirements, and compliance strategies. \
  You prioritize clear, actionable guidance tailored to small businesses and non-technical users. \
  You do provide assistance on general cybersecurity, IT support. \
  If a request does not pertain to *CMMC Level 1, Level 2,  Level 3, or cybersecurity related matters*, politely decline and redirect the user to official CMMC resources at https://dodcio.defense.gov/CMMC/. \
  Ensure responses are *clear, concise, and aligned with official DoD requirements*. \
  Make sure you responses are concise and users are able to understand the answer to their question with the least amount of reading. ",
};

const Chat = () => {
  // Chat overlay open state
  const [chatBoxOpen, setChatBoxOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Auth tracking state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEvents, setAuthEvents] = useState<ListenData | null>(null);

  // Chatting functions related state
  const [client] = useState(getClientSchema());
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([
    initialSystemMessage,
  ]);
  const [currentMessage, setCurrentMessage] = useState<string>("");

  // Chat handling related state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [responseLoading, setResponseLoading] = useState<boolean>(false);

  // Add ref for auto-scrolling
  const chatboxRef = useRef<HTMLDivElement | null>(null);

  // Load saved messages when user is authenticated
  useEffect(() => {
    if (currentUser) {
      const savedMessages = loadFromLocalStorage();
      if (savedMessages && savedMessages.length > 0) {
        // Always keep the initial system message at the top.
        setMessages([initialSystemMessage, ...savedMessages]);
      }
    }
  }, [currentUser]);

  // Save messages when they change and user is authenticated
  useEffect(() => {
    if (currentUser && messages.length > 1) {
      // Save all messages except the initial system message.
      const messagesToSave = messages.slice(1);
      saveToLocalStorage(messagesToSave);
    }
  }, [messages, currentUser]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for user and real time update
  useEffect(() => {
    getAmplify();
    const hubListener = Hub.listen("auth", (data: ListenData) => {
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

    return () => {
      // Stop listening for data memory leaks
      hubListener();
    };
  }, [authEvents]);

  // Add onclick listener to open chat button (if present elsewhere in the DOM)
  useEffect(() => {
    const button = document.getElementById("check-out-ai");
    if (button) {
      button.onclick = () => {
        setChatBoxOpen(true);
      };
    }
  }, []);

  // Determine if the trash (clear chat) button should be enabled.
  const isClearEnabled = messages.length > 1 || error;

  // Reinitialize Flowbite whenever clear functionality becomes enabled or messages change.
  useEffect(() => {
    if (isClearEnabled) {
      initFlowbite();
    }
  }, [isClearEnabled, messages]);

  // Handler to toggle chatbox open/close.
  const toggleChatBox = () => {
    setChatBoxOpen(!chatBoxOpen);
  };

  // Handler for clearing the chat history (triggered by the popover’s button).
  const handleClearChat = () => {
    if (responseLoading) return; // Prevent clearing while loading
    clearChatHistory();
    setMessages([initialSystemMessage]); // Reset to only the system message.
    setError(null);
    setCurrentMessage("");
  };

  // Handle input change.
  const handleCurrentMessageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentMessage(event.target.value);
  };

  // Handle the Enter key for message submission.
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      currentMessage.trim() &&
      !responseLoading
    ) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  // Handle chat submission.
  const handleChatSubmit = async (): Promise<void> => {
    // Don't submit if message is empty or already loading
    if (!currentMessage.trim() || responseLoading) return;
    // Error or not => set to null, if there is an error, it will be set again at end of function
    setError(null);
    // Set response loading to true, locking send message button
    setResponseLoading(true);

    // Add user message to messages array then set current message back to empty
    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentMessage.trim() },
    ]);
    setCurrentMessage("");

    // TEMPORARY -- COMMENT OUT FOR PRODUCTION
    // setTimeout(() => {
    //   setMessages((prev) => [
    //     ...prev,
    //     {
    //       role: "assistant",
    //       content:
    //         "Our chat bot is currently disabled! Please check back later.",
    //     },
    //   ]);
    //   setResponseLoading(false);
    // }, 500);

    try {
      // Request response from GPT completion function using previous currentMessages copy
      const response = await client.queries.gptCompletion({
        messages: JSON.stringify([
          ...messages,
          { role: "user", content: currentMessage },
        ]),
      });

      // If no response data, set error state
      if (
        !response.data ||
        Object.keys(JSON.parse(JSON.parse(response.data as string))).length ===
          0
      ) {
        console.error("Error fetching completion response.");
        setError("Error fetching response, please try again.");
        return;
      }

      // Otherwise double parse response for response messages array and set messages state
      const parsedMessages = JSON.parse(
        JSON.parse(response.data as string)
      ) as ChatHistoryMessage[];
      // console.info(parsedMessages);
      setMessages(parsedMessages);
    } catch (error) {
      console.error("Error fetching response:", error);
      // Set error and set response loading to false to unlock send message
      setError(`Error fetching response: ${error}`);
    } finally {
      // Set response loading to false to unlock send message
      setResponseLoading(false);
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <div className="fixed bottom-0 right-0 mb-4 mr-4 z-50">
        <button
          onClick={toggleChatBox}
          id="open-chat"
          className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition duration-300 flex items-center"
        >
          {chatBoxOpen ? (
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
          ) : (
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
                d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.616l-2.88 2.592C8.537 20.461 7 19.776 7 18.477V17H5a2 2 0 0 1-2-2V6Zm4 2a1 1 0 0 0 0 2h5a1 1 0 1 0 0-2H7Zm8 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2Zm-8 3a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Zm5 0a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Chat container */}
      <div
        id="chat-container"
        className={`fixed bottom-16 right-4 ${
          isExpanded
            ? "w-[95%] sm:w-[85%] md:w-[75%] lg:w-[65%] xl:w-[60%]"
            : "w-[calc(100%-2rem)] sm:w-96"
        } z-50 transition-all duration-300 ${chatBoxOpen ? "" : "hidden"}`}
      >
        <div
          className={`bg-gray-300 dark:bg-gray-800 rounded-lg shadow-2xl w-full ${
            isExpanded ? "max-w-none" : "max-w-lg"
          }`}
        >
          <div className="px-3 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-t-lg flex justify-between items-center">
            <p className="text-lg font-semibold inline-flex items-center">
              <svg
                className="w-6 h-6 mr-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              MC3 Cyber Assistant
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:text-gray-200 transition duration-300"
                title={isExpanded ? "Collapse Chat" : "Expand Chat"}
              >
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isExpanded ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9L4 4m0 0l5-5M4 4h16m-4 11l5 5m0 0l-5 5m5-5H4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  )}
                </svg>
              </button>
              {currentUser && (
                <button
                  type="button"
                  disabled={!isClearEnabled}
                  // Only attach the popover trigger when enabled.
                  {...(isClearEnabled
                    ? { "data-popover-target": "popover-default" }
                    : {})}
                  className={`text-white transition duration-300 ${
                    !isClearEnabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:text-gray-200"
                  }`}
                  title="Clear Chat History"
                >
                  <svg
                    className="w-5 h-5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={responseLoading ? "gray" : "currentColor"}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Conditionally render the popover only when the trash button is enabled */}
          {isClearEnabled && (
            <div
              data-popover
              id="popover-default"
              role="tooltip"
              className="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-xs opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
            >
              <div className="px-3 py-2 bg-primary-600 dark:bg-primary-700 text-white border-b border-primary-600 rounded-t-lg">
                <h3 className="font-semibold">Clear Chat History?</h3>
              </div>
              <div className="px-3 py-2">
                <p>
                  Are you sure you want to clear all chat messages? This cannot
                  be undone.
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    data-popover-dismiss
                    onClick={handleClearChat}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Yes, clear
                  </button>
                </div>
              </div>
              <div data-popper-arrow></div>
            </div>
          )}

          {loading ? (
            <Spinner />
          ) : (
            <div>
              <div
                ref={chatboxRef}
                id="chatbox"
                className={`p-4 overflow-y-auto ${
                  isExpanded ? "h-[70vh]" : "h-80"
                } transition-all duration-300`}
              >
                {currentUser ? (
                  <>
                    <ChatMessage
                      role="assistant"
                      message="Hello! How can I assist you today?"
                    />
                    {messages
                      .filter((message) => message.role !== "system")
                      .map((message, key) => (
                        <ChatMessage
                          key={key}
                          role={message.role}
                          message={message.content}
                        />
                      ))}

                    {responseLoading && (
                      <div className="flex justify-center py-2">
                        <div className="animate-pulse text-gray-400">
                          Thinking...
                        </div>
                      </div>
                    )}

                    {error && (
                      <div>
                        <ChatMessage role="error" message={error} />
                      </div>
                    )}
                  </>
                ) : (
                  <ChatMessage
                    role="assistant"
                    message="Please log in to use our MC3 chat bot!"
                  />
                )}
              </div>

              <div className="p-4 flex rounded-b-md">
                <input
                  value={currentMessage}
                  onChange={handleCurrentMessageChange}
                  onKeyDown={handleKeyDown}
                  disabled={responseLoading || !currentUser}
                  id="user-input"
                  type="text"
                  placeholder="Type a message"
                  className="w-full px-3 py-2 rounded-l-md focus:outline-none dark:bg-gray-700 dark:text-white"
                />
                {currentMessage.length > 0 &&
                currentUser &&
                !responseLoading ? (
                  <button
                    id="send-button"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md transition duration-300"
                    onClick={handleChatSubmit}
                  >
                    <svg
                      className="w-5 h-5 rotate-90"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2a1 1 0 0 1 .932.638l7 18a1 1 0 0 1-1.326 1.281L13 19.517V13a1 1 0 1 0-2 0v6.517l-5.606 2.402a1 1 0 0 1-1.326-1.281l7-18A1 1 0 0 1 12 2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    id="send-button"
                    className="bg-gray-600 dark:bg-gray-600 text-white px-4 py-2 rounded-r-md transition duration-300"
                    disabled={true}
                  >
                    <svg
                      className="w-5 h-5 rotate-90"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2a1 1 0 0 1 .932.638l7 18a1 1 0 0 1-1.326 1.281L13 19.517V13a1 1 0 1 0-2 0v6.517l-5.606 2.402a1 1 0 0 1-1.326-1.281l7-18A1 1 0 0 1 12 2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
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
