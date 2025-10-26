import React, { useCallback, useState } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import type { ChatAttachment } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  conversationId: string;
  messageId: string;
  onUploadComplete: (attachments: ChatAttachment[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

/**
 * FileUpload Component
 * 
 * Componente para subir archivos a Supabase Storage con:
 * - Drag & drop
 * - Click to select
 * - Progress bar
 * - Preview de imágenes
 * - Validación de tipo y tamaño
 * - Múltiples archivos simultáneos
 */
export function FileUpload({
  conversationId,
  messageId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Validar archivo
   */
  const validateFile = useCallback((file: File): string | null => {
    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `El archivo ${file.name} excede el límite de ${maxSizeMB}MB`;
    }

    // Validar tipo
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}`;
    }

    return null;
  }, [maxSizeMB, acceptedTypes]);

  /**
   * Agregar archivos a la lista
   */
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    // Validar cantidad
    if (files.length + fileArray.length > maxFiles) {
      onUploadError?.(`Solo puedes subir hasta ${maxFiles} archivos a la vez`);
      return;
    }

    // Validar cada archivo
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return;
      }
    }

    setFiles(prev => [...prev, ...fileArray]);
  }, [files.length, maxFiles, onUploadError, validateFile]);

  /**
   * Remover archivo de la lista
   */
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  /**
   * Upload files to Supabase Storage
   */
  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedAttachments: ChatAttachment[] = [];

    try {
      for (const file of files) {
        // Generar path único
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${conversationId}/${messageId}/${fileName}`;

        // Simular progress (Supabase SDK no expone progress nativo)
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Upload a Supabase Storage
        const { error } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(`Error al subir ${file.name}: ${error.message}`);
        }

        // Simular progress completo
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Obtener URL pública (con signed URL para bucket privado)
        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        // Agregar a lista de attachments
        uploadedAttachments.push({
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }

      // Callback con attachments
      onUploadComplete(uploadedAttachments);

      // Limpiar estado
      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      onUploadError?.(message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Get icon for file type
   */
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-foreground mb-1">
          Arrastra archivos aquí o{' '}
          <label className="text-primary cursor-pointer hover:underline">
            selecciona
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </p>
        <p className="text-xs text-muted-foreground">
          Máximo {maxFiles} archivos, {maxSizeMB}MB cada uno
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Archivos seleccionados ({files.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Limpiar todos
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>

                  {/* Progress bar (si está subiendo) */}
                  {uploading && uploadProgress[file.name] !== undefined && (
                    <Progress
                      value={uploadProgress[file.name]}
                      className="h-1 mt-1"
                    />
                  )}
                </div>

                {/* Remove button */}
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}
