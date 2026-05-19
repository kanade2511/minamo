import { createClient } from "@/lib/supabase/server";
import InsightCard from "@/components/InsightCard";
import DeleteEntryButton from "@/components/DeleteEntryButton";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  // Fetch entry with theme
  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  // Fetch associated insights
  const { data: insights } = await supabase
    .from("insights")
    .select("*")
    .eq("entry_id", id)
    .order("created_at", { ascending: true });

  const date = new Date(entry.created_at);
  const dateStr = date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const timeStr = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Back link */}
        <a
          href="/app/timeline"
          className="text-xs text-text-secondary/40 hover:text-text-secondary transition-colors"
        >
          ← タイムラインに戻る
        </a>

      {/* Date */}
      <time className="block mt-6 text-xs text-text-secondary/40 tracking-wide">
        {dateStr} {timeStr}
      </time>

      {/* Question is stored as theme_id — show if present */}

      {/* Content */}
      <div className="mt-6 text-text-primary text-[1.05rem] leading-[1.9] whitespace-pre-wrap">
        {entry.content}
      </div>

      {/* Delete */}
      <div className="mt-4 flex justify-end">
        <DeleteEntryButton entryId={entry.id} redirectTo="/app/timeline" />
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xs text-text-secondary/40 tracking-wide mb-4">
            深掘りで得た気づき
          </h2>
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight as any} />
            ))}
          </div>

          {/* Full dialogue (expandable) */}
          {insights.map(
            (insight) =>
              insight.dialogue &&
              Array.isArray(insight.dialogue) && (
                <details key={`dialogue-${insight.id}`} className="mt-6 group">
                  <summary className="text-xs text-text-secondary/30 cursor-pointer hover:text-text-secondary/60 transition-colors">
                    対話の全文を表示
                  </summary>
                  <div className="mt-4 space-y-4 text-sm text-text-secondary/70 leading-relaxed">
                    {(insight.dialogue as any[]).map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === "assistant"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <p
                          className={`max-w-[85%] whitespace-pre-wrap ${
                            msg.role === "assistant"
                              ? "text-text-primary"
                              : "text-text-secondary"
                          }`}
                        >
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )
          )}
        </div>
      )}
    </div>
  );
}
