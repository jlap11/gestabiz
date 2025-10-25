import React from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { List, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'
import WebViewDashboard from '../../components/WebViewDashboard'

/**
 * Settings Screen - Hybrid approach
 * 
 * Opciones nativas:
 * - Cerrar sesión (nativo para mejor UX)
 * 
 * Contenido web:
 * - Editar perfil
 * - Notificaciones preferences
 * - Idioma (español/inglés)
 * - Tema (claro/oscuro)
 * - Ayuda y soporte
 * - Términos y condiciones
 * - Política de privacidad
 * - Acerca de
 * 
 * ✅ Balance entre nativo y web
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showLogoutButton, setShowLogoutButton] = React.useState(true)

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Contenido web de settings */}
      <View style={styles.webviewContainer}>
        <WebViewDashboard route="/app/settings" />
      </View>

      {/* Botón nativo de cerrar sesión (siempre visible) */}
      {showLogoutButton && (
        <View style={styles.logoutSection}>
          <Divider />
          <List.Item
            title="Cerrar Sesión"
            description={user?.email || 'Usuario'}
            left={(props) => <List.Icon {...props} icon="logout" color="#EF4444" />}
            onPress={handleSignOut}
            titleStyle={styles.logoutText}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webviewContainer: {
    flex: 1,
  },
  logoutSection: {
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
})
