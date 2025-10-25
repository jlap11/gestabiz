import React from 'react'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Chat Screen - Renderiza el sistema de chat web completo
 * 
 * Contenido web incluye:
 * - Lista de conversaciones
 * - Chat en tiempo real (Supabase Realtime)
 * - Unread count automático
 * - Avatares y nombres
 * - Attachments (imágenes/archivos)
 * - Read receipts
 * - Typing indicators
 * - Fix de memory leak implementado (static channel names)
 * 
 * ✅ 100% reutilización de código web
 * ✅ Realtime updates automáticos
 * ✅ Performance optimizado
 */
export default function ChatScreen() {
  return <WebViewDashboard route="/app/chat" />
}
