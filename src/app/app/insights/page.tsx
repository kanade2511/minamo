import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MoodTrendChart from './MoodTrendChart'
import SummaryCard from '@/components/SummaryCard'
import { generateWeeklySummaryForUser, shouldShowWeeklySummary, getSummariesForUser } from '@/lib/summaries'

export const dynamic = 'force-dynamic'

export default async function InsightsPage({
    searchParams,
}: {
    searchParams: Promise<{ range?: string }>
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { range } = await searchParams
    const days = range === 'month' ? 30 : 7
    const label = range === 'month' ? '月間' : '週間'

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: analyses } = await supabase
        .from('note_analyses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: true })

    // ─── Weekly Summary ──────────────────────────
    // Check if we should show/generate a weekly summary
    const summaryCheck = await shouldShowWeeklySummary()
    let latestSummary = summaryCheck.summary

    // If summary should be shown but doesn't exist yet, generate it
    if (summaryCheck.show && !latestSummary) {
        try {
            const result = await generateWeeklySummaryForUser()
            if (result.success && result.summary) {
                latestSummary = result.summary
            }
        } catch (e) {
            console.error('Failed to generate weekly summary:', e)
        }
    }

    // Get all past summaries
    const pastSummaries = await getSummariesForUser()
    const olderSummaries = latestSummary
        ? pastSummaries.filter(s => s.id !== latestSummary.id)
        : pastSummaries

    return (
        <div className='max-w-2xl mx-auto px-6 py-12 space-y-12'>
            {/* ─── Mood Trend Section ─────────────── */}
            <section>
                <div className='flex items-center justify-between mb-8'>
                    <h1 className='text-lg font-light text-text-primary'>ムードトレンド</h1>
                    <div className='flex gap-2'>
                        <a
                            href='/app/insights?range=week'
                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                range !== 'month'
                                    ? 'bg-accent text-white'
                                    : 'bg-border text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            週間
                        </a>
                        <a
                            href='/app/insights?range=month'
                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                                range === 'month'
                                    ? 'bg-accent text-white'
                                    : 'bg-border text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            月間
                        </a>
                    </div>
                </div>

                {!analyses || analyses.length === 0 ? (
                    <div className='text-center py-20'>
                        <p className='text-text-secondary/40 text-sm'>
                            分析データがありません。ノートを保存すると自動で分析されます。
                        </p>
                    </div>
                ) : (
                    <MoodTrendChart analyses={analyses as any} days={days} label={label} />
                )}
            </section>

            {/* ─── Weekly Summaries Section ──────── */}
            <section>
                <h2 className='text-lg font-light text-text-primary mb-6'>週次サマリー</h2>

                {latestSummary ? (
                    <div className='space-y-6'>
                        <SummaryCard summary={latestSummary} isLatest />

                        {olderSummaries.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='text-xs text-text-secondary/40 tracking-wider pt-4'>
                                    過去のサマリー
                                </h3>
                                {olderSummaries.map(s => (
                                    <SummaryCard key={s.id} summary={s} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='text-center py-16 rounded-xl border border-border border-dashed'>
                        <p className='text-text-secondary/40 text-sm'>
                            金曜日以降に、その週のノートのサマリーが表示されます。
                        </p>
                        <p className='text-text-secondary/25 text-xs mt-2'>
                            毎週1件以上ノートを書くと自動で生成されます ✨
                        </p>
                    </div>
                )}
            </section>
        </div>
    )
}
