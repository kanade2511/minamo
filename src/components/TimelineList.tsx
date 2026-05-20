import Link from 'next/link'
import type { Insight, Note } from '@/types/database'
import DeleteNoteButton from './DeleteNoteButton'
import InsightCard from './InsightCard'

type Props = {
    notes: Note[]
    insights: Record<string, Insight[]>
}

export default function TimelineList({ notes, insights }: Props) {
    if (notes.length === 0) {
        return (
            <div className='text-center py-20'>
                <p className='text-text-secondary/40 text-sm'>まだノートがありません。</p>
                <Link
                    href='/app'
                    className='inline-block mt-4 text-sm text-accent underline underline-offset-2'
                >
                    最初のノートを書く
                </Link>
            </div>
        )
    }

    return (
        <div className='space-y-8'>
            {notes.map(note => {
                const noteInsights = insights[note.id] ?? []
                const date = new Date(note.created_at)
                const dateStr = date.toLocaleDateString('ja-JP', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                })
                const timeStr = date.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                })
                const preview =
                    note.content.length > 120 ? `${note.content.slice(0, 120)}...` : note.content

                return (
                    <div key={note.id} className='group'>
                        <Link href={`/app/timeline/${note.id}`} className='block'>
                            <article>
                                <time className='text-xs text-text-secondary/40 tracking-wide'>
                                    {dateStr} {timeStr}
                                </time>
                                <p className='mt-2 text-sm text-text-primary leading-relaxed whitespace-pre-wrap group-hover:text-text-secondary transition-colors'>
                                    {preview}
                                </p>
                                {noteInsights.length > 0 && (
                                    <div className='mt-2'>
                                        <InsightCard insight={noteInsights[0]} />
                                        {noteInsights.length > 1 && (
                                            <p className='text-xs text-text-secondary/30 mt-1'>
                                                +{noteInsights.length - 1} 件の気づき
                                            </p>
                                        )}
                                    </div>
                                )}
                            </article>
                        </Link>
                        <div className='mt-1 flex justify-end'>
                            <DeleteNoteButton noteId={note.id} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
