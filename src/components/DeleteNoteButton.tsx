'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteNote } from '@/app/actions'

export default function DeleteNoteButton({
    noteId,
    redirectTo,
}: {
    noteId: string
    redirectTo?: string
}) {
    const [confirming, setConfirming] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await deleteNote(noteId)
            if (redirectTo) {
                router.push(redirectTo)
            } else {
                router.refresh()
            }
        } catch (e) {
            console.error('Delete failed:', e)
        } finally {
            setDeleting(false)
        }
    }

    if (confirming) {
        return (
            <div className='flex items-center gap-2'>
                <span className='text-[10px] text-red-500/60'>削除しますか？</span>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className='text-[10px] text-red-500 hover:text-red-600 transition-colors disabled:opacity-30'
                >
                    {deleting ? '...' : '削除する'}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className='text-[10px] text-text-secondary/30 hover:text-text-secondary transition-colors'
                >
                    キャンセル
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className='text-[10px] text-text-secondary/30 hover:text-red-500/60 transition-colors'
        >
            削除
        </button>
    )
}
