# Arquitectura de Separación Lógica-Visual (Gestabiz)

## 📋 Principio Fundamental

> **Separar estrictamente la lógica de negocio (hooks compartidos) de la presentación visual (componentes web/móvil)**

## 🎯 Estructura del Proyecto

```
gestabiz/
├── src/
│   ├── shared/                      # ⭐ LÓGICA COMPARTIDA (Platform-agnostic)
│   │   └── hooks/
│   │       └── auth/
│   │           ├── index.ts         # Barrel export
│   │           ├── useAuthForm.ts   # Estado del formulario
│   │           ├── usePasswordReset.ts
│   │           ├── useMagicLink.ts
│   │           ├── useInactiveAccount.ts
│   │           ├── useAuthRedirect.ts
│   │           └── authValidation.ts
│   │
│   ├── components/                  # 🌐 UI WEB (React + Radix UI + Tailwind)
│   │   └── auth/
│   │       ├── AuthScreen.tsx       # Original (deprecated)
│   │       └── AuthScreen.refactored.tsx  # ⭐ Usa hooks compartidos
│   │
│   └── mobile/                      # 📱 UI MÓVIL (React Native)
│       └── src/
│           └── screens/
│               ├── AuthScreen.tsx   # Original (deprecated)
│               └── AuthScreen.refactored.tsx  # ⭐ Usa hooks compartidos
```

## 🔧 Hooks Compartidos (src/shared/hooks/auth/)

### 1. useAuthForm
**Responsabilidad**: Manejo del estado del formulario de autenticación

```typescript
// ✅ LÓGICA COMPARTIDA
export function useAuthForm(options: UseAuthFormOptions) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: ''
  })
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Auto-fill password en DEV (web y móvil)
  useEffect(() => {
    if (autoFillPasswordInDev && import.meta.env?.DEV && formData.email) {
      setFormData(prev => ({ ...prev, password: 'TestPassword123!' }))
    }
  }, [formData.email])
  
  return {
    // State
    formData,
    isSignUpMode,
    rememberMe,
    showPassword,
    // Actions
    handleInputChange,
    toggleMode,
    toggleRememberMe,
    togglePasswordVisibility,
    setError,
    setLoading,
    resetForm
  }
}
```

### 2. usePasswordReset
**Responsabilidad**: Lógica de recuperación de contraseña

### 3. useMagicLink (DEV ONLY)
**Responsabilidad**: Magic link authentication (TODO: REMOVE BEFORE PRODUCTION)

### 4. useInactiveAccount
**Responsabilidad**: Manejo de cuentas inactivas

### 5. useAuthRedirect
**Responsabilidad**: Preservar contexto de reserva después de login

### 6. authValidation.ts
**Responsabilidad**: Validaciones de formulario y mensajes de error

```typescript
export function validateAuthForm(
  data: AuthFormData, 
  isSignUpMode: boolean
): AuthValidation {
  const errors: Partial<Record<keyof AuthFormData, string>> = {}
  
  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Email inválido'
  }
  if (!data.password || data.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
  }
  if (isSignUpMode && !data.name) {
    errors.name = 'El nombre es requerido'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
```

## 🌐 Componente Web (AuthScreen.refactored.tsx)

**Características**:
- Usa React Router DOM para navegación
- Componentes de Radix UI (`Button`, `Input`, `Checkbox`)
- Tailwind CSS para estilos
- Toast notifications con `sonner`
- Google Analytics tracking
- Iconos de Phosphor y Lucide React

**Ejemplo de uso**:
```typescript
import { useAuthForm, validateAuthForm } from '@shared/hooks/auth'

export default function AuthScreen({ onLogin, onLoginSuccess }: AuthScreenProps) {
  const { signIn, signUp } = useAuth()
  const authForm = useAuthForm({ initialMode: 'signin' })
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateAuthForm(authForm.formData, false)
    if (!validation.isValid) {
      authForm.setError(Object.values(validation.errors)[0])
      return
    }
    
    const result = await signIn({
      email: authForm.formData.email,
      password: authForm.formData.password
    })
    
    if (result.success) {
      handlePostLoginNavigation(result.user)
    }
  }
  
  return (
    <form onSubmit={handleSignIn}>
      <Input
        type="email"
        value={authForm.formData.email}
        onChange={(e) => authForm.handleInputChange('email', e.target.value)}
      />
      {/* ... más UI web ... */}
    </form>
  )
}
```

