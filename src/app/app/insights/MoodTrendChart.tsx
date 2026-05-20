'use client'

import { useMemo, useState } from 'react'

type Analysis = {
    id: string
    note_id: string
    emotions: { label: string; score: number }[]
    sentiment: 'positive' | 'neutral' | 'negative'
    keywords: string[]
    summary: string
    created_at: string
}

type Props = {
    analyses: Analysis[]
    days: number
    label: string
}

type DayData = {
    date: string
    dateLabel: string
    notes: number
    avgScore: number
    emotions: { label: string; avgScore: number }[]
}

function computeMoodScore(emotions: { label: string; score: number }[]): number {
    const map: Record<string, number> = {}
    for (const em of emotions) {
        map[em.label] = em.score
    }
    const positive = (map['喜び'] ?? 0) + (map['安心'] ?? 0)
    const negative = (map['悲しみ'] ?? 0) + (map['怒り'] ?? 0) + (map['不安'] ?? 0)
    return (positive - negative) / 5 // normalize to [-1, 1]
}

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    })
}

function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function MoodTrendChart({ analyses, days }: Props) {
    const [expandedEmotion, setExpandedEmotion] = useState<string | null>(null)

    // Group analyses by day and compute daily averages
    const dailyData: DayData[] = useMemo(() => {
        const groups: Record<string, Analysis[]> = {}

        // Initialize all days in range
        const now = new Date()
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            groups[key] = []
        }

        // Fill in analyses
        for (const a of analyses) {
            const key = new Date(a.created_at).toISOString().slice(0, 10)
            if (groups[key]) {
                groups[key].push(a)
            }
        }

        // Compute averages
        const result: DayData[] = []
        for (const [date, items] of Object.entries(groups)) {
            if (items.length === 0) {
                result.push({
                    date,
                    dateLabel: formatShortDate(date),
                    notes: 0,
                    avgScore: 0,
                    emotions: [],
                })
                continue
            }

            const totalScore = items.reduce((sum, a) => sum + computeMoodScore(a.emotions), 0)
            const avgScore = totalScore / items.length

            // Average per emotion
            const emotionScores: Record<string, number[]> = {}
            for (const a of items) {
                for (const em of a.emotions) {
                    if (!emotionScores[em.label]) emotionScores[em.label] = []
                    emotionScores[em.label].push(em.score)
                }
            }
            const emotions = Object.entries(emotionScores).map(([label, scores]) => ({
                label,
                avgScore: scores.reduce((s, v) => s + v, 0) / scores.length,
            }))

            result.push({
                date,
                dateLabel: formatShortDate(date),
                notes: items.length,
                avgScore,
                emotions: emotions.sort((a, b) => b.avgScore - a.avgScore),
            })
        }

        return result
    }, [analyses, days])

    // Find max abs score for scaling
    const maxAbs = useMemo(() => {
        let m = 0.1
        for (const d of dailyData) {
            if (d.notes > 0 && Math.abs(d.avgScore) > m) m = Math.abs(d.avgScore)
        }
        return m
    }, [dailyData])

    // Summary stats
    const stats = useMemo(() => {
        const withData = dailyData.filter(d => d.notes > 0)
        if (withData.length === 0) return null
        const avg = withData.reduce((s, d) => s + d.avgScore, 0) / withData.length
        const positive = withData.filter(d => d.avgScore > 0.1).length
        const negative = withData.filter(d => d.avgScore < -0.1).length
        const neutral = withData.length - positive - negative
        return { avg, positive, negative, neutral, total: withData.length }
    }, [dailyData])

    const barColor = (score: number) => {
        if (score > 0.1) return 'bg-blue-400/80'
        if (score < -0.1) return 'bg-red-400/80'
        return 'bg-gray-400/60'
    }

    const barLabelColor = (score: number) => {
        if (score > 0.1) return 'text-blue-300'
        if (score < -0.1) return 'text-red-300'
        return 'text-gray-400'
    }

    if (dailyData.length === 0) {
        return (
            <div className='text-center py-20'>
                <p className='text-text-secondary/40 text-sm'>データがありません</p>
            </div>
        )
    }

    return (
        <div className='space-y-8'>
            {/* Summary */}
            {stats && (
                <div className='grid grid-cols-4 gap-3'>
                    <div className='rounded-lg border border-border p-3 text-center'>
                        <p className='text-[10px] text-text-secondary/40 tracking-wider'>平均ムード</p>
                        <p
                            className={`text-lg mt-1 ${
                                stats.avg > 0.1
                                    ? 'text-blue-400'
                                    : stats.avg < -0.1
                                      ? 'text-red-400'
                                      : 'text-gray-400'
                            }`}
                        >
                            {(stats.avg * 100).toFixed(0)}
                        </p>
                    </div>
                    <div className='rounded-lg border border-border p-3 text-center'>
                        <p className='text-[10px] text-text-secondary/40 tracking-wider'>ポジティブ</p>
                        <p className='text-lg mt-1 text-blue-400'>{stats.positive}</p>
                    </div>
                    <div className='rounded-lg border border-border p-3 text-center'>
                        <p className='text-[10px] text-text-secondary/40 tracking-wider'>ニュートラル</p>
                        <p className='text-lg mt-1 text-gray-400'>{stats.neutral}</p>
                    </div>
                    <div className='rounded-lg border border-border p-3 text-center'>
                        <p className='text-[10px] text-text-secondary/40 tracking-wider'>ネガティブ</p>
                        <p className='text-lg mt-1 text-red-400'>{stats.negative}</p>
                    </div>
                </div>
            )}

            {/* Bar chart */}
            <div className='rounded-lg border border-border p-5'>
                <h2 className='text-[10px] text-text-secondary/40 tracking-wider mb-5'>
                    日別ムードスコア
                </h2>

                <div className='space-y-2'>
                    {dailyData.map(day => {
                        const barWidth =
                            day.notes > 0
                                ? `${(Math.abs(day.avgScore) / maxAbs) * 100}%`
                                : '0%'
                        const isPositive = day.avgScore >= 0

                        return (
                            <div key={day.date} className='group'>
                                <div className='flex items-center gap-3'>
                                    {/* Date label */}
                                    <span className='w-14 text-[10px] text-text-secondary/40 shrink-0'>
                                        {day.dateLabel}
                                    </span>

                                    {/* Dot for days without data */}
                                    {day.notes === 0 ? (
                                        <div className='flex-1 flex items-center'>
                                            <div className='w-1.5 h-1.5 rounded-full bg-border' />
                                        </div>
                                    ) : (
                                        <div className='flex-1 flex items-center gap-1'>
                                            {/* Negative side */}

                                            <div className='flex-1 h-5 flex items-center justify-end'>
                                                {!isPositive && (
                                                    <div
                                                        className={`h-3 rounded-sm ${barColor(day.avgScore)} transition-all duration-500`}
                                                        style={{ width: barWidth }}
                                                    />
                                                )}
                                            </div>

                                            {/* Center line */}
                                            <div className='w-px h-6 bg-border shrink-0' />

                                            {/* Positive side */}
                                            <div className='flex-1 h-5 flex items-center'>
                                                {isPositive && (
                                                    <div
                                                        className={`h-3 rounded-sm ${barColor(day.avgScore)} transition-all duration-500`}
                                                        style={{ width: barWidth }}
                                                    />
                                                )}
                                            </div>

                                            {/* Score */}
                                            <span
                                                className={`w-8 text-[10px] text-right shrink-0 ${barLabelColor(day.avgScore)}`}
                                            >
                                                {(day.avgScore * 100).toFixed(0)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Notes count */}
                                    {day.notes > 0 && (
                                        <span className='text-[9px] text-text-secondary/25 w-4 text-right'>
                                            {day.notes}
                                        </span>
                                    )}
                                </div>

                                {/* Expanded emotion breakdown (on click) */}
                                {expandedEmotion === day.date && day.emotions.length > 0 && (
                                    <div className='ml-[4.5rem] mt-2 mb-3 p-3 rounded bg-border/40 space-y-1.5'>
                                        {day.emotions.map(em => (
                                            <div key={em.label} className='flex items-center gap-2'>
                                                <span className='text-[10px] text-text-secondary/50 w-8 text-right'>
                                                    {em.label}
                                                </span>
                                                <div className='flex-1 h-1.5 bg-border rounded-full overflow-hidden'>
                                                    <div
                                                        className='h-full rounded-full bg-accent/60'
                                                        style={{ width: `${em.avgScore * 100}%` }}
                                                    />
                                                </div>
                                                <span className='text-[9px] text-text-secondary/30 w-8 text-right'>
                                                    {(em.avgScore * 100).toFixed(0)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className='mt-6 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-1.5'>
                            <div className='w-2 h-2 rounded-sm bg-blue-400/80' />
                            <span className='text-[9px] text-text-secondary/30'>ポジティブ</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                            <div className='w-2 h-2 rounded-sm bg-gray-400/60' />
                            <span className='text-[9px] text-text-secondary/30'>ニュートラル</span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                            <div className='w-2 h-2 rounded-sm bg-red-400/80' />
                            <span className='text-[9px] text-text-secondary/30'>ネガティブ</span>
                        </div>
                    </div>
                    <span className='text-[9px] text-text-secondary/25'>棒をタップで詳細</span>
                </div>
            </div>

            {/* Emotion trend (detailed breakdown per emotion type) */}
            <div className='rounded-lg border border-border p-5'>
                <h2 className='text-[10px] text-text-secondary/40 tracking-wider mb-5'>
                    感情ごとの推移
                </h2>

                {['喜び', '悲しみ', '怒り', '不安', '安心', '驚き'].map(emotionLabel => {
                    const values = dailyData
                        .filter(d => d.notes > 0)
                        .map(d => {
                            const found = d.emotions.find(e => e.label === emotionLabel)
                            return { date: d.dateLabel, score: found?.avgScore ?? 0 }
                        })

                    if (values.length === 0) return null

                    const maxVal = Math.max(...values.map(v => v.score), 0.1)

                    return (
                        <div key={emotionLabel} className='mb-4 last:mb-0'>
                            <div className='flex items-center justify-between mb-1.5'>
                                <span className='text-[10px] text-text-secondary/50'>
                                    {emotionLabel}
                                </span>
                                <span className='text-[9px] text-text-secondary/30'>
                                    最大{(maxVal * 100).toFixed(0)}
                                </span>
                            </div>
                            <div className='flex items-end gap-0.5 h-12'>
                                {values.map((v, i) => {
                                    const height = `${(v.score / maxVal) * 100}%`
                                    const isToday =
                                        i === values.length - 1
                                    return (
                                        <div
                                            key={i}
                                            className='flex-1 flex flex-col items-center justify-end'
                                            title={`${v.date}: ${(v.score * 100).toFixed(0)}`}
                                        >
                                            <div
                                                className={`w-full rounded-t-sm transition-all duration-500 ${
                                                    isToday ? 'bg-accent/80' : 'bg-accent/30'
                                                }`}
                                                style={{ height }}
                                            />
                                            {values.length <= 7 && (
                                                <span className='text-[7px] text-text-secondary/20 mt-0.5'>
                                                    {v.date.slice(3)}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
