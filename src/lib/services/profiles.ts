import supabase from '@/lib/supabase'
import type { User } from '@/types'
import type { Json } from '@/types/database'

export const profilesService = {
  async get(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) throw error
    if (!data) return null
  const settings = (data.settings as Json) as unknown as { language?: 'es' | 'en' } | null
  return {
      id: data.id,
      email: data.email,
      name: data.full_name || '',
      avatar_url: data.avatar_url || undefined,
      role: data.role,
      phone: data.phone || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_active: data.is_active,
  language: settings?.language || 'es',
      notification_preferences: {
        email: true, push: true, browser: true, whatsapp: false,
        reminder_24h: true, reminder_1h: true, reminder_15m: false,
        daily_digest: false, weekly_report: false
      },
      permissions: [],
      timezone: 'America/Mexico_City'
    }
  }
}
