'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklySummary } from '@/lib/llm/weekly-summary'
import { getCurrentWeekRange, isFridayOrLater } from '@/lib/week'

// ─── Generate Weekly Summary ─────────────────────

export async function generateWeeklySummaryForUser() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { weekStart, weekEnd } = getCurrentWeekRange()

    // Check if summary already exists for this week
    const { data: existing } = await supabase
        .from('summaries')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStart.toISOString().slice(0, 10))
        .maybeSingle()

    if (existing) {
        return { alreadyExists: true, id: existing.id }
    }

    // Fetch notes for this week
    const { data: notes } = await supabase
        .from('notes')
        .select('content, created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: true })

    if (!notes || notes.length === 0) {
        return { noNotes: true }
    }

    // Generate summary via LLM
    const notesContent = notes.map(n => n.content)
    const result = await generateWeeklySummary(notesContent)

    // Save to DB
    const { data, error } = await supabase
        .from('summaries')
        .insert({
            user_id: user.id,
            week_start: weekStart.toISOString().slice(0, 10),
            week_end: weekEnd.toISOString().slice(0, 10),
            content: result.content,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath('/app/insights')
    revalidatePath('/app')

    return { success: true, summary: data }
}

// ─── Check if summary should be shown ─────────────

export async function shouldShowWeeklySummary(): Promise<{
    show: boolean
    summary: any | null
}> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { show: false, summary: null }

    // Only show on Friday or later
    if (!isFridayOrLater()) {
        return { show: false, summary: null }
    }

    const { weekStart, weekEnd } = getCurrentWeekRange()
    const weekStartStr = weekStart.toISOString().slice(0, 10)

    // Check if this week's summary exists
    const { data: existing } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle()

    if (existing) {
        return { show: true, summary: existing }
    }

    // Check if user has any notes this week
    const { data: notes } = await supabase
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .limit(1)

    if (!notes || notes.length === 0) {
        return { show: false, summary: null }
    }

    // Summary exists to be generated
    return { show: true, summary: null }
}

// ─── Get all summaries for user ──────────────────

export async function getSummariesForUser() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })

    return data ?? []
}
