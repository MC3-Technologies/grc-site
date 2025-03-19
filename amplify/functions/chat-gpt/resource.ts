import { defineFunction } from "@aws-amplify/backend";

export const chatGptFunction = defineFunction({
  name: "chat-gpt",
  entry: "./handler.ts",
  environment: {
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY || "",
  },
  timeoutSeconds: 30,
});
