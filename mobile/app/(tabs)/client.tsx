import React from 'react'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Client Dashboard - Renderiza el dashboard web completo
 * 
 * Contenido web incluye:
 * - Búsqueda de negocios/servicios/profesionales
 * - Booking wizard completo (7 pasos + 5 validaciones críticas)
 * - Próximas citas
 * - Favoritos
 * - Negocios cercanos (geolocalización)
 * - Historial de citas
 * 
 * ✅ 100% reutilización de código web
 * ✅ Traducciones automáticas (español/inglés)
 * ✅ Validaciones automáticas (horarios, almuerzo, overlap, ausencias, festivos)
 * ✅ Diseño responsive del web funciona
 */
export default function ClientDashboard() {
  return <WebViewDashboard route="/app/client" />
}
