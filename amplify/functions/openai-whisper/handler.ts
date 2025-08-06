import { transcribeAudio } from "./src/transcriptionFunction";
import { APIGatewayProxyEvent } from "aws-lambda";

//import { env } from "$amplify/env/audio-transcriber";   REPLACE THE LINE BELOW AFTER AMPLIFY PUSH
const env = {
  OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY || "",
};

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body || !event.isBase64Encoded) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request: missing audio file" }),
      };
    }

    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.startsWith("multipart/form-data")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Expected multipart/form-data" }),
      };
    }

    // Decode the raw multipart body
    const bodyBuffer = Buffer.from(event.body, "base64");

    const transcript = await transcribeAudio(bodyBuffer, contentType, env.OPEN_AI_API_KEY);

    return {
      statusCode: 200,
      body: JSON.stringify({ transcript }),
    };
  } catch (error) {
    console.error("Transcription error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Transcription failed" }),
    };
  }
};