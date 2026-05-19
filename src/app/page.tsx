import { createClient } from "@/lib/supabase/server";
import { getDailyQuestion } from "@/lib/questions";
import EntryEditor from "@/components/EntryEditor";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get today's question
  const question = getDailyQuestion(user.id);

  // Check if user already has an entry for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayEntry } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <EntryEditor
      initialEntry={todayEntry}
      question={question}
      userId={user.id}
    />
  );
}
