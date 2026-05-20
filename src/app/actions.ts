'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { analyzeText } from '@/lib/analyze'

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

    // Auto-analyze and save result (non-blocking — don't fail on error)
    try {
        const analysis = await analyzeText(content)
        await supabase.from('note_analyses').insert({
            note_id: data.id,
            user_id: user.id,
            emotions: analysis.emotions,
            sentiment: analysis.sentiment,
            keywords: analysis.keywords,
            summary: analysis.summary,
        })
    } catch (e) {
        console.error('Auto-analysis failed:', e)
        // Note was saved successfully; analysis failure is non-critical
    }

    revalidatePath('/app')
    revalidatePath('/app/timeline')
    revalidatePath('/app/insights')
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
    revalidatePath('/app/insights')
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

// ─── Note Analyses ────────────────────────────────

export async function getAnalysisForNote(noteId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('note_analyses')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .maybeSingle()

    return data
}

export async function getAnalysisForUser(sinceDays: number = 30) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
        .from('note_analyses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })

    return data ?? []
}
