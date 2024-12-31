const ChatMessage = (props: { message: string; role: "user" | "bot" }) => {
  const { message, role } = props;
  return role === "bot" ? (
    <>
      <div className="mb-1">
        <p className=" bg-blue-500 text-white rounded-lg py-1 px-2 inline-block text-sm">
          {message}
        </p>
      </div>
    </>
  ) : (
    <>
      <div className="mb-1 text-right">
        <p className="bg-gray-200 text-gray-700 rounded-lg py-1 px-2 inline-block text-sm">
          {message}
        </p>
      </div>
    </>
  );
};

export default ChatMessage;
