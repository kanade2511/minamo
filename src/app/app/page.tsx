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

    // Fetch notes for the past 365 days for the writing calendar
    const calendarSince = new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: calendarNotes } = await supabase
        .from('notes')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', calendarSince)

    const notesByDate: Record<string, number> = {}
    if (calendarNotes) {
        for (const note of calendarNotes) {
            const dateKey = note.created_at.slice(0, 10)
            notesByDate[dateKey] = (notesByDate[dateKey] || 0) + 1
        }
    }

    return <NoteEditor question={question} userId={user.id} notesByDate={notesByDate} />
}
