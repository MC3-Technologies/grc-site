// const ChatMessage = (props: { message: string; role: "user" | "assistant" }) => {
//   const { message, role } = props;
//   return role === "assistant" ? (
//     <>
//       <div className="mb-1">
//         <p className=" bg-blue-500 text-white rounded-lg py-1 px-2 inline-block text-sm">
//           {message}
//         </p>
//       </div>
//     </>
//   ) : (
//     <>
//       <div className="mb-1 text-right">
//         <p className="bg-gray-200 text-gray-700 rounded-lg py-1 px-2 inline-block text-sm">
//           {message}
//         </p>
//       </div>
//     </>
//   );
// };

// export default ChatMessage;



interface ChatMessageProps {
  role: "user" | "assistant";
  message: string;
}

const ChatMessage = ({ role, message }: ChatMessageProps) => {
  const isUser = role === "user";
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white rounded-lg py-1 px-2 inline-block text-sm'
            : 'bg-gray-200 text-gray-700 rounded-lg py-1 px-2 inline-block text-sm'
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;