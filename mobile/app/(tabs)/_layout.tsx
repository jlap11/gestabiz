import React, { useEffect, useState } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Badge, Menu, Divider } from 'react-native-paper'
import { useAuth } from '../../lib/auth'
import { useUserRoles } from '../../../src/hooks/useUserRoles'
import { useInAppNotifications } from '../../../src/hooks/useInAppNotifications'
import type { UserRole } from '../../../src/types/types'

export default function TabsLayout() {
  const { user } = useAuth()
  const router = useRouter()
  const { activeRole, availableRoles, switchRole } = useUserRoles()
  const { unreadCount } = useInAppNotifications()

  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    // Si no hay rol activo pero hay roles disponibles, setear el primero
    if (!activeRole && availableRoles.length > 0) {
      switchRole(availableRoles[0])
    }
  }, [activeRole, availableRoles])

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role)
    setMenuVisible(false)
    
    // Navegar al tab correspondiente
    switch (role) {
      case 'admin':
        router.push('/(tabs)/admin')
        break
      case 'employee':
        router.push('/(tabs)/employee')
        break
      case 'client':
        router.push('/(tabs)/client')
        break
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'business'
      case 'employee':
        return 'briefcase'
      case 'client':
        return 'person'
      default:
        return 'person'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'employee':
        return 'Empleado'
      case 'client':
        return 'Cliente'
      default:
        return 'Usuario'
    }
  }

  // Determinar qué tabs mostrar según el rol activo
  const getTabsConfig = () => {
    switch (activeRole) {
      case 'admin':
        return [
          { name: 'admin', label: 'Panel Admin', icon: 'grid' },
          { name: 'notifications', label: 'Notificaciones', icon: 'notifications', badge: unreadCount },
          { name: 'chat', label: 'Chat', icon: 'chatbubbles' },
          { name: 'settings', label: 'Ajustes', icon: 'settings' },
        ]
      case 'employee':
        return [
          { name: 'employee', label: 'Empleado', icon: 'briefcase' },
          { name: 'notifications', label: 'Notificaciones', icon: 'notifications', badge: unreadCount },
          { name: 'chat', label: 'Chat', icon: 'chatbubbles' },
          { name: 'settings', label: 'Ajustes', icon: 'settings' },
        ]
      case 'client':
      default:
        return [
          { name: 'client', label: 'Buscar', icon: 'search' },
          { name: 'appointments', label: 'Citas', icon: 'calendar' },
          { name: 'notifications', label: 'Notificaciones', icon: 'notifications', badge: unreadCount },
          { name: 'chat', label: 'Chat', icon: 'chatbubbles' },
          { name: 'settings', label: 'Ajustes', icon: 'settings' },
        ]
    }
  }

  const tabsConfig = getTabsConfig()

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#1E293B',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        headerRight: () => (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={styles.roleButton}
              >
                <Ionicons name={getRoleIcon(activeRole as UserRole)} size={24} color="#3B82F6" />
              </TouchableOpacity>
            }
          >
            {availableRoles.map((role) => (
              <React.Fragment key={role}>
                <Menu.Item
                  onPress={() => handleRoleSwitch(role)}
                  title={getRoleLabel(role)}
                  leadingIcon={getRoleIcon(role)}
                  disabled={role === activeRole}
                  style={role === activeRole ? styles.activeRole : undefined}
                />
                {role !== availableRoles[availableRoles.length - 1] && <Divider />}
              </React.Fragment>
            ))}
          </Menu>
        ),
      }}
    >
      {/* Renderizar tabs dinámicamente según rol */}
      {activeRole === 'admin' && (
        <>
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Panel Admin',
              tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
            }}
          />
        </>
      )}

      {activeRole === 'employee' && (
        <>
          <Tabs.Screen
            name="employee"
            options={{
              title: 'Empleado',
              tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} />,
            }}
          />
        </>
      )}

      {activeRole === 'client' && (
        <>
          <Tabs.Screen
            name="client"
            options={{
              title: 'Buscar',
              tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              title: 'Mis Citas',
              tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
            }}
          />
        </>
      )}

      {/* Tabs comunes para todos los roles */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications" size={size} color={color} />
              {unreadCount > 0 && (
                <Badge style={styles.badge} size={16}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />

      {/* Ocultar tabs que no corresponden al rol activo */}
      {activeRole !== 'admin' && (
        <Tabs.Screen
          name="admin"
          options={{
            href: null, // Oculta el tab
          }}
        />
      )}
      {activeRole !== 'employee' && (
        <Tabs.Screen
          name="employee"
          options={{
            href: null, // Oculta el tab
          }}
        />
      )}
      {activeRole !== 'client' && (
        <>
          <Tabs.Screen
            name="client"
            options={{
              href: null, // Oculta el tab
            }}
          />
          <Tabs.Screen
            name="appointments"
            options={{
              href: null, // Oculta el tab
            }}
          />
        </>
      )}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  roleButton: {
    marginRight: 16,
    padding: 4,
  },
  activeRole: {
    backgroundColor: '#EBF4FF',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
  },
})


