import fetch from "node-fetch";
import FormData from "form-data";

interface WhisperResponse {
  text: string;
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OPEN_AI_API_KEY;
  if (!apiKey) {
    throw new Error("OPEN_AI_API_KEY is not set");
  }
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "audio.webm",
    contentType: "audio/webm",
  });
  formData.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI Whisper request failed: ${errText}`);
  }

  // ✅ tell TS the expected type from res.json()
  const data = (await res.json()) as WhisperResponse;
  return data.text;
}