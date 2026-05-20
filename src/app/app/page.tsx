import { redirect } from 'next/navigation'
import Link from 'next/link'
import NoteEditor from '@/components/NoteEditor'
import { getDailyQuestion } from '@/lib/questions'
import { createClient } from '@/lib/supabase/server'
import { shouldShowWeeklySummary } from '@/lib/summaries'

export const dynamic = 'force-dynamic'

export default async function AppHomePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const question = await getDailyQuestion(user.id, supabase)

    // ─── Weekly summary check ─────────────────────
    const { show: hasSummary, summary } = await shouldShowWeeklySummary()

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

    return (
        <>
            {/* Weekly summary notification banner */}
            {hasSummary && summary && (
                <div className='max-w-2xl mx-auto px-6 pt-6'>
                    <Link
                        href='/app/insights'
                        className='block rounded-xl border border-accent/20 bg-accent/5 p-4 hover:bg-accent/10 transition-colors'
                    >
                        <div className='flex items-center gap-2 mb-1'>
                            <span className='text-xs text-accent/70 font-medium'>✨ 今週のサマリー</span>
                            <span className='text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent/60'>
                                NEW
                            </span>
                        </div>
                        <p className='text-sm text-text-secondary/70 line-clamp-2'>
                            {summary.content.length > 120
                                ? `${summary.content.slice(0, 120)}…`
                                : summary.content}
                        </p>
                        <p className='text-[10px] text-text-secondary/30 mt-1.5'>
                            タップして詳細を見る →
                        </p>
                    </Link>
                </div>
            )}

            <NoteEditor question={question} userId={user.id} notesByDate={notesByDate} />
        </>
    )
}
