import { chatRequest } from "./src/textFunctions";

import { ChatHistoryMessage } from "./src/textFunctions";
import { Schema } from "../../data/resource";

export const handler: Schema["gptCompletion"]["functionHandler"] = async (
  event,
) => {
  try {
    const { messages } = event.arguments;
    if (!messages) {
      return JSON.stringify(new Error("Messages not found"));
    }
    const messagesResponse = await chatRequest(
      messages as ChatHistoryMessage[],
    );
    return JSON.stringify(messagesResponse);
  } catch (error) {
    return JSON.stringify(new Error(`Internal function error ${error}`));
  }
};
