import { defineFunction } from "@aws-amplify/backend";

export const transcriptionFunction = defineFunction({
  entry: "./handler.ts",
  timeoutSeconds: 60,        
  memoryMB: 1024,            
  environment: {
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY || "",
  },
});