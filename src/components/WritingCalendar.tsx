'use client'

import { useMemo } from 'react'

type Props = {
    notesByDate: Record<string, number>
    compact?: boolean
}

export default function WritingCalendar({ notesByDate, compact }: Props) {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    const { cells, totalNotes, monthlyDays, streak } = useMemo(() => {
        // Last 14 days
        const DAYS = 14
        const cells: { date: string; label: string; count: number; isToday: boolean }[] = []

        for (let i = DAYS - 1; i >= 0; i--) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().slice(0, 10)

            const weekdays = ['日', '月', '火', '水', '木', '金', '土']
            const label =
                i === 0
                    ? '今日'
                    : i === 1
                      ? '昨日'
                      : weekdays[d.getDay()]

            cells.push({
                date: dateStr,
                label,
                count: notesByDate[dateStr] ?? 0,
                isToday: dateStr === todayStr,
            })
        }

        const totalNotes = Object.values(notesByDate).reduce((a, b) => a + b, 0)
        const thisMonth = today.getMonth()
        const thisYear = today.getFullYear()
        const monthlyDays = Object.entries(notesByDate).filter(([date]) => {
            const d = new Date(date)
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear
        }).length

        // Streak
        let streak = 0
        for (let i = 0; i < 365; i++) {
            const d = new Date(today)
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().slice(0, 10)
            if (notesByDate[dateStr] && notesByDate[dateStr] > 0) {
                streak++
            } else if (i > 0) {
                break
            }
        }

        return { cells, totalNotes, monthlyDays, streak }
    }, [notesByDate, today])

    const getColor = (count: number): string => {
        if (count === 0) return 'bg-transparent'
        if (count === 1) return 'bg-accent/20'
        if (count === 2) return 'bg-accent/50'
        return 'bg-accent'
    }

    const cellSize = compact ? 28 : 32

    return (
        <div>
            <div className='flex gap-1.5'>
                {cells.map(cell => (
                    <div key={cell.date} className='flex flex-col items-center gap-1'>
                        <span className='text-[10px] text-text-muted leading-none'>
                            {cell.label}
                        </span>
                        <div
                            className={`relative ${getColor(cell.count)} rounded-md ${cell.isToday ? 'ring-1 ring-accent ring-offset-[1px] ring-offset-bg-primary' : ''} ${cell.count > 0 ? 'group' : ''}`}
                            style={{ width: cellSize, height: cellSize }}
                        >
                            {cell.count > 0 && (
                                <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10'>
                                    <div className='bg-text-primary text-bg-primary text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-sm'>
                                        {cell.count}件
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!compact && (
                <div className='flex items-center gap-4 mt-3 pt-3 border-t border-border'>
                    <div className='flex items-center gap-4'>
                        <div>
                            <p className='text-xs font-medium text-text-primary'>{streak}日</p>
                            <p className='text-[10px] text-text-muted'>連続執筆中</p>
                        </div>
                        <div className='h-6 w-px bg-border' />
                        <div>
                            <p className='text-xs font-medium text-text-primary'>今月{monthlyDays}日</p>
                            <p className='text-[10px] text-text-muted'>執筆日数</p>
                        </div>
                        <div className='h-6 w-px bg-border' />
                        <div>
                            <p className='text-xs font-medium text-text-primary'>合計{totalNotes}ノート</p>
                            <p className='text-[10px] text-text-muted'>全期間</p>
                        </div>
                    </div>

                    {/* Color legend */}
                    <div className='flex items-center gap-1 ml-auto'>
                        <span className='text-[10px] text-text-muted'>少</span>
                        {[0, 1, 2, 3].map(level => (
                            <div
                                key={level}
                                className={`rounded-sm ${getColor(level)}`}
                                style={{ width: 10, height: 10 }}
                            />
                        ))}
                        <span className='text-[10px] text-text-muted ml-1'>多</span>
                    </div>
                </div>
            )}
        </div>
    )
}
