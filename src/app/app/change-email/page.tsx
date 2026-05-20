'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { submitNewEmail, confirmEmailChange } from '@/app/actions'

type Step = 'step1' | 'step2' | 'done' | 'error'

function ChangeEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const code = searchParams.get('code')

    const [step, setStep] = useState<Step>('step1')
    const [newEmail, setNewEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [oldEmail, setOldEmail] = useState('')

    useEffect(() => {
        if (code) {
            setStep('step2')
        } else if (!token) {
            setStep('error')
            setError('トークンが見つかりません')
        }
    }, [token, code])

    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) return
        setLoading(true)
        setError(null)
        try {
            await submitNewEmail(newEmail.trim(), token!, window.location.origin)
            setStep('done')
            setMessage(
                '確認メールを送信しました。新しいメールアドレスに届いたリンクをクリックして変更を完了してください。',
            )
        } catch (e: any) {
            setError(e.message ?? 'エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await confirmEmailChange(code!)
            setOldEmail(result.email ?? '')
            setStep('done')
            setMessage('メールアドレスを変更しました。')
        } catch (e: any) {
            setError(e.message ?? 'エラーが発生しました')
        } finally {
            setLoading(false)
        }
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

                {/* Step 1: Enter new email */}
                {step === 'step1' && token && (
                    <>
                        <p className='text-xs text-text-secondary/50 tracking-wider mb-5'>
                            新しいメールアドレスを入力してください
                        </p>
                        <form onSubmit={handleSubmitEmail} className='space-y-4'>
                            <input
                                type='email'
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder='新しいメールアドレス'
                                required
                                autoFocus
                                className='w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors'
                            />
                            {error && <p className='text-red-500 text-sm'>{error}</p>}
                            <button
                                type='submit'
                                disabled={loading || !newEmail.trim()}
                                className='w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30 rounded-full'
                            >
                                {loading ? '送信中...' : '確認メールを送信'}
                            </button>
                        </form>
                    </>
                )}

                {/* Step 2: Confirm email change */}
                {step === 'step2' && code && (
                    <div className='space-y-6'>
                        <p className='text-xs text-text-secondary/50 tracking-wider'>
                            以下のメールアドレスに変更しますか？
                        </p>
                        {error && <p className='text-red-500 text-sm'>{error}</p>}
                        <button
                            type='button'
                            onClick={handleConfirm}
                            disabled={loading}
                            className='w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30 rounded-full'
                        >
                            {loading ? '変更中...' : '変更する'}
                        </button>
                        <button
                            type='button'
                            onClick={() => router.push('/app/settings')}
                            className='w-full text-center text-xs text-text-secondary/40 hover:text-text-secondary transition-colors'
                        >
                            キャンセルして設定に戻る
                        </button>
                    </div>
                )}

                {/* Done / message */}
                {(step === 'done' || step === 'error') && (
                    <div className='text-center space-y-4'>
                        <p
                            className={`text-sm ${
                                step === 'done'
                                    ? 'text-green-700/80'
                                    : 'text-red-500/80'
                            }`}
                        >
                            {message || error}
                        </p>
                        <button
                            type='button'
                            onClick={() => router.push('/app/settings')}
                            className='text-xs text-accent underline underline-offset-2 hover:opacity-80 transition-opacity'
                        >
                            設定に戻る
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ChangeEmailPageWrapper() {
    return (
        <Suspense>
            <ChangeEmailPage />
        </Suspense>
    )
}
