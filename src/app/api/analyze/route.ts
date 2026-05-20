import type { NextRequest } from 'next/server'
import { analyzeText } from '@/lib/analyze'

export async function POST(request: NextRequest) {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
        return new Response('Missing text', { status: 400 })
    }

    try {
        const data = await analyzeText(text)
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error('Analysis error:', err)
        return new Response(
            JSON.stringify({
                emotions: [],
                sentiment: 'neutral',
                keywords: [],
                summary: '分析できませんでした',
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        )
    }
}
