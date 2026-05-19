'use client'

import { useEffect, useRef, useState } from 'react'
import { createNote } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import NoteAnalysis from './NoteAnalysis'

type Props = {
    question: { id: string; question: string; category: string }
    userId: string
}

export default function NoteEditor({ question, userId }: Props) {
    const [content, setContent] = useState('')
    const [mode, setMode] = useState<'question' | 'free' | null>(null)
    const [savedNote, setSavedNote] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const _supabase = createClient()

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [])

    const handleSave = async () => {
        if (!content.trim()) return
        setIsSaving(true)
        try {
            const created = await createNote(content, mode === 'question' ? question.id : undefined)
            setSavedNote(created)
        } catch (e) {
            console.error('Save failed:', e)
        } finally {
            setIsSaving(false)
        }
    }

    const handleNewNote = () => {
        setContent('')
        setMode(null)
        setSavedNote(null)
    }

    const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    })

    // Mode selection
    if (!mode) {
        return (
            <div className='max-w-6xl mx-auto px-6 py-12'>
                <div className='max-w-lg mx-auto'>
                    <div className='mb-8'>
                        <h1 className='text-2xl font-light text-text-primary mb-2'>Minamo</h1>
                        <p className='text-text-secondary text-sm'>{today}</p>
                    </div>

                    <div className='space-y-3'>
                        <button
                            onClick={() => setMode('question')}
                            className='w-full text-left px-6 py-5 rounded-lg border border-border hover:border-accent/30 transition-colors bg-white'
                        >
                            <p className='text-sm text-accent mb-1'>今日の問いに答える</p>
                            <p className='text-xs text-text-secondary/50 leading-relaxed'>
                                {question.question}
                            </p>
                        </button>

                        <button
                            onClick={() => setMode('free')}
                            className='w-full text-left px-6 py-5 rounded-lg border border-border hover:border-accent/30 transition-colors bg-white'
                        >
                            <p className='text-sm text-text-primary mb-1'>自由に書く</p>
                            <p className='text-xs text-text-secondary/50'>
                                テーマなしで、今思うことをそのまま
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='max-w-6xl mx-auto px-6 py-12'>
            <div className='flex gap-8'>
                {/* Left: Editor */}
                <div className='flex-1 min-w-0'>
                    {/* Mode switch + date */}
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            {mode === 'question' ? (
                                <p className='text-xs text-text-secondary/50 mb-1'>今日の問い</p>
                            ) : (
                                <p className='text-xs text-text-secondary/50 mb-1'>自由記述</p>
                            )}
                            {mode === 'question' && (
                                <p className='text-sm text-text-primary font-light leading-relaxed'>
                                    {question.question}
                                </p>
                            )}
                        </div>
                        <time className='text-xs text-text-secondary/40'>{today}</time>
                    </div>

                    {/* Editor */}
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={
                            mode === 'free' ? '今、頭の中にあることをそのまま書いてみよう…' : ''
                        }
                        className='w-full min-h-[55vh] bg-transparent text-text-primary text-[1.05rem] leading-[1.9] resize-none focus:outline-none placeholder:text-text-secondary/30'
                        rows={14}
                    />

                    {/* Actions */}
                    <div className='mt-8 flex items-center gap-4'>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !content.trim()}
                            className='px-6 py-2.5 bg-[#17171c] text-white text-sm rounded-full disabled:opacity-30 hover:opacity-90 transition-opacity'
                        >
                            {isSaving ? '保存中...' : '保存'}
                        </button>

                        {savedNote && (
                            <button
                                onClick={handleNewNote}
                                className='px-6 py-2.5 border border-[#d9d9dd] text-[#75758a] text-sm rounded-full hover:border-[#17171c] hover:text-[#17171c] transition-colors'
                            >
                                新しいノートを書く
                            </button>
                        )}
                    </div>

                    {/* Status */}
                    {savedNote && <p className='mt-3 text-xs text-green-700/50'>保存しました</p>}

                    {/* After save hint */}
                    {savedNote && (
                        <div className='mt-6 p-4 rounded-lg border border-accent/20 bg-accent/5'>
                            <p className='text-xs text-text-secondary/60 leading-relaxed'>
                                保存したノートは <span className='text-accent'>「探る」</span>{' '}
                                タブからMirrorと対話できます
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Note Analysis */}
                <div className='w-80 flex-shrink-0 hidden lg:block'>
                    <div className='sticky top-20'>
                        <div className='rounded-lg border border-border p-4'>
                            <h2 className='text-[10px] text-text-secondary/40 tracking-wider mb-4'>
                                ノート分析
                            </h2>
                            <NoteAnalysis content={content} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
