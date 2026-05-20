'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteUserData, sendVerifyOldEmail } from '@/app/actions'
import AvatarUpload from '@/components/AvatarUpload'
import ThemeColorPicker from '@/components/ThemeColorPicker'

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()

    // ─── User state ──────────────────────────────────
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // ─── Display name ────────────────────────────────
    const [displayName, setDisplayName] = useState('')
    const [savingName, setSavingName] = useState(false)
    const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

    // ─── Email ──────────────────────────────────────
    const [savingEmail, setSavingEmail] = useState(false)
    const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

    // ─── Password reset email ─────────────────────────
    const [sendingReset, setSendingReset] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [resetError, setResetError] = useState<string | null>(null)

    // ─── Cooldown (email send throttle) ───────────────
    const [sendCooldown, setSendCooldown] = useState(0)
    useEffect(() => {
        if (sendCooldown <= 0) return
        const id = setInterval(() => setSendCooldown(c => c - 1), 1000)
        return () => clearInterval(id)
    }, [sendCooldown])

    // ─── Weekly summary ──────────────────────────────
    const [weeklySummary, setWeeklySummary] = useState(true)
    const [togglingSummary, setTogglingSummary] = useState(false)

    // ─── Account deletion ────────────────────────────
    const [deleteReady, setDeleteReady] = useState(false) // step 1: click "削除する"
    const [confirmText, setConfirmText] = useState('') // step 2: type "削除"
    const [deleting, setDeleting] = useState(false)
    const [deleteMsg, setDeleteMsg] = useState<string | null>(null)

    // ─── Load user data ──────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)
            setDisplayName(user.user_metadata?.display_name ?? '')
            setWeeklySummary(user.user_metadata?.weekly_summary_enabled ?? true)
            setLoading(false)
        })
    }, [])

    // ─── Display name ────────────────────────────────
    const handleSaveName = async () => {
        setSavingName(true)
        setNameMsg(null)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: displayName },
            })
            if (error) throw error
            setNameMsg({ ok: true, text: '保存しました' })
            window.dispatchEvent(new CustomEvent('user-updated'))
        } catch (e: any) {
            setNameMsg({ ok: false, text: e.message ?? 'エラーが発生しました' })
        } finally {
            setSavingName(false)
        }
    }

    // ─── Email ──────────────────────────────────────
    const handleSaveEmail = async () => {
        setSavingEmail(true)
        setEmailMsg(null)
        try {
            await sendVerifyOldEmail(window.location.origin)
            setEmailMsg({
                ok: true,
                text: '確認メールを送信しました。現在のメールアドレスに届いたリンクをクリックして変更手続きを進めてください。',
            })
            setSendCooldown(60)
        } catch (e: any) {
            setEmailMsg({ ok: false, text: e.message ?? 'エラーが発生しました' })
        } finally {
            setSavingEmail(false)
        }
    }

    // ─── Password Reset Email ──────────────────────────

    const handleSendReset = async () => {
        setSendingReset(true)
        setResetError(null)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/app/update-password`,
            })
            if (error) throw error
            setResetSent(true)
            setSendCooldown(60)
        } catch (e: any) {
            setResetError(e.message ?? '送信に失敗しました')
        } finally {
            setSendingReset(false)
        }
    }

    // ─── Weekly summary toggle ───────────────────────
    const handleToggleSummary = async (enabled: boolean) => {
        setTogglingSummary(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { weekly_summary_enabled: enabled },
            })
            if (error) throw error
            setWeeklySummary(enabled)
        } catch (e: any) {
            console.error('Toggle failed:', e)
        } finally {
            setTogglingSummary(false)
        }
    }

    // ─── Account deletion ────────────────────────────
    const handleDelete = async () => {
        setDeleting(true)
        setDeleteMsg(null)
        try {
            await deleteUserData()
            router.push('/')
        } catch (e: any) {
            setDeleteMsg(e.message ?? 'エラーが発生しました')
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className='max-w-2xl mx-auto px-6 py-12'>
                <p className='text-sm text-text-secondary/40'>読み込み中...</p>
            </div>
        )
    }

    return (
        <div className='max-w-2xl mx-auto px-6 py-12'>
            <h1 className='text-lg font-light text-text-primary mb-2'>アカウント設定</h1>
            <p className='text-xs text-text-secondary/40 mb-8'>
                アカウント情報の確認と変更
            </p>

            {/* ─── Avatar / Theme Section ───────────── */}
            <div className='border border-border rounded-lg p-6 mb-6'>
                <AvatarUpload url={user?.user_metadata?.avatar_url} uid={user?.id} />
                <div className='mt-4 pt-4 border-t border-border'>
                    <ThemeColorPicker />
                </div>
            </div>

            {/* ─── プロフィール ──────────────────────── */}
            <div className='border border-border rounded-lg p-6 mb-6'>
                <h2 className='text-xs text-text-primary font-medium mb-4'>プロフィール</h2>

                {/* Display name */}
                <div className='mb-4'>
                    <label className='text-[10px] text-text-secondary/40 tracking-wider block mb-1.5'>
                        表示名
                    </label>
                    <div className='flex gap-2'>
                        <input
                            type='text'
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder='表示名を入力'
                            className='flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent/50 transition-colors'
                        />
                        <button
                            onClick={handleSaveName}
                            disabled={savingName}
                            className='px-4 py-2 bg-accent text-white text-xs rounded-full disabled:opacity-30 hover:opacity-90 transition-opacity whitespace-nowrap'
                        >
                            {savingName ? '保存中...' : '保存'}
                        </button>
                    </div>
                    {nameMsg && (
                        <p
                            className={`mt-1 text-[10px] ${nameMsg.ok ? 'text-green-700/60' : 'text-red-500/60'}`}
                        >
                            {nameMsg.text}
                        </p>
                    )}
                </div>

            {/* ─── メールアドレス ──────────────────── */}
                <div>
                    <label className='text-[10px] text-text-secondary/40 tracking-wider block mb-1.5'>
                        メールアドレス
                    </label>
                    <p className='text-sm text-text-primary mb-2'>{user?.email}</p>
                    <p className='text-[10px] text-text-secondary/40 mb-3'>
                        変更するには確認メールを送信します
                    </p>
                    {emailMsg && (
                        <p
                            className={`mb-2 text-[10px] ${emailMsg.ok ? 'text-green-700/60' : 'text-red-500/60'}`}
                        >
                            {emailMsg.text}
                        </p>
                    )}
                    <button
                        onClick={handleSaveEmail}
                        disabled={savingEmail || sendCooldown > 0}
                        className='px-4 py-2 bg-accent text-white text-xs rounded-full disabled:opacity-30 hover:opacity-90 transition-opacity'
                    >
                        {sendCooldown > 0
                            ? `${sendCooldown}秒後`
                            : savingEmail
                              ? '送信中...'
                              : 'メールアドレスを変更'}
                    </button>
                </div>
            </div>

            {/* ─── パスワード変更 ────────────────────── */}
            <div className='border border-border rounded-lg p-6 mb-6'>
                <h2 className='text-xs text-text-primary font-medium mb-4'>パスワード</h2>

                {!resetSent ? (
                    <div>
                        <p className='text-sm text-text-primary mb-1'>パスワードをリセット</p>
                        <p className='text-[10px] text-text-secondary/40 mb-3'>
                            リセット用のリンクをメールで送信します
                        </p>
                        {resetError && (
                            <p className='text-[10px] text-red-500/60 mb-2'>{resetError}</p>
                        )}
                        <button
                            onClick={handleSendReset}
                            disabled={sendingReset || sendCooldown > 0}
                            className='px-4 py-2 bg-accent text-white text-xs rounded-full disabled:opacity-30 hover:opacity-90 transition-opacity'
                        >
                            {sendCooldown > 0
                                ? `${sendCooldown}秒後`
                                : sendingReset
                                  ? '送信中...'
                                  : 'パスワードをリセット'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className='text-sm text-green-700/80 mb-1'>メールを送信しました</p>
                        <p className='text-[10px] text-text-secondary/40 leading-relaxed'>
                            メール内のリンクをクリックして、新しいパスワードを設定してください。
                        </p>
                    </div>
                )}
            </div>

            {/* ─── 設定 ────────────────────────────── */}
            <div className='border border-border rounded-lg p-6 mb-6'>
                <h2 className='text-xs text-text-primary font-medium mb-4'>設定</h2>

                <div className='flex items-center justify-between'>
                    <div>
                        <p className='text-sm text-text-primary'>週次サマリー</p>
                        <p className='text-[10px] text-text-secondary/40 mt-0.5'>
                            金曜日に今週のノートのサマリーを生成・表示します
                        </p>
                    </div>
                    <button
                        onClick={() => handleToggleSummary(!weeklySummary)}
                        disabled={togglingSummary}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                            togglingSummary
                                ? 'opacity-40'
                                : weeklySummary
                                  ? 'bg-accent'
                                  : 'bg-border-strong'
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                weeklySummary ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* ─── データ ──────────────────────────────── */}
            <div className='border border-border rounded-lg p-6 mb-6'>
                <h2 className='text-xs text-text-primary font-medium mb-4'>データ</h2>

                <div>
                    <p className='text-sm text-text-primary mb-2'>データを書き出す</p>
                    <p className='text-[10px] text-text-secondary/40 mb-3'>
                        ノートとインサイトの全データをJSON形式でダウンロードします
                    </p>
                    <a
                        href='/api/export'
                        download
                        className='inline-block px-4 py-2 bg-accent text-white text-xs rounded-full hover:opacity-90 transition-opacity'
                    >
                        ダウンロード
                    </a>
                </div>
            </div>

            {/* ─── アカウント削除 ──────────────────── */}
            <div className='border border-border rounded-lg p-6 border-red-500/20'>
                <h2 className='text-xs text-text-primary font-medium mb-4 text-red-500/80'>
                    アカウント削除
                </h2>

                {!deleteReady ? (
                    <div>
                        <p className='text-sm text-text-primary mb-1'>データを消去する</p>
                        <p className='text-[10px] text-text-secondary/40 mb-3'>
                            ノート・インサイト・分析データをすべて削除します。
                            <br />
                            アカウント（ログイン情報）は保持されます。
                        </p>
                        <button
                            onClick={() => setDeleteReady(true)}
                            className='px-4 py-2 bg-red-500/10 text-red-500 text-xs rounded-full hover:bg-red-500/20 transition-colors'
                        >
                            データを削除する
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className='text-xs text-red-500/80 mb-2'>
                            本当に削除しますか？確認のため「削除」と入力してください。
                        </p>
                        <input
                            type='text'
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            placeholder='削除'
                            className='w-full bg-transparent border border-red-500/30 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-red-500/50 transition-colors mb-3'
                        />
                        <div className='flex gap-2'>
                            <button
                                onClick={handleDelete}
                                disabled={deleting || confirmText !== '削除'}
                                className='px-4 py-2 bg-red-500 text-white text-xs rounded-full disabled:opacity-30 hover:opacity-90 transition-opacity'
                            >
                                {deleting ? '削除中...' : 'すべて削除する'}
                            </button>
                            <button
                                onClick={() => {
                                    setDeleteReady(false)
                                    setConfirmText('')
                                }}
                                disabled={deleting}
                                className='px-4 py-2 border border-border text-text-secondary text-xs rounded-full hover:text-text-primary transition-colors'
                            >
                                キャンセル
                            </button>
                        </div>
                        {deleteMsg && (
                            <p className='mt-2 text-[10px] text-red-500/60'>{deleteMsg}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
