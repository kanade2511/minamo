'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PRESETS = [
    { label: 'スチールブルー', color: '#4a6fa5' },
    { label: 'スレート', color: '#6b7280' },
    { label: 'パープル', color: '#8b5cf6' },
    { label: 'エメラルド', color: '#059669' },
    { label: 'アンバー', color: '#d97706' },
    { label: 'ローズ', color: '#e11d48' },
    { label: 'スカイ', color: '#0284c7' },
    { label: 'ティール', color: '#0d9488' },
    { label: 'ピンク', color: '#db2777' },
    { label: 'インディゴ', color: '#6366f1' },
]

export default function ThemeColorPicker() {
    const supabase = createClient()
    const [selected, setSelected] = useState('#4a6fa5')
    const [customColor, setCustomColor] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        // Apply from localStorage first (instant, no API call)
        const local = localStorage.getItem('theme_color')
        if (local) {
            setSelected(local)
            const isPreset = PRESETS.some(p => p.color === local)
            if (!isPreset) setCustomColor(local)
            applyColor(local)
        }

        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const stored = user?.user_metadata?.theme_color
            if (stored && stored !== local) {
                setSelected(stored)
                const isPreset = PRESETS.some(p => p.color === stored)
                if (!isPreset) setCustomColor(stored)
                applyColor(stored)
            }
        }
        load()
    }, [supabase])

    const applyColor = (color: string) => {
        document.documentElement.style.setProperty('--color-accent', color)
    }

    const handleSelect = async (color: string) => {
        setSelected(color)
        setCustomColor('')
        setSaved(false)
        applyColor(color)
        await saveColor(color)
    }

    const handleCustom = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value
        setCustomColor(color)
        setSelected(color)
        setSaved(false)
        applyColor(color)
        await saveColor(color)
    }

    const saveColor = async (color: string) => {
        setSaving(true)
        try {
            localStorage.setItem('theme_color', color)
            const { error } = await supabase.auth.updateUser({
                data: { theme_color: color },
            })
            if (error) throw error
            setSaved(true)
            window.dispatchEvent(new CustomEvent('user-updated'))
        } catch {
            // silent
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <p className='text-xs text-text-primary mb-3'>テーマカラー</p>
            <div className='flex flex-wrap gap-2'>
                {PRESETS.map(p => (
                    <button
                        key={p.color}
                        onClick={() => handleSelect(p.color)}
                        className={`w-7 h-7 rounded-full transition-all ${
                            selected === p.color && !customColor ? 'ring-2 ring-offset-2 ring-offset-bg-primary ring-accent scale-110' : ''
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                    />
                ))}
                <label
                    className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                        customColor ? '' : 'border-2 border-dashed border-border hover:border-accent/50'
                    } ${customColor && selected === customColor ? 'ring-2 ring-offset-2 ring-offset-bg-primary ring-accent scale-110' : ''}`}
                    style={customColor ? { backgroundColor: customColor } : {}}
                    title={customColor ? 'カスタムカラー（クリックで変更）' : 'カスタムカラーを追加'}
                >
                    <input
                        type='color'
                        value={customColor || selected}
                        onChange={handleCustom}
                        className='w-0 h-0 opacity-0 absolute'
                    />
                    {!customColor && (
                        <span className='text-[10px] text-text-muted'>+</span>
                    )}
                </label>
            </div>
            {saving && (
                <p className='text-[10px] text-text-muted mt-2'>保存中...</p>
            )}
            {saved && (
                <p className='text-[10px] text-green-700/60 mt-2'>保存しました</p>
            )}
        </div>
    )
}
