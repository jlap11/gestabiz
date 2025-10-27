// Mobile App - Dashboard Screen
// File: mobile/src/screens/DashboardScreen.tsx

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { useMobileAlert } from '../../../../components/mobile/useMobileAlert'

export default function DashboardScreen({ navigation }) {
  const { error } = useMobileAlert()
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()
    loadDashboardData()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadDashboardData = async () => {
    try {
      // Get upcoming appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5)

      if (appointmentsError) throw appointmentsError

      setAppointments(appointmentsData || [])

      // Get statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats')

      if (statsError) throw statsError

      if (statsData && statsData.length > 0) {
        setStats({
          total: statsData[0].total_appointments,
          today: statsData[0].upcoming_today,
          upcoming: statsData[0].upcoming_week,
          completed: statsData[0].completed_appointments,
        })
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      error('Failed to load dashboard data', { title: 'Error' })
    }
  }

  const onRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setIsRefreshing(false)
  }

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getTimeUntil = (dateTime) => {
    const now = new Date()
    const appointmentTime = new Date(dateTime)
    const diffMs = appointmentTime - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else if (diffMs > 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
    } else {
      return 'now'
    }
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.user_metadata?.full_name || 'User'}!
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <Text style={styles.statNumber}>{stats.today}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => navigation.navigate('CreateAppointment')}
          >
            <Text style={styles.actionButtonText}>+ New Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AppointmentList')}
          >
            <Text style={styles.actionButtonText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('CreateAppointment')}
            >
              <Text style={styles.emptyStateButtonText}>Create your first appointment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              style={styles.appointmentCard}
              onPress={() => navigation.navigate('EditAppointment', { appointment })}
            >
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                <Text style={styles.appointmentTime}>
                  {getTimeUntil(appointment.start_time)}
                </Text>
              </View>
              <Text style={styles.appointmentDateTime}>
                {formatDateTime(appointment.start_time)}
              </Text>
              {appointment.client_name && (
                <Text style={styles.appointmentClient}>
                  Client: {appointment.client_name}
                </Text>
              )}
              {appointment.location && (
                <Text style={styles.appointmentLocation}>
                  📍 {appointment.location}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#667eea',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#667eea',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  appointmentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '500',
  },
  appointmentDateTime: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  appointmentClient: {
    fontSize: 14,
    color: '#999',
    marginBottom: 3,
  },
  appointmentLocation: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  emptyStateButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
