// import OpenAI from "openai";

const apiKey = process.env.OPEN_AI_API_KEY;

export interface ChatHistoryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const chatRequest = async (
  messages: ChatHistoryMessage[],
): Promise<ChatHistoryMessage[]> => {
  // if (!apiKey) {
  //   throw new Error("Missing OpenAI API Key");
  // }
  // const openai = new OpenAI({ apiKey });

  try {
    // const completion = await openai.chat.completions.create({
    //   messages: messages,
    //   model: "gpt-3.5-turbo",
    // });

    // if (
    //   !completion ||
    //   !completion.choices.length ||
    //   !completion.choices[0].message.content
    // ) {
    //   throw new Error("Error: OpenAI completion is empty.");
    // }

    // Create new assistant message
    // const assistantMessage: ChatHistoryMessage = {
    //   role: "assistant",
    //   content: completion.choices[0].message.content,
    // };

    const fakeChatResponse: ChatHistoryMessage = {
      role: "assistant",
      content: "Hello there! 2+2=4!",
    };

    return [...messages, fakeChatResponse];
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate chat completion.");
  }
};
