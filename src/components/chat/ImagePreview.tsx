import React, { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ImagePreviewProps {
  src: string
  alt: string
  className?: string
}

/**
 * ImagePreview Component
 *
 * Preview de imagen con modal full-screen:
 * - Thumbnail clickeable
 * - Modal con imagen ampliada
 * - Zoom in/out
 * - Download button
 * - Close con ESC o click fuera
 */
export function ImagePreview({ src, alt, className }: Readonly<ImagePreviewProps>) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [zoom, setZoom] = useState(100)

  /**
   * Download image
   */
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = alt || 'image.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      // Error silencioso (el navegador abrirá la imagen en nueva tab si falla)
      window.open(src, '_blank')
    }
  }

  /**
   * Zoom in
   */
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  /**
   * Zoom out
   */
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  /**
   * Reset zoom when opening
   */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setZoom(100)
    }
  }

  return (
    <>
      {/* Thumbnail */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'relative overflow-hidden rounded-lg cursor-pointer',
          'hover:opacity-90 transition-opacity',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'group',
          className
        )}
        aria-label={t('common.previewImage') || 'Ver imagen'}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* Full-screen modal */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-full sm:max-w-screen-lg w-full h-[94vh] sm:h-[90vh] p-0 sm:rounded-lg rounded-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          aria-label={alt}
        >
          <DialogHeader className="p-3 sm:p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate pr-4 text-sm sm:text-base">{alt}</DialogTitle>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-6 sm:w-6"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    aria-label={t('common.zoomOut') || 'Alejar'}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium min-w-[3ch] text-center">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-6 sm:w-6"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    aria-label={t('common.zoomIn') || 'Acercar'}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Download button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  title="Descargar imagen"
                  className="h-8 w-8 sm:h-6 sm:w-6"
                  aria-label={t('common.download') || 'Descargar'}
                >
                  <Download className="h-4 w-4" />
                </Button>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 sm:h-6 sm:w-6"
                  aria-label={t('common.close') || 'Cerrar'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Image container */}
          <div className="flex-1 overflow-auto p-3 sm:p-4 bg-black/5">
            <div className="flex items-center justify-center min-h-full">
              <img
                src={src}
                alt={alt}
                style={{
                  width: `${zoom}%`,
                  maxWidth: 'none',
                }}
                className="object-contain max-h-[60vh] sm:max-h-[75vh]"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}