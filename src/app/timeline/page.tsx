import { createClient } from "@/lib/supabase/server";
import TimelineList from "@/components/TimelineList";
import TimelineSearch from "./search";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { q } = await searchParams;

// Fetch entries with their theme info
  let query = supabase
    .from("entries")
    .select("*, themes(question)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Full-text search if query provided
  if (q && q.trim()) {
    query = query.textSearch("search_vector", q.trim(), {
      type: "websearch",
    });
  }

  const { data: entries } = await query.limit(100);

  const safeEntries = entries ?? [];

  // Fetch insights for all entries (batch)
  const entryIds: string[] = safeEntries.map((e: { id: string }) => e.id);
  const { data: rawInsights } = entryIds.length
    ? await supabase
        .from("insights")
        .select("*")
        .in("entry_id", entryIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Group insights by entry_id
  const insightsByEntry: Record<string, any[]> = {};
  for (const ins of rawInsights ?? []) {
    const eid = ins.entry_id;
    if (!insightsByEntry[eid]) insightsByEntry[eid] = [];
    insightsByEntry[eid].push(ins);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-light text-text-primary">タイムライン</h1>
        <a
          href="/api/export"
          className="text-xs text-text-secondary/40 hover:text-text-secondary transition-colors"
          download
        >
          データを書き出す
        </a>
      </div>

      <TimelineSearch initialQuery={q} />

      <div className="mt-8">
        <TimelineList
          entries={(entries ?? []) as any}
          insights={insightsByEntry as any}
        />
      </div>
    </div>
  );
}
