import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { transcribeAudio } from "./src/transcriptionFunction";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",       // tighten to your domain in prod
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // CORS preflight
  if (event.requestContext.http.method === "OPTIONS") {
    return { statusCode: 204, headers: defaultHeaders, body: "" };
  }

  try {
    const ct = event.headers["content-type"] || event.headers["Content-Type"];
    if (ct !== "audio/webm") {
      return { statusCode: 415, headers: defaultHeaders, body: JSON.stringify({ error: "Unsupported type" }) };
    }
    if (!event.body || !event.isBase64Encoded) {
      return { statusCode: 400, headers: defaultHeaders, body: JSON.stringify({ error: "Expected base64 body" }) };
    }

    // Guard ≤10 MB (HTTP API payload limit path)
    const maxBytes = 10 * 1024 * 1024;
    if (Buffer.byteLength(event.body, "base64") > maxBytes) {
      return { statusCode: 413, headers: defaultHeaders, body: JSON.stringify({ error: "Payload too large" }) };
    }

    const audioBuffer = Buffer.from(event.body, "base64");
    const transcript = await transcribeAudio(audioBuffer);

    return { statusCode: 200, headers: defaultHeaders, body: JSON.stringify({ transcript }) };
  } catch (err) {
    console.error("Transcription error:", err);
    return { statusCode: 500, headers: defaultHeaders, body: JSON.stringify({ error: "Internal server error" }) };
  }
};