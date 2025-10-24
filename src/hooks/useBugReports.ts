import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical'
export type BugReportStatus =
  | 'reported'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'wont_fix'

export interface BugReport {
  id: string
  user_id: string
  title: string
  description: string
  steps_to_reproduce?: string
  severity: BugReportSeverity
  category?: string
  affected_page?: string
  user_agent?: string
  browser_version?: string
  device_type?: string
  screen_resolution?: string
  status: BugReportStatus
  priority: string
  assigned_to?: string
  resolution_notes?: string
  resolved_at?: string
  resolved_by?: string
  created_at: string
  updated_at: string
}

export interface BugReportEvidence {
  id: string
  bug_report_id: string
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
  uploaded_by: string
  uploaded_at: string
  description?: string
}

export interface CreateBugReportData {
  title: string
  description: string
  stepsToReproduce?: string
  severity: BugReportSeverity
  category?: string
  affectedPage?: string
}

interface UseBugReportsReturn {
  loading: boolean
  error: string | null
  createBugReport: (data: CreateBugReportData, files?: File[]) => Promise<BugReport | null>
  uploadEvidence: (
    bugReportId: string,
    file: File,
    description?: string
  ) => Promise<BugReportEvidence | null>
  getBugReports: () => Promise<BugReport[]>
  getBugReportById: (id: string) => Promise<BugReport | null>
  getEvidences: (bugReportId: string) => Promise<BugReportEvidence[]>
  deleteBugReport: (id: string) => Promise<boolean>
  deleteEvidence: (id: string, filePath: string) => Promise<boolean>
}

