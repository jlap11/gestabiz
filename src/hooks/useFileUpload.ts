import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export type StorageBucket = 'business-logos' | 'location-images' | 'service-images' | 'user-avatars' | 'location-videos'

interface UploadOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
}

interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
}

const BUCKET_LIMITS: Record<StorageBucket, number> = {
  'business-logos': 2, // 2 MB
  'location-images': 5, // 5 MB
  'service-images': 2, // 2 MB
  'user-avatars': 2, // 2 MB
  'location-videos': 50, // 50 MB
}

export function useFileUpload(bucket: StorageBucket) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Validate file before upload
   */
  const validateFile = useCallback(
    (file: File, options: UploadOptions): { valid: boolean; error?: string } => {
      const maxSize = options.maxSizeMB || BUCKET_LIMITS[bucket]
      const allowedTypes = options.allowedTypes || DEFAULT_OPTIONS.allowedTypes!

      // Check file size
      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB > maxSize) {
        return {
          valid: false,
          error: `El archivo es demasiado grande. Máximo ${maxSize}MB permitido.`,
        }
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes
            .map((t) => t.split('/')[1])
            .join(', ')}`,
        }
      }

      return { valid: true }
    },
    [bucket]
  )

  /**
   * Upload a single file to Supabase Storage
   * @param file - File to upload
   * @param folderPath - Path within the bucket (e.g., businessId, locationId)
   * @param fileName - Optional custom filename (will use file.name if not provided)
   * @param options - Upload options (maxSize, allowedTypes, onProgress)
   * @returns UploadResult with success, url, path, or error
   */
  const uploadFile = useCallback(
    async (
      file: File,
      folderPath: string,
      fileName?: string,
      options: UploadOptions = {}
    ): Promise<UploadResult> => {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      try {
        // Merge options with defaults
        const uploadOptions = { ...DEFAULT_OPTIONS, ...options }

        // Validate file
        const validation = validateFile(file, uploadOptions)
        if (!validation.valid) {
          setError(validation.error!)
          toast.error(validation.error!)
          return { success: false, error: validation.error }
        }

        // Generate file path
        const timestamp = Date.now()
        const fileExt = file.name.split('.').pop()
        const finalFileName = fileName || `${timestamp}.${fileExt}`
        const filePath = `${folderPath}/${finalFileName}`

        // Simulate progress (Supabase doesn't provide real-time upload progress)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = prev + 10
            if (next >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            if (uploadOptions.onProgress) {
              uploadOptions.onProgress(next)
            }
            return next
          })
        }, 100)

        // Upload file
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Replace if exists
          })

        clearInterval(progressInterval)
        setUploadProgress(100)
        if (uploadOptions.onProgress) {
          uploadOptions.onProgress(100)
        }

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(data.path)

        toast.success('Archivo subido exitosamente')
        return {
          success: true,
          url: publicUrl,
          path: data.path,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al subir archivo'
        setError(errorMessage)
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [bucket, validateFile]
  )

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(
    async (
      files: File[],
      folderPath: string,
      options: UploadOptions = {}
    ): Promise<UploadResult[]> => {
      const results: UploadResult[] = []

      for (const file of files) {
        const result = await uploadFile(file, folderPath, undefined, options)
        results.push(result)
      }

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      if (failCount > 0) {
        toast.error(`${failCount} archivo(s) fallaron al subir`)
      }

      return results
    },
    [uploadFile]
  )

  /**
   * Delete a file from storage
   */
  const deleteFile = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        const { error } = await supabase.storage.from(bucket).remove([filePath])

        if (error) throw error

        toast.success('Archivo eliminado')
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al eliminar archivo'
        toast.error(errorMessage)
        return false
      }
    },
    [bucket]
  )

  /**
   * Get public URL for a file
   */
  const getPublicUrl = useCallback(
    (filePath: string): string => {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath)
      return publicUrl
    },
    [bucket]
  )

  /**
   * List files in a folder
   */
  const listFiles = useCallback(
    async (folderPath: string): Promise<string[]> => {
      try {
        const { data, error } = await supabase.storage.from(bucket).list(folderPath)

        if (error) throw error

        return data.map((file) => `${folderPath}/${file.name}`)
      } catch (err) {
        console.error('Error listing files:', err)
        return []
      }
    },
    [bucket]
  )

  return {
    // State
    isUploading,
    uploadProgress,
    error,
    // Actions
    uploadFile,
    uploadFiles,
    deleteFile,
    getPublicUrl,
    listFiles,
    validateFile,
  }
}