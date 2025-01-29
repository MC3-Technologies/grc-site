const ChatMessage = (props: {
  message: string;
  role: "user" | "assistant" | "system" | "error";
}) => {
  const { message, role } = props;

  switch (role) {
    case "user":
      return (
        <div className="mb-1 text-right">
          <p className="bg-gray-200 text-gray-700 rounded-lg py-1 px-2 inline-block text-sm">
            {message}
          </p>
        </div>
      );
    case "assistant":
      return (
        <div className="mb-1">
          <p className=" bg-blue-500 text-white rounded-lg py-1 px-2 inline-block text-sm">
            {message}
          </p>
        </div>
      );
    case "error":
      return (
        <div className="mb-1">
          <p className=" bg-red-500 text-white rounded-lg py-1 px-2 inline-block text-sm">
            {`Error! ${message}`}
          </p>
        </div>
      );
    default:
      return;
  }
};

export default ChatMessage;
