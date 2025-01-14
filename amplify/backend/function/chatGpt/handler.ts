import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" }); // Adjust region as needed

interface Message {
  role: "user" | "bot";
  message: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Add CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    // Handle OPTIONS requests for CORS
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    const { messages } = JSON.parse(event.body || "{}");

    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: "Invalid request. 'messages' should be an array.",
        }),
      };
    }

    // Format messages for Claude
    const formattedMessages = messages
      .map((msg: Message) => {
        const role = msg.role === "user" ? "Human" : "Assistant";
        return `${role}: ${msg.message}`;
      })
      .join("\n\n");

    // Prepare the prompt
    const prompt = `\n\nHuman: You are a cybersecurity assistant for MC3 Technologies. You help users with cybersecurity related questions and provide guidance on best practices. Here is our conversation so far:\n\n${formattedMessages}\n\nAssistant:`;

    // Call Claude via Bedrock
    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-v2", // or anthropic.claude-3-sonnet-20240229-v1:0 for Claude 3
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          prompt,
          max_tokens_to_sample: 1000,
          temperature: 0.7,
          top_p: 0.9,
        }),
      })
    );

    // Parse the response
    const responseBody = new TextDecoder().decode(response.body);
    const { completion } = JSON.parse(responseBody);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: completion.trim(),
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
