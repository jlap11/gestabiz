import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { appointmentService } from '../lib/supabase'

export default function EditAppointmentScreen({ navigation, route }: any) {
  const { appointment } = route.params
  const [title, setTitle] = useState(appointment.title)
  const [description, setDescription] = useState(appointment.description || '')
  const [startDate, setStartDate] = useState(new Date(appointment.start_time))
  const [endDate, setEndDate] = useState(new Date(appointment.end_time))
  const [location, setLocation] = useState(appointment.location || '')
  const [clientName, setClientName] = useState(appointment.client_name || '')
  const [clientEmail, setClientEmail] = useState(appointment.client_email || '')
  const [clientPhone, setClientPhone] = useState(appointment.client_phone || '')
  const [status, setStatus] = useState(appointment.status)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    if (!title) {
      Alert.alert('Error', 'Por favor ingresa un título')
      return
    }

    setLoading(true)
    try {
      const { error } = await appointmentService.updateAppointment(appointment.id, {
        title,
        description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        status,
      })

      if (error) throw error

      Alert.alert('Éxito', 'Cita actualizada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false)
    if (selectedDate) {
      setStartDate(selectedDate)
    }
  }

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false)
    if (selectedDate) {
      setEndDate(selectedDate)
    }
  }

  const StatusButton = ({ value, label }: { value: string; label: string }) => (
    <TouchableOpacity
      style={[
        styles.statusButton,
        status === value && styles.statusButtonActive,
      ]}
      onPress={() => setStatus(value)}
    >
      <Text
        style={[
          styles.statusButtonText,
          status === value && styles.statusButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.statusContainer}>
            <StatusButton value="scheduled" label="Programada" />
            <StatusButton value="completed" label="Completada" />
            <StatusButton value="cancelled" label="Cancelada" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Corte de cabello"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalles de la cita..."
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha y hora de inicio</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#667eea" />
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha y hora de fin</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#667eea" />
            <Text style={styles.dateText}>
              {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ubicación</Text>
          <TextInput
            style={styles.input}
            placeholder="Dirección o lugar"
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Información del Cliente</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del cliente"
            placeholderTextColor="#666"
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@ejemplo.com"
            placeholderTextColor="#666"
            value={clientEmail}
            onChangeText={setClientEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+57 300 123 4567"
            placeholderTextColor="#666"
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  statusButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
