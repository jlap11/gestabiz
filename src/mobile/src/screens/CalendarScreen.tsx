import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { useAuth } from '../contexts/AuthContext'
import { appointmentService } from '../lib/supabase'

export default function CalendarScreen({ navigation }: any) {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [appointments, setAppointments] = useState<any[]>([])
  const [markedDates, setMarkedDates] = useState<any>({})

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    if (!user) return

    try {
      const { data, error } = await appointmentService.getAppointments(user.id)
      if (error) throw error
      
      setAppointments(data || [])
      
      // Mark dates with appointments
      const marked: any = {}
      data?.forEach((apt: any) => {
        const date = new Date(apt.start_time).toISOString().split('T')[0]
        marked[date] = {
          marked: true,
          dotColor: '#667eea',
        }
      })
      
      // Add selected date marker
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#667eea',
      }
      
      setMarkedDates(marked)
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString)
    
    // Update marked dates
    const newMarked = { ...markedDates }
    Object.keys(newMarked).forEach(key => {
      newMarked[key] = {
        ...newMarked[key],
        selected: key === day.dateString,
        selectedColor: key === day.dateString ? '#667eea' : undefined,
      }
    })
    setMarkedDates(newMarked)
  }

  const getAppointmentsForSelectedDate = () => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time).toISOString().split('T')[0]
      return aptDate === selectedDate
    })
  }

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const selectedAppointments = getAppointmentsForSelectedDate()

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#000',
          calendarBackground: '#1a1a1a',
          textSectionTitleColor: '#fff',
          selectedDayBackgroundColor: '#667eea',
          selectedDayTextColor: '#fff',
          todayTextColor: '#667eea',
          dayTextColor: '#fff',
          textDisabledColor: '#666',
          dotColor: '#667eea',
          selectedDotColor: '#fff',
          arrowColor: '#667eea',
          monthTextColor: '#fff',
          indicatorColor: '#667eea',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      <View style={styles.appointmentsContainer}>
        <Text style={styles.sectionTitle}>
          Citas para {new Date(selectedDate).toLocaleDateString()}
        </Text>

        <ScrollView style={styles.appointmentsList}>
          {selectedAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay citas programadas</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateAppointment')}
              >
                <Text style={styles.createButtonText}>Crear cita</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={styles.appointmentCard}
                onPress={() => navigation.navigate('EditAppointment', { appointment })}
              >
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>
                    {formatTime(appointment.start_time)}
                  </Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                  {appointment.client_name && (
                    <Text style={styles.appointmentClient}>
                      {appointment.client_name}
                    </Text>
                  )}
                  {appointment.location && (
                    <Text style={styles.appointmentLocation}>
                      📍 {appointment.location}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  appointmentsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  appointmentsList: {
    flex: 1,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  timeContainer: {
    marginRight: 15,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  appointmentClient: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  appointmentLocation: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
