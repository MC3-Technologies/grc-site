import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { transcribeAudio } from "./src/transcriptionFunction";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*", // adjust for your domain
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ error: "No audio data received" }),
      };
    }

    const audioBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body);

    const transcript = await transcribeAudio(audioBuffer);

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify({ transcript }),
    };
  } catch (err) {
    console.error("Transcription error:", err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};