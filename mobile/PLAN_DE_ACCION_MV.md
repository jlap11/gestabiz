# PLAN DE ACCIÓN - VERSIÓN MÓVIL (Expo + Expo Router)

> **Objetivo**: Implementar app móvil reutilizando hooks/servicios existentes, sin modificar código web.  
> **Estimación**: 23-32 días  
> **Paridad funcional**: 100% con web

## 0. ALCANCE Y PRINCIPIOS ⚠️

### Restricciones
- ❌ NO modificar archivos fuera de `mobile/` (excepto `package.json` raíz si necesario)
- ✅ Reutilizar 100%: hooks (`src/hooks/**`), servicios (`src/lib/services/**`), types, translations
- ✅ Mantener: arquitectura roles dinámicos, Supabase singleton, React Query

### Arquitectura Crítica
```
mobile/
├── app/                 # Expo Router (file-based routing)
│   ├── _layout.tsx      # Root: QueryClient, AuthProvider, NotificationProvider
│   ├── (auth)/          # Stack: login, register, forgot-password
│   ├── (tabs)/          # Bottom tabs dinámicos por rol
│   │   ├── admin/       # Stack admin
│   │   ├── employee/    # Stack employee
│   │   └── client/      # Stack client
│   └── appointment/     # Modales globales
├── lib/                 # Auth, notifications, utils móviles
├── components/          # Componentes RN reutilizables
└── types/               # Types específicos móvil (si necesario)
```

## 1. SETUP INICIAL (Día 1-2)

### 1.1 Instalar Dependencias
```bash
cd mobile
npm install @tanstack/react-query@^5.0.0
npm install react-native-paper@^5.11.1
npm install react-native-vector-icons@^10.0.0
npm install @react-native-async-storage/async-storage@1.18.2
npm install expo-secure-store@~12.3.1
npm install react-native-calendars@^1.1302.0
npm install react-native-gifted-chat@^2.4.0
npm install expo-notifications@~0.20.1
npm install expo-linking@~5.0.2
```

### 1.2 Configurar Variables de Entorno
```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 1.3 Root Layout (`mobile/app/_layout.tsx`)
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../lib/auth'
import { NotificationProvider } from '../lib/notifications'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min (mismo que web)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <Stack />
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
```

### 1.4 Configurar app.config.js
```javascript
export default {
  expo: {
    scheme: 'gestabiz',
    plugins: [
      'expo-router',
      'expo-secure-store',
      '@react-native-async-storage/async-storage',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#3B82F6'
        }
      ]
    ]
  }
}
```

## 2. AUTENTICACIÓN Y ROLES (Día 3-4) ⚠️ CRÍTICO

### 2.1 AuthProvider Móvil (`mobile/lib/auth.tsx`)
```typescript
import { supabase } from '../../src/lib/supabase' // ⚠️ SINGLETON
import { useAuthSimple } from '../../src/hooks/useAuthSimple'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

// Context que llama useAuthSimple() UNA sola vez
export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }) {
  const authState = useAuthSimple()
  
  // Persistir sesión
  useEffect(() => {
    if (authState.session) {
      SecureStore.setItemAsync('session', JSON.stringify(authState.session))
    }
  }, [authState.session])
  
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

// Hook consumidor (USAR en componentes)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### 2.2 Roles Dinámicos
```typescript
// Reutilizar src/hooks/useUserRoles.ts (compatible RN)
import { useUserRoles } from '../../src/hooks/useUserRoles'

const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)

// Persistir rol activo en AsyncStorage (key: 'user-active-role')
await AsyncStorage.setItem('user-active-role', JSON.stringify({
  role: activeRole,
  businessId: activeBusiness?.id
}))
```

### 2.3 Pantallas Auth (`mobile/app/(auth)/`)
- `login.tsx`: Email/password + Google OAuth
- `register.tsx`: Formulario registro completo
- `forgot-password.tsx`: Reset password con email

## 3. NAVEGACIÓN CON ROLES (Día 5-6)

### 3.1 Bottom Tabs Dinámicos (`mobile/app/(tabs)/_layout.tsx`)
```typescript
import { Tabs } from 'expo-router'
import { useUserRoles } from '../../../src/hooks/useUserRoles'
import { useAuth } from '../../lib/auth'

