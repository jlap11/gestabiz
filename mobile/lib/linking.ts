import * as Linking from 'expo-linking'

/**
 * Configuración de Deep Linking para Expo Router
 * 
 * Soporta:
 * - gestabiz:// (esquema personalizado)
 * - https://gestabiz.com (web links)
 * - https://app.gestabiz.com (subdomain)
 */

export const linking = {
  prefixes: [
    'gestabiz://',
    'https://gestabiz.com',
    'https://app.gestabiz.com',
    Linking.createURL('/'),
  ],
  
  config: {
    screens: {
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register',
          'forgot-password': 'forgot-password',
        },
      },
      '(tabs)': {
        screens: {
          client: 'app/client',
          admin: 'app/admin',
          employee: 'app/employee',
          appointments: 'app/appointments',
          notifications: 'app/notifications',
          chat: 'app/chat',
          settings: 'app/settings',
        },
      },
    },
  },
}

/**
 * Ejemplos de deep links soportados:
 * 
 * gestabiz://app/client → ClientDashboard
 * gestabiz://app/admin → AdminDashboard
 * gestabiz://app/employee → EmployeeDashboard
 * gestabiz://app/appointments → AppointmentsScreen
 * gestabiz://app/chat → ChatScreen
 * 
 * https://gestabiz.com/app/client → ClientDashboard
 * https://app.gestabiz.com/client → ClientDashboard
 */

/**
 * Helper para crear deep links programáticamente
 */
export function createDeepLink(path: string): string {
  return Linking.createURL(path)
}

/**
 * Helper para parsear deep links entrantes
 */
export async function parseDeepLink(url: string) {
  const { path, queryParams } = Linking.parse(url)
  return { path, queryParams }
}


