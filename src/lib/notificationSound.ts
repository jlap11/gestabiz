/**
 * Utilidad para reproducir sonidos de notificación
 * Usa Audio API del navegador para reproducir sonidos sin necesidad de archivos externos
 */

// Audio Context para generar sonidos
let audioContext: AudioContext | null = null

/**
 * Inicializa el Audio Context (necesario para navegadores modernos)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

/**
 * Reproduce un tono de notificación
 * Genera un sonido sintético sin necesidad de archivos de audio
 */
export function playNotificationSound(type: 'message' | 'alert' | 'success' = 'message'): void {
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
        oscillator.frequency.setValueAtTime(1046.50, context.currentTime + 0.12) // Do6 (nota alta)
        break
      case 'alert':
        // Tono más urgente (Sol - Do alto)
        oscillator.frequency.setValueAtTime(783.99, context.currentTime) // Sol5
        oscillator.frequency.setValueAtTime(1046.50, context.currentTime + 0.1) // Do6
        break
      case 'success':
        // Tono ascendente positivo (Do - Sol - Do alto)
        oscillator.frequency.setValueAtTime(523.25, context.currentTime) // Do5
        oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.08) // Sol5
        oscillator.frequency.setValueAtTime(1046.50, context.currentTime + 0.16) // Do6
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
    
  } catch (error) {
    // Silenciar errores de audio (no queremos romper la app si no hay audio)
    console.warn('No se pudo reproducir el sonido de notificación:', error)
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
export function playNotificationFeedback(type: 'message' | 'alert' | 'success' = 'message'): void {
  playNotificationSound(type)
  vibrateNotification()
}
