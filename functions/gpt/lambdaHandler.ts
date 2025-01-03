import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { chatRequest } from "./src/textFunctions";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Parse for messages array
    const { messages } = JSON.parse(event.body || "{}");

    // Check if messages array exists and is valid
    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request. 'messages' should be an array.",
        }),
      };
    }

    // Call the chatRequest function with chat history
    const newMessages = await chatRequest(messages);

    // Response with completion
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        messages: newMessages,
        input: event,
      }),
    };

    return response;
  } catch (error) {
    console.error("Error handling event:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
