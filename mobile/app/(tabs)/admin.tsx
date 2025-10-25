import React from 'react'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Admin Dashboard - Renderiza el dashboard web completo
 * 
 * Contenido web incluye:
 * - Estadísticas en tiempo real (citas, ingresos, clientes)
 * - Calendario de citas
 * - Gestión de sedes
 * - Gestión de servicios
 * - Gestión de empleados (jerarquía)
 * - Reclutamiento (vacantes laborales)
 * - Ausencias (aprobar/rechazar)
 * - Billing (pagos Stripe/PayU/MercadoPago)
 * - Reportes financieros
 * - Contabilidad (IVA, ICA, Retención)
 * 
 * ✅ 100% reutilización de código web
 * ✅ Todos los hooks web funcionan automáticamente
 * ✅ Permisos granulares aplicados
 */
export default function AdminDashboard() {
  return <WebViewDashboard route="/app/admin" />
}
