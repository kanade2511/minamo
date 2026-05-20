'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
    const supabase = createClient()
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sessionReady, setSessionReady] = useState(false)

    // Check if user is authenticated (session should exist after code exchange)
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push('/login')
            } else {
                setSessionReady(true)
            }
        })
    }, [router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください')
            return
        }
        if (password !== confirmPassword) {
            setError('パスワードが一致しません')
            return
        }
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            router.push('/app')
            router.refresh()
        } catch (e: any) {
            setError(e.message ?? 'エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    if (!sessionReady) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-bg-primary'>
                <p className='text-sm text-text-secondary/40'>読み込み中...</p>
            </div>
        )
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-bg-primary'>
            <div className='w-full max-w-sm px-6'>
                <div className='mb-10'>
                    <h1 className='text-4xl font-extralight tracking-tight text-text-primary mb-2'>
                        Minamo
                    </h1>
                    <p className='text-text-secondary text-sm'>
                        自分を知る、毎日少しずつ。
                    </p>
                </div>

                <p className='text-xs text-text-secondary/50 tracking-wider mb-5'>
                    新しいパスワードを設定してください
                </p>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <input
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder='新しいパスワード'
                        required
                        autoFocus
                        className='w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors'
                    />
                    <input
                        type='password'
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder='新しいパスワード（確認）'
                        required
                        className='w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors'
                    />
                    {error && <p className='text-red-500 text-sm'>{error}</p>}
                    <button
                        type='submit'
                        disabled={loading || !password.trim()}
                        className='w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30 rounded-full'
                    >
                        {loading ? '変更中...' : 'パスワードを更新'}
                    </button>
                </form>
            </div>
        </div>
    )
}
