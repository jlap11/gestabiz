import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'

// ⭐ SHARED HOOKS - Same business logic as web version
import {
  useAuthForm,
  usePasswordReset,
  validateAuthForm,
  getAuthErrorMessage,
  type AuthFormData
} from '../../../shared/hooks/auth'

const IS_DEV = __DEV__

export default function AuthScreen() {
  // ==================== DEPENDENCIES ====================
  const { signIn, signUp } = useAuth()
  
  // ==================== SHARED BUSINESS LOGIC ====================
  // Same hooks as web version - business logic is identical
  const authForm = useAuthForm({ 
    initialMode: 'signin',
    autoFillPasswordInDev: true 
  })
  
  // Password reset is simplified for mobile (no modal, just Alert)
  const passwordReset = usePasswordReset()

  // ==================== AUTH HANDLERS ====================
  // Mobile-specific: Uses Alert instead of toast
  const showError = (message: string) => {
    Alert.alert('Error', message)
  }

  const handleSignIn = async () => {
    const validation = validateAuthForm(authForm.formData, false)
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0] || 'Error de validación')
      return
    }
    
    authForm.setLoading(true)
    authForm.setError(null)
    
    try {
      const { error } = await signIn(
        authForm.formData.email, 
        authForm.formData.password
      )
      
      if (error) {
        showError(getAuthErrorMessage(error))
      }
      // Success: AuthContext will handle navigation
    } catch (error) {
      showError(getAuthErrorMessage(error))
    } finally {
      authForm.setLoading(false)
    }
  }

  const handleSignUp = async () => {
    const validation = validateAuthForm(authForm.formData, true)
    if (!validation.isValid) {
      showError(Object.values(validation.errors)[0] || 'Error de validación')
      return
    }
    
    authForm.setLoading(true)
    authForm.setError(null)
    
    try {
      const { error } = await signUp(
        authForm.formData.email,
        authForm.formData.password,
        authForm.formData.name
      )
      
      if (error) {
        showError(getAuthErrorMessage(error))
      }
      // Success: AuthContext will handle navigation
    } catch (error) {
      showError(getAuthErrorMessage(error))
    } finally {
      authForm.setLoading(false)
    }
  }

  const handlePasswordResetRequest = () => {
    Alert.prompt(
      'Recuperar Contraseña',
      'Ingresa tu email para recibir un enlace de recuperación',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async (email) => {
            if (!email || !email.includes('@')) {
              Alert.alert('Error', 'Por favor ingresa un email válido')
              return
            }
            
            // TODO: Implement password reset via Supabase
            Alert.alert(
              'Email Enviado',
              `Se envió un enlace de recuperación a ${email}`
            )
          }
        }
      ],
      'plain-text'
    )
  }

  // ==================== RENDER ====================
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Circle */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="briefcase" size={40} color="#667eea" />
          </View>
          <Text style={styles.title}>Gestabiz</Text>
          <Text style={styles.subtitle}>
            {authForm.isSignUpMode 
              ? 'Crea tu cuenta para comenzar' 
              : 'Ingresa tus credenciales para continuar'
            }
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Error Banner */}
          {authForm.formError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{authForm.formError}</Text>
              <TouchableOpacity onPress={() => authForm.setError(null)}>
                <Text style={styles.errorClose}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Name Input (Sign Up Only) */}
          {authForm.isSignUpMode && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#999"
                value={authForm.formData.name}
                onChangeText={(text) => authForm.handleInputChange('name', text)}
                autoCapitalize="words"
                editable={!authForm.isLoading}
              />
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={authForm.formData.email}
              onChangeText={(text) => authForm.handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!authForm.isLoading}
            />
          </View>

          {/* Password Input with Toggle */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                value={authForm.formData.password}
                onChangeText={(text) => authForm.handleInputChange('password', text)}
                secureTextEntry={!authForm.showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!authForm.isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={authForm.togglePasswordVisibility}
              >
                <Ionicons 
                  name={authForm.showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
            {IS_DEV && !authForm.formData.password && (
              <View style={styles.devWarning}>
                <Ionicons name="warning" size={12} color="#f59e0b" />
                <Text style={styles.devText}>DEV: Contraseña auto-completada</Text>
              </View>
            )}
          </View>

          {/* Remember Me & Forgot Password */}
          {!authForm.isSignUpMode && (
            <View style={styles.rememberContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={authForm.toggleRememberMe}
              >
                <View style={[
                  styles.checkbox, 
                  authForm.rememberMe && styles.checkboxChecked
                ]}>
                  {authForm.rememberMe && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePasswordResetRequest}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, authForm.isLoading && styles.buttonDisabled]}
            onPress={authForm.isSignUpMode ? handleSignUp : handleSignIn}
            disabled={authForm.isLoading}
          >
            {authForm.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {authForm.isSignUpMode ? 'Registrarse' : 'Iniciar Sesión'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O continuar con</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Button (Placeholder) */}
          <TouchableOpacity
            style={styles.googleButton}
            disabled={authForm.isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleText}>Google</Text>
          </TouchableOpacity>

          {/* DEV ONLY: Magic Link */}
          {IS_DEV && (
            <>
              <View style={styles.devSection}>
                <Ionicons name="flask" size={14} color="#666" />
                <Text style={styles.devSectionText}>DEV ONLY - Magic Link</Text>
              </View>
              <TouchableOpacity
                style={styles.magicLinkButton}
                disabled={authForm.isLoading}
              >
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={styles.magicLinkText}>Enviar Magic Link</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Toggle Sign Up/Sign In */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={authForm.toggleMode}
          >
            <Text style={styles.switchText}>
              {authForm.isSignUpMode 
                ? '¿Ya tienes cuenta? ' 
                : '¿No tienes cuenta? '
              }
              <Text style={styles.switchTextBold}>
                {authForm.isSignUpMode ? 'Inicia sesión' : 'Regístrate'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Desarrollado por TI Turing</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a0f0f',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
  },
  errorClose: {
    fontSize: 24,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 0,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  devWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1410',
    borderRadius: 8,
    marginTop: 8,
  },
  devText: {
    fontSize: 12,
    color: '#f59e0b',
    flex: 1,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  rememberText: {
    fontSize: 14,
    color: '#999',
  },
  forgotText: {
    fontSize: 14,
    color: '#667eea',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  googleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  devSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 20,
    marginBottom: 16,
  },
  devSectionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  magicLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  magicLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  switchButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchText: {
    color: '#999',
    fontSize: 14,
  },
  switchTextBold: {
    color: '#667eea',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 11,
    color: '#555',
  },
})
