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
