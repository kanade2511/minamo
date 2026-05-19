import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExploreDetail from './ExploreDetail'

export const dynamic = 'force-dynamic'

export default async function ExploreNotePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { id } = await params

    const { data: note } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!note) notFound()

    return <ExploreDetail note={note} />
}