export default function TabsLayout() {
  const { user } = useAuth()
  const { activeRole } = useUserRoles(user)

  const tabsByRole = {
    admin: [
      { name: 'admin/index', title: 'Dashboard', icon: 'view-dashboard' },
      { name: 'admin/appointments', title: 'Citas', icon: 'calendar' },
      { name: 'admin/employees', title: 'Empleados', icon: 'account-group' },
      { name: 'admin/settings', title: 'Ajustes', icon: 'cog' }
    ],
    employee: [
      { name: 'employee/index', title: 'Empleos', icon: 'briefcase' },
      { name: 'employee/vacancies', title: 'Vacantes', icon: 'magnify' },
      { name: 'employee/absences', title: 'Ausencias', icon: 'calendar-off' },
      { name: 'employee/appointments', title: 'Citas', icon: 'calendar' }
    ],
    client: [
      { name: 'client/index', title: 'Buscar', icon: 'magnify' },
      { name: 'client/appointments', title: 'Mis Citas', icon: 'calendar' },
      { name: 'client/favorites', title: 'Favoritos', icon: 'heart' },
      { name: 'client/history', title: 'Historial', icon: 'history' }
    ]
  }

  return (
    <Tabs>
      {tabsByRole[activeRole].map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  )
}
```

### 3.2 Deep Linking y Notificaciones
```typescript
// mobile/app/_layout.tsx
import * as Linking from 'expo-linking'
import { getRoleForNotification } from '../../src/lib/notificationRoleMapping'

useEffect(() => {
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    const { hostname, path, queryParams } = Linking.parse(url)
    
    // gestabiz://notification/456?type=absence_request_new
    if (hostname === 'notification') {
      const notifType = queryParams.type
      const requiredRole = getRoleForNotification(notifType)
      
      if (requiredRole !== activeRole) {
        await switchRole(requiredRole)
      }
      
      router.push(`/${path}`)
    }
  })
  
  return () => subscription.remove()
}, [activeRole])
```

### 3.3 Rutas Modales
- `appointment/[id].tsx`: Detalle de cita (presente/edición)
- `appointment/wizard.tsx`: Wizard booking completo
- `business/[id].tsx`: Perfil público de negocio
- `chat/[conversationId].tsx`: Chat individual

## 4. DASHBOARD CLIENT (Día 7-10) - WIZARD CRÍTICO ⚠️

### 4.1 Búsqueda con RPC (`client/index.tsx`)
```typescript
import { useGeolocation } from '../../../src/hooks/useGeolocation'
import { supabase } from '../../../src/lib/supabase'

const { coords } = useGeolocation({ requestOnMount: true, showPermissionPrompt: true })

// Búsqueda con RPC optimizado
const { data: businesses } = await supabase.rpc('search_businesses', {
  query: searchTerm,
  user_lat: coords?.latitude,
  user_lng: coords?.longitude
})

// Renderizar con FlatList
<FlatList
  data={businesses}
  renderItem={({ item }) => <BusinessCard business={item} />}
  keyExtractor={item => item.id}
/>
```

### 4.2 Wizard de Citas (`appointment/wizard.tsx`) ⚠️ VALIDACIONES CRÍTICAS
```typescript
import { useWizardDataCache } from '../../../src/hooks/useWizardDataCache'
import { useAssigneeAvailability } from '../../../src/hooks/useAssigneeAvailability'
import { usePublicHolidays } from '../../../src/hooks/usePublicHolidays'

// Pre-carga datos
const dataCache = useWizardDataCache(businessId)

