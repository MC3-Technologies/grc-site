import { defineFunction } from "@aws-amplify/backend";
    
export const chatGptFunction = defineFunction({
  name: "chat-gpt",
  entry: "./handler.ts"
});