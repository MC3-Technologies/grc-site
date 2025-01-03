import OpenAI from "openai";

const apiKey = process.env.OPEN_AI_API_KEY;

interface ChatHistoryMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const chatRequest = async (
  messages: ChatHistoryMessage[]
): Promise<ChatHistoryMessage[]> => {
  const openai = new OpenAI({ apiKey: apiKey });
  try {
    // Get completion
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "replace-model-here",
    });

    // If completion or completion content doesn't exist, throw error
    if (!completion || !completion.choices[0].message.content) {
      throw new Error(
        "Error creating chat completion: completion doesn't exist."
      );
    }

    // Otherwise, create a new ChatHistoryMessage and push to overall history
    const assistantMessage: ChatHistoryMessage = {
      role: "assistant",
      content: completion.choices[0].message.content,
    };
    messages.push(assistantMessage);

    // Return all messages
    return messages;
  } catch (error) {
    console.error("Error creating chat completion:", error);
    throw new Error("Error creating chat completion:");
  }
};