// Validaciones en paso DateTime (5 OBLIGATORIAS):
const validateSlot = async (slot: TimeSlot) => {
  // 1. Horario de sede
  if (slot.time < location.opens_at || slot.time > location.closes_at) {
    return { valid: false, reason: 'Fuera del horario' }
  }
  
  // 2. Hora de almuerzo del empleado
  if (slot.time >= employee.lunch_break_start && 
      slot.time < employee.lunch_break_end) {
    return { valid: false, reason: 'Hora de almuerzo' }
  }
  
  // 3. Overlaps con citas existentes
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('end_time', slot.start)
    .lte('start_time', slot.end)
  
  if (appointments.length > 0) {
    return { valid: false, reason: 'Ocupado' }
  }
  
  // 4. Ausencias aprobadas
  const { data: absences } = await supabase
    .from('employee_absences')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .gte('end_date', slot.date)
    .lte('start_date', slot.date)
  
  if (absences.length > 0) {
    return { valid: false, reason: 'Ausencia programada' }
  }
  
  // 5. Festivos públicos
  const holidays = usePublicHolidays('CO', new Date().getFullYear())
  if (holidays.isHoliday(slot.date)) {
    return { valid: false, reason: 'Festivo público' }
  }
  
  return { valid: true }
}
```

**Pasos Wizard**:
1. Negocio (si no preseleccionado)
2. Sede
3. Servicio
4. Empleado/Recurso (validar compatibilidad con `employee_services`)
5. Negocio del empleado (si tiene múltiples)
6. Fecha/Hora (con validaciones)
7. Confirmación
8. Éxito (tracking GA4)

### 4.3 Calendario y Favoritos
- `client/appointments.tsx`: `react-native-calendars` con `markedDates`
- `client/favorites.tsx`: FlatList con `useFavorites(userId)`
- `client/history.tsx`: FlatList paginado con pull-to-refresh

## 5. DASHBOARD EMPLOYEE (Día 11-14)

### 5.1 Ausencias con Balance (`employee/absences.tsx`)
```typescript
import { useEmployeeAbsences } from '../../../src/hooks/useEmployeeAbsences'

const { absences, vacationBalance, requestAbsence } = useEmployeeAbsences(businessId)

// Renderizar balance
<Card>
  <Text>Disponibles: {vacationBalance.days_available}</Text>
  <Text>Usados: {vacationBalance.days_used}</Text>
  <Text>Pendientes: {vacationBalance.days_pending}</Text>
</Card>

// Solicitar ausencia (Edge Function request-absence)
await requestAbsence({
  businessId,
  absence_type: 'vacation',
  start_date: '2025-02-01',
  end_date: '2025-02-05',
  reason: 'Vacaciones familiares'
})
// ⚠️ APROBACIÓN OBLIGATORIA (require_absence_approval = true)
```

### 5.2 Vacantes con Matching (`employee/vacancies.tsx`)
```typescript
import { useMatchingVacancies } from '../../../src/hooks/useMatchingVacancies'

const { matches } = useMatchingVacancies(userId)

// matches incluyen score de compatibilidad (0-100)
<FlatList
  data={matches}
  renderItem={({ item }) => (
    <VacancyCard 
      vacancy={item} 
      matchScore={item.match_score}
      onApply={() => applyToVacancy(item.id)}
    />
  )}
/>
```

## 6. DASHBOARD ADMIN (Día 15-20)

### 6.1 Overview con Estadísticas (`admin/index.tsx`)
```typescript
import { statsService } from '../../../src/lib/services/stats'

const stats = await statsService.getDashboardStats(userId, 'admin')

// Renderizar KPIs
<View>
  <StatCard title="Citas Hoy" value={stats.appointmentsToday} />
  <StatCard title="Ingresos Mes" value={formatCurrency(stats.revenueMonth, 'COP')} />
  <StatCard title="Nuevos Clientes" value={stats.newClientsWeek} />
