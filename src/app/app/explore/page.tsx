import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("entries")
    .select("id, content, created_at, theme_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-lg font-light text-text-primary mb-2">探る</h1>
      <p className="text-xs text-text-secondary/40 mb-8">
        エントリを選んで、Mirrorと対話しながら考えを深めよう
      </p>

      {(!entries || entries.length === 0) && (
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
      )}

      <div className="space-y-3">
        {(entries ?? []).map((entry) => {
          const date = new Date(entry.created_at);
          const dateStr = date.toLocaleDateString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
          });
          const preview =
            entry.content.length > 100
              ? entry.content.slice(0, 100) + "..."
              : entry.content;

          return (
            <Link
              key={entry.id}
              href={`/app/explore/${entry.id}`}
              className="block p-5 rounded-lg border border-border hover:border-accent/30 transition-colors bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <time className="text-[10px] text-text-secondary/30 tracking-wide">{dateStr}</time>
                  <p className="mt-1 text-sm text-text-primary leading-relaxed line-clamp-2">{preview}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs text-accent/60 whitespace-nowrap">探る →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
