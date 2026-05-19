'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
    const router = useRouter()

    const handleAuthRedirect = async (e: React.MouseEvent, mode: 'login' | 'signup') => {
        e.preventDefault()
        const supabase = createClient()
        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (session) {
            router.push('/app')
        } else {
            router.push(mode === 'signup' ? '/login?mode=signup' : '/login')
        }
    }

    return (
        <div className='min-h-screen bg-white'>
            <header className='sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-[#e5e7eb]'>
                <div className='max-w-6xl mx-auto px-6 h-14 flex items-center justify-between'>
                    <span className='text-sm text-[#17171c] tracking-tight font-medium'>
                        Minamo
                    </span>
                    <nav className='flex items-center gap-8'>
                        <a
                            href='/login'
                            onClick={e => handleAuthRedirect(e, 'login')}
                            className='text-sm text-[#75758a] hover:text-[#17171c] transition-colors'
                        >
                            ログイン
                        </a>
                        <a
                            href='/login'
                            onClick={e => handleAuthRedirect(e, 'signup')}
                            className='text-sm px-5 py-2 bg-[#17171c] text-white rounded-full hover:opacity-90 transition-opacity'
                        >
                            始める
                        </a>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero section: text left, image right full-height */}
                <section className='max-w-6xl mx-auto px-6 pt-16 pb-0 md:pt-24 md:pb-0'>
                    <div className='grid md:grid-cols-2 gap-12'>
                        <div className='max-w-xl pt-8 md:pt-16 pb-16 md:pb-20'>
                            <p className='text-xs text-[#75758a] tracking-[0.15em] mb-6'>
                                水面 — Minamo
                            </p>
                            <h1 className='text-5xl md:text-7xl font-light text-[#17171c] leading-[1.0] tracking-[-1.5px] md:tracking-[-2px]'>
                                自分のことを
                                <br />
                                もっと知っていく。
                            </h1>
                            <p className='mt-8 text-lg text-[#75758a] leading-relaxed max-w-lg'>
                                Minamoは、日々の問いかけに答えながら自分自身の思考や感情のパターンをやさしく紐解いていく内省ツールです。
                            </p>
                            <div className='mt-10 flex items-center gap-4'>
                                <a
                                    href='/login'
                                    onClick={e => handleAuthRedirect(e, 'signup')}
                                    className='px-7 py-3 bg-[#17171c] text-white text-sm rounded-full hover:opacity-90 transition-opacity'
                                >
                                    無料ではじめる
                                </a>
                                <a
                                    href='/login'
                                    onClick={e => handleAuthRedirect(e, 'login')}
                                    className='text-sm text-[#75758a] underline underline-offset-4 hover:text-[#17171c] transition-colors'
                                >
                                    ログイン
                                </a>
                            </div>
                        </div>
                        <div className='-mr-6 -mt-16 md:-mt-24 overflow-hidden'>
                            <img
                                src='/minamo-hero.jpg'
                                alt=''
                                className='w-full h-full object-cover'
                            />
                        </div>
                    </div>
                </section>

                <div className='max-w-6xl mx-auto px-6'>
                    <div className='h-px bg-[#e5e7eb]' />
                </div>

                <section className='max-w-6xl mx-auto px-6 py-24 md:py-32'>
                    <p className='text-xs text-[#93939f] tracking-[0.15em] mb-14'>使い方</p>
                    <div className='grid md:grid-cols-3 gap-x-16 gap-y-12'>
                        {[
                            {
                                num: '01',
                                title: '書く',
                                desc: '今日の問いに答えるか、自由に書きたいことを綴ります。1日何度でも、思いついたときに。',
                            },
                            {
                                num: '02',
                                title: '探る',
                                desc: 'Mirrorとの対話を通じて、自分の思考をより深く掘り下げます。誘導はせず、ただ問いを投げかけます。',
                            },
                            {
                                num: '03',
                                title: '気づく',
                                desc: '蓄積されたノートと洞察を振り返り、自分では気づかなかったパターンや価値観を発見します。',
                            },
                        ].map(item => (
                            <div key={item.num}>
                                <span className='text-2xl text-[#4a6fa5]/30 font-light'>
                                    {item.num}
                                </span>
                                <h3 className='mt-4 text-lg text-[#17171c] font-medium'>
                                    {item.title}
                                </h3>
                                <p className='mt-3 text-sm text-[#75758a] leading-relaxed'>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className='bg-[#f8f7f6]'>
                    <div className='max-w-6xl mx-auto px-6 py-24 md:py-32'>
                        <p className='text-xs text-[#93939f] tracking-[0.15em] mb-14'>特徴</p>
                        <div className='grid md:grid-cols-2 gap-x-20 gap-y-14'>
                            {[
                                {
                                    title: '日々の問いかけ',
                                    desc: '毎日変わる15の問いが、書くきっかけを作ります。自由に書きたい日はそれも選べます。',
                                },
                                {
                                    title: 'AIは鏡であってレンズではない',
                                    desc: 'Mirrorは解釈を押し付けず、あなた自身の言葉を受け止めて新しい問いを返します。',
                                },
                                {
                                    title: '自動感情分析',
                                    desc: '書いたノートからAIが感情の傾向やキーワードを抽出。自分の状態を客観的に捉えられます。',
                                },
                                {
                                    title: 'データはあなたのもの',
                                    desc: 'すべてのノートと洞察はJSONで書き出せます。いつでも自由に持ち出せます。',
                                },
                            ].map(item => (
                                <div key={item.title}>
                                    <div className='w-8 h-px bg-[#4a6fa5]/40 mb-5' />
                                    <h3 className='text-base text-[#17171c] font-medium'>
                                        {item.title}
                                    </h3>
                                    <p className='mt-2 text-sm text-[#75758a] leading-relaxed'>
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className='max-w-6xl mx-auto px-6 py-24 md:py-32 text-center'>
                    <p className='text-xs text-[#93939f] tracking-[0.15em] mb-5'>水面 — Minamo</p>
                    <h2 className='text-3xl md:text-4xl font-light text-[#17171c] leading-snug tracking-[-0.5px]'>
                        今日から、自分を知ることを始めてみませんか。
                    </h2>
                    <a
                        href='/login'
                        onClick={e => handleAuthRedirect(e, 'signup')}
                        className='inline-block mt-8 px-8 py-3 bg-[#17171c] text-white text-sm rounded-full hover:opacity-90 transition-opacity'
                    >
                        無料ではじめる
                    </a>
                </section>
            </main>

            <footer className='max-w-6xl mx-auto px-6 py-8 border-t border-[#e5e7eb]'>
                <div className='flex items-center justify-between'>
                    <span className='text-xs text-[#93939f]'>Minamo</span>
                    <span className='text-xs text-[#93939f]/60'>
                        水面 — 自分を知る、毎日少しずつ。
                    </span>
                </div>
            </footer>
        </div>
    )
}
