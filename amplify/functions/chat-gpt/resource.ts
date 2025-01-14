import { defineFunction } from "@aws-amplify/backend";
// import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export const chatGptFunction = defineFunction({
  name: "chat-gpt",
  entry: "./handler.ts",
});

/**
 * This sets up an API gateway route: POST /chat -> chatGptFunction
 */
// export const chatGptApi = defineApiGateway({
//   name: "chatGptAPI",
//   routes: [
//     {
//       path: "/chat",
//       function: chatGptFunction
//     }
//   ]
// });