// Background service worker for Chrome extension
console.log('Bookio background script loaded')

const SUPABASE_URL = 'your-supabase-url'
const SUPABASE_ANON_KEY = 'your-supabase-anon-key'
const APP_URL = 'https://your-app-domain.com'

// Listen for auth changes from the web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'AUTH_CHANGED') {
        handleAuthChange(request.data)
    } else if (request.type === 'APPOINTMENT_UPDATED') {
        handleAppointmentUpdate(request.data)
    }
})

// Handle authentication changes
async function handleAuthChange(authData) {
    if (authData && authData.session) {
        // Store auth data
        await chrome.storage.local.set({
            supabase_auth: {
                token: authData.session.access_token,
                user: authData.session.user,
                expires_at: authData.session.expires_at
            }
        })
        
        // Set up notifications
        await setupNotifications()
        
        console.log('User authenticated in extension')
    } else {
        // Clear auth data
        await chrome.storage.local.remove(['supabase_auth'])
        console.log('User logged out from extension')
    }
}

// Handle appointment updates
async function handleAppointmentUpdate(appointmentData) {
    console.log('Appointment updated:', appointmentData)
    
    // If it's a new appointment or status change, might want to show notification
    if (appointmentData.type === 'created') {
        await showNotification({
            title: 'Nueva cita creada',
            message: `${appointmentData.appointment.title} programada para ${new Date(appointmentData.appointment.start_datetime).toLocaleString('es-ES')}`,
            iconUrl: 'icons/icon48.png'
        })
    }
}

// Set up notification scheduling
async function setupNotifications() {
    try {
        const authData = await getStoredAuth()
        if (!authData) return

        // Fetch upcoming appointments
        const appointments = await fetchUpcomingAppointments(authData.token)
        
        // Clear existing alarms
        await chrome.alarms.clearAll()
        
        // Set up alarms for upcoming appointments
        for (const appointment of appointments) {
            const appointmentTime = new Date(appointment.start_datetime)
            const now = new Date()
            
            // Set reminder 1 hour before (if appointment is more than 1 hour away)
            const oneHourBefore = new Date(appointmentTime.getTime() - 60 * 60 * 1000)
            if (oneHourBefore > now) {
                await chrome.alarms.create(`reminder_${appointment.id}`, {
                    when: oneHourBefore.getTime()
                })
            }
            
            // Set reminder 15 minutes before (if appointment is more than 15 minutes away)
            const fifteenMinsBefore = new Date(appointmentTime.getTime() - 15 * 60 * 1000)
            if (fifteenMinsBefore > now) {
                await chrome.alarms.create(`reminder_final_${appointment.id}`, {
                    when: fifteenMinsBefore.getTime()
                })
            }
        }
        
        console.log(`Set up notifications for ${appointments.length} appointments`)
        
    } catch (error) {
        console.error('Error setting up notifications:', error)
    }
}

// Listen for alarm triggers
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('Alarm triggered:', alarm.name)
    
    if (alarm.name.startsWith('reminder_')) {
        const appointmentId = alarm.name.replace('reminder_', '').replace('reminder_final_', '')
        const isFinalReminder = alarm.name.includes('final')
        
        try {
            const authData = await getStoredAuth()
            if (!authData) return
            
            const appointment = await fetchAppointment(authData.token, appointmentId)
            if (!appointment) return
            
            const appointmentTime = new Date(appointment.start_datetime)
            const timeText = isFinalReminder ? 'en 15 minutos' : 'en 1 hora'
            
            await showNotification({
                title: `Recordatorio: ${appointment.title}`,
                message: `Tu cita con ${appointment.client_name} es ${timeText}`,
                iconUrl: 'icons/icon48.png',
                buttons: [
                    { title: 'Ver detalles' },
                    { title: 'Abrir app' }
                ]
            })
            
        } catch (error) {
            console.error('Error handling alarm:', error)
        }
    }
})

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.tabs.create({ url: APP_URL })
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        // "Ver detalles" - extract appointment ID if available
        chrome.tabs.create({ url: APP_URL })
    } else if (buttonIndex === 1) {
        // "Abrir app"
        chrome.tabs.create({ url: APP_URL })
    }
})

// Utility functions
async function getStoredAuth() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['supabase_auth'], (result) => {
            const authData = result.supabase_auth
            
            // Check if token is expired
            if (authData && authData.expires_at) {
                const expiresAt = new Date(authData.expires_at * 1000)
                if (expiresAt <= new Date()) {
                    // Token expired
                    chrome.storage.local.remove(['supabase_auth'])
                    resolve(null)
                    return
                }
            }
            
            resolve(authData)
        })
    })
}

async function fetchUpcomingAppointments(token) {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/appointments?start_datetime=gte.${now.toISOString()}&start_datetime=lte.${oneWeekFromNow.toISOString()}&status=eq.scheduled&order=start_datetime.asc`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        }
    )
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
}

async function fetchAppointment(token, appointmentId) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/appointments?id=eq.${appointmentId}&select=*,clients(name)`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        }
    )
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data[0]
}

async function showNotification(options) {
    return new Promise((resolve) => {
        chrome.notifications.create(
            {
                type: 'basic',
                iconUrl: options.iconUrl || 'icons/icon48.png',
                title: options.title,
                message: options.message,
                buttons: options.buttons,
                requireInteraction: true
            },
            resolve
        )
    })
}

// Initialize on extension startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension started, setting up notifications')
    await setupNotifications()
})

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated')
    await setupNotifications()
})

// Refresh notifications every hour
chrome.alarms.create('refresh_notifications', { periodInMinutes: 60 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'refresh_notifications') {
        console.log('Refreshing notifications')
        await setupNotifications()
    }
})