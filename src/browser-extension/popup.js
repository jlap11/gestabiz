// Browser Extension - Popup JavaScript
// File: popup.js

const APP_URL = 'https://your-app-url.com'
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-supabase-anon-key'

class AppointmentPopup {
  constructor() {
    this.user = null
    this.appointments = []
    this.supabase = null
    this.init()
  }

  async init() {
    // Initialize Supabase client (you'll need to include the Supabase JS library)
    // For now, we'll use fetch API directly

    await this.loadUserSession()
    this.setupEventListeners()
    await this.loadAppointments()
  }

  async loadUserSession() {
    try {
      // Try to get user session from storage
      const result = await chrome.storage.local.get(['userSession'])
      if (result.userSession) {
        this.user = result.userSession
        this.showMainContent()
      } else {
        this.showAuthSection()
      }
    } catch (error) {
      console.error('Error loading user session:', error)
      this.showAuthSection()
    }
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.loadAppointments()
    })

    // Open app buttons
    const openAppBtns = [
      'open-app-btn',
      'open-app-link',
      'new-appointment-btn',
      'view-all-btn',
      'create-first-btn',
    ]

    openAppBtns.forEach(btnId => {
      const btn = document.getElementById(btnId)
      if (btn) {
        btn.addEventListener('click', () => {
          chrome.tabs.create({ url: APP_URL })
          window.close()
        })
      }
    })

    // Appointment click handlers will be added dynamically
  }

  async loadAppointments() {
    if (!this.user) {
      this.showAuthSection()
      return
    }

    this.showLoading()

    try {
      // Call Supabase function to get upcoming appointments
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/sync-appointments?user_id=${this.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      this.appointments = data.appointments || []

      if (this.appointments.length === 0) {
        this.showEmptyState()
      } else {
        this.renderAppointments()
        this.showMainContent()
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      this.showError('Failed to load appointments')
    }
  }

  renderAppointments() {
    const appointmentsList = document.getElementById('appointments-list')
    const todayCount = document.getElementById('today-count')
    const upcomingCount = document.getElementById('upcoming-count')

    // Clear existing appointments
    appointmentsList.innerHTML = ''

    // Calculate stats
    const today = new Date().toDateString()
    const todayAppointments = this.appointments.filter(
      apt => new Date(apt.start_time).toDateString() === today
    )

    todayCount.textContent = todayAppointments.length
    upcomingCount.textContent = this.appointments.length

    // Render up to 3 appointments
    const displayAppointments = this.appointments.slice(0, 3)

    displayAppointments.forEach(appointment => {
      const appointmentElement = this.createAppointmentElement(appointment)
      appointmentsList.appendChild(appointmentElement)
    })
  }

  createAppointmentElement(appointment) {
    const div = document.createElement('div')
    div.className = 'appointment-item'
    div.addEventListener('click', () => {
      chrome.tabs.create({
        url: `${APP_URL}/appointments/${appointment.id}`,
      })
      window.close()
    })

    const startTime = new Date(appointment.start_time)
    const timeUntil = this.getTimeUntil(startTime)
    const formattedTime = this.formatDateTime(startTime)

    div.innerHTML = `
      <div class="appointment-header">
        <div class="appointment-title">${this.escapeHtml(appointment.title)}</div>
        <div class="appointment-time">${timeUntil}</div>
      </div>
      <div class="appointment-details">
        <div class="appointment-datetime">${formattedTime}</div>
        ${appointment.client_name ? `<div class="appointment-client">👤 ${this.escapeHtml(appointment.client_name)}</div>` : ''}
        ${appointment.location ? `<div class="appointment-location">📍 ${this.escapeHtml(appointment.location)}</div>` : ''}
      </div>
    `

    return div
  }

  getTimeUntil(dateTime) {
    const now = new Date()
    const diffMs = dateTime - now
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMs < 0) {
      return 'Past'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`
    } else if (diffHours < 24) {
      return `${diffHours}h`
    } else {
      return `${diffDays}d`
    }
  }

  formatDateTime(date) {
    const options = {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return date.toLocaleDateString('en-US', options)
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  showLoading() {
    this.hideAllSections()
    document.getElementById('loading-section').classList.remove('hidden')
  }

  showMainContent() {
    this.hideAllSections()
    document.getElementById('main-content').classList.remove('hidden')
  }

  showAuthSection() {
    this.hideAllSections()
    document.getElementById('auth-section').classList.remove('hidden')
  }

  showEmptyState() {
    this.hideAllSections()
    document.getElementById('empty-state').classList.remove('hidden')
  }

  showError(message) {
    this.hideAllSections()
    // You could create an error section or show a simple alert
    console.error(message)
    this.showAuthSection() // Fallback to auth section
  }

  hideAllSections() {
    const sections = ['loading-section', 'main-content', 'auth-section', 'empty-state']

    sections.forEach(sectionId => {
      document.getElementById(sectionId).classList.add('hidden')
    })
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AppointmentPopup()
})

// Listen for storage changes (user login/logout)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.userSession) {
    // Reload the popup when user session changes
    location.reload()
  }
})
