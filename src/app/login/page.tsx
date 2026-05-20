'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Step = 'email' | 'method' | 'password' | 'sent'

function LoginForm() {
    const searchParams = useSearchParams()
    const initialMode = searchParams.get('mode') === 'signup'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(initialMode)
    const [step, setStep] = useState<Step>('email')
    const [loading, setLoading] = useState(false)
    const [sendCooldown, setSendCooldown] = useState(0)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Cooldown countdown
    useEffect(() => {
        if (sendCooldown <= 0) return
        const id = setInterval(() => setSendCooldown(c => c - 1), 1000)
        return () => clearInterval(id)
    }, [sendCooldown])

    // ─── Mode tabs ─────────────────────────────────

    const setMode = (signup: boolean) => {
        setIsSignUp(signup)
        setStep('email')
        setPassword('')
        setConfirmPassword('')
        setError(null)
        setMessage(null)
    }

    // ─── Email → Next ─────────────────────────────

    const handleEmailNext = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return
        setError(null)
        setMessage(null)
        setStep(isSignUp ? 'password' : 'method')
    }

    // ─── Magic Link ────────────────────────────────

    const handleMagicLink = async () => {
        setError(null)
        setMessage(null)
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
            setStep('sent')
            setSendCooldown(60)
            setMessage('ログインリンクを送信しました。メールをご確認ください。')
        } catch (e: any) {
            setError(e.message ?? '送信に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    // ─── Password Login / Signup ───────────────────

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) return
        if (isSignUp && password !== confirmPassword) {
            setError('パスワードが一致しません')
            return
        }
        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください')
            return
        }
        setError(null)
        setMessage(null)
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (signUpError) throw signUpError
                if (data?.user?.identities?.length === 0) {
                    setMessage('このメールアドレスは既に登録されています。ログインしてください。')
                } else if (data?.session) {
                    router.push('/app')
                    router.refresh()
                } else {
                    setMessage(
                        '確認メールを送信しました。メール内のリンクをクリックしてからログインしてください。',
                    )
                    setSendCooldown(60)
                }
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (signInError) throw signInError
                router.push('/app')
                router.refresh()
            }
        } catch (e: any) {
            setError(e.message ?? 'エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    // ─── Navigation ────────────────────────────────

    const handleBack = () => {
        setStep('email')
        setPassword('')
        setConfirmPassword('')
        setError(null)
        setMessage(null)
    }

    // ─── Render helpers ────────────────────────────

    const ModeTabs = () => (
        <div className='flex rounded-lg border border-border p-0.5 mb-8'>
            <button
                type='button'
                onClick={() => setMode(false)}
                className={`flex-1 py-2 text-xs rounded-md transition-all ${
                    !isSignUp
                        ? 'bg-accent text-white'
                        : 'text-text-secondary/40 hover:text-text-secondary'
                }`}
            >
                ログイン
            </button>
            <button
                type='button'
                onClick={() => setMode(true)}
                className={`flex-1 py-2 text-xs rounded-md transition-all ${
                    isSignUp
                        ? 'bg-accent text-white'
                        : 'text-text-secondary/40 hover:text-text-secondary'
                }`}
            >
                新規登録
            </button>
        </div>
    )

    const EmailStep = () => (
        <>
            <ModeTabs />
            <form onSubmit={handleEmailNext} className='space-y-4'>
                <p className='text-xs text-text-secondary/50 tracking-wider'>
                    {isSignUp
                        ? 'メールアドレスを入力してください'
                        : 'メールアドレスを入力してください'}
                </p>
                <input
                    type='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='メールアドレス'
                    required
                    autoFocus
                    className='w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors'
                />
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                {message && <p className='text-green-700/80 text-sm'>{message}</p>}
                <button
                    type='submit'
                    className='w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity rounded-full'
                >
                    次へ
                </button>
            </form>
        </>
    )

    const MethodStep = () => (
        <>
            <ModeTabs />
            <p className='text-xs text-text-secondary/50 tracking-wider mb-1'>
                ログイン方法を選択
            </p>
            <p className='text-sm text-text-secondary/60 truncate mb-5'>{email}</p>
            <div className='space-y-3'>
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                {message && <p className='text-green-700/80 text-sm'>{message}</p>}
                <button
                    type='button'
                    onClick={handleMagicLink}
                    disabled={loading || sendCooldown > 0}
                    className='w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30 rounded-full'
                >
                    {sendCooldown > 0
                        ? `${sendCooldown}秒後に再送信可能`
                        : loading
                          ? '送信中...'
                          : 'ログインリンクを送信'}
                </button>
                <div className='relative'>
                    <div className='absolute inset-0 flex items-center'>
                        <div className='w-full border-t border-border' />
                    </div>
                    <div className='relative flex justify-center'>
                        <span className='bg-bg-primary px-3 text-[10px] text-text-secondary/30 tracking-wider'>
                            または
                        </span>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={() => setStep('password')}
                    className='w-full py-3 border border-border text-text-secondary text-sm tracking-wide hover:text-text-primary hover:border-text-primary/30 transition-all rounded-full'
                >
                    パスワードを入力
                </button>
                <button
                    type='button'
                    onClick={handleBack}
                    className='w-full text-center text-xs text-text-secondary/40 hover:text-text-secondary transition-colors'
                >
                    ← メールアドレスを変更
                </button>
            </div>
        </>
    )

    const PasswordStep = () => (
        <>
            <ModeTabs />
            <p className='text-xs text-text-secondary/50 tracking-wider mb-1'>
                {isSignUp ? 'パスワードを設定してください' : 'パスワードを入力してください'}
            </p>
            <p className='text-sm text-text-secondary/60 truncate mb-5'>{email}</p>
            <form onSubmit={handlePasswordSubmit} className='space-y-4'>
                <input
                    type='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder='パスワード'
                    required
                    autoFocus
                    className='w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors'
                />
                {isSignUp && (
                    <input
                        type='password'
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder='パスワード（確認）'
                        required
                        className='w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors'
                    />
                )}
                {error && <p className='text-red-500 text-sm'>{error}</p>}
                {message && <p className='text-green-700/80 text-sm'>{message}</p>}
                <button
                    type='submit'
                    disabled={loading || !password.trim() || sendCooldown > 0}
                    className='w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30 rounded-full'
                >
                    {sendCooldown > 0
                        ? `${sendCooldown}秒後に再送信可能`
                        : loading
                          ? '処理中...'
                          : isSignUp
                            ? 'アカウントを作成'
                            : 'ログイン'}
                </button>
                <button
                    type='button'
                    onClick={handleBack}
                    className='w-full text-center text-xs text-text-secondary/40 hover:text-text-secondary transition-colors'
                >
                    ← メールアドレスを変更
                </button>
            </form>
        </>
    )

    const SentStep = () => (
        <>
            <ModeTabs />
            <div className='text-center space-y-4'>
                <p className='text-sm text-text-secondary leading-relaxed'>
                    ログインリンクを
                    <br />
                    <span className='text-text-primary font-medium'>{email}</span>
                    <br />
                    に送信しました。
                </p>
                <p className='text-xs text-text-secondary/40 leading-relaxed'>
                    メール内のリンクをクリックしてログインしてください。
                    <br />
                    数分経っても届かない場合は迷惑メールフォルダをご確認ください。
                </p>
                <button
                    type='button'
                    onClick={handleBack}
                    className='text-xs text-accent underline underline-offset-2 hover:opacity-80 transition-opacity'
                >
                    別のメールアドレスで試す
                </button>
            </div>
        </>
    )

    // ─── Main render ──────────────────────────────

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

                {step === 'email' && <EmailStep />}
                {step === 'method' && !isSignUp && <MethodStep />}
                {step === 'password' && <PasswordStep />}
                {step === 'sent' && <SentStep />}
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
