import { chatRequest } from "./src/textFunctions";

import { ChatHistoryMessage } from "./src/textFunctions";
import { Schema } from "../../data/resource";

export const handler: Schema["gptCompletion"]["functionHandler"] = async (
  event
) => {
  try {
    const { message } = event.arguments;
    if (!message) {
      return new Error("Broken");
    }

    const t = await chatRequest(message as ChatHistoryMessage[]);
    return JSON.stringify(t);
  } catch (error) {
    return new Error("Broken");
  }
};
