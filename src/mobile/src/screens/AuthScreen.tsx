import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'

const __DEV__ = process.env.NODE_ENV === 'development'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos')
      return
    }

    if (!isLogin && !fullName) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo')
      return
    }

    setLoading(true)
    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password, fullName)

      if (error) {
        Alert.alert('Error', error.message)
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    Alert.alert('Google OAuth', 'Funcionalidad disponible próximamente')
  }

  const handleMagicLink = () => {
    if (__DEV__) {
      Alert.alert('Magic Link (DEV)', 'Funcionalidad de desarrollo')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="briefcase" size={40} color="#667eea" />
          </View>
          <Text style={styles.title}>Gestabiz</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Ingresa tus credenciales para acceder a tu cuenta' : 'Crear nueva cuenta'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu dirección de correo"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {__DEV__ && (
            <View style={styles.devWarning}>
              <Ionicons name="flask" size={14} color="#f59e0b" />
              <Text style={styles.devText}>
                Modo DEV: Contraseña opcional (usa TestPassword123!)
              </Text>
            </View>
          )}

          {isLogin && (
            <View style={styles.rememberContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Recuérdame</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O continuar con</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <Ionicons name="logo-google" size={20} color="#667eea" />
            <Text style={styles.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* DEV Magic Link */}
          {__DEV__ && (
            <>
              <View style={styles.devSection}>
                <Ionicons name="flask-outline" size={16} color="#666" />
                <Text style={styles.devSectionText}>DEV ONLY - Magic Link</Text>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Email para Magic Link (solo DEV)"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TouchableOpacity
                style={styles.magicLinkButton}
                onPress={handleMagicLink}
              >
                <Ionicons name="mail-outline" size={20} color="#667eea" />
                <Text style={styles.magicLinkText}>Enviar Magic Link (DEV)</Text>
              </TouchableOpacity>

              <View style={styles.devWarning}>
                <Ionicons name="warning-outline" size={14} color="#f59e0b" />
                <Text style={styles.devText}>
                  Esta opción es solo para desarrollo. Recibe un enlace por email.
                </Text>
              </View>
            </>
          )}

          {/* Switch Mode */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? '¿No tienes una cuenta? '
                : '¿Ya tienes cuenta? '}
              <Text style={styles.switchTextBold}>
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Desarrollado por TI Turing</Text>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
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
    marginBottom: 16,
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
    marginTop: 16,
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
