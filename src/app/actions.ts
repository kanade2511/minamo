'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Notes ───────────────────────────────────────

export async function createNote(content: string, themeId?: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('notes')
        .insert({
            user_id: user.id,
            content,
            theme_id: themeId ?? null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/app')
    revalidatePath('/app/timeline')
    return data
}

export async function deleteNote(id: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/app')
    revalidatePath('/app/timeline')
    revalidatePath('/app/explore')
}

// ─── Insights ──────────────────────────────────────

export async function saveInsight(
    noteId: string,
    dialogue: { role: 'assistant' | 'user'; content: string }[],
    insight: string,
    tags?: string[],
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('insights')
        .insert({
            note_id: noteId,
            user_id: user.id,
            dialogue,
            insight,
            tags: tags ?? [],
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/app/timeline')
    return data
}
