'use client'

import { useEffect } from 'react'

export default function ThemeInitializer() {
    useEffect(() => {
        const color = localStorage.getItem('theme_color')
        if (color) {
            document.documentElement.style.setProperty('--color-accent', color)
        }
    }, [])

    return null
}
