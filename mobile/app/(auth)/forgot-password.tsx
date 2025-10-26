import React, { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, Card } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const { resetPassword } = useAuth()
  const router = useRouter()

  const handleResetPassword = async () => {
    try {
      setLoading(true)
      setError('')
      await resetPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al enviar email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.successTitle}>
                ✓ Email Enviado
              </Text>
              <Text variant="bodyMedium" style={styles.successText}>
                Hemos enviado un enlace de recuperación a {email}
              </Text>
              <Button
                mode="contained"
                onPress={() => router.back()}
                style={styles.button}
              >
                Volver al inicio
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Recuperar Contraseña
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Te enviaremos un enlace para restablecer tu contraseña
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

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading || !email}
                style={styles.button}
              >
                Enviar enlace
              </Button>

              <Button
                mode="text"
                onPress={() => router.back()}
                style={styles.linkButton}
              >
                Volver al inicio de sesión
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
  successTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#64748B',
  },
})


