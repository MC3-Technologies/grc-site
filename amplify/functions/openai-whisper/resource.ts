import { defineFunction } from "@aws-amplify/backend";

export const audioTranscriber = defineFunction({
  name: "audio-transcriber",
  entry: "./handler.ts",
  resourceGroupName: "data",
  environment: {
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY || "",
  },
  timeoutSeconds: 30,
});