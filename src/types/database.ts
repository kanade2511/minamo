export type Theme = {
  id: string;
  question: string;
  category: string | null;
  created_at: string;
};

export type Entry = {
  id: string;
  user_id: string;
  theme_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Insight = {
  id: string;
  entry_id: string;
  user_id: string;
  dialogue: DialogueMessage[];
  insight: string;
  tags: string[];
  created_at: string;
};

export type DialogueMessage = {
  role: "assistant" | "user";
  content: string;
};

export type EntryWithTheme = Entry & {
  themes: Pick<Theme, "question"> | null;
};

export type InsightWithEntry = Insight & {
  entries: Pick<Entry, "content" | "created_at"> | null;
};
