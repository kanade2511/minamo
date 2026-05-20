import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MoodTrendChart from './MoodTrendChart'

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

    return (
        <div className='max-w-2xl mx-auto px-6 py-12'>
            <div className='flex items-center justify-between mb-8'>
                <h1 className='text-lg font-light text-text-primary'>ムードトレンド</h1>
                <div className='flex gap-2'>
                    <a
                        href='/app/insights?range=week'
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                            range !== 'month'
                                ? 'bg-text-primary text-bg-primary'
                                : 'bg-border text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        週間
                    </a>
                    <a
                        href='/app/insights?range=month'
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                            range === 'month'
                                ? 'bg-text-primary text-bg-primary'
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
        </div>
    )
}
