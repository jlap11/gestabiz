import React from 'react'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Notifications Screen - Renderiza el centro de notificaciones web completo
 * 
 * Contenido web incluye:
 * - Notificaciones in-app (17 tipos soportados)
 * - Filtros (Todas/Sin leer)
 * - Marcar como leído individual y masivo
 * - Navegación contextual según tipo
 * - Realtime updates (Supabase subscriptions)
 * - Iconos dinámicos por tipo
 * - Timestamps formateados
 * 
 * ✅ 100% reutilización de código web
 * ✅ Notificaciones en tiempo real automáticas
 * ✅ Sistema de supresión de chat integrado
 */
export default function NotificationsScreen() {
  return <WebViewDashboard route="/app/notifications" />
}
