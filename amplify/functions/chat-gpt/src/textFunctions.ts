import OpenAI from "openai";
import { env } from "$amplify/env/chat-gpt1";

export interface ChatHistoryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const logNestedInfo = (obj: any, indent: number = 0): void => {
  const indentation = " ".repeat(indent);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        console.log(`${indentation}${key}: {`);
        logNestedInfo(value, indent + 2);
        console.log(`${indentation}}`);
      } else {
        console.log(`${indentation}${key}: ${value}`);
      }
    }
  }
};

export const chatRequest = async (
  messages: ChatHistoryMessage[]
): Promise<ChatHistoryMessage[]> => {
  if (!env.OPENAI_API_KEY) {
    console.error("Missing OpenAI API Key!");
    throw new Error("Missing OpenAI API Key!");
  }
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o-mini",
      store: true,
    });

    logNestedInfo(completion);

    if (
      !completion ||
      !completion.choices.length ||
      !completion.choices[0].message.content
    ) {
      throw new Error("Error: OpenAI completion is empty.");
    }

    // Create new assistant message
    const assistantMessage: ChatHistoryMessage = {
      role: "assistant",
      content: completion.choices[0].message.content,
    };

    // const fakeChatResponse: ChatHistoryMessage = {
    //   role: "assistant",
    //   content: "Hello there! 2+2=4!",
    // };
    return [...messages, assistantMessage];
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate chat completion.");
  }
};
