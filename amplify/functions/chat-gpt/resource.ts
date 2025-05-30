import { defineFunction } from "@aws-amplify/backend";

export const chatGptFunction = defineFunction({
  name: "chat-gpt",
  entry: "./handler.ts",
  resourceGroupName: "data",
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  },
  timeoutSeconds: 30,
});
