'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { analyzeText } from '@/lib/analyze'

// ─── Notes ───────────────────────────────────────

export async function createNote(content: string, themeId?: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('notes')
        .insert({
            user_id: user.id,
            content,
            theme_id: themeId ?? null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Auto-analyze and save result (non-blocking — don't fail on error)
    try {
        const analysis = await analyzeText(content)
        await supabase.from('note_analyses').insert({
            note_id: data.id,
            user_id: user.id,
            emotions: analysis.emotions,
            sentiment: analysis.sentiment,
            keywords: analysis.keywords,
            summary: analysis.summary,
        })
    } catch (e) {
        console.error('Auto-analysis failed:', e)
        // Note was saved successfully; analysis failure is non-critical
    }

    revalidatePath('/app')
    revalidatePath('/app/timeline')
    revalidatePath('/app/insights')
    return data
}

// ─── Account ──────────────────────────────────────

/** Step 1: Send verification email to the CURRENT email address */
export async function sendVerifyOldEmail(origin: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const admin = await createAdminClient()
    const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
            ...user.user_metadata,
            email_change_token: token,
            email_change_token_expires: expiresAt,
        },
    })
    if (metaError) throw new Error(metaError.message)

    const linkUrl = `${origin}/app/change-email?token=${token}`
    const html = emailHtml(
        'メールアドレス変更のリクエストを受け付けました。',
        '以下のボタンをクリックして、新しいメールアドレスを入力してください。',
        linkUrl,
        '新しいメールアドレスを入力する',
    )

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Minamo <noreply@resend.dev>',
            to: [user.email!],
            subject: '【Minamo】メールアドレス変更の確認',
            html,
        }),
    })

    if (!res.ok) {
        await admin.auth.admin.updateUserById(user.id, {
            user_metadata: user.user_metadata,
        })
        throw new Error('メール送信に失敗しました')
    }

    return { success: true }
}

/** Step 2: Validate step-1 token, store new email, send confirmation to NEW email */
export async function submitNewEmail(newEmail: string, token: string, origin: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const meta = user.user_metadata || {}
    if (meta.email_change_token !== token) {
        throw new Error('無効なトークンです')
    }
    if (Date.now() > new Date(meta.email_change_token_expires || 0).getTime()) {
        throw new Error('トークンの有効期限が切れました。もう一度お試しください。')
    }

    const code = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const admin = await createAdminClient()
    await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
            ...user.user_metadata,
            email_change_new: newEmail,
            email_change_code: code,
            email_change_code_expires: expiresAt,
        },
    })

    const linkUrl = `${origin}/app/change-email?code=${code}`
    const html = emailHtml(
        '新しいメールアドレスの確認をお願いします。',
        '以下のボタンをクリックして、メールアドレスの変更を完了してください。',
        linkUrl,
        'メールアドレスを変更する',
    )

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Minamo <noreply@resend.dev>',
            to: [newEmail],
            subject: '【Minamo】新しいメールアドレスの確認',
            html,
        }),
    })

    if (!res.ok) {
        // Roll back step-2 metadata
        await admin.auth.admin.updateUserById(user.id, {
            user_metadata: user.user_metadata,
        })
        throw new Error('メール送信に失敗しました')
    }

    return { success: true }
}

/** Step 3: Validate step-2 code and apply the email change */
export async function confirmEmailChange(code: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const meta = user.user_metadata || {}
    if (meta.email_change_code !== code) {
        throw new Error('無効なコードです')
    }
    if (Date.now() > new Date(meta.email_change_code_expires || 0).getTime()) {
        throw new Error('コードの有効期限が切れました。もう一度お試しください。')
    }

    const newEmail = meta.email_change_new
    if (!newEmail) throw new Error('新しいメールアドレスが見つかりません')

    const admin = await createAdminClient()
    const cleanMeta = { ...user.user_metadata }
    delete cleanMeta.email_change_token
    delete cleanMeta.email_change_token_expires
    delete cleanMeta.email_change_new
    delete cleanMeta.email_change_code
    delete cleanMeta.email_change_code_expires

    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
        email: newEmail,
        user_metadata: cleanMeta,
    })
    if (error) throw new Error(error.message)

    return { success: true, email: data.user.email }
}

/** Build consistent email HTML */
function emailHtml(
    heading: string,
    body: string,
    linkUrl: string,
    buttonLabel: string,
): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8f7f6;font-family:'Hiragino Sans','Noto Sans JP',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f7f6;padding:40px 0;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:48px 48px 0 48px;"><p style="margin:0;font-size:20px;font-weight:600;color:#17171c;">Minamo</p></td></tr>
<tr><td style="padding:32px 48px 0 48px;">
<p style="margin:0;font-size:14px;line-height:1.8;color:#17171c;">${heading}</p>
<p style="margin:12px 0 0 0;font-size:14px;line-height:1.8;color:#17171c;">${body}</p>
</td></tr>
<tr><td style="padding:32px 48px 0 48px;">
<table cellpadding="0" cellspacing="0"><tr>
<td style="background-color:#17171c;border-radius:32px;padding:12px 32px;">
<a href="${linkUrl}" style="color:#fff;text-decoration:none;font-size:13px;display:inline-block;">${buttonLabel}</a>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:24px 48px 0 48px;">
<p style="margin:0;font-size:12px;line-height:1.7;color:#93939f;">このリンクは1時間有効です。心当たりがない場合は、このメールを破棄してください。</p>
</td></tr>
<tr><td style="padding:40px 48px 48px 48px;">
<p style="margin:0;font-size:11px;color:#b0b0b8;line-height:1.6;">自分を知る、毎日少しずつ。</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function deleteUserData() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Remove avatar from storage (before auth deletion while session is valid)
    const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.webp`])
    if (storageError) {
        console.error('Avatar deletion failed:', storageError.message)
    }

    // Delete auth user first (requires service role key)
    const admin = await createAdminClient()
    const { error: adminError } = await admin.auth.admin.deleteUser(user.id)
    if (adminError) throw new Error(adminError.message)

    // User data is cascade-deleted via FK references, but purge explicitly too
    const tables = ['note_analyses', 'insights', 'summaries', 'notes'] as const
    const errors: string[] = []

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq('user_id', user.id)
        if (error) errors.push(`${table}: ${error.message}`)
    }

    if (errors.length > 0) {
        throw new Error(`Failed to delete some data:\n${errors.join('\n')}`)
    }

    // Clear session (in case user was already deleted, ignore signOut errors)
    try {
        await supabase.auth.signOut()
    } catch {
        // ignore
    }

    revalidatePath('/')
    return { success: true }
}

export async function deleteNote(id: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/app')
    revalidatePath('/app/timeline')
    revalidatePath('/app/explore')
    revalidatePath('/app/insights')
}

// ─── Insights ──────────────────────────────────────

export async function saveInsight(
    noteId: string,
    dialogue: { role: 'assistant' | 'user'; content: string }[],
    insight: string,
    tags?: string[],
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('insights')
        .insert({
            note_id: noteId,
            user_id: user.id,
            dialogue,
            insight,
            tags: tags ?? [],
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/app/timeline')
    return data
}

// ─── Note Analyses ────────────────────────────────

export async function getAnalysisForNote(noteId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('note_analyses')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .maybeSingle()

    return data
}

export async function getAnalysisForUser(sinceDays: number = 30) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
        .from('note_analyses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })

    return data ?? []
}
