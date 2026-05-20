import type { SupabaseClient } from '@supabase/supabase-js'

type Question = {
    question: string
    category: string
}

/**
 * Returns today's question deterministically based on date + userId hash,
 * fetched from the Supabase themes table.
 */
export async function getDailyQuestion(
    userId: string,
    supabase: SupabaseClient,
): Promise<Question & { id: string }> {
    const { data: questions, error } = await supabase
        .from('themes')
        .select('id, question, category')

    if (error || !questions || questions.length === 0) {
        console.error('Failed to fetch questions from Supabase:', error?.message)
        // Fallback: return a hardcoded question if DB is empty
        return {
            id: 'fallback-0',
            question: '今日、どんなことに心が動いた？',
            category: 'daily',
        }
    }

    const today = new Date().toISOString().split('T')[0]
    const seed = hashCode(today + userId)
    const index = Math.abs(seed) % questions.length
    return questions[index]
}

function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash |= 0
    }
    return hash
}