</View>
```

### 6.2 Gestión de Empleados con Jerarquía
```typescript
// Reutilizar useBusinessHierarchy (RPC get_business_hierarchy)
const { data: hierarchy } = await supabase.rpc('get_business_hierarchy', {
  p_business_id: businessId
})

// Renderizar árbol jerárquico (SectionList por nivel)
```

### 6.3 Settings Reutilizando Lógica Web
```typescript
// Reutilizar lógica de CompleteUnifiedSettings
// Tabs: General, Perfil, Notificaciones, Preferencias del Negocio
// UI: React Native Paper components (TextInput, Switch, etc.)
```

## 7. NOTIFICACIONES Y CHAT (Día 21-23)

### 7.1 Notificaciones Push (`mobile/lib/notifications.tsx`)
```typescript
import * as Notifications from 'expo-notifications'
import { supabase } from '../../src/lib/supabase'

// Configurar handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Suscripción realtime (mismo que web)
const channel = supabase
  .channel(`global_notifications_${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'in_app_notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    const notification = payload.new
    
    // ⚠️ REGLA SUPRESIÓN: Si chat activo y notif es chat_message de misma conversación
    if (notification.type === 'chat_message' && 
        isChatOpen && 
        notification.data?.conversation_id === activeConversationId) {
      return // No mostrar toast
    }
    
    // Mostrar notificación local
    Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        data: notification.data
      },
      trigger: null // Inmediata
    })
  })
  .subscribe()
```

### 7.2 Chat con Gifted Chat (`chat/[conversationId].tsx`)
```typescript
import { GiftedChat, IMessage } from 'react-native-gifted-chat'
import { useMessages } from '../../../src/hooks/useMessages'

const { messages, sendMessage } = useMessages(conversationId, userId)

// Transformar a formato GiftedChat
const giftedMessages: IMessage[] = messages.map(m => ({
  _id: m.id,
  text: m.content,
  createdAt: new Date(m.created_at),
  user: {
    _id: m.sender_id,
    name: m.sender.full_name,
    avatar: m.sender.avatar_url
  }
}))

<GiftedChat
  messages={giftedMessages}
  onSend={messages => sendMessage(messages[0].text)}
  user={{ _id: userId }}
/>
```

## 8. INTEGRACIONES (Día 24-26)

### 8.1 Google Calendar (OAuth + Edge Functions)
```typescript
// OAuth en móvil con expo-auth-session
import * as Google from 'expo-auth-session/providers/google'

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: GOOGLE_CLIENT_ID,
  scopes: ['https://www.googleapis.com/auth/calendar']
})

// Llamar Edge Function calendar-integration
await supabase.functions.invoke('calendar-integration', {
  body: {
    provider: 'google',
    calendarId: selectedCalendarId,
    userId: user.id
  }
})
```

### 8.2 Billing con Triple Gateway
```typescript
import { getPaymentGateway } from '../../src/lib/payments/PaymentGatewayFactory'

const gateway = getPaymentGateway() // Stripe/PayU/MercadoPago

// Opción 1: Checkout via WebView (RECOMENDADO)
const { checkoutUrl } = await gateway.createCheckoutSession({
  businessId,
  planType: 'inicio',
  billingCycle: 'monthly'
})

<WebView source={{ uri: checkoutUrl }} />

// Opción 2: Deep link a app nativa del gateway (si disponible)
Linking.openURL(checkoutUrl)
```

## 9. CALIDAD Y PUBLICACIÓN (Día 27-32)

### 9.1 Performance
```typescript
// Memoización en listas grandes
const renderItem = useCallback(({ item }) => (
  <BusinessCard business={item} />
), [])

// Cleanup realtime subscriptions
useEffect(() => {
  const channel = supabase.channel('my-channel') // ⚠️ Nombre estático
  channel.subscribe()
  
  return () => {
    supabase.removeChannel(channel) // ⚠️ CRÍTICO: limpiar al unmount
  }
}, [])
```

### 9.2 Testing con Jest
```bash
# Unitarios para hooks reutilizados
npm test src/hooks/useUserRoles.test.ts
npm test src/hooks/useEmployeeAbsences.test.ts
```

### 9.3 EAS Build
```bash
# Configurar eas.json
eas build:configure

# Build para Android/iOS
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit a stores
eas submit --platform android
eas submit --platform ios
```

## 10. CHECKLIST DE PARIDAD FUNCIONAL ⚠️

### Roles y Auth
- [ ] Roles dinámicos (admin/employee/client calculados)
- [ ] Cambio de rol automático desde notificaciones
- [ ] Persistencia de sesión con SecureStore
- [ ] OAuth Google funcional

### Booking
- [ ] Wizard completo (6-8 pasos dinámicos)
- [ ] Validación horarios sede (`opens_at/closes_at`)
- [ ] Validación hora almuerzo (`lunch_break_start/end`)
- [ ] Validación overlaps con algoritmo: `slotStart < aptEnd && slotEnd > aptStart`
- [ ] Validación ausencias aprobadas
- [ ] Validación festivos públicos (54 festivos Colombia precargados)

### Ausencias
- [ ] Solicitud con Edge Function `request-absence`
- [ ] Aprobación obligatoria (NO parametrizable)
- [ ] Balance automático con trigger
- [ ] Notificación a TODOS los admins/managers

### Chat y Notificaciones
- [ ] Chat realtime con canales estáticos
- [ ] Regla supresión si chat activo
- [ ] Notificaciones push con `expo-notifications`
- [ ] Deep linking con mapeo de roles (30+ tipos)

### Búsqueda y Reviews
- [ ] RPC `search_businesses` con geolocalización
- [ ] 6 algoritmos de ordenamiento (rating, distancia, relevancia)
- [ ] Reviews anónimas post-cita completada
- [ ] Reviews obligatorias post-contratación vía vacante

### Billing
- [ ] Checkout con 3 gateways (Stripe/PayU/MercadoPago)
- [ ] WebView o deep link funcional
- [ ] Confirmación y tracking de suscripción

## 11. RIESGOS Y MITIGACIONES ⚠️

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Radix UI NO portable | ALTO | Usar React Native Paper |
| Tailwind NO soportado | ALTO | StyleSheet o styled-components |
| OAuth móvil complejo | MEDIO | `expo-auth-session` + schemes configurados |
| Realtime memory leaks | ALTO | Canales con nombres estáticos + cleanup |
| Diferencias iOS/Android | MEDIO | Testing en ambas plataformas |
| Sin Supabase local | BAJO | Testing contra instancia remota |

## 12. ENTREGABLES FINALES

### Código
```
mobile/
├── app/                    # ✅ Todas las pantallas
│   ├── (auth)/             # Login, register, forgot-password
│   ├── (tabs)/             # Admin, Employee, Client stacks
│   ├── appointment/        # [id].tsx, wizard.tsx
│   ├── business/[id].tsx
│   └── chat/[conversationId].tsx
├── lib/                    # ✅ Auth, notifications, utils
│   ├── auth.tsx
│   ├── notifications.tsx
│   └── utils.ts
├── components/             # ✅ Componentes RN reutilizables
└── __tests__/              # ✅ Tests unitarios
```

### Documentación
- [x] `ANALISIS_EXHAUSTIVO_APP.md` (857 líneas)
- [x] `PLAN_DE_ACCION_MV.md` (este documento)
- [ ] `TODO.txt` (ajustes a web si necesarios)
- [ ] `DIFERENCIAS.md` (web vs móvil documentadas)
- [ ] `README_MOBILE.md` (instrucciones setup y build)

### Configuración
- [ ] `app.config.js` completo (schemes, permisos, plugins)
- [ ] `.env.mobile` con variables Expo
- [ ] `eas.json` para builds Android/iOS
- [ ] Assets (icons, splash screens)

---

**Próximo paso**: Crear `TODO.txt` con posibles ajustes a observar durante el desarrollo (si aplican).
