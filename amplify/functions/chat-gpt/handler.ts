import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1" // or your selected region
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST"
    };
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }
    const { messages } = JSON.parse(event.body || "{}");
    if (!messages) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No messages key found."}) };
    }

    // Example: Prepare a prompt for Claude
    const userPrompt = messages.map((m:any) => m.message).join("\nUser: ");
    const promptString = `You are a cybersecurity AI assistant...\nUser: ${userPrompt}\nAssistant:`;

    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-v2", // or whichever model
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          prompt: promptString,
          max_tokens_to_sample: 1000,
          temperature: 0.7
        })
      })
    );

    // Decode JSON
    const data = JSON.parse(new TextDecoder().decode(response.body));
    const completion = data.completion || "(No response)";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: completion })
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: e instanceof Error ? e.message : String(e) })
    };
  }
};