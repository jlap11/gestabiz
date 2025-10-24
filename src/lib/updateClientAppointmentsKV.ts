// Utilidad para actualizar el storage de citas del cliente tras crear una cita
export function updateClientAppointmentsKV(userId: string, appointment: any) {
  if (typeof window === 'undefined') return
  const key = `appointments-${userId}`
  try {
    const raw = window.localStorage.getItem(key)
    const prev = raw ? JSON.parse(raw) : []
    const updated = [appointment, ...prev]
    window.localStorage.setItem(key, JSON.stringify(updated))
  } catch {}
}