export function useBugReports(): UseBugReportsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Obtener información técnica del navegador
  const getTechnicalInfo = useCallback(() => {
    const userAgent = navigator.userAgent
    const browserVersion = getBrowserInfo()
    const deviceType = getDeviceType()
    const screenResolution = `${window.screen.width}x${window.screen.height}`
    const affectedPage = window.location.pathname

    return {
      userAgent,
      browserVersion,
      deviceType,
      screenResolution,
      affectedPage,
    }
  }, [])

  // Detectar navegador y versión
  const getBrowserInfo = (): string => {
    const ua = navigator.userAgent
    let browser = 'Unknown'

    if (ua.includes('Firefox')) {
      const match = ua.match(/Firefox\/(\d+\.\d+)/)
      browser = `Firefox ${match ? match[1] : ''}`
    } else if (ua.includes('Chrome') && !ua.includes('Edg')) {
      const match = ua.match(/Chrome\/(\d+\.\d+)/)
      browser = `Chrome ${match ? match[1] : ''}`
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      const match = ua.match(/Version\/(\d+\.\d+)/)
      browser = `Safari ${match ? match[1] : ''}`
    } else if (ua.includes('Edg')) {
      const match = ua.match(/Edg\/(\d+\.\d+)/)
      browser = `Edge ${match ? match[1] : ''}`
    }

    return browser
  }

  // Detectar tipo de dispositivo
  const getDeviceType = (): string => {
    const ua = navigator.userAgent

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'Tablet'
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      )
    ) {
      return 'Mobile'
    }
    return 'Desktop'
  }

  // Crear reporte de bug
  const createBugReport = useCallback(
    async (data: CreateBugReportData, files?: File[]): Promise<BugReport | null> => {
      if (!user) {
        toast.error('Debes iniciar sesión para reportar un problema')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        // Obtener información técnica
        const techInfo = getTechnicalInfo()

        // Crear el reporte
        const { data: bugReport, error: insertError } = await supabase
          .from('bug_reports')
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description,
            steps_to_reproduce: data.stepsToReproduce,
            severity: data.severity,
            category: data.category,
            affected_page: data.affectedPage || techInfo.affectedPage,
            user_agent: techInfo.userAgent,
            browser_version: techInfo.browserVersion,
            device_type: techInfo.deviceType,
            screen_resolution: techInfo.screenResolution,
            status: 'open',
            priority: data.severity === 'critical' || data.severity === 'high' ? 'high' : 'normal',
          })
          .select()
          .single()

        if (insertError) throw insertError
        if (!bugReport) throw new Error('No se pudo crear el reporte')

        // Subir archivos si existen
        if (files && files.length > 0) {
          const uploadPromises = files.map(file => uploadEvidence(bugReport.id, file))
          await Promise.all(uploadPromises)
        }

        // Obtener información del perfil del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        // Llamar a la Edge Function para enviar email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-bug-report-email', {
            body: {
              bugReportId: bugReport.id,
              userId: user.id,
              title: data.title,
              description: data.description,
              stepsToReproduce: data.stepsToReproduce,
              severity: data.severity,
              userEmail: profile?.email || user.email || 'unknown',
              userName: profile?.full_name || 'Usuario',
              userAgent: techInfo.userAgent,
              browserVersion: techInfo.browserVersion,
              deviceType: techInfo.deviceType,
              screenResolution: techInfo.screenResolution,
              affectedPage: techInfo.affectedPage,
            },
          })

          if (emailError) {
            console.error('Error sending email:', emailError)
            // No fallar el reporte si falla el email
          }
        } catch (emailError) {
          console.error('Error calling email function:', emailError)
          // No fallar el reporte si falla el email
        }

        toast.success('Reporte enviado correctamente', {
          description: 'Nuestro equipo revisará tu reporte pronto',
        })

        return bugReport as BugReport
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear el reporte'
        setError(message)
        toast.error('Error al enviar el reporte', {
          description: message,
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [user, getTechnicalInfo]
  )

  // Subir evidencia
  const uploadEvidence = useCallback(
    async (
      bugReportId: string,
      file: File,
      description?: string
    ): Promise<BugReportEvidence | null> => {
      if (!user) {
        toast.error('Debes iniciar sesión')
        return null
      }

      try {
        // Validar tamaño (10MB máximo)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('El archivo no puede superar los 10MB')
        }

        // Generar path único: userId/bugReportId/timestamp-filename
        const timestamp = Date.now()
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${user.id}/${bugReportId}/${timestamp}-${fileName}`

        // Subir a Storage
        const { error: uploadError } = await supabase.storage
          .from('bug-reports-evidence')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Crear registro en la base de datos
        const { data: evidence, error: insertError } = await supabase
          .from('bug_report_evidences')
          .insert({
            bug_report_id: bugReportId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id,
            description,
          })
          .select()
          .single()

        if (insertError) throw insertError

        return evidence as BugReportEvidence
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir el archivo'
        toast.error('Error al subir evidencia', {
          description: message,
        })
        return null
      }
    },
    [user]
  )

  // Obtener reportes del usuario
  const getBugReports = useCallback(async (): Promise<BugReport[]> => {
    if (!user) return []

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []) as BugReport[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener reportes'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  // Obtener reporte por ID
  const getBugReportById = useCallback(
    async (id: string): Promise<BugReport | null> => {
      if (!user) return null

      try {
        const { data, error: fetchError } = await supabase
          .from('bug_reports')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError

        return data as BugReport
      } catch (err) {
        console.error('Error fetching bug report:', err)
        return null
      }
    },
    [user]
  )

  // Obtener evidencias de un reporte
  const getEvidences = useCallback(
    async (bugReportId: string): Promise<BugReportEvidence[]> => {
      if (!user) return []

      try {
        const { data, error: fetchError } = await supabase
          .from('bug_report_evidences')
          .select('*')
          .eq('bug_report_id', bugReportId)
          .order('uploaded_at', { ascending: false })

        if (fetchError) throw fetchError

        return (data || []) as BugReportEvidence[]
      } catch (err) {
        console.error('Error fetching evidences:', err)
        return []
      }
    },
    [user]
  )

  // Eliminar reporte
  const deleteBugReport = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false

      try {
        // Primero eliminar evidencias del storage
        const evidences = await getEvidences(id)

        for (const evidence of evidences) {
          await supabase.storage.from('bug-reports-evidence').remove([evidence.file_path])
        }

        // Eliminar el reporte (cascade eliminará evidencias y comentarios)
        const { error: deleteError } = await supabase
          .from('bug_reports')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        toast.success('Reporte eliminado correctamente')
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar el reporte'
        toast.error('Error al eliminar', {
          description: message,
        })
        return false
      }
    },
    [user, getEvidences]
  )

  // Eliminar evidencia
  const deleteEvidence = useCallback(
    async (id: string, filePath: string): Promise<boolean> => {
      if (!user) return false

      try {
        // Eliminar del storage
        const { error: storageError } = await supabase.storage
          .from('bug-reports-evidence')
          .remove([filePath])

        if (storageError) throw storageError

        // Eliminar el registro
        const { error: deleteError } = await supabase
          .from('bug_report_evidences')
          .delete()
          .eq('id', id)
          .eq('uploaded_by', user.id)

        if (deleteError) throw deleteError

        toast.success('Evidencia eliminada correctamente')
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar la evidencia'
        toast.error('Error al eliminar', {
          description: message,
        })
        return false
      }
    },
    [user]
  )

  return {
    loading,
    error,
    createBugReport,
    uploadEvidence,
    getBugReports,
    getBugReportById,
    getEvidences,
    deleteBugReport,
    deleteEvidence,
  }
}
