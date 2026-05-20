'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NavBar() {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const [email, setEmail] = useState<string | null>(null)
    const [displayName, setDisplayName] = useState<string | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const overlayRef = useRef<HTMLDivElement>(null)

    const isPublicPage = pathname === '/login' || pathname.startsWith('/auth') || pathname === '/'

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email ?? null)
                setDisplayName(user.user_metadata?.display_name ?? null)
                setAvatarUrl(user.user_metadata?.avatar_url ?? null)
            }
        }
        getUser()
    }, [supabase.auth.getUser])

    // Listen for auth state changes (avatar upload, theme change, etc.)
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setEmail(session.user.email ?? null)
                setDisplayName(session.user.user_metadata?.display_name ?? null)
                setAvatarUrl(session.user.user_metadata?.avatar_url ?? null)
            }
        })
        return () => subscription.unsubscribe()
    }, [supabase])

    // Re-fetch user data when settings save (custom event from settings page)
    useEffect(() => {
        const handler = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setDisplayName(user.user_metadata?.display_name ?? null)
                setAvatarUrl(user.user_metadata?.avatar_url ?? null)
            }
        }
        window.addEventListener('user-updated', handler)
        return () => window.removeEventListener('user-updated', handler)
    }, [supabase])

    // Close menu on navigation
    useEffect(() => {
        setMenuOpen(false)
    }, [pathname])

    // Close menu on Escape
    useEffect(() => {
        if (!menuOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [menuOpen])

    // Lock body scroll when menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [menuOpen])

    const handleLogout = async () => {
        setMenuOpen(false)
        await supabase.auth.signOut()
        router.push('/')
    }

    if (isPublicPage) return null

    const navLinks = [
        { href: '/app', label: '書く' },
        { href: '/app/insights', label: 'インサイト' },
        { href: '/app/explore', label: '探る' },
        { href: '/app/timeline', label: 'タイムライン' },
    ]

    const isActive = (href: string) => {
        if (href === '/app') return pathname === '/app'
        return pathname.startsWith(href)
    }

    const linkClass = (active: boolean) =>
        `text-sm transition-colors ${
            active ? 'text-accent font-medium' : 'text-text-secondary hover:text-text-primary'
        }`

    const menuLinkClass = (active: boolean) =>
        `block w-full py-4 text-xl tracking-tight text-center transition-colors ${
            active ? 'text-accent font-medium' : 'text-text-secondary hover:text-text-primary'
        }`

    return (
        <>
            <header className='sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-sm border-b border-border'>
                <div className='max-w-6xl mx-auto px-6 h-14 flex items-center justify-between'>
                    <Link href='/app' className='text-base tracking-tight font-semibold'>
                        Minamo
                    </Link>

                    {/* Desktop nav */}
                    <nav className='hidden md:flex items-center gap-8'>
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={linkClass(isActive(link.href))}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className='h-4 w-px bg-border' />
                        {email && (
                            <div className='relative group'>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt=''
                                        className='w-7 h-7 rounded-full object-cover'
                                    />
                                ) : (
                                    <button className='w-7 h-7 rounded-full bg-accent text-bg-primary text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity'>
                                        {displayName ? displayName[0].toUpperCase() : email[0].toUpperCase()}
                                    </button>
                                )}
                                <div className='absolute right-0 top-full mt-2 w-48 bg-surface-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50'>
                                    <div className='px-4 py-3 border-b border-border'>
                                        <p className='text-xs text-text-primary font-medium truncate'>{displayName || email}</p>
                                        <p className='text-[10px] text-text-muted truncate mt-0.5'>{email}</p>
                                    </div>
                                    <Link
                                        href='/app/settings'
                                        className='block px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors'
                                    >
                                        アカウント設定
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className='w-full text-left px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors rounded-b-lg border-t border-border'
                                    >
                                        ログアウト
                                    </button>
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* Hamburger button (mobile) */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className='md:hidden flex flex-col items-center justify-center w-8 h-8 gap-[5px] relative z-50'
                        aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
                    >
                        <span
                            className={`block w-5 h-px bg-text-primary transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`}
                        />
                        <span
                            className={`block w-5 h-px bg-text-primary transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}
                        />
                        <span
                            className={`block w-5 h-px bg-text-primary transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`}
                        />
                    </button>
                </div>
            </header>

            {/* Full-screen mobile overlay — outside header to avoid stacking issues */}
            {menuOpen && (
                <div
                    ref={overlayRef}
                    className='fixed inset-0 z-30 flex flex-col items-center justify-center bg-bg-primary/70 backdrop-blur-xl md:hidden animate-[fadeIn_0.2s_ease-out]'
                    onClick={e => {
                        if (e.target === overlayRef.current) setMenuOpen(false)
                    }}
                >
                    <nav className='flex flex-col items-center w-full max-w-xs px-8'>
                        {navLinks.map((link, i) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={menuLinkClass(isActive(link.href))}
                                style={{
                                    animation: `nav-item-in 0.35s ease-out forwards`,
                                    animationDelay: `${i * 0.07}s`,
                                    opacity: 0,
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Divider between nav links and account */}
                        <div
                            className='w-8 h-px bg-border-strong my-5'
                            style={{
                                animation: `nav-item-in 0.35s ease-out forwards`,
                                animationDelay: `${navLinks.length * 0.07}s`,
                                opacity: 0,
                            }}
                        />

                        {/* Account section */}
                        {email && (
                            <div
                                className='w-full pt-6'
                                style={{
                                    animation: `nav-item-in 0.35s ease-out forwards`,
                                    animationDelay: `${navLinks.length * 0.07}s`,
                                    opacity: 0,
                                }}
                            >
                                <div className='flex items-center gap-3 mb-3'>
                                <div className='w-8 h-8 rounded-full bg-accent text-bg-primary text-sm font-medium flex items-center justify-center flex-shrink-0 overflow-hidden'>
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt='' className='w-full h-full object-cover' />
                                        ) : (
                                            email[0].toUpperCase()
                                        )}
                                    </div>
                                    <span className='text-sm text-text-primary truncate'>{displayName || email}</span>
                                </div>
                                <Link
                                    href='/app/settings'
                                    className='block w-full text-center py-2.5 text-xs text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-secondary'
                                >
                                    アカウント設定
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className='w-full text-center py-2.5 text-xs text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-bg-secondary'
                                >
                                    ログアウト
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </>
    )
}
