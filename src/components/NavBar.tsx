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
    const [menuOpen, setMenuOpen] = useState(false)
    const overlayRef = useRef<HTMLDivElement>(null)

    const isPublicPage = pathname === '/login' || pathname.startsWith('/auth') || pathname === '/'

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (user) setEmail(user.email ?? null)
        }
        getUser()
    }, [supabase.auth.getUser])

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
            active ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
        }`

    const menuLinkClass = (active: boolean) =>
        `block w-full py-4 text-xl tracking-tight text-center transition-colors ${
            active ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'
        }`

    return (
        <>
            <header className='sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-sm border-b border-border'>
                <div className='max-w-6xl mx-auto px-6 h-14 flex items-center justify-between'>
                    <Link href='/app' className='text-sm text-text-primary tracking-tight font-medium'>
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
                            <span className='text-xs text-text-muted'>
                                {email.length > 24 ? `${email.slice(0, 24)}…` : email}
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            className='text-xs text-text-muted hover:text-text-primary transition-colors'
                        >
                            ログアウト
                        </button>
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

                        <div
                            className='w-8 h-px bg-border-strong my-5'
                            style={{
                                animation: `nav-item-in 0.35s ease-out forwards`,
                                animationDelay: `${navLinks.length * 0.07}s`,
                                opacity: 0,
                            }}
                        />

                        {email && (
                            <div
                                className='text-xs text-text-muted py-2 text-center'
                                style={{
                                    animation: `nav-item-in 0.35s ease-out forwards`,
                                    animationDelay: `${(navLinks.length + 1) * 0.07}s`,
                                    opacity: 0,
                                }}
                            >
                                {email}
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className='text-xs text-text-muted hover:text-text-primary transition-colors py-2 text-center'
                            style={{
                                animation: `nav-item-in 0.35s ease-out forwards`,
                                animationDelay: `${(navLinks.length + (email ? 2 : 1)) * 0.07}s`,
                                opacity: 0,
                            }}
                        >
                            ログアウト
                        </button>
                    </nav>
                </div>
            )}
        </>
    )
}
