export interface LLMProvider {
  chat(
    messages: { role: "system" | "user" | "assistant"; content: string }[]
  ): AsyncGenerator<string>;
}

export type LLMConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};
