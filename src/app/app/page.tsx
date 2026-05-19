import { redirect } from 'next/navigation'
import NoteEditor from '@/components/NoteEditor'
import { getDailyQuestion } from '@/lib/questions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AppHomePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const question = getDailyQuestion(user.id)

    return <NoteEditor question={question} userId={user.id} />
}
