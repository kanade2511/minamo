import { createClient } from "@/lib/supabase/server";
import { getDailyQuestion } from "@/lib/questions";
import EntryEditor from "@/components/EntryEditor";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const question = getDailyQuestion(user.id);

  return (
    <EntryEditor
      question={question}
      userId={user.id}
    />
  );
}
