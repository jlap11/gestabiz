import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useBugReports, type BugReportSeverity } from '@/hooks/useBugReports'
import { AlertCircle, Upload, X, FileIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BugReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SEVERITY_CONFIG = {
  low: {
    label: 'Baja',
    description: 'Problema menor que no afecta el uso',
    color: 'bg-green-500/20 text-green-700 border-green-500/50',
    icon: '🟢'
  },
  medium: {
    label: 'Media',
    description: 'Problema que afecta algunas funciones',
    color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
    icon: '🟡'
  },
  high: {
    label: 'Alta',
    description: 'Problema grave que impide usar funciones importantes',
    color: 'bg-orange-500/20 text-orange-700 border-orange-500/50',
    icon: '🟠'
  },
  critical: {
    label: 'Crítica',
    description: 'Error bloqueante que impide usar la aplicación',
    color: 'bg-red-500/20 text-red-700 border-red-500/50',
    icon: '🔴'
  }
}

const MAX_FILES = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
  'text/plain'
]

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { createBugReport, loading } = useBugReports()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [severity, setSeverity] = useState<BugReportSeverity>('medium')
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Validar número de archivos
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast.error(`Máximo ${MAX_FILES} archivos permitidos`)
      return
    }

    // Validar cada archivo
    const validFiles: File[] = []
    for (const file of selectedFiles) {
      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} supera el tamaño máximo de 10MB`)
        continue
      }

      // Validar tipo
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} no es un tipo de archivo permitido`)
        continue
      }

      validFiles.push(file)
    }

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!title.trim()) {
      toast.error('El título es requerido')
      return
    }

    if (!description.trim()) {
      toast.error('La descripción es requerida')
      return
    }

    if (title.length < 10) {
      toast.error('El título debe tener al menos 10 caracteres')
      return
    }

    if (description.length < 20) {
      toast.error('La descripción debe tener al menos 20 caracteres')
      return
    }

    // Crear reporte
    const result = await createBugReport(
      {
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        severity,
        category: category.trim() || undefined
      },
      files.length > 0 ? files : undefined
    )

    if (result) {
      // Limpiar formulario
      setTitle('')
      setDescription('')
      setStepsToReproduce('')
      setSeverity('medium')
      setFiles([])
      setCategory('')
      
      // Cerrar modal
      onOpenChange(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertCircle className="h-6 w-6 text-primary" />
            Reportar un Problema
          </DialogTitle>
          <DialogDescription>
            Ayúdanos a mejorar reportando errores o problemas que encuentres en la aplicación.
            Tu reporte será enviado a nuestro equipo de soporte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Título del Problema *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Error al guardar cita"
              maxLength={255}
              required
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/255 caracteres (mínimo 10)
            </p>
          </div>

          {/* Severidad */}
          <div className="space-y-2">
            <Label htmlFor="severity" className="text-base font-semibold">
              Severidad *
            </Label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as BugReportSeverity)}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <div>
                        <div className="font-semibold">{config.label}</div>
                        <div className="text-xs text-muted-foreground">{config.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Badge visual de severidad */}
            <Badge className={SEVERITY_CONFIG[severity].color}>
              {SEVERITY_CONFIG[severity].icon} {SEVERITY_CONFIG[severity].label}
            </Badge>
          </div>

          {/* Categoría (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              Categoría (Opcional)
            </Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citas">Gestión de Citas</SelectItem>
                <SelectItem value="clientes">Gestión de Clientes</SelectItem>
                <SelectItem value="servicios">Servicios</SelectItem>
                <SelectItem value="empleados">Empleados</SelectItem>
                <SelectItem value="pagos">Pagos y Facturación</SelectItem>
                <SelectItem value="notificaciones">Notificaciones</SelectItem>
                <SelectItem value="calendario">Calendario</SelectItem>
                <SelectItem value="reportes">Reportes</SelectItem>
                <SelectItem value="configuracion">Configuración</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Descripción del Problema *
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalladamente qué sucedió, qué esperabas que sucediera y cualquier información relevante..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {description.length} caracteres (mínimo 20)
            </p>
          </div>

          {/* Pasos para reproducir */}
          <div className="space-y-2">
            <Label htmlFor="steps" className="text-base font-semibold">
              Pasos para Reproducir (Opcional)
            </Label>
            <Textarea
              id="steps"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Ve a la página de citas&#10;2. Haz clic en 'Nueva Cita'&#10;3. Completa el formulario&#10;4. El error aparece al hacer clic en 'Guardar'"
              rows={4}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Ayuda a nuestro equipo a reproducir el problema paso a paso
            </p>
          </div>

          {/* Upload de archivos */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Evidencias (Opcional)
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                disabled={files.length >= MAX_FILES}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  files.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Haz clic para subir archivos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Capturas de pantalla, videos, logs, etc.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Máximo {MAX_FILES} archivos, 10MB cada uno
                  </p>
                </div>
              </label>
            </div>

            {/* Lista de archivos */}
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">
                  Archivos seleccionados ({files.length}/{MAX_FILES}):
                </p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="ml-2 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info adicional */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              ℹ️ Información Técnica
            </p>
            <p className="text-xs text-muted-foreground">
              Se capturará automáticamente información sobre tu navegador, dispositivo y la página
              donde ocurrió el problema para ayudarnos a diagnosticarlo.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Reporte'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
