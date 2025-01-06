import { defineFunction } from "@aws-amplify/backend";
    
export const osintFunction = defineFunction({
  name: "osint",
  entry: "./handler.ts"
});