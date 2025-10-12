import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useFileUpload, type StorageBucket } from '@/hooks/useFileUpload'

interface ImageUploaderProps {
  bucket: StorageBucket
  folderPath: string // businessId, locationId, serviceId
  maxFiles?: number
  maxSizeMB?: number
  onUploadComplete?: (urls: string[]) => void
  onUploadError?: (error: string) => void
  existingImages?: string[]
  className?: string
  showPreview?: boolean
  disabled?: boolean
  // NEW: Delayed upload mode
  delayedUpload?: boolean // If true, don't upload immediately
  onFileSelected?: (file: File) => void // Callback when file selected (delayedUpload mode)
}

interface ImagePreview {
  id: string
  file?: File
  url: string
  isExisting: boolean
  isUploading: boolean
  progress: number
}

export function ImageUploader({
  bucket,
  folderPath,
  maxFiles = 10,
  maxSizeMB = 5,
  onUploadComplete,
  onUploadError,
  existingImages = [],
  className,
  showPreview = true,
  disabled = false,
  delayedUpload = false,
  onFileSelected,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>(
    existingImages.map((url, index) => ({
      id: `existing-${index}`,
      url,
      isExisting: true,
      isUploading: false,
      progress: 100,
    }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploadFile, deleteFile, isUploading } = useFileUpload(bucket)

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const remainingSlots = maxFiles - previews.length

      if (fileArray.length > remainingSlots) {
        onUploadError?.(`Solo puedes subir ${remainingSlots} imagen(es) más`)
        return
      }

      // DELAYED UPLOAD MODE: Just create preview and call callback
      if (delayedUpload) {
        const file = fileArray[0] // Only handle single file in delayed mode
        
        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          onUploadError?.(`El archivo es muy grande. Máximo ${maxSizeMB}MB`)
          return
        }

        // Create preview with FileReader
        const reader = new FileReader()
        reader.onload = (e) => {
          const preview: ImagePreview = {
            id: `preview-${Date.now()}`,
            file,
            url: e.target?.result as string,
            isExisting: false,
            isUploading: false,
            progress: 100,
          }
          setPreviews([preview]) // Replace existing preview (single file mode)
        }
        reader.readAsDataURL(file)

        // Call callback with File object
        onFileSelected?.(file)
        return
      }

      // IMMEDIATE UPLOAD MODE: Original behavior
      // Create previews
      const newPreviews: ImagePreview[] = fileArray.map((file) => ({
        id: `preview-${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
        isExisting: false,
        isUploading: true,
        progress: 0,
      }))

      setPreviews((prev) => [...prev, ...newPreviews])

      // Upload files
      const uploadedUrls: string[] = []

      for (const preview of newPreviews) {
        if (!preview.file) continue

        const result = await uploadFile(preview.file, folderPath, undefined, {
          maxSizeMB,
          onProgress: (progress) => {
            setPreviews((prev) =>
              prev.map((p) => (p.id === preview.id ? { ...p, progress } : p))
            )
          },
        })

        if (result.success && result.url) {
          uploadedUrls.push(result.url)
          setPreviews((prev) =>
            prev.map((p) =>
              p.id === preview.id
                ? { ...p, url: result.url!, isUploading: false, progress: 100 }
                : p
            )
          )
        } else {
          // Remove failed upload
          setPreviews((prev) => prev.filter((p) => p.id !== preview.id))
          onUploadError?.(result.error || 'Error al subir imagen')
        }
      }

      if (uploadedUrls.length > 0) {
        onUploadComplete?.(uploadedUrls)
      }
    },
    [previews.length, maxFiles, uploadFile, folderPath, maxSizeMB, onUploadComplete, onUploadError, delayedUpload, onFileSelected]
  )

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      handleFiles(files)
    },
    [handleFiles]
  )

  // Handle click to select files
  const handleClick = useCallback(() => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }, [disabled, isUploading])

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  // Remove image
  const handleRemove = useCallback(
    async (preview: ImagePreview) => {
      if (preview.isExisting) {
        // Extract path from URL
        const urlParts = preview.url.split('/')
        const pathIndex = urlParts.findIndex((part) => part === bucket)
        const path = urlParts.slice(pathIndex + 1).join('/')

        const success = await deleteFile(path)
        if (success) {
          setPreviews((prev) => prev.filter((p) => p.id !== preview.id))
        }
      } else {
        // Just remove from preview
        setPreviews((prev) => prev.filter((p) => p.id !== preview.id))
      }
    },
    [bucket, deleteFile]
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-gray-300 dark:border-gray-700',
          disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple={maxFiles > 1}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isUploading ? 'Subiendo...' : 'Click para seleccionar o arrastra imágenes aquí'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WEBP hasta {maxSizeMB}MB • Máximo {maxFiles} imagen(es)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {previews.length}/{maxFiles} imagen(es) cargada(s)
            </p>
          </div>
        </div>
      </div>

      {/* Preview grid */}
      {showPreview && previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-square"
            >
              {/* Image */}
              {preview.url ? (
                <img
                  src={preview.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Upload progress */}
              {preview.isUploading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <Progress value={preview.progress} className="w-3/4" />
                  <span className="text-xs text-white">{Math.round(preview.progress)}%</span>
                </div>
              )}

              {/* Remove button */}
              {!preview.isUploading && (
                <button
                  onClick={() => handleRemove(preview)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Eliminar imagen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
