import Link from "next/link";
import type { Entry, Insight } from "@/types/database";
import InsightCard from "./InsightCard";

type Props = {
  entries: (Entry & { themes: { question: string } | null })[];
  insights: Record<string, Insight[]>; // keyed by entry_id
};

export default function TimelineList({ entries, insights }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary/40 text-sm">
          まだエントリがありません。
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-accent underline underline-offset-2"
        >
          最初のエントリを書く
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {entries.map((entry) => {
        const entryInsights = insights[entry.id] ?? [];
        const date = new Date(entry.created_at);
        const dateStr = date.toLocaleDateString("ja-JP", {
          month: "long",
          day: "numeric",
          weekday: "short",
        });
        const timeStr = date.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const preview =
          entry.content.length > 120
            ? entry.content.slice(0, 120) + "..."
            : entry.content;

        return (
          <Link
            key={entry.id}
            href={`/timeline/${entry.id}`}
            className="block group"
          >
            <article>
              {/* Date */}
              <time className="text-xs text-text-secondary/40 tracking-wide">
                {dateStr} {timeStr}
              </time>

              {/* Question */}
              {entry.themes?.question && (
                <p className="text-xs text-text-secondary/50 mt-1 italic">
                  {entry.themes.question}
                </p>
              )}

              {/* Preview */}
              <p className="mt-2 text-sm text-text-primary leading-relaxed whitespace-pre-wrap group-hover:text-text-secondary transition-colors">
                {preview}
              </p>

              {/* Insights attached to this entry */}
              {entryInsights.length > 0 && (
                <div className="mt-2">
                  <InsightCard insight={entryInsights[0]} />
                  {entryInsights.length > 1 && (
                    <p className="text-xs text-text-secondary/30 mt-1">
                      +{entryInsights.length - 1} 件の気づき
                    </p>
                  )}
                </div>
              )}
            </article>
          </Link>
        );
      })}
    </div>
  );
}
