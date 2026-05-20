'use client'

import { useEffect, useRef, useState } from 'react'

type AnalysisResult = {
    emotions: { label: string; score: number }[]
    sentiment: 'positive' | 'neutral' | 'negative'
    keywords: string[]
    summary: string
}

export default function NoteAnalysis({
    content,
    savedResult,
}: {
    content?: string
    savedResult?: AnalysisResult | null
}) {
    const [result, setResult] = useState<AnalysisResult | null>(savedResult ?? null)
    const [loading, setLoading] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastAnalyzedRef = useRef('')

    // If savedResult is provided, use it directly (readonly mode)
    useEffect(() => {
        if (savedResult) {
            setResult(savedResult)
            setLoading(false)
            return
        }
    }, [savedResult])

    // Real-time analysis mode (used in editor)
    useEffect(() => {
        // If we have a saved result, skip real-time fetching
        if (savedResult) return
        if (!content || !content.trim()) {
            setResult(null)
            return
        }

        // Debounce: wait 1.5s after user stops typing
        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = setTimeout(async () => {
            // Skip if content hasn't changed
            if (content === lastAnalyzedRef.current) return
            lastAnalyzedRef.current = content

            setLoading(true)
            try {
                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: content }),
                })
                if (!res.ok) throw new Error('API error')
                const data: AnalysisResult = await res.json()
                setResult(data)
            } catch {
                // Silently fail — analysis is non-critical
            } finally {
                setLoading(false)
            }
        }, 1500)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [content, savedResult])

    const displayContent = content ?? ''

    if (!displayContent.trim() && !result) {
        return (
            <div className='text-center py-8'>
                <p className='text-xs text-text-secondary/30'>ノートを書くと分析が表示されます</p>
            </div>
        )
    }

    if (!result && loading) {
        return (
            <div className='text-center py-8'>
                <div className='flex justify-center gap-1'>
                    <span
                        className='w-1.5 h-1.5 rounded-full bg-accent/20 animate-bounce'
                        style={{ animationDelay: '0ms' }}
                    />
                    <span
                        className='w-1.5 h-1.5 rounded-full bg-accent/20 animate-bounce'
                        style={{ animationDelay: '150ms' }}
                    />
                    <span
                        className='w-1.5 h-1.5 rounded-full bg-accent/20 animate-bounce'
                        style={{ animationDelay: '300ms' }}
                    />
                </div>
            </div>
        )
    }

    if (!result) return null

    const sentimentColor =
        result.sentiment === 'positive'
            ? '#4a6fa5'
            : result.sentiment === 'negative'
              ? '#a85d5d'
              : '#78716c'

    const sentimentLabel =
        result.sentiment === 'positive'
            ? 'ポジティブ'
            : result.sentiment === 'negative'
              ? 'ネガティブ'
              : 'ニュートラル'

    return (
        <div className='space-y-5'>
            {/* Sentiment */}
            <div>
                <div className='flex items-center justify-between mb-1.5'>
                    <span className='text-[10px] text-text-secondary/40 tracking-wider'>
                        感情の傾向
                    </span>
                    <span
                        className='text-[10px] text-text-secondary/30'
                        style={{ color: sentimentColor }}
                    >
                        {sentimentLabel}
                    </span>
                </div>
            </div>

            {/* Emotion bars */}
            {result.emotions.length > 0 && (
                <div className='space-y-2'>
                    <p className='text-[10px] text-text-secondary/40 tracking-wider'>
                        検出された感情
                    </p>
                    {result.emotions
                        .filter(em => em.score > 0.05)
                        .sort((a, b) => b.score - a.score)
                        .map(em => (
                            <div key={em.label} className='flex items-center gap-2'>
                                <span className='text-[10px] text-text-secondary/50 w-8 text-right truncate'>
                                    {em.label}
                                </span>
                                <div className='flex-1 h-2 bg-border rounded-full overflow-hidden'>
                                    <div
                                        className='h-full rounded-full bg-accent transition-all duration-700'
                                        style={{ width: `${em.score * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Keywords */}
            {result.keywords.length > 0 && (
                <div>
                    <p className='text-[10px] text-text-secondary/40 tracking-wider mb-2'>
                        キーワード
                    </p>
                    <div className='flex flex-wrap gap-1.5'>
                        {result.keywords.map((kw, i) => (
                            <span
                                key={i}
                                className='text-[10px] px-2 py-0.5 bg-accent/10 text-accent/70 rounded-sm'
                            >
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary */}
            {result.summary && (
                <div className='pt-2 border-t border-border'>
                    <p className='text-[10px] text-text-secondary/40 tracking-wider mb-1'>要約</p>
                    <p className='text-xs text-text-secondary/60 leading-relaxed'>
                        {result.summary}
                    </p>
                </div>
            )}

            {/* Loading indicator */}
            {loading && (
                <div className='flex items-center gap-1.5 pt-1'>
                    <span className='w-1 h-1 rounded-full bg-accent/30 animate-pulse' />
                    <span
                        className='w-1 h-1 rounded-full bg-accent/30 animate-pulse'
                        style={{ animationDelay: '300ms' }}
                    />
                    <span
                        className='w-1 h-1 rounded-full bg-accent/30 animate-pulse'
                        style={{ animationDelay: '600ms' }}
                    />
                </div>
            )}
        </div>
    )
}
