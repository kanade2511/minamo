'use client'

import { useState, useRef, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'

// ─── Image helpers ───────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

/** Crop the selected area and return as WebP blob */
async function cropToWebP(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await loadImage(imageSrc)
    const canvas = document.createElement('canvas')
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    )
    return new Promise(resolve => {
        canvas.toBlob(b => resolve(b!), 'image/webp', 0.92)
    })
}

// ─── Component ───────────────────────────────────

export default function AvatarUpload({
    url,
    uid,
}: {
    url?: string | null
    uid: string
}) {
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)

    const [avatarUrl, setAvatarUrl] = useState(url ?? null)
    const [uploading, setUploading] = useState(false)

    // Crop dialog state
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)

    const onCropComplete = useCallback(
        (_: Area, cropped: Area) => setCroppedPixels(cropped),
        [],
    )

    const handlePick = () => fileRef.current?.click()

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setImageSrc(reader.result as string)
            setCrop({ x: 0, y: 0 })
            setZoom(1)
        }
        reader.readAsDataURL(file)
        e.target.value = '' // allow re-picking the same file
    }

    const handleCropCancel = () => {
        setImageSrc(null)
        setCroppedPixels(null)
    }

    const handleCropConfirm = async () => {
        if (!imageSrc || !croppedPixels) return
        setUploading(true)

        try {
            // 1. Crop → WebP blob
            const webpBlob = await cropToWebP(imageSrc, croppedPixels)

            // 2. Compress to <5 MB with browser-image-compression
            const compress = (await import('browser-image-compression')).default
            const compressed = await compress(
                new File([webpBlob], 'avatar.webp', { type: 'image/webp' }),
                { maxSizeMB: 5, maxWidthOrHeight: 1024, useWebWorker: true },
            )

            // 3. Upload to Supabase Storage (upsert replaces old file)
            const path = `${uid}/avatar.webp`
            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(path, compressed, { upsert: true })
            if (uploadErr) throw uploadErr

            // 4. Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage.from('avatars').getPublicUrl(path)

            // 5. Persist to user_metadata
            const { error: metaErr } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            })
            if (metaErr) throw metaErr

            setAvatarUrl(publicUrl)
            window.dispatchEvent(new CustomEvent('user-updated'))
        } catch (e) {
            console.error('Avatar upload failed:', e)
        } finally {
            setUploading(false)
            setImageSrc(null)
            setCroppedPixels(null)
        }
    }

    const initial = uid.slice(0, 2).toUpperCase()

    return (
        <>
            <div className='flex items-center gap-4'>
                <button
                    type='button'
                    onClick={handlePick}
                    disabled={uploading}
                    className='relative w-14 h-14 rounded-full bg-accent/20 text-accent text-lg font-medium flex items-center justify-center flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity group cursor-pointer'
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt=''
                            className='w-full h-full rounded-full object-cover'
                        />
                    ) : (
                        <span>{initial}</span>
                    )}
                    {/* Hover overlay */}
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/[0.06] transition-colors rounded-full pointer-events-none' />
                </button>
                <div className='text-left'>
                    <p className='text-xs text-text-primary'>アバター</p>
                    <p className='text-[10px] text-text-secondary/40 mt-0.5'>
                        {uploading ? 'アップロード中...' : 'クリックして画像を選択'}
                    </p>
                </div>
            </div>

            {/* Hidden file picker */}
            <input
                ref={fileRef}
                type='file'
                accept='image/*'
                onChange={handleFile}
                className='hidden'
            />

            {/* ─── Crop Modal ────────────────────────────── */}
            {imageSrc && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-surface-card rounded-xl w-full max-w-lg overflow-hidden shadow-xl'>
                        <div className='relative w-full h-80'>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <div className='p-5 space-y-4'>
                            {/* Zoom slider */}
                            <div className='flex items-center gap-3'>
                                <span className='text-[10px] text-text-muted tracking-wider'>
                                    ズーム
                                </span>
                                <input
                                    type='range'
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={e =>
                                        setZoom(Number(e.target.value))
                                    }
                                    className='flex-1 h-1 accent-accent'
                                />
                            </div>

                            {/* Actions */}
                            <div className='flex justify-end gap-2'>
                                <button
                                    type='button'
                                    onClick={handleCropCancel}
                                    disabled={uploading}
                                    className='px-5 py-2 text-xs text-text-secondary rounded-full border border-border hover:text-text-primary hover:border-text-primary/30 transition-all disabled:opacity-30'
                                >
                                    キャンセル
                                </button>
                                <button
                                    type='button'
                                    onClick={handleCropConfirm}
                                    disabled={uploading}
                                    className='px-5 py-2 text-xs text-white bg-accent rounded-full hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-1.5'
                                >
                                    {uploading && (
                                        <span className='w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin' />
                                    )}
                                    {uploading ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
