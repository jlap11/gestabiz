// Browser Extension - Background Script
// File: background.js

const APP_URL = 'https://your-app-url.com'
const SUPABASE_URL = 'https://your-project.supabase.co'

class BackgroundService {
  constructor() {
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupAlarms()
    this.setupNotifications()
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(details => {
      if (details.reason === 'install') {
        this.handleFirstInstall()
      }
    })

    // Handle messages from content scripts or popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
      return true // Will respond asynchronously
    })

    // Handle alarm events
    chrome.alarms.onAlarm.addListener(alarm => {
      this.handleAlarm(alarm)
    })

    // Handle notification clicks
    chrome.notifications.onClicked.addListener(notificationId => {
      this.handleNotificationClick(notificationId)
    })
  }

  setupAlarms() {
    // Clear existing alarms
    chrome.alarms.clearAll()

    // Set up periodic check for appointments (every 15 minutes)
    chrome.alarms.create('checkAppointments', {
      delayInMinutes: 1,
      periodInMinutes: 15,
    })
  }

  setupNotifications() {
    // Request notification permission
    chrome.notifications.getPermissionLevel(level => {
      if (level !== 'granted') {
        console.log('Notification permission not granted')
      }
    })
  }

  handleFirstInstall() {
    // Open the web app on first install
    chrome.tabs.create({ url: APP_URL })

    // Set up initial storage
    chrome.storage.local.set({
      extensionInstalled: true,
      lastNotificationCheck: Date.now(),
    })
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'saveUserSession':
          await this.saveUserSession(request.session)
          sendResponse({ success: true })
          break

        case 'clearUserSession':
          await this.clearUserSession()
          sendResponse({ success: true })
          break

        case 'checkAppointments':
          const appointments = await this.checkUpcomingAppointments()
          sendResponse({ success: true, appointments })
          break

        case 'showNotification':
          await this.showNotification(request.notification)
          sendResponse({ success: true })
          break

        default:
          sendResponse({ success: false, error: 'Unknown action' })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async handleAlarm(alarm) {
    switch (alarm.name) {
      case 'checkAppointments':
        await this.checkUpcomingAppointments()
        break
    }
  }

  async handleNotificationClick(notificationId) {
    // Parse notification ID to extract appointment information
    if (notificationId.startsWith('appointment-')) {
      const appointmentId = notificationId.replace('appointment-', '')
      chrome.tabs.create({
        url: `${APP_URL}/appointments/${appointmentId}`,
      })
    } else {
      chrome.tabs.create({ url: APP_URL })
    }

    // Clear the notification
    chrome.notifications.clear(notificationId)
  }

  async saveUserSession(session) {
    await chrome.storage.local.set({ userSession: session })
    console.log('User session saved')
  }

  async clearUserSession() {
    await chrome.storage.local.remove(['userSession'])
    console.log('User session cleared')
  }

  async checkUpcomingAppointments() {
    try {
      // Get user session
      const { userSession } = await chrome.storage.local.get(['userSession'])
      if (!userSession) {
        return []
      }

      // Get last notification check time
      const { lastNotificationCheck } = await chrome.storage.local.get(['lastNotificationCheck'])
      const lastCheck = lastNotificationCheck || 0

      // Fetch upcoming appointments
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/sync-appointments?user_id=${userSession.id}`,
        {
          headers: {
            Authorization: `Bearer ${userSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      const appointments = data.appointments || []

      // Check for appointments that need notifications
      const now = new Date()
      const notificationThreshold = 60 * 60 * 1000 // 1 hour in milliseconds

      for (const appointment of appointments) {
        const appointmentTime = new Date(appointment.start_time)
        const timeUntilAppointment = appointmentTime - now

        // Show notification for appointments within the next hour
        if (timeUntilAppointment > 0 && timeUntilAppointment <= notificationThreshold) {
          const notificationId = `appointment-${appointment.id}`

          // Check if we've already shown this notification
          const notificationKey = `notification-${appointment.id}-${appointmentTime.getTime()}`
          const { [notificationKey]: alreadyNotified } = await chrome.storage.local.get([
            notificationKey,
          ])

          if (!alreadyNotified) {
            await this.showAppointmentNotification(appointment, timeUntilAppointment)

            // Mark this notification as sent
            await chrome.storage.local.set({ [notificationKey]: true })
          }
        }
      }

      // Update last check time
      await chrome.storage.local.set({ lastNotificationCheck: now.getTime() })

      return appointments
    } catch (error) {
      console.error('Error checking appointments:', error)
      return []
    }
  }

  async showAppointmentNotification(appointment, timeUntil) {
    const timeText = this.formatTimeUntil(timeUntil)

    const notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Upcoming Appointment',
      message: `"${appointment.title}" ${timeText}`,
      contextMessage: appointment.client_name ? `Client: ${appointment.client_name}` : '',
      priority: 1,
      requireInteraction: true,
      buttons: [{ title: 'View Details' }, { title: 'Dismiss' }],
    }

    const notificationId = `appointment-${appointment.id}`

    return new Promise(resolve => {
      chrome.notifications.create(notificationId, notificationOptions, id => {
        console.log('Notification created:', id)
        resolve(id)
      })
    })
  }

  async showNotification(notification) {
    const notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: notification.title,
      message: notification.message,
      priority: notification.priority || 0,
    }

    return new Promise(resolve => {
      chrome.notifications.create(notificationOptions, id => {
        resolve(id)
      })
    })
  }

  formatTimeUntil(milliseconds) {
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`
    } else if (minutes > 0) {
      return `in ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      return 'starting now'
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService()

// Keep service worker alive
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension is being suspended')
})

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started')
})
