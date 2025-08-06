import Busboy from "busboy";
import { Readable } from "stream";
import FormData from "form-data";
import fetch from "node-fetch";


export const transcribeAudio = (
  bodyBuffer: Buffer,
  contentType: string,
  openAiKey: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: { "content-type": contentType } });

    const audioChunks: Buffer[] = [];

    // Extract file from multipart stream
    busboy.on("file", (_fieldname, file) => {
      file.on("data", (chunk) => {
        audioChunks.push(chunk); // collect each chunk of the stream
      });
    });

    // When upload stream is done, process the buffer
    busboy.on("finish", async () => {
      try {
        const audioBuffer = Buffer.concat(audioChunks); // reconstruct full file

        const form = new FormData();
        form.append("file", audioBuffer, {
          filename: "audio.webm",
          contentType: "audio/webm",
        });
        form.append("model", "whisper-1");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            ...form.getHeaders(),
          },
          body: form,
        });

        const data = (await response.json()) as { text: string };

        if (!response.ok) {
          console.error("OpenAI Whisper error:", data);
          return reject(new Error("Transcription failed"));
        }

        resolve(data.text);
      } catch (err) {
        reject(err);
      }
    });

    // Feed raw buffer into the parser as a readable stream
    Readable.from(bodyBuffer).pipe(busboy);
  });
};