'use client'

import Link from 'next/link'
import DeleteNoteButton from '@/components/DeleteNoteButton'
import InlineConversation from '@/components/InlineConversation'
import NoteAnalysis from '@/components/NoteAnalysis'
import type { Note } from '@/types/database'

export default function ExploreDetail({ note }: { note: Note }) {
    const date = new Date(note.created_at)
    const dateStr = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    })

    return (
        <div className='max-w-6xl mx-auto px-6 py-12'>
            <div className='flex gap-8'>
                {/* Left: Note */}
                <div className='flex-1 min-w-0'>
                    <Link
                        href='/app/explore'
                        className='text-xs text-text-secondary/40 hover:text-text-secondary transition-colors'
                    >
                        ← 探るに戻る
                    </Link>

                    <time className='block mt-4 text-xs text-text-secondary/30 tracking-wide'>
                        {dateStr}
                    </time>

                    <div className='mt-4 text-text-primary text-[1.05rem] leading-[1.9] whitespace-pre-wrap'>
                        {note.content}
                    </div>

                    <div className='mt-4 flex justify-end'>
                        <DeleteNoteButton noteId={note.id} redirectTo='/app/explore' />
                    </div>

                    {/* Analysis */}
                    <div className='mt-10 lg:hidden'>
                        <div className='rounded-lg border border-border p-4'>
                            <h2 className='text-[10px] text-text-secondary/40 tracking-wider mb-4'>
                                ノート分析
                            </h2>
                            <NoteAnalysis content={note.content} />
                        </div>
                    </div>
                </div>

                {/* Right: Chat */}
                <div className='w-[420px] flex-shrink-0 hidden lg:block'>
                    <div className='sticky top-20'>
                        <div className='flex items-center gap-2 mb-4'>
                            <div className='w-1.5 h-1.5 rounded-full bg-accent/40' />
                            <h2 className='text-xs text-text-secondary tracking-wider font-medium'>
                                Mirror との対話
                            </h2>
                        </div>
                        <InlineConversation noteId={note.id} noteContent={note.content} />
                    </div>
                </div>
            </div>

            {/* Mobile chat */}
            <div className='mt-8 lg:hidden'>
                <div className='flex items-center gap-2 mb-4'>
                    <div className='w-1.5 h-1.5 rounded-full bg-accent/40' />
                    <h2 className='text-xs text-text-secondary tracking-wider font-medium'>
                        Mirror との対話
                    </h2>
                </div>
                <InlineConversation noteId={note.id} noteContent={note.content} />
            </div>
        </div>
    )
}
