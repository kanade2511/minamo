export type Note = {
    id: string
    user_id: string
    theme_id: string | null
    content: string
    created_at: string
    updated_at: string
}

export type Insight = {
    id: string
    note_id: string
    user_id: string
    dialogue: DialogueMessage[]
    insight: string
    tags: string[]
    created_at: string
}

export type DialogueMessage = {
    role: 'assistant' | 'user'
    content: string
}

export type NoteAnalysis = {
    id: string
    note_id: string
    user_id: string
    emotions: { label: string; score: number }[]
    sentiment: 'positive' | 'neutral' | 'negative'
    keywords: string[]
    summary: string
    created_at: string
}

export type Summary = {
    id: string
    user_id: string
    week_start: string
    week_end: string
    content: string
    created_at: string
}