## 📱 Componente Móvil (AuthScreen.refactored.tsx)

**Características**:
- Usa React Native components (`View`, `Text`, `TextInput`, `TouchableOpacity`)
- StyleSheet para estilos (no Tailwind)
- Alert para notificaciones (no toast)
- Expo Vector Icons (Ionicons)
- KeyboardAvoidingView para manejo de teclado

**Ejemplo de uso**:
```typescript
import { useAuthForm, validateAuthForm } from '../../../shared/hooks/auth'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const authForm = useAuthForm({ initialMode: 'signin' })
  
  const handleSignIn = async () => {
    const validation = validateAuthForm(authForm.formData, false)
    if (!validation.isValid) {
      Alert.alert('Error', Object.values(validation.errors)[0])
      return
    }
    
    const { error } = await signIn(
      authForm.formData.email,
      authForm.formData.password
    )
    
    if (error) {
      Alert.alert('Error', error)
    }
  }
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={authForm.formData.email}
        onChangeText={(text) => authForm.handleInputChange('email', text)}
      />
      {/* ... más UI móvil ... */}
    </View>
  )
}
```

## ✅ Beneficios de Esta Arquitectura

### 1. Reutilización de Código
- **95% de la lógica de negocio compartida** entre web y móvil
- Solo cambia la UI (componentes React vs React Native)
- Validaciones idénticas en ambas plataformas

### 2. Mantenibilidad
- Bugs en lógica se arreglan una sola vez
- Cambios en reglas de negocio se propagan automáticamente
- Código más fácil de testear (hooks aislados)

### 3. Consistencia
- Misma experiencia de usuario en web y móvil
- Comportamiento predecible entre plataformas
- Validaciones y mensajes de error uniformes

### 4. Escalabilidad
- Fácil agregar nuevas plataformas (ej: desktop con Tauri)
- Hooks se pueden extender sin romper componentes
- Componentes visuales se pueden refactorizar independientemente

## 📐 Reglas de Desarrollo

### ❌ NO HACER
```typescript
// ❌ Lógica de negocio en componente visual
export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // ❌ Validación dentro del componente
  const handleSignIn = () => {
    if (!email || !password) {
      alert('Campos requeridos')
      return
    }
    // ...
  }
}
```

### ✅ SÍ HACER
```typescript
// ✅ Lógica en hook compartido
export default function AuthScreen() {
  const authForm = useAuthForm()
  const validation = validateAuthForm(authForm.formData, false)
  
  // ✅ Componente solo maneja UI
  const handleSignIn = async () => {
    if (!validation.isValid) {
      showError(validation.errors)
      return
    }
    await signIn(authForm.formData)
  }
}
```

## 🔄 Flujo de Trabajo

1. **Identificar lógica de negocio** (validaciones, estado, side effects)
2. **Crear hook en `src/shared/hooks/`** con TypeScript strict
3. **Exportar tipos e interfaces** para uso en componentes
4. **Implementar UI web** en `src/components/` usando el hook
5. **Implementar UI móvil** en `src/mobile/src/screens/` usando el mismo hook
6. **Testear ambos componentes** para asegurar paridad

## 📦 Aliases de Import

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

**Uso**:
```typescript
// Web
import { useAuthForm } from '@shared/hooks/auth'

// Mobile
import { useAuthForm } from '../../../shared/hooks/auth'
```

## 🧪 Testing

Los hooks compartidos se pueden testear una sola vez:

```typescript
// src/shared/hooks/auth/__tests__/useAuthForm.test.ts
import { renderHook, act } from '@testing-library/react-hooks'
import { useAuthForm } from '../useAuthForm'

describe('useAuthForm', () => {
  it('should toggle password visibility', () => {
    const { result } = renderHook(() => useAuthForm())
    
    expect(result.current.showPassword).toBe(false)
    
    act(() => {
      result.current.togglePasswordVisibility()
    })
    
    expect(result.current.showPassword).toBe(true)
  })
})
```

## 🚀 Próximos Pasos

1. ✅ Hooks de autenticación completados
2. ⏳ Refactorizar hooks de Dashboard
3. ⏳ Refactorizar hooks de Appointments
4. ⏳ Refactorizar hooks de Settings
5. ⏳ Documentar patrones de diseño
6. ⏳ Crear guía de contribución

---

**Última actualización**: 1 de diciembre de 2025  
**Autor**: TI Turing Team  
**Versión**: 2.0.0
