import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { profileService, userSettingsService } from '../lib/supabase'

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: false,
    calendar_sync_enabled: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!user) return

    try {
      const { data: profileData } = await profileService.getProfile(user.id)
      setProfile(profileData)

      const { data: settingsData } = await userSettingsService.getUserSettings(user.id)
      if (settingsData) {
        setSettings({
          notifications_enabled: settingsData.notifications_enabled,
          email_notifications: settingsData.email_notifications,
          sms_notifications: settingsData.sms_notifications,
          calendar_sync_enabled: settingsData.calendar_sync_enabled,
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const updateSetting = async (key: string, value: boolean) => {
    if (!user) return

    setSettings({ ...settings, [key]: value })

    try {
      await userSettingsService.updateUserSettings(user.id, { [key]: value })
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: signOut, style: 'destructive' },
      ]
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#667eea" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.full_name || 'Usuario'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notificaciones habilitadas</Text>
            <Text style={styles.settingDescription}>
              Recibir notificaciones de la aplicación
            </Text>
          </View>
          <Switch
            value={settings.notifications_enabled}
            onValueChange={(value) => updateSetting('notifications_enabled', value)}
            trackColor={{ false: '#333', true: '#667eea' }}
            thumbColor={settings.notifications_enabled ? '#fff' : '#999'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notificaciones por email</Text>
            <Text style={styles.settingDescription}>
              Recibir emails de recordatorios
            </Text>
          </View>
          <Switch
            value={settings.email_notifications}
            onValueChange={(value) => updateSetting('email_notifications', value)}
            trackColor={{ false: '#333', true: '#667eea' }}
            thumbColor={settings.email_notifications ? '#fff' : '#999'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notificaciones por SMS</Text>
            <Text style={styles.settingDescription}>
              Recibir SMS de recordatorios
            </Text>
          </View>
          <Switch
            value={settings.sms_notifications}
            onValueChange={(value) => updateSetting('sms_notifications', value)}
            trackColor={{ false: '#333', true: '#667eea' }}
            thumbColor={settings.sms_notifications ? '#fff' : '#999'}
          />
        </View>
      </View>

      {/* Calendar Sync */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendario</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sincronización de calendario</Text>
            <Text style={styles.settingDescription}>
              Sincronizar citas con el calendario del dispositivo
            </Text>
          </View>
          <Switch
            value={settings.calendar_sync_enabled}
            onValueChange={(value) => updateSetting('calendar_sync_enabled', value)}
            trackColor={{ false: '#333', true: '#667eea' }}
            thumbColor={settings.calendar_sync_enabled ? '#fff' : '#999'}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Versión 1.0.0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Términos y condiciones</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Política de privacidad</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#999',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
})
