/**
 * Edge Function: request-absence
 *
 * Permite a empleados solicitar ausencias/vacaciones.
 * Crea solicitud de aprobación y envía notificaciones.
 *
 * Features:
 * - Validación de balance de vacaciones
 * - Creación de solicitud de aprobación
 * - Notificación a administradores (email + in-app)
 * - Validación de fechas y solapamientos
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AbsenceRequest {
  businessId: string
  absenceType: 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other'
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  reason: string
  employeeNotes?: string
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtener todos los headers disponibles
    const authHeader = req.headers.get('Authorization') || ''
    const xClientInfo = req.headers.get('x-client-info') || ''
    const xUserId = req.headers.get('x-user-id') || ''

    console.log('[request-absence] Headers:', {
      authLength: authHeader.length,
      xUserIdPresent: !!xUserId,
      xClientInfoPresent: !!xClientInfo,
    })

    // Crear cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Intentar obtener el usuario autenticado
    let userId: string | undefined
    let user: any = null

    // Primero, intentar getUser()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authUser?.id) {
      userId = authUser.id
      user = authUser
      console.log('[request-absence] User from getUser:', { userId })
    } else if (xUserId) {
      // Fallback: si x-user-id viene en headers, usarlo
      userId = xUserId
      console.log('[request-absence] User from x-user-id header:', { userId })
    }

    if (!userId) {
      throw new Error(`No autenticado - authError: ${authError?.message}`)
    }

    const requestData: AbsenceRequest = await req.json()
    const { businessId, absenceType, startDate, endDate, reason, employeeNotes } = requestData

    console.log('[request-absence] Parsed data:', {
      businessId,
      absenceType,
      startDate,
      endDate,
      hasReason: !!reason,
    })

    // 1. Validar fechas
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log('[request-absence] Date validation:', {
      start: start.toISOString(),
      end: end.toISOString(),
      today: today.toISOString(),
      startGreaterThanEnd: start > end,
    })

    if (start > end) {
      throw new Error('Fecha de inicio no puede ser después de fecha de fin')
    }

    // 2. Obtener configuración del negocio
    const { data: business, error: businessError } = await supabaseClient
      .from('businesses')
      .select(
        'vacation_days_per_year, allow_same_day_absence, require_absence_approval, max_advance_vacation_request_days, owner_id'
      )
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      throw new Error('Negocio no encontrado')
    }

    // Validar si es mismo día y no está permitido
    if (
      !business.allow_same_day_absence &&
      start.getTime() === today.getTime() &&
      absenceType !== 'emergency'
    ) {
      throw new Error('No se permiten ausencias el mismo día excepto emergencias')
    }

    // Validar anticipación para vacaciones
    if (absenceType === 'vacation') {
      const daysAdvance = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysAdvance > business.max_advance_vacation_request_days) {
        throw new Error(
          `Vacaciones solo pueden solicitarse con máximo ${business.max_advance_vacation_request_days} días de anticipación`
        )
      }
      if (start < today) {
        throw new Error('Vacaciones no pueden ser en el pasado')
      }
    }

    // 3. Verificar si empleado existe en el negocio
    const { data: employee, error: employeeError } = await supabaseClient
      .from('business_employees')
      .select('id, hire_date')
      .eq('employee_id', userId)
      .eq('business_id', businessId)
      .single()

    if (employeeError || !employee) {
      throw new Error('Empleado no encontrado en este negocio')
    }

    // 4. Si es vacación, validar balance
    if (absenceType === 'vacation') {
      const currentYear = start.getFullYear()
      const daysRequested =
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Calcular años trabajados
      if (!employee.hire_date) {
        throw new Error('Fecha de contratación no configurada. Contacte a su administrador.')
      }

      const hireDate = new Date(employee.hire_date)
      const yearsWorked = Math.floor(
        (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      )

      if (yearsWorked < 1) {
        throw new Error('Debe completar al menos 1 año de trabajo para solicitar vacaciones')
      }

      // Obtener balance actual - CAMBIO CLAVE: usar maybeSingle() en vez de single()
      // Si no existe el registro, balance será null y usaremos valores por defecto
      const { data: balance } = await supabaseClient
        .from('vacation_balance')
        .select('total_days_available, days_used, days_pending')
        .eq('business_id', businessId)
        .eq('employee_id', userId)
        .eq('year', currentYear)
        .maybeSingle()

      const totalAvailable = balance?.total_days_available || business.vacation_days_per_year
      const daysUsed = balance?.days_used || 0
      const daysPending = balance?.days_pending || 0
      const daysRemaining = totalAvailable - daysUsed - daysPending

      if (daysRequested > daysRemaining) {
        throw new Error(
          `Solo tiene ${daysRemaining} días de vacaciones disponibles. Solicitó ${daysRequested} días.`
        )
      }
    }

    // 5. Verificar solapamientos con ausencias existentes
    const { data: existingAbsences } = await supabaseClient
      .from('employee_absences')
      .select('id, start_date, end_date, absence_type')
      .eq('employee_id', userId)
      .eq('business_id', businessId)
      .in('status', ['pending', 'approved'])
      .gte('end_date', startDate)
      .lte('start_date', endDate)

    if (existingAbsences && existingAbsences.length > 0) {
      throw new Error('Ya tiene una ausencia programada en este periodo')
    }

    // 6. Crear solicitud de ausencia
    const { data: absence, error: absenceError } = await supabaseClient
      .from('employee_absences')
      .insert({
        business_id: businessId,
        employee_id: userId,
        absence_type: absenceType,
        start_date: startDate,
        end_date: endDate,
        reason,
        employee_notes: employeeNotes,
        status: business.require_absence_approval ? 'pending' : 'approved',
      })
      .select()
      .single()

    if (absenceError || !absence) {
      throw new Error('Error al crear solicitud de ausencia')
    }

    // 7. Si requiere aprobación, crear solicitud de aprobación
    if (business.require_absence_approval) {
      const { error: approvalError } = await supabaseClient
        .from('absence_approval_requests')
        .insert({
          absence_id: absence.id,
          business_id: businessId,
          requested_by: userId,
          assigned_to: null, // Cualquier admin puede aprobar
          status: 'pending',
        })

      if (approvalError) {
        console.error('Error creating approval request:', approvalError)
      }

      // 8. Obtener perfil del empleado para el nombre
      const { data: employeeProfile } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      const employeeName = employeeProfile?.full_name || 'Un empleado'

      // 9. Obtener TODOS los managers/admins del negocio
      const { data: admins } = await supabaseClient
        .from('business_employees')
        .select('employee_id, profiles(full_name, email)')
        .eq('business_id', businessId)
        .in('role', ['manager', 'admin'])

      // Siempre incluir al owner
      const adminEmails = new Set<string>()
      const adminIds = new Set<string>()

      for (const admin of admins || []) {
        adminIds.add(admin.employee_id)
        if (admin.profiles?.email) {
          adminEmails.add(admin.profiles.email)
        }
      }

      // Agregar owner si no está en la lista
      adminIds.add(business.owner_id)
      const { data: ownerProfile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', business.owner_id)
        .single()

      if (ownerProfile?.email) {
        adminEmails.add(ownerProfile.email)
      }

      // 10. Crear notificación in-app para CADA admin
      for (const adminId of adminIds) {
        const { error: notifError } = await supabaseClient.from('in_app_notifications').insert({
          user_id: adminId,
          type: 'absence_request',
          title: `Nueva solicitud de ${absenceType === 'vacation' ? 'vacaciones' : 'ausencia'}`,
          message: `${employeeName} ha solicitado ${absenceType === 'vacation' ? 'vacaciones' : 'una ausencia'} del ${startDate} al ${endDate}`,
          data: {
            absenceId: absence.id,
            employeeId: userId,
            employeeName,
            absenceType,
            startDate,
            endDate,
            businessId,
          },
          action_url: `/admin/approvals?tab=absences&id=${absence.id}`,
        })

        if (notifError) {
          console.error(`Error creating notification for admin ${adminId}:`, notifError)
        }
      }

      // 11. Enviar emails a TODOS los admins
      try {
        const absenceTypeLabel =
          {
            vacation: 'Vacaciones',
            emergency: 'Emergencia',
            sick_leave: 'Incapacidad médica',
            personal: 'Asunto personal',
            other: 'Otro',
          }[absenceType] || 'Ausencia'

        for (const email of adminEmails) {
          await supabaseClient.functions.invoke('send-notification', {
            body: {
              userEmail: email,
              type: 'email',
              subject: `Nueva solicitud de ${absenceTypeLabel} - ${employeeName}`,
              template: 'absence_request',
              data: {
                adminName: 'Administrador',
                employeeName,
                absenceType: absenceTypeLabel,
                startDate,
                endDate,
                reason,
                businessName: business.name,
              },
            },
          })
        }
      } catch (emailError) {
        console.error('Error sending notification emails:', emailError)
        // No fallar si el email no se envía (la notificación in-app sigue siendo válida)
      }
    } else {
      // Auto-aprobada, marcar como aprobada inmediatamente
      await supabaseClient
        .from('employee_absences')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', absence.id)

      // Cancelar citas si aplica
      console.log('TODO: Trigger Edge Function cancel-appointments-on-absence')
    }

    return new Response(
      JSON.stringify({
        success: true,
        absence,
        requiresApproval: business.require_absence_approval,
        message: business.require_absence_approval
          ? 'Solicitud de ausencia creada. Pendiente de aprobación.'
          : 'Ausencia registrada exitosamente.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error in request-absence:', errorMessage)

    // ⚠️ IMPORTANTE: Retornar 200 incluso para errores
    // Si retornamos 400, el cliente de Supabase no parsea el body
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // ← Cambiar de 400 a 200 para que se parsee el body
      }
    )
  }
})
