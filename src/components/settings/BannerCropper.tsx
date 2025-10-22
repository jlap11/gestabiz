import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface BannerCropperProps {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  onCropComplete: (croppedBlob: Blob) => void
}

export const BannerCropper: React.FC<BannerCropperProps> = ({
  isOpen,
  onClose,
  imageFile,
  onCropComplete
}) => {
  const { t } = useLanguage()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)

  // Load image when file changes
  React.useEffect(() => {
    if (!imageFile) return

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const result = reader.result
      if (typeof result === 'string') {
        setImageSrc(result)
      }
    })
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Initialize crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    
    // Calculate crop dimensions for 16:9 aspect ratio
    const aspectRatio = 16 / 9
    let cropWidth = width
    let cropHeight = width / aspectRatio

    // If calculated height is too tall, adjust based on height
    if (cropHeight > height) {
      cropHeight = height
      cropWidth = height * aspectRatio
    }

    // Center the crop
    const x = (width - cropWidth) / 2
    const y = (height - cropHeight) / 2

    const initialCrop: Crop = {
      unit: 'px',
      x,
      y,
      width: cropWidth,
      height: cropHeight
    }

    setCrop(initialCrop)
    setCompletedCrop(initialCrop as PixelCrop)
  }, [])

  // Generate cropped image as Blob
  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current) return null

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Set output dimensions (1200x675 for 16:9 at good quality)
    const outputWidth = 1200
    const outputHeight = 675

    canvas.width = outputWidth
    canvas.height = outputHeight

    // Draw the cropped image
    ctx.drawImage(
      image,
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
      0,
      0,
      outputWidth,
      outputHeight
    )

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.95
      )
    })
  }, [completedCrop])

  const handleCropConfirm = async () => {
    const croppedBlob = await getCroppedImg()
    if (croppedBlob) {
      onCropComplete(croppedBlob)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('bannerCropper.title')}</DialogTitle>
        </DialogHeader>

        {imageSrc && (
          <div className="flex flex-col items-center gap-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={16 / 9}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>

            <div className="text-sm text-muted-foreground">
              {t('bannerCropper.instructions')}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCropConfirm} disabled={!completedCrop}>
            {t('bannerCropper.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
