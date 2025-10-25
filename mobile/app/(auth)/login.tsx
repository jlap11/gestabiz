import React, { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, Card } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      await signIn(email, password)
      // La navegación se maneja automáticamente en _layout.tsx
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Gestabiz
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Gestión de citas y negocios
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading || !email || !password}
                style={styles.button}
              >
                Iniciar Sesión
              </Button>

              <Button
                mode="text"
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.linkButton}
              >
                ¿Olvidaste tu contraseña?
              </Button>

              <Button
                mode="outlined"
                onPress={() => router.push('/(auth)/register')}
                style={styles.registerButton}
              >
                Crear cuenta
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#64748B',
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 16,
  },
})


