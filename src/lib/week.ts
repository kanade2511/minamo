/**
 * Get the Monday (start) and Sunday (end) of the current ISO week.
 * Returns Date objects at midnight JST (UTC+9).
 */
export function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
    const now = new Date()

    // Convert to JST (UTC+9) for week calculation
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)

    const dayOfWeek = jst.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
    // Monday = 1, so diff from Monday:
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const weekStart = new Date(jst)
    weekStart.setUTCDate(jst.getUTCDate() + diffToMonday)
    weekStart.setUTCHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
    weekEnd.setUTCHours(23, 59, 59, 999)

    return { weekStart, weekEnd }
}

/**
 * Check if today is Friday or later in the current week.
 */
export function isFridayOrLater(): boolean {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const dayOfWeek = jst.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
    return dayOfWeek >= 5 // Friday(5), Saturday(6), Sunday(0)... Sunday is 0, so handle that
        || (dayOfWeek === 0) // Sunday is also "later" than Friday
}

/**
 * Format week range as a human-readable string.
 */
export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
    const startStr = weekStart.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
    })
    const endStr = weekEnd.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
    })
    return `${startStr} 〜 ${endStr}`
}
