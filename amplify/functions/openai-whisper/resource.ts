import { defineFunction } from "@aws-amplify/backend";

export const audioTranscriber = defineFunction({
  entry: "./handler.ts",
  timeoutSeconds: 60,
  runtime: 20,        
  memoryMB: 1024,            
  environment: {
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY || "",
  },
});