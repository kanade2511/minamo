"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Entries ───────────────────────────────────────

export async function createEntry(content: string, themeId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      content,
      theme_id: themeId ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/timeline");
  return data;
}

export async function updateEntry(id: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("entries")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/timeline");
  return data;
}

export async function deleteEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/timeline");
  revalidatePath("/app/explore");
}

// ─── Insights ──────────────────────────────────────

export async function saveInsight(
  entryId: string,
  dialogue: { role: "assistant" | "user"; content: string }[],
  insight: string,
  tags?: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("insights")
    .insert({
      entry_id: entryId,
      user_id: user.id,
      dialogue,
      insight,
      tags: tags ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/timeline");
  return data;
}
