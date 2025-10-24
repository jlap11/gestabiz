/**
 * Utilidades para compresión de imágenes
 * Convierte imágenes a formatos optimizados y reduce tamaño automáticamente
 */

export interface CompressionOptions {
  /** Calidad JPEG (0-1), por defecto 0.85 */
  quality?: number
  /** Ancho máximo en píxeles, por defecto 2048 */
  maxWidth?: number
  /** Alto máximo en píxeles, por defecto 2048 */
  maxHeight?: number
  /** Tamaño máximo en MB, por defecto 2 */
  maxSizeMB?: number
}

/**
 * Comprime un blob de imagen a través de canvas
 */
async function compressImageBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  maxSizeBytes: number
): Promise<Blob | null> {
  return new Promise<Blob | null>(resolveBlob => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          resolveBlob(null)
          return
        }
        if (blob.size <= maxSizeBytes) {
          resolveBlob(blob)
        } else {
          resolveBlob(null)
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Procesa la compresión iterativa de imagen
 */
async function processImageCompression(
  canvas: HTMLCanvasElement,
  initialQuality: number,
  maxSizeMB: number
): Promise<Blob> {
  let currentQuality = initialQuality
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // Intentar con calidad progresivamente más baja si es muy grande
  for (let attempt = 0; attempt < 5; attempt++) {
    const blob = await compressImageBlob(canvas, currentQuality, maxSizeBytes)
    if (blob) {
      return blob
    }

    // Reducir calidad para siguiente intento
    currentQuality *= 0.85
  }

  // Si llegamos aquí, incluso con calidad muy baja es muy grande
  throw new Error(
    'No se pudo comprimir la imagen lo suficiente. La imagen es demasiado grande incluso con máxima compresión.'
  )
}

/**
 * Maneja la carga y procesamiento de imagen
 */
async function handleImageLoading(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  maxSizeMB: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = async () => {
      try {
        // Calcular dimensiones escaladas
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }

        // Crear canvas y comprimir
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto 2D del canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Procesar compresión
        const result = await processImageCompression(canvas, quality, maxSizeMB)
        resolve(result)
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'))
    }

    img.src = dataUrl
  })
}

/**
 * Comprime una imagen automáticamente
 *
 * Características:
 * - Convierte a JPEG de alta calidad
 * - Reduce dimensiones si exceden máximos
 * - Reintenta con calidad más baja si sigue siendo muy grande
 * - Valida que el resultado sea menor al tamaño máximo
 *
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión
 * @returns Blob comprimido
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<Blob> {
  const { quality = 0.85, maxWidth = 2048, maxHeight = 2048, maxSizeMB = 2 } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = event => {
      const dataUrl = event.target?.result as string
      handleImageLoading(dataUrl, maxWidth, maxHeight, quality, maxSizeMB)
        .then(resolve)
        .catch(reject)
    }

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Comprime una imagen para logo (pequeño y cuadrado)
 *
 * @param file - Archivo de imagen
 * @returns Blob comprimido optimizado para logo
 */
export async function compressImageForLogo(file: File): Promise<Blob> {
  return compressImage(file, {
    quality: 0.9,
    maxWidth: 512,
    maxHeight: 512,
    maxSizeMB: 1,
  })
}

/**
 * Comprime una imagen para banner (panorámica)
 *
 * @param file - Archivo de imagen
 * @returns Blob comprimido optimizado para banner
 */
export async function compressImageForBanner(file: File): Promise<Blob> {
  return compressImage(file, {
    quality: 0.85,
    maxWidth: 1920,
    maxHeight: 1080,
    maxSizeMB: 2,
  })
}

/**
 * Convierte un Blob a File
 *
 * @param blob - Blob a convertir
 * @param fileName - Nombre del archivo
 * @returns Archivo
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}

/**
 * Obtiene información de tamaño formateada
 *
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toString() + ' ' + sizes[i]
}
