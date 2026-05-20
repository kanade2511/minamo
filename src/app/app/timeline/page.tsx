import { redirect } from 'next/navigation'
import TimelineList from '@/components/TimelineList'
import { createClient } from '@/lib/supabase/server'
import TimelineSearch from './search'

export const dynamic = 'force-dynamic'

export default async function TimelinePage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { q } = await searchParams

    // Fetch notes with their theme info
    let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Full-text search if query provided
    if (q?.trim()) {
        query = query.textSearch('search_vector', q.trim(), {
            type: 'websearch',
        })
    }

    const { data: notes } = await query.limit(100)

    const safeNotes = notes ?? []

    // Fetch insights for all notes (batch)
    const noteIds: string[] = safeNotes.map((n: { id: string }) => n.id)
    const { data: rawInsights } = noteIds.length
        ? await supabase
              .from('insights')
              .select('*')
              .in('note_id', noteIds)
              .order('created_at', { ascending: true })
        : { data: [] }

    // Group insights by note_id
    const insightsByNote: Record<string, any[]> = {}
    for (const ins of rawInsights ?? []) {
        const nid = ins.note_id
        if (!insightsByNote[nid]) insightsByNote[nid] = []
        insightsByNote[nid].push(ins)
    }

    return (
        <div className='max-w-2xl mx-auto px-6 py-12'>
            <div className='flex items-center justify-between mb-8'>
                <h1 className='text-lg font-light text-text-primary'>タイムライン</h1>
            </div>

            <TimelineSearch initialQuery={q} />

            <div className='mt-8'>
                <TimelineList notes={(safeNotes ?? []) as any} insights={insightsByNote as any} />
            </div>
        </div>
    )
}
