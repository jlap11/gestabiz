import supabase from '@/lib/supabase'
import type { UserSettings } from '@/types'
import { normalizeUserSettings as normalize } from '@/lib/normalizers'

export const userSettingsService = {
  async getByUser(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return normalize(data as Record<string, unknown>)
  },
  async upsert(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...updates })
      .select()
      .single()
    if (error) throw error
    return normalize(data as Record<string, unknown>)
  },
}
