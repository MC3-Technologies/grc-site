interface WhisperResponse { text: string }

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OPEN_AI_API_KEY;
  if (!apiKey) throw new Error("OPEN_AI_API_KEY not set");

  // Build multipart form using built-ins
  const fd = new FormData();
  // Append Blob + filename (FormData.append(name, blob, filename))
  fd.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "audio.webm");
  fd.append("model", "whisper-1");

  // Abort slightly before API GW timeout
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`OpenAI Whisper failed: ${await res.text()}`);
    const data = (await res.json()) as WhisperResponse;
    return data.text ?? "";
  } finally {
    clearTimeout(t);
  }
}