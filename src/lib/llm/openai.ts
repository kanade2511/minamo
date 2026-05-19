import OpenAI from "openai";
import { LLMProvider, LLMConfig } from "./types";

export function createOpenAIProvider(config: LLMConfig): LLMProvider {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  return {
    async *chat(messages) {
      const stream = await client.chat.completions.create({
        model: config.model,
        messages,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    },
  };
}
