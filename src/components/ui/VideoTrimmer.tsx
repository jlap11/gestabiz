import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Scissors, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface VideoTrimmerProps {
  videoFile: File
  maxDurationSeconds?: number
  onTrimComplete?: (startTime: number, endTime: number) => void
  onCancel?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function VideoTrimmer({
  videoFile,
  maxDurationSeconds = 45,
  onTrimComplete,
  onCancel,
  isOpen = true,
  onOpenChange,
  className,
}: VideoTrimmerProps) {
  // Validación temprana para evitar errores
  if (!videoFile) {
    return null
  }

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(maxDurationSeconds)
  const [videoUrl, setVideoUrl] = useState<string>('')

  useEffect(() => {
    if (!videoFile) return
    
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration
      setDuration(videoDuration)
      setEndTime(Math.min(maxDurationSeconds, videoDuration))
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Pausar automáticamente al llegar al final del segmento seleccionado
      if (video.currentTime >= endTime) {
        video.pause()
        setIsPlaying(false)
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [endTime, maxDurationSeconds])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      // Si estamos al final del segmento, volver al inicio
      if (currentTime >= endTime) {
        video.currentTime = startTime
      }
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimelineChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = value[0]
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleStartTimeChange = (value: number[]) => {
    const newStartTime = value[0]
    setStartTime(newStartTime)
    
    // Asegurar que el segmento no exceda la duración máxima
    const maxEndTime = Math.min(newStartTime + maxDurationSeconds, duration)
    if (endTime > maxEndTime) {
      setEndTime(maxEndTime)
    }
  }

  const handleEndTimeChange = (value: number[]) => {
    const newEndTime = value[0]
    const maxAllowedEndTime = Math.min(startTime + maxDurationSeconds, duration)
    setEndTime(Math.min(newEndTime, maxAllowedEndTime))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const selectedDuration = endTime - startTime

  const handleCancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  const handleConfirm = () => {
    onTrimComplete?.(startTime, endTime)
    onOpenChange?.(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Recortar Video
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona un segmento de máximo {maxDurationSeconds} segundos
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-64 object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={togglePlayPause}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Posición actual</label>
              <Slider
                value={[currentTime]}
                onValueChange={handleTimelineChange}
                max={duration}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span className="font-medium">{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Inicio del segmento</label>
                <Slider
                  value={[startTime]}
                  onValueChange={handleStartTimeChange}
                  max={Math.max(0, duration - maxDurationSeconds)}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Inicio: <span className="font-medium">{formatTime(startTime)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Final del segmento</label>
                <Slider
                  value={[endTime]}
                  onValueChange={handleEndTimeChange}
                  min={startTime}
                  max={Math.min(startTime + maxDurationSeconds, duration)}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Final: <span className="font-medium">{formatTime(endTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Duration Info */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Duración seleccionada:</span>
              <span className={cn(
                'text-sm font-semibold',
                selectedDuration > maxDurationSeconds ? 'text-destructive' : 'text-primary'
              )}>
                {formatTime(selectedDuration)} / {formatTime(maxDurationSeconds)}
              </span>
            </div>
            {selectedDuration > maxDurationSeconds && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <X className="h-3 w-3" />
                El segmento excede la duración máxima permitida
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedDuration > maxDurationSeconds}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}