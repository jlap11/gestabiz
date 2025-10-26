// Configuration
const SUPABASE_URL = 'your-supabase-url'
const SUPABASE_ANON_KEY = 'your-supabase-anon-key'
const APP_URL = 'https://your-app-domain.com'

// State management
let isLoading = false
let currentUser = null
let appointments = []

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    await initializeExtension()
    setupEventListeners()
})

async function initializeExtension() {
    try {
        showLoading()
        
        // Check if user is authenticated
        const authData = await getStoredAuth()
        
        if (!authData || !authData.token) {
            showAuthState()
            return
        }

        currentUser = authData.user
        await loadAppointments()
        
    } catch (error) {
        console.error('Error initializing extension:', error)
        showError('Error al inicializar la extensión')
    }
}

async function getStoredAuth() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['supabase_auth'], (result) => {
            resolve(result.supabase_auth)
        })
    })
}

async function loadAppointments() {
    try {
        const authData = await getStoredAuth()
        
        if (!authData?.token) {
            showAuthState()
            return
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            method: 'GET'
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // Filter upcoming appointments
        const now = new Date()
        const upcomingAppointments = data
            .filter(apt => {
                const appointmentDate = new Date(apt.start_datetime)
                return appointmentDate > now && apt.status === 'scheduled'
            })
            .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
            .slice(0, 5) // Show only next 5 appointments

        appointments = upcomingAppointments
        updateUI()
        
    } catch (error) {
        console.error('Error loading appointments:', error)
        showError('Error al cargar las citas')
    }
}

function updateUI() {
    hideLoading()
    
    if (appointments.length === 0) {
        showEmptyState()
        return
    }

    showMainContent()
    updateStats()
    renderAppointments()
}

function updateStats() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const thisWeek = new Date(today)
    thisWeek.setDate(today.getDate() + 7)

    const todayCount = appointments.filter(apt => {
        const aptDate = new Date(apt.start_datetime)
        return aptDate.toDateString() === today.toDateString()
    }).length

    const weekCount = appointments.filter(apt => {
        const aptDate = new Date(apt.start_datetime)
        return aptDate <= thisWeek
    }).length

    document.getElementById('todayCount').textContent = todayCount
    document.getElementById('weekCount').textContent = weekCount
}

function renderAppointments() {
    const appointmentsList = document.getElementById('appointmentsList')
    appointmentsList.innerHTML = ''

    appointments.forEach(appointment => {
        const appointmentElement = createAppointmentElement(appointment)
        appointmentsList.appendChild(appointmentElement)
    })
}

function createAppointmentElement(appointment) {
    const div = document.createElement('div')
    div.className = 'appointment-item'
    
    const appointmentDate = new Date(appointment.start_datetime)
    const now = new Date()
    
    // Calculate time until appointment
    const timeDiff = appointmentDate - now
    const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    let timeText = ''
    if (hoursUntil < 1) {
        timeText = minutesUntil > 0 ? `en ${minutesUntil}m` : 'Ahora'
    } else if (hoursUntil < 24) {
        timeText = `en ${hoursUntil}h ${minutesUntil}m`
    } else {
        timeText = appointmentDate.toLocaleDateString('es-ES', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        })
    }

    const timeFormatted = appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    })

    div.innerHTML = `
        <div class="appointment-info">
            <div class="appointment-title">${appointment.title}</div>
            <div class="appointment-client">${appointment.client_name || 'Cliente'}</div>
            <div class="appointment-time">
                <span class="time">${timeFormatted}</span>
                <span class="time-until">${timeText}</span>
            </div>
        </div>
        <div class="appointment-actions">
            <button class="view-btn" onclick="viewAppointment('${appointment.id}')">Ver</button>
        </div>
    `

    // Add urgency indicator
    if (hoursUntil < 2) {
        div.classList.add('urgent')
    } else if (hoursUntil < 24) {
        div.classList.add('soon')
    }

    return div
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn')?.addEventListener('click', async () => {
        await loadAppointments()
    })

    // Login button
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: `${APP_URL}/login` })
        window.close()
    })

    // Open app button
    document.getElementById('openAppBtn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: APP_URL })
        window.close()
    })

    // Create appointment button
    document.getElementById('createAppointmentBtn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: `${APP_URL}/appointments/new` })
        window.close()
    })

    // Retry button
    document.getElementById('retryBtn')?.addEventListener('click', async () => {
        await initializeExtension()
    })
}

// View appointment function (called from HTML)
window.viewAppointment = function(appointmentId) {
    chrome.tabs.create({ url: `${APP_URL}/appointments/${appointmentId}` })
    window.close()
}

// UI State Functions
function showLoading() {
    isLoading = true
    document.getElementById('loadingState').classList.remove('hidden')
    document.getElementById('mainContent').classList.add('hidden')
    document.getElementById('authState').classList.add('hidden')
    document.getElementById('errorState').classList.add('hidden')
}

function hideLoading() {
    isLoading = false
    document.getElementById('loadingState').classList.add('hidden')
}

function showMainContent() {
    document.getElementById('mainContent').classList.remove('hidden')
    document.getElementById('emptyState').classList.add('hidden')
    document.getElementById('authState').classList.add('hidden')
    document.getElementById('errorState').classList.add('hidden')
}

function showEmptyState() {
    document.getElementById('mainContent').classList.remove('hidden')
    document.getElementById('emptyState').classList.remove('hidden')
    document.getElementById('authState').classList.add('hidden')
    document.getElementById('errorState').classList.add('hidden')
}

function showAuthState() {
    document.getElementById('authState').classList.remove('hidden')
    document.getElementById('mainContent').classList.add('hidden')
    document.getElementById('errorState').classList.add('hidden')
    hideLoading()
}

function showError(message) {
    document.getElementById('errorState').classList.remove('hidden')
    document.getElementById('errorState').querySelector('p').textContent = message
    document.getElementById('mainContent').classList.add('hidden')
    document.getElementById('authState').classList.add('hidden')
    hideLoading()
}