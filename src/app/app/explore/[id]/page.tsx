import { createClient } from "@/lib/supabase/server";
import ExploreDetail from "./ExploreDetail";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExploreEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  return <ExploreDetail entry={entry} />;
}
