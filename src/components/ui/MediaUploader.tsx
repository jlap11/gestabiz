import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Video as VideoIcon, Loader2, Star, Play, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileUpload } from '@/hooks/useFileUpload'
import { VideoTrimmer } from '@/components/ui/VideoTrimmer'

export interface MediaItemPending {
  file: File
  description?: string
  type: 'image' | 'video'
  isBanner?: boolean
  isPrimary?: boolean
  durationSec?: number
}

interface MediaUploaderProps {
  locationId: string
  maxImageFiles?: number
  maxImageSizeMB?: number
  maxVideoFiles?: number
  maxVideoSizeMB?: number
  maxVideoDurationSeconds?: number
  className?: string
  onUploadComplete?: (items: { type: 'image' | 'video'; url: string; description?: string; isBanner?: boolean; isPrimary?: boolean }[]) => void
  onUploadError?: (error: string) => void
  onBannerCropRequest?: (imageUrl: string) => void
  onUploadTrigger?: (uploadFn: () => Promise<void>) => void
}

export function MediaUploader({
  locationId,
  maxImageFiles = 5,
  maxImageSizeMB = 5,
  maxVideoFiles = 2,
  maxVideoSizeMB = 50,
  maxVideoDurationSeconds = 45,
  className,
  onUploadComplete,
  onUploadError,
  onBannerCropRequest,
  onUploadTrigger,
}: MediaUploaderProps) {
  const [pendingImages, setPendingImages] = useState<MediaItemPending[]>([])
  const [pendingVideos, setPendingVideos] = useState<MediaItemPending[]>([])
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [isDraggingVideos, setIsDraggingVideos] = useState(false)
  const [videoToTrim, setVideoToTrim] = useState<File | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const imageUpload = useFileUpload('location-images')
  const videoUpload = useFileUpload('location-videos')

  // Configurar callback para subida externa
  useEffect(() => {
    if (onUploadTrigger) {
      onUploadTrigger(handleUpload)
    }
  }, [onUploadTrigger, pendingImages, pendingVideos])

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = url
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(video.duration)
      }
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('No se pudo leer la duración del video'))
      }
    })
  }

  const handleImageFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    const remaining = maxImageFiles - pendingImages.length
    const toProcess = arr.slice(0, remaining)
    if (arr.length > remaining) {
      onUploadError?.(`Solo puedes subir ${remaining} imagen(es) más`)
    }
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const newItems: MediaItemPending[] = []
    for (const file of toProcess) {
      if (!allowed.includes(file.type)) {
        onUploadError?.('Tipo de imagen no permitido')
        continue
      }
      if (file.size > maxImageSizeMB * 1024 * 1024) {
        onUploadError?.(`El archivo es muy grande. Máximo ${maxImageSizeMB}MB`)
        continue
      }
      newItems.push({ file, type: 'image', description: '' })
    }
    setPendingImages((prev) => [...prev, ...newItems])
  }, [maxImageFiles, maxImageSizeMB, pendingImages.length, onUploadError])

  const handleVideoFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    const remaining = maxVideoFiles - pendingVideos.length
    const toProcess = arr.slice(0, remaining)
    if (arr.length > remaining) {
      onUploadError?.(`Solo puedes subir ${remaining} video(s) más`)
    }
    const allowed = ['video/mp4', 'video/webm']
    const newItems: MediaItemPending[] = []
    for (const file of toProcess) {
      if (!allowed.includes(file.type)) {
        onUploadError?.('Tipo de video no permitido (solo MP4/WebM)')
        continue
      }
      if (file.size > maxVideoSizeMB * 1024 * 1024) {
        onUploadError?.(`El video es muy pesado. Máximo ${maxVideoSizeMB}MB`)
        continue
      }
      try {
        const duration = await getVideoDuration(file)
        if (duration > maxVideoDurationSeconds) {
          // Abrir VideoTrimmer para recortar el video
          setVideoToTrim(file)
          return
        }
        newItems.push({ file, type: 'video', description: '', durationSec: duration })
      } catch (err) {
        onUploadError?.('No se pudo validar el video')
      }
    }
    setPendingVideos((prev) => [...prev, ...newItems])
  }, [maxVideoFiles, maxVideoSizeMB, maxVideoDurationSeconds, pendingVideos.length, onUploadError])

  const removeImage = (idx: number) => setPendingImages((prev) => prev.filter((_, i) => i !== idx))
  const removeVideo = (idx: number) => setPendingVideos((prev) => prev.filter((_, i) => i !== idx))

  const markBanner = (idx: number) => {
    setPendingImages((prev) => prev.map((item, i) => ({ ...item, isBanner: i === idx })))
    
    // Si hay callback para recorte de banner, activarlo con la imagen seleccionada
    if (onBannerCropRequest && pendingImages[idx]) {
      const imageUrl = URL.createObjectURL(pendingImages[idx].file)
      onBannerCropRequest(imageUrl)
    }
  }

  const markPrimaryVideo = (idx: number) => {
    setPendingVideos((prev) => prev.map((item, i) => ({ ...item, isPrimary: i === idx })))
  }

  const handleVideoTrimComplete = (startTime: number, endTime: number) => {
    if (!videoToTrim) return
    
    // Crear un nuevo archivo de video con los metadatos de recorte
    const trimmedVideo = new File([videoToTrim], videoToTrim.name, {
      type: videoToTrim.type,
      lastModified: videoToTrim.lastModified,
    })
    
    // Agregar metadatos de recorte como propiedades personalizadas
    Object.defineProperty(trimmedVideo, 'trimStart', { value: startTime })
    Object.defineProperty(trimmedVideo, 'trimEnd', { value: endTime })
    
    const duration = endTime - startTime
    setPendingVideos((prev) => [...prev, { 
      file: trimmedVideo, 
      type: 'video', 
      description: '', 
      durationSec: duration 
    }])
    
    setVideoToTrim(null)
  }

  const handleVideoTrimCancel = () => {
    setVideoToTrim(null)
  }

  const handleUpload = async () => {
    const results: { type: 'image' | 'video'; url: string; description?: string; isBanner?: boolean; isPrimary?: boolean }[] = []
    // Upload images
    for (const item of pendingImages) {
      const fileName = `${Date.now()}-${item.file.name}`
      const res = await imageUpload.uploadFile(item.file, `${locationId}`, fileName, {
        maxSizeMB: maxImageSizeMB,
        allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      })
      if (!res.success || !res.url) {
        onUploadError?.(res.error || 'Error al subir imagen')
        continue
      }
      results.push({ type: 'image', url: res.url, description: item.description, isBanner: !!item.isBanner })
    }
    // Upload videos
    for (const item of pendingVideos) {
      const fileName = `${Date.now()}-${item.file.name}`
      const res = await videoUpload.uploadFile(item.file, `${locationId}`, fileName, {
        maxSizeMB: maxVideoSizeMB,
        allowedTypes: ['video/mp4', 'video/webm'],
      })
      if (!res.success || !res.url) {
        onUploadError?.(res.error || 'Error al subir video')
        continue
      }
      results.push({ type: 'video', url: res.url, description: item.description, isPrimary: !!item.isPrimary })
    }

    if (results.length > 0) {
      // Persist metadata in location_media table
      try {
        const payload = results.map((r) => ({
          location_id: locationId,
          type: r.type,
          url: r.url,
          description: r.description || null,
          is_banner: r.isBanner || false,
          is_primary: r.isPrimary || false,
        }))
        const { error } = await (await import('@/lib/supabase')).supabase
          .from('location_media')
          .insert(payload)
        if (error) throw error
      } catch (err) {
        onUploadError?.('Error al guardar metadata de multimedia')
      }
      onUploadComplete?.(results)
      setPendingImages([])
      setPendingVideos([])
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Uploader de imágenes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Imágenes</h3>
          <span className="text-sm text-muted-foreground">
            ({pendingImages.length}/{maxImageFiles})
          </span>
        </div>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingImages(false) }}
          onDrop={(e) => { e.preventDefault(); setIsDraggingImages(false); handleImageFiles(e.dataTransfer.files) }}
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer group',
            isDraggingImages 
              ? 'border-primary bg-primary/10 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
          onClick={() => imageInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'p-3 rounded-full transition-colors',
              isDraggingImages ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10'
            )}>
              <Upload className={cn(
                'h-6 w-6 transition-colors',
                isDraggingImages ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              )} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDraggingImages ? 'Suelta las imágenes aquí' : 'Arrastra imágenes aquí o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, JPEG, WebP • Máximo {maxImageSizeMB}MB cada una
              </p>
            </div>
          </div>
          <input 
            ref={imageInputRef} 
            type="file" 
            accept="image/png,image/jpeg,image/jpg,image/webp" 
            multiple 
            className="hidden" 
            onChange={(e) => handleImageFiles(e.target.files)} 
          />
        </div>

        {pendingImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingImages.map((item, idx) => (
              <div key={idx} className="relative border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="relative">
                  <img src={URL.createObjectURL(item.file)} alt="preview" className="w-full h-40 object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1.5 shadow-sm transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {item.isBanner && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                      <Star className="h-3 w-3 inline mr-1" />
                      Banner
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                    <input
                      type="text"
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Describe esta imagen"
                      value={item.description || ''}
                      onChange={(e) => setPendingImages((prev) => prev.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input 
                      type="radio" 
                      name="banner-image" 
                      checked={!!item.isBanner} 
                      onChange={() => markBanner(idx)}
                      className="text-primary focus:ring-primary" 
                    />
                    <Star className="h-4 w-4" />
                    Marcar como banner
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploader de videos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <VideoIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Videos</h3>
          <span className="text-sm text-muted-foreground">
            ({pendingVideos.length}/{maxVideoFiles})
          </span>
        </div>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingVideos(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingVideos(false) }}
          onDrop={(e) => { e.preventDefault(); setIsDraggingVideos(false); handleVideoFiles(e.dataTransfer.files) }}
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer group',
            isDraggingVideos 
              ? 'border-primary bg-primary/10 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
          onClick={() => videoInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'p-3 rounded-full transition-colors',
              isDraggingVideos ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10'
            )}>
              <Upload className={cn(
                'h-6 w-6 transition-colors',
                isDraggingVideos ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
              )} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDraggingVideos ? 'Suelta los videos aquí' : 'Arrastra videos aquí o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM • Máximo {maxVideoSizeMB}MB y {maxVideoDurationSeconds}s cada uno
              </p>
            </div>
          </div>
          <input 
            ref={videoInputRef} 
            type="file" 
            accept="video/mp4,video/webm" 
            multiple 
            className="hidden" 
            onChange={(e) => handleVideoFiles(e.target.files)} 
          />
        </div>

        {pendingVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingVideos.map((item, idx) => (
              <div key={idx} className="relative border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="relative">
                  <video 
                    src={URL.createObjectURL(item.file)} 
                    className="w-full h-40 object-cover" 
                    controls 
                    onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime > maxVideoDurationSeconds) v.pause() }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeVideo(idx)} 
                    className="absolute top-2 right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1.5 shadow-sm transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {item.isPrimary && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                      <Play className="h-3 w-3 inline mr-1" />
                      Principal
                    </div>
                  )}
                  {item.trimStart !== undefined && item.trimEnd !== undefined && (
                    <div className="absolute bottom-2 left-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-medium">
                      <Scissors className="h-3 w-3 inline mr-1" />
                      Recortado
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                    <input
                      type="text"
                      className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Describe este video"
                      value={item.description || ''}
                      onChange={(e) => setPendingVideos((prev) => prev.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input 
                      type="radio" 
                      name="primary-video" 
                      checked={!!item.isPrimary} 
                      onChange={() => markPrimaryVideo(idx)}
                      className="text-primary focus:ring-primary" 
                    />
                    <Play className="h-4 w-4" />
                    Marcar como video principal
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Video Trimmer Dialog */}
      <VideoTrimmer
        videoFile={videoToTrim!}
        maxDurationSeconds={maxVideoDurationSeconds}
        onTrimComplete={handleVideoTrimComplete}
        onCancel={handleVideoTrimCancel}
        isOpen={!!videoToTrim}
        onOpenChange={(open) => !open && setVideoToTrim(null)}
      />
    </div>
  )
}
