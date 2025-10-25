import React from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from 'react-native-paper'

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text variant="titleMedium" style={styles.text}>
        Gestabiz
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Cargando aplicación...
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    marginTop: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  subtitle: {
    marginTop: 8,
    color: '#64748B',
  },
})


