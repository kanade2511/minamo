import Link from "next/link";
import type { Entry, Insight } from "@/types/database";
import InsightCard from "./InsightCard";
import DeleteEntryButton from "./DeleteEntryButton";

type Props = {
  entries: Entry[];
  insights: Record<string, Insight[]>;
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
          <div key={entry.id} className="group">
            <Link href={`/timeline/${entry.id}`} className="block">
              <article>
                <time className="text-xs text-text-secondary/40 tracking-wide">
                  {dateStr} {timeStr}
                </time>
                <p className="mt-2 text-sm text-text-primary leading-relaxed whitespace-pre-wrap group-hover:text-text-secondary transition-colors">
                  {preview}
                </p>
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
            <div className="mt-1 flex justify-end">
              <DeleteEntryButton entryId={entry.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
