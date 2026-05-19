import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch all user data
  const [entriesRes, insightsRes] = await Promise.all([
    supabase
      .from("entries")
      .select("*, themes(question)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    entries: entriesRes.data ?? [],
    insights: insightsRes.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="minamo-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
