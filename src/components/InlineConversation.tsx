"use client";

import { useState, useEffect, useRef } from "react";

type Message = { role: "assistant" | "user"; content: string };

export default function InlineConversation({
  entryId,
  entryContent,
}: {
  entryId: string;
  entryContent: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [saved, setSaved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsStreaming(true);
      try {
        const res = await fetch("/api/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryContent, messages: [] }),
        });
        if (!res.ok) throw new Error("API error");
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
        setMessages([{ role: "assistant", content: text }]);
      } catch {
        setMessages([
          {
            role: "assistant",
            content: "すみません、何か問題が起きました。もう一度試してみてください。",
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    };
    init();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");
    try {
      const res = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryContent, messages: updatedMessages }),
      });
      if (!res.ok) throw new Error("API error");
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setStreamingText(text);
      }
      setMessages([...updatedMessages, { role: "assistant", content: text }]);
      setStreamingText("");
    } catch {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "すみません、何か問題が起きました。" },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSave = async () => {
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistantMsg) return;
    try {
      const { saveInsight } = await import("@/app/actions");
      await saveInsight(entryId, messages, lastAssistantMsg.content, []);
      setSaved(true);
    } catch (e) {
      console.error("Failed to save:", e);
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Messages */}
      <div className="max-h-[60vh] overflow-y-auto px-5 py-5 space-y-5 bg-bg-primary">
        {messages.length === 0 && isStreaming && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-xs text-text-secondary/30">Mirror が考えています…</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
            <div className="max-w-[80%]">
              <p className={`text-[10px] text-accent/50 mb-1 tracking-wider ${msg.role === "assistant" ? "text-left" : "text-right"}`}>
                {msg.role === "assistant" ? "Mirror" : "あなた"}
              </p>
              <div className={`rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "assistant"
                  ? "bg-white border border-border text-text-primary"
                  : "bg-accent/10 text-text-primary"
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && !streamingText && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <p className="text-[10px] text-accent/50 mb-1 tracking-wider">Mirror</p>
              <div className="rounded-lg px-4 py-3 bg-white border border-border">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {isStreaming && streamingText && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <p className="text-[10px] text-accent/50 mb-1 tracking-wider">Mirror</p>
              <div className="rounded-lg px-4 py-3 bg-white border border-border text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
                {streamingText}
                <span className="inline-block w-1.5 h-3.5 bg-accent/40 ml-0.5 animate-pulse align-text-bottom" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Save */}
      {messages.length > 0 && !saved && (
        <div className="px-5 py-3 border-t border-border bg-white flex items-center justify-between">
          <p className="text-xs text-text-secondary/40">対話を保存して振り返りに使う</p>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-accent text-white text-xs tracking-wider hover:opacity-90 transition-opacity rounded"
          >
            保存
          </button>
        </div>
      )}

      {saved && (
        <div className="px-5 py-3 border-t border-border bg-white">
          <p className="text-xs text-green-700/60">保存しました — タイムラインで確認できます</p>
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-border bg-white">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "考え中..." : "返信を入力…"}
            disabled={isStreaming}
            rows={2}
            className="flex-1 px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent/40 transition-colors disabled:opacity-30 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2.5 bg-accent text-white text-xs tracking-wider disabled:opacity-30 hover:opacity-90 transition-opacity rounded-lg"
          >
            送信
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-text-secondary/25 text-right">Cmd+Enter で送信</p>
      </div>
    </div>
  );
}
