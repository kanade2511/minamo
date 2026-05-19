import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOpenAIProvider } from "@/lib/llm/openai";
import { DEEP_DIVE_SYSTEM_PROMPT } from "@/lib/prompts/deep-dive";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { entryContent, messages } = await request.json();

  if (!entryContent) {
    return new Response("Missing entryContent", { status: 400 });
  }

  // Build message array
  const systemMsg = {
    role: "system" as const,
    content: DEEP_DIVE_SYSTEM_PROMPT,
  };

  const entryMsg = {
    role: "user" as const,
    content: `以下が私が書いたエントリです。\n\n${entryContent}`,
  };

  const history: { role: "user" | "assistant"; content: string }[] = (
    messages ?? []
  ).map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const allMessages = [systemMsg, entryMsg, ...history];

  // Determine if we should synthesize (after ~3 exchanges)
  const assistantCount = history.filter((m) => m.role === "assistant").length;
  if (assistantCount >= 3) {
    allMessages.push({
      role: "user",
      content:
        "ここまでの対話を踏まえて、【対話の振り返り】と【あなた自身への問い】の形式で洞察を提示してください。",
    });
  }

  const provider = createOpenAIProvider({
    apiKey: process.env.LLM_API_KEY!,
    baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
  });

  try {
    const stream = provider.chat(allMessages);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              "\n\nすみません、応答の生成中にエラーが発生しました。もう一度お試しください。"
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Failed to create LLM provider:", err);
    return new Response(
      "LLM APIの設定が正しくありません。環境変数を確認してください。",
      { status: 500 }
    );
  }
}
