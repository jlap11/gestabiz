import React from 'react'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Appointments Screen - Renderiza el listado web completo
 * 
 * Contenido web incluye:
 * - Lista de citas (próximas, completadas, canceladas)
 * - Filtros por estado y rango de fechas
 * - Detalle de cada cita
 * - Reprogramar cita
 * - Cancelar cita
 * - Calendario view
 * 
 * ✅ 100% reutilización de código web
 * ✅ Validaciones de edición automáticas
 */
export default function AppointmentsScreen() {
  return <WebViewDashboard route="/app/appointments" />
}
