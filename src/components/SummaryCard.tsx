import type { Summary } from '@/types/database'

export default function SummaryCard({
    summary,
    isLatest,
}: {
    summary: Summary
    isLatest?: boolean
}) {
    const weekStart = new Date(summary.week_start)
    const weekEnd = new Date(summary.week_end)
    const dateLabel = `${weekStart.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })} 〜 ${weekEnd.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}`

    return (
        <div
            className={`rounded-xl border p-6 transition-all ${
                isLatest
                    ? 'border-accent/30 bg-accent/5 shadow-sm shadow-accent/5'
                    : 'border-border bg-bg-primary/50'
            }`}
        >
            <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                    {isLatest && (
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent/70 tracking-wider'>
                            NEW
                        </span>
                    )}
                    <span className='text-xs text-text-secondary/40 tracking-wide'>
                        {dateLabel}
                    </span>
                </div>
                <span className='text-[10px] text-text-secondary/25'>
                    {new Date(summary.created_at).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </div>
            <p className='text-sm text-text-secondary leading-relaxed whitespace-pre-wrap'>
                {summary.content}
            </p>
        </div>
    )
}
