"use client";

import { useState, useRef, useEffect } from "react";
import { createEntry, updateEntry } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type { Entry, Theme } from "@/types/database";

type Props = {
  initialEntry: Entry | null;
  question: { id: string; question: string; category: string };
  userId: string;
};

export default function EntryEditor({ initialEntry, question, userId }: Props) {
  const [content, setContent] = useState(initialEntry?.content ?? "");
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [savedEntry, setSavedEntry] = useState<Entry | null>(initialEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      if (savedEntry) {
        const updated = await updateEntry(savedEntry.id, content);
        setSavedEntry(updated);
      } else {
        const created = await createEntry(
          content,
          isFreeMode ? undefined : question.id
        );
        setSavedEntry(created);
      }
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeepDive = () => {
    if (!savedEntry) {
      // Auto-save first
      handleSave();
    }
    setShowDeepDive(true);
  };

  const handleInsightAppended = (insightText: string) => {
    setContent((prev) => `${prev}\n\n---\n${insightText}`);
    setShowDeepDive(false);
  };

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Date */}
      <time className="text-xs text-text-secondary tracking-wide">{today}</time>

      {/* Question or free-mode toggle */}
      <div className="mt-6 mb-8">
        {isFreeMode ? (
          <p className="text-sm text-text-secondary/60 italic">
            自由に書く
            <button
              onClick={() => setIsFreeMode(false)}
              className="ml-3 text-xs underline underline-offset-2 hover:text-accent transition-colors"
            >
              今日の問いに戻る
            </button>
          </p>
        ) : (
          <>
            <p className="text-xs text-text-secondary/50 mb-1">今日の問い</p>
            <p className="text-lg text-text-primary font-light leading-relaxed">
              {question.question}
            </p>
            <button
              onClick={() => setIsFreeMode(true)}
              className="mt-1 text-xs text-text-secondary/60 underline underline-offset-2 hover:text-accent transition-colors"
            >
              自由に書く
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          isFreeMode
            ? "今、頭の中にあることをそのまま書いてみよう…"
            : ""
        }
        className="w-full min-h-[40vh] bg-transparent text-text-primary text-[1.05rem] leading-[1.9] resize-none focus:outline-none placeholder:text-text-secondary/30"
        rows={10}
      />

      {/* Actions */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !content.trim()}
          className="px-6 py-2.5 bg-accent text-white text-sm tracking-wide disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          {isSaving ? "保存中..." : "保存"}
        </button>

        <button
          onClick={handleDeepDive}
          disabled={!content.trim()}
          className="px-6 py-2.5 border border-border text-text-secondary text-sm tracking-wide disabled:opacity-30 hover:border-accent hover:text-accent transition-colors"
        >
          探る
        </button>
      </div>

      {/* Status */}
      {savedEntry && (
        <p className="mt-3 text-xs text-text-secondary/40">
          保存済み {new Date(savedEntry.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {/* Deep Dive Modal */}
      {showDeepDive && savedEntry && (
        <DeepDiveOverlay
          entryId={savedEntry.id}
          entryContent={content}
          onInsight={handleInsightAppended}
          onClose={() => setShowDeepDive(false)}
        />
      )}
    </div>
  );
}

// ─── Deep Dive Overlay ────────────────────────────

function DeepDiveOverlay({
  entryId,
  entryContent,
  onInsight,
  onClose,
}: {
  entryId: string;
  entryContent: string;
  onInsight: (text: string) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<
    { role: "assistant" | "user"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [phase, setPhase] = useState<
    "questioning" | "synthesizing" | "insight"
  >("questioning");
  const [streamingText, setStreamingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Initial LLM call on mount
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryContent,
          messages: [],
        }),
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

      setMessages([{ role: "assistant", content: text }]);
      setStreamingText("");
    } catch (e) {
      setMessages([{ role: "assistant", content: "すみません、何か問題が起きました。もう一度試してみてください。" }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg = { role: "user" as const, content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryContent,
          messages: updatedMessages,
        }),
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

      const newMessages = [
        ...updatedMessages,
        { role: "assistant" as const, content: text },
      ];
      setMessages(newMessages);
      setStreamingText("");

      // After ~3 exchanges (6 messages = 3 user + 3 assistant), check for insight
      if (newMessages.filter((m) => m.role === "assistant").length >= 3) {
        setPhase("synthesizing");
        // Final assistant message likely contains the insight
        if (text.includes("【対話の振り返り】") || text.includes("【あなた自身への問い】")) {
          setPhase("insight");
        }
      }
    } catch (e) {
      const errorMessages = [
        ...updatedMessages,
        { role: "assistant" as const, content: "すみません、何か問題が起きました。" },
      ];
      setMessages(errorMessages);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const appendInsight = async () => {
    // Get the last assistant message as insight
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") {
      onInsight(lastMsg.content);

      // Save insight to DB
      try {
        const { saveInsight } = await import("@/app/actions");
        await saveInsight(
          entryId,
          messages,
          lastMsg.content,
          []
        );
      } catch (e) {
        console.error("Failed to save insight:", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary/95 flex">
      {/* Left: entry reference */}
      <div className="hidden lg:flex w-1/3 p-8 border-r border-border overflow-y-auto">
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {entryContent}
        </div>
      </div>

      {/* Right: chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm text-text-primary font-light">
            深掘り対話
          </h2>
          <button
            onClick={onClose}
            className="text-xs text-text-secondary/50 hover:text-text-secondary transition-colors"
          >
            閉じる ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming */}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                {streamingText}
                <span className="inline-block w-1 h-4 bg-text-secondary/30 ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Insight action */}
        {phase === "insight" && (
          <div className="px-6 py-4 border-t border-border bg-bg-secondary">
            <p className="text-xs text-text-secondary/60 mb-3">
              深掘りが完了しました。この気づきをエントリに反映しますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={appendInsight}
                className="px-5 py-2 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity"
              >
                反映して閉じる
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 border border-border text-text-secondary text-sm tracking-wide hover:border-accent hover:text-accent transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        {phase !== "insight" && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isStreaming
                    ? "考え中..."
                    : "返信を入力..."
                }
                disabled={isStreaming}
                className="flex-1 px-0 py-2 bg-transparent border-b border-border text-text-primary text-sm placeholder:text-text-secondary/30 focus:outline-none focus:border-accent transition-colors disabled:opacity-30"
              />
              <button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim()}
                className="px-4 py-2 text-xs text-text-secondary tracking-wide disabled:opacity-30 hover:text-accent transition-colors"
              >
                送信
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
