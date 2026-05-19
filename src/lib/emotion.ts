// Simple rule-based emotion analysis — no LLM involved

const emotionDict: Record<string, { emotion: string; score: number }> = {
  // 喜び / ポジティブ
  嬉しい: { emotion: "joy", score: 1 },
  嬉しかった: { emotion: "joy", score: 1 },
  嬉し: { emotion: "joy", score: 1 },
  楽しい: { emotion: "joy", score: 1 },
  楽し: { emotion: "joy", score: 1 },
  楽しかった: { emotion: "joy", score: 1 },
  幸せ: { emotion: "joy", score: 1 },
  最高: { emotion: "joy", score: 1 },
  喜び: { emotion: "joy", score: 1 },
  感謝: { emotion: "joy", score: 1 },
  笑顔: { emotion: "joy", score: 1 },
  ワクワク: { emotion: "joy", score: 1 },
  充実: { emotion: "joy", score: 1 },
  満足: { emotion: "joy", score: 1 },
  良かっ: { emotion: "joy", score: 0.5 },
  よかっ: { emotion: "joy", score: 0.5 },

  // 悲しみ / ネガティブ
  悲しい: { emotion: "sadness", score: -1 },
  悲し: { emotion: "sadness", score: -1 },
  悲しかった: { emotion: "sadness", score: -1 },
  寂しい: { emotion: "sadness", score: -1 },
  寂し: { emotion: "sadness", score: -1 },
  切ない: { emotion: "sadness", score: -1 },
  辛い: { emotion: "sadness", score: -1 },
  辛かっ: { emotion: "sadness", score: -1 },
  涙: { emotion: "sadness", score: -0.5 },
  泣き: { emotion: "sadness", score: -0.5 },
  泣い: { emotion: "sadness", score: -0.5 },
  哀しい: { emotion: "sadness", score: -1 },
  虚しい: { emotion: "sadness", score: -1 },

  // 怒り / ネガティブ
  怒り: { emotion: "anger", score: -1 },
  怒っ: { emotion: "anger", score: -1 },
  イライラ: { emotion: "anger", score: -0.5 },
  ムカつく: { emotion: "anger", score: -1 },
  腹が立つ: { emotion: "anger", score: -1 },
  不満: { emotion: "anger", score: -0.5 },

  // 不安 / ネガティブ
  不安: { emotion: "anxiety", score: -0.5 },
  心配: { emotion: "anxiety", score: -0.5 },
  怖い: { emotion: "anxiety", score: -0.5 },
  怖かっ: { emotion: "anxiety", score: -0.5 },
  緊張: { emotion: "anxiety", score: -0.5 },
  焦り: { emotion: "anxiety", score: -0.5 },
  焦っ: { emotion: "anxiety", score: -0.5 },
  迷い: { emotion: "anxiety", score: -0.5 },

  // 信頼 / 安心 / ポジティブ
  信頼: { emotion: "trust", score: 0.5 },
  安心: { emotion: "trust", score: 0.5 },
  大丈夫: { emotion: "trust", score: 0.5 },
  頼り: { emotion: "trust", score: 0.5 },

  // 驚き
  驚い: { emotion: "surprise", score: 0.5 },
  びっくり: { emotion: "surprise", score: 0.5 },
  意外: { emotion: "surprise", score: 0.5 },
};

const emotionLabels: Record<string, { label: string; color: string }> = {
  joy: { label: "喜び", color: "#4a6fa5" },
  sadness: { label: "悲しみ", color: "#78716c" },
  anger: { label: "怒り", color: "#a85d5d" },
  anxiety: { label: "不安", color: "#8a7c6b" },
  trust: { label: "安心", color: "#5a8a72" },
  surprise: { label: "驚き", color: "#7a6ba5" },
};

export type EmotionResult = {
  emotions: { key: string; label: string; count: number; color: string }[];
  sentiment: number; // -1 to 1
  keywords: { word: string; count: number }[];
};

export function analyzeText(text: string): EmotionResult {
  const counts: Record<string, number> = {};
  let totalScore = 0;

  // Count emotion words
  for (const [word, data] of Object.entries(emotionDict)) {
    if (text.includes(word)) {
      const count = (text.match(new RegExp(word, "g")) || []).length;
      counts[data.emotion] = (counts[data.emotion] || 0) + count;
      totalScore += data.score * count;
    }
  }

  // Build result
  const emotions = Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: emotionLabels[key]?.label ?? key,
      count,
      color: emotionLabels[key]?.color ?? "#999",
    }))
    .sort((a, b) => b.count - a.count);

  // Keywords (words that appear frequently, excluding common particles)
  const words = text
    .replace(/[、。！？「」\n\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const wordCounts: Record<string, number> = {};
  for (const w of words) {
    wordCounts[w] = (wordCounts[w] || 0) + 1;
  }
  const keywords = Object.entries(wordCounts)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  // Sentiment: -1 to 1
  const totalWords = text.replace(/[、。！？「」\n\s]/g, "").length;
  const sentiment =
    totalWords > 0
      ? Math.max(-1, Math.min(1, totalScore / Math.max(1, totalWords * 0.1)))
      : 0;

  return { emotions, sentiment, keywords };
}
