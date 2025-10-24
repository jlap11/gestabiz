/**
 * Utilidad para reproducir sonidos de notificación
 * Usa Audio API del navegador para reproducir sonidos sin necesidad de archivos externos
 */

// Audio Context para generar sonidos
let audioContext: AudioContext | null = null

type AudioContextConstructor = typeof AudioContext
type AudioContextGlobal = typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor
}

/**
 * Inicializa el Audio Context (necesario para navegadores modernos)
 */
function getAudioContext(): AudioContext {
  if (audioContext) {
    return audioContext
  }

  const ctxGlobal = globalThis as AudioContextGlobal
  const AudioContextClass: AudioContextConstructor | undefined =
    ctxGlobal.AudioContext ?? ctxGlobal.webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('AudioContext not supported')
  }

  const createdContext = new AudioContextClass()
  audioContext = createdContext
  return createdContext
}

/**
 * Reproduce un tono de notificación
 * Genera un sonido sintético sin necesidad de archivos de audio
 */
type NotificationTone = 'message' | 'alert' | 'success' | 'chat-active'

export function playNotificationSound(type: NotificationTone = 'message'): void {
  try {
    const context = getAudioContext()

    // Crear oscilador para generar el tono
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    // Configurar tipo de onda y frecuencia según el tipo de notificación
    oscillator.type = 'sine'

    switch (type) {
      case 'message':
        // ✨ Tono tipo "ding" para mensajes de chat (Mi - Sol - Do alto)
        oscillator.frequency.setValueAtTime(659.25, context.currentTime) // Mi5
        oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.06) // Sol5
        oscillator.frequency.setValueAtTime(1046.5, context.currentTime + 0.12) // Do6 (nota alta)
        break
      case 'alert':
        // Tono más urgente (Sol - Do alto)
        oscillator.frequency.setValueAtTime(783.99, context.currentTime) // Sol5
        oscillator.frequency.setValueAtTime(1046.5, context.currentTime + 0.1) // Do6
        break
      case 'success':
        // Tono ascendente positivo (Do - Sol - Do alto)
        oscillator.frequency.setValueAtTime(523.25, context.currentTime) // Do5
        oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.08) // Sol5
        oscillator.frequency.setValueAtTime(1046.5, context.currentTime + 0.16) // Do6
        break
      case 'chat-active':
        // Tono más suave para mensajes dentro del chat activo (Re - Fa - La)
        oscillator.frequency.setValueAtTime(587.33, context.currentTime) // Re5
        oscillator.frequency.setValueAtTime(698.46, context.currentTime + 0.05) // Fa5
        oscillator.frequency.setValueAtTime(880, context.currentTime + 0.1) // La5
        break
    }

    // Conectar nodos
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    // Configurar envolvente de volumen (fade in/out suave)
    gainNode.gain.setValueAtTime(0, context.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01) // Fade in rápido
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2) // Fade out

    // Reproducir sonido
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.2)
  } catch {
    // Silenciar errores de audio (no queremos romper la app si no hay audio)
  }
}

/**
 * Reproduce el sonido de notificación de mensaje de chat
 */
export function playChatMessageSound(): void {
  playNotificationSound('message')
}

/**
 * Reproduce el sonido de notificación de alerta
 */
export function playAlertSound(): void {
  playNotificationSound('alert')
}

/**
 * Reproduce el sonido de notificación de éxito
 */
export function playSuccessSound(): void {
  playNotificationSound('success')
}

/**
 * Vibra el dispositivo si está disponible (móviles)
 * Patrón: vibración corta para notificación
 */
export function vibrateNotification(): void {
  if ('vibrate' in navigator) {
    // Patrón: vibrar 100ms, pausar 50ms, vibrar 100ms
    navigator.vibrate([100, 50, 100])
  }
}

/**
 * Reproduce sonido y vibra (feedback completo)
 */
export function playNotificationFeedback(type: NotificationTone = 'message'): void {
  playNotificationSound(type)
  vibrateNotification()
}

export function playActiveChatMessageSound(): void {
  playNotificationFeedback('chat-active')
}
