import type { Insight } from '@/types/database'

export default function InsightCard({ insight }: { insight: Insight }) {
    return (
        <div className='border-l-2 border-accent/20 pl-4 py-3 my-4'>
            <p className='text-xs text-accent/50 mb-2 tracking-wide'>気づき</p>
            <p className='text-sm text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-3'>
                {insight.insight}
            </p>
            {insight.tags.length > 0 && (
                <div className='flex flex-wrap gap-1.5 mt-2'>
                    {insight.tags.map((tag, i) => (
                        <span
                            key={i}
                            className='text-[10px] px-2 py-0.5 bg-accent/10 text-accent/60'
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
