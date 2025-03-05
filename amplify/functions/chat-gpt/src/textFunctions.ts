import OpenAI from "openai";
import { env } from "$amplify/env/chat-gpt";

export interface ChatHistoryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const chatRequest = async (
  messages: ChatHistoryMessage[]
): Promise<ChatHistoryMessage[]> => {
  console.log(env.OPEN_AI_API_KEY);
  if (!env.OPEN_AI_API_KEY) {
    console.error("Missing OpenAI API Key!");
    throw new Error("Missing OpenAI API Key!");
  }
  const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-3.5-turbo",
    });

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
