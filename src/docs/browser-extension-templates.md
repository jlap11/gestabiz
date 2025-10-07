# Browser Extension Templates

This directory contains the complete browser extension for Chrome/Edge.

## File Structure

```
browser-extension/
├── manifest.json
├── popup.html
├── popup.js
├── popup.css
├── background.js
├── content.js
├── options.html
├── options.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Complete Extension Files

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Bookio - Quick Appointments",
  "version": "1.0.0",
  "description": "Quick access to your upcoming appointments and schedule management",
  "permissions": [
    "storage",
    "activeTab",
    "alarms",
    "notifications"
  ],
  "host_permissions": [
    "https://*.supabase.co/*",
    "https://your-app-domain.vercel.app/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Bookio",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://your-app-domain.vercel.app/*"],
      "js": ["content.js"]
    }
  ],
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### popup.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <img src="icons/icon48.png" alt="Bookio" class="logo-icon">
        <span class="logo-text">Bookio</span>
      </div>
      <div class="sync-status" id="sync-status">
        <span class="sync-dot"></span>
      </div>
    </div>

    <!-- User Info -->
    <div class="user-info" id="user-info" style="display: none;">
      <img id="user-avatar" class="user-avatar" src="" alt="User">
      <span id="user-name" class="user-name"></span>
    </div>

    <!-- Main Content -->
    <div class="content">
      <!-- Loading State -->
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <span>Loading appointments...</span>
      </div>

      <!-- Not Logged In -->
      <div class="not-logged-in" id="not-logged-in" style="display: none;">
        <div class="icon">🔐</div>
        <h3>Please Log In</h3>
        <p>Log in to your Bookio account to see your appointments here.</p>
        <button class="btn btn-primary" id="login-btn">Open Bookio</button>
      </div>

      <!-- Appointments List -->
      <div class="appointments-section" id="appointments-section" style="display: none;">
        <div class="section-header">
          <h3>Upcoming Appointments</h3>
          <button class="btn btn-ghost btn-sm" id="refresh-btn">↻</button>
        </div>
        <div class="appointments-list" id="appointments-list"></div>
        
        <div class="no-appointments" id="no-appointments" style="display: none;">
          <div class="icon">📅</div>
          <p>No upcoming appointments</p>
          <button class="btn btn-secondary btn-sm" id="create-appointment-btn">Create New</button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats" id="stats" style="display: none;">
        <div class="stat-item">
          <span class="stat-value" id="stat-today">0</span>
          <span class="stat-label">Today</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="stat-week">0</span>
          <span class="stat-label">This Week</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="stat-total">0</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="footer">
      <button class="btn btn-primary btn-full" id="open-app-btn">Open Full App</button>
      <div class="footer-links">
        <button class="link-btn" id="settings-btn">Settings</button>
        <button class="link-btn" id="help-btn">Help</button>
      </div>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### popup.css
```css
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 380px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  background: #ffffff;
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 24px;
  height: 24px;
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  color: #2563eb;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

.sync-dot.error {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

/* Content */
.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: #6b7280;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Not Logged In */
.not-logged-in {
  text-align: center;
  padding: 40px 20px;
}

.not-logged-in .icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.not-logged-in h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}

.not-logged-in p {
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.6;
}

/* Appointments */
.appointments-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appointment-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.appointment-card:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.appointment-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
  font-size: 15px;
}

.appointment-client {
  color: #2563eb;
  font-size: 13px;
  margin-bottom: 8px;
}

.appointment-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.appointment-location {
  font-size: 13px;
  color: #6b7280;
}

.appointment-countdown {
  display: inline-flex;
  align-items: center;
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 8px;
}

.appointment-countdown.urgent {
  background: #fee2e2;
  color: #991b1b;
}

.appointment-countdown.distant {
  background: #dbeafe;
  color: #1e40af;
}

/* No Appointments */
.no-appointments {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-appointments .icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

/* Stats */
.stats {
  display: flex;
  justify-content: space-around;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #2563eb;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Footer */
.footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.btn:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border-color: #6b7280;
}

.btn-secondary:hover {
  background: #4b5563;
  border-color: #4b5563;
}

.btn-ghost {
  color: #6b7280;
  border-color: #e5e7eb;
}

.btn-ghost:hover {
  background: #f3f4f6;
  color: #374151;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-full {
  width: 100%;
}

.link-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.link-btn:hover {
  color: #374151;
}

/* Utilities */
.text-center {
  text-align: center;
}

.mb-4 {
  margin-bottom: 16px;
}

/* Responsive adjustments */
@media (max-height: 500px) {
  .content {
    padding: 12px 20px;
  }
  
  .appointments-list {
    gap: 8px;
  }
  
  .appointment-card {
    padding: 12px;
  }
}
```

### popup.js
```javascript
// Configuration
const CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
  SUPABASE_ANON_KEY: 'your_anon_key',
  WEB_APP_URL: 'https://your-app-domain.vercel.app',
  MAX_APPOINTMENTS: 5,
  REFRESH_INTERVAL: 5 * 60 * 1000 // 5 minutes
}

class AppointmentExtension {
  constructor() {
    this.user = null
    this.appointments = []
    this.stats = {}
    this.lastUpdate = null
    
    this.init()
  }

  async init() {
    try {
      this.showLoading(true)
      
      // Check if user is authenticated
      const authData = await this.getStoredAuth()
      if (authData) {
        this.user = authData.user
        await this.loadAppointments()
        this.showUserInfo()
        this.showAppointments()
      } else {
        this.showNotLoggedIn()
      }
      
      this.setupEventListeners()
      this.setupPeriodicRefresh()
      
    } catch (error) {
      console.error('Error initializing extension:', error)
      this.showError('Failed to load appointments')
    } finally {
      this.showLoading(false)
    }
  }

  async getStoredAuth() {
    try {
      const result = await chrome.storage.local.get(['supabase_auth'])
      return result.supabase_auth || null
    } catch (error) {
      console.error('Error getting stored auth:', error)
      return null
    }
  }

  async loadAppointments() {
    if (!this.user) return

    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/browser-extension-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.user.id,
          limit: CONFIG.MAX_APPOINTMENTS
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      this.appointments = data.appointments || []
      this.stats = data.stats || {}
      this.lastUpdate = new Date()
      
      this.updateSyncStatus('success')
      
    } catch (error) {
      console.error('Error loading appointments:', error)
      this.updateSyncStatus('error')
      throw error
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading')
    if (loading) {
      loading.style.display = show ? 'flex' : 'none'
    }
  }

  showNotLoggedIn() {
    document.getElementById('not-logged-in').style.display = 'block'
    document.getElementById('appointments-section').style.display = 'none'
    document.getElementById('stats').style.display = 'none'
    document.getElementById('user-info').style.display = 'none'
  }

  showUserInfo() {
    if (!this.user) return
    
    const userInfo = document.getElementById('user-info')
    const userAvatar = document.getElementById('user-avatar')
    const userName = document.getElementById('user-name')
    
    if (userInfo && userAvatar && userName) {
      userAvatar.src = this.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.email)}&background=2563eb&color=fff`
      userName.textContent = this.user.user_metadata?.full_name || this.user.email.split('@')[0]
      userInfo.style.display = 'flex'
    }
  }

  showAppointments() {
    const appointmentsSection = document.getElementById('appointments-section')
    const appointmentsList = document.getElementById('appointments-list')
    const noAppointments = document.getElementById('no-appointments')
    const statsSection = document.getElementById('stats')
    
    appointmentsSection.style.display = 'block'
    statsSection.style.display = 'block'
    
    if (this.appointments.length === 0) {
      appointmentsList.innerHTML = ''
      noAppointments.style.display = 'block'
    } else {
      noAppointments.style.display = 'none'
      this.renderAppointments()
    }
    
    this.renderStats()
  }

  renderAppointments() {
    const container = document.getElementById('appointments-list')
    if (!container) return

    container.innerHTML = this.appointments.map(apt => {
      const startTime = new Date(apt.datetime)
      const timeUntil = this.getTimeUntil(startTime)
      const countdownClass = this.getCountdownClass(startTime)
      
      return `
        <div class="appointment-card" data-appointment-id="${apt.id}">
          <div class="appointment-title">${this.escapeHtml(apt.title)}</div>
          ${apt.client ? `<div class="appointment-client">👤 ${this.escapeHtml(apt.client)}</div>` : ''}
          <div class="appointment-time">
            🕐 ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          ${apt.location ? `<div class="appointment-location">📍 ${this.escapeHtml(apt.location)}</div>` : ''}
          <div class="appointment-countdown ${countdownClass}">
            ${timeUntil}
          </div>
        </div>
      `
    }).join('')

    // Add click handlers
    container.querySelectorAll('.appointment-card').forEach(card => {
      card.addEventListener('click', () => {
        const appointmentId = card.dataset.appointmentId
        this.openAppointmentDetail(appointmentId)
      })
    })
  }

  renderStats() {
    const todayStat = document.getElementById('stat-today')
    const weekStat = document.getElementById('stat-week')
    const totalStat = document.getElementById('stat-total')
    
    if (todayStat) todayStat.textContent = this.stats.today || 0
    if (weekStat) weekStat.textContent = this.stats.this_week || 0
    if (totalStat) totalStat.textContent = this.stats.scheduled || 0
  }

  getTimeUntil(dateTime) {
    const now = new Date()
    const diffInMs = dateTime.getTime() - now.getTime()
    
    if (diffInMs < 0) return 'Overdue'
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInDays > 0) {
      return `in ${diffInDays} day${diffInDays === 1 ? '' : 's'}`
    } else if (diffInHours > 0) {
      return `in ${diffInHours} hour${diffInHours === 1 ? '' : 's'}`
    } else if (diffInMinutes > 0) {
      return `in ${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'}`
    } else {
      return 'Starting now!'
    }
  }

  getCountdownClass(dateTime) {
    const now = new Date()
    const diffInMs = dateTime.getTime() - now.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'urgent'
    if (diffInHours > 24) return 'distant'
    return ''
  }

  updateSyncStatus(status) {
    const syncStatus = document.getElementById('sync-status')
    const syncDot = syncStatus?.querySelector('.sync-dot')
    
    if (!syncDot) return
    
    syncDot.className = 'sync-dot'
    if (status === 'error') {
      syncDot.classList.add('error')
    }
    
    // Update timestamp
    if (this.lastUpdate) {
      syncStatus.title = `Last updated: ${this.lastUpdate.toLocaleTimeString()}`
    }
  }

  setupEventListeners() {
    // Open app button
    const openAppBtn = document.getElementById('open-app-btn')
    if (openAppBtn) {
      openAppBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: CONFIG.WEB_APP_URL })
      })
    }

    // Login button
    const loginBtn = document.getElementById('login-btn')
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: CONFIG.WEB_APP_URL })
      })
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn')
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh()
      })
    }

    // Create appointment button
    const createBtn = document.getElementById('create-appointment-btn')
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: `${CONFIG.WEB_APP_URL}/appointments/new` })
      })
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn')
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage()
      })
    }

    // Help button
    const helpBtn = document.getElementById('help-btn')
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: `${CONFIG.WEB_APP_URL}/help` })
      })
    }
  }

  setupPeriodicRefresh() {
    setInterval(() => {
      if (this.user) {
        this.refresh()
      }
    }, CONFIG.REFRESH_INTERVAL)
  }

  async refresh() {
    try {
      await this.loadAppointments()
      this.renderAppointments()
      this.renderStats()
    } catch (error) {
      console.error('Error refreshing appointments:', error)
    }
  }

  openAppointmentDetail(appointmentId) {
    chrome.tabs.create({ 
      url: `${CONFIG.WEB_APP_URL}/appointments/${appointmentId}` 
    })
  }

  showError(message) {
    const content = document.querySelector('.content')
    if (content) {
      content.innerHTML = `
        <div class="not-logged-in">
          <div class="icon">⚠️</div>
          <h3>Error</h3>
          <p>${this.escapeHtml(message)}</p>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

// Initialize extension when popup opens
document.addEventListener('DOMContentLoaded', () => {
  new AppointmentExtension()
})
```

### background.js
```javascript
// Background script for Bookio extension

// Configuration
const CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
  WEB_APP_URL: 'https://your-app-domain.vercel.app',
  SYNC_INTERVAL: 5, // minutes
  NOTIFICATION_BADGE_UPDATE_INTERVAL: 1 // minutes
}

// Installation and update handlers
chrome.runtime.onInstalled.addListener(({ reason }) => {
  console.log('Bookio extension installed/updated:', reason)
  
  // Set up periodic sync
  chrome.alarms.create('syncAppointments', { 
    periodInMinutes: CONFIG.SYNC_INTERVAL 
  })
  
  // Set up badge update
  chrome.alarms.create('updateBadge', { 
    periodInMinutes: CONFIG.NOTIFICATION_BADGE_UPDATE_INTERVAL 
  })
  
  // Initial badge update
  updateBadge()
})

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'syncAppointments':
      syncAppointments()
      break
    case 'updateBadge':
      updateBadge()
      break
  }
})

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'STORE_AUTH_TOKEN':
      storeAuthData(message.data)
      sendResponse({ success: true })
      break
      
    case 'CLEAR_AUTH_TOKEN':
      clearAuthData()
      sendResponse({ success: true })
      break
      
    case 'GET_AUTH_STATUS':
      getAuthStatus().then(sendResponse)
      return true // Keep message channel open for async response
      
    case 'SYNC_NOW':
      syncAppointments().then(sendResponse)
      return true
      
    case 'SHOW_NOTIFICATION':
      showNotification(message.data)
      sendResponse({ success: true })
      break
  }
})

// Store authentication data
async function storeAuthData(authData) {
  try {
    await chrome.storage.local.set({ 
      supabase_auth: authData,
      last_auth_update: Date.now()
    })
    console.log('Auth data stored successfully')
    
    // Immediate sync after login
    setTimeout(syncAppointments, 1000)
    
  } catch (error) {
    console.error('Error storing auth data:', error)
  }
}

// Clear authentication data
async function clearAuthData() {
  try {
    await chrome.storage.local.remove(['supabase_auth', 'last_auth_update', 'appointments_cache'])
    chrome.action.setBadgeText({ text: '' })
    console.log('Auth data cleared')
  } catch (error) {
    console.error('Error clearing auth data:', error)
  }
}

// Get authentication status
async function getAuthStatus() {
  try {
    const result = await chrome.storage.local.get(['supabase_auth'])
    return {
      isAuthenticated: !!result.supabase_auth,
      user: result.supabase_auth?.user || null
    }
  } catch (error) {
    console.error('Error getting auth status:', error)
    return { isAuthenticated: false, user: null }
  }
}

// Sync appointments from backend
async function syncAppointments() {
  try {
    const authStatus = await getAuthStatus()
    if (!authStatus.isAuthenticated) {
      console.log('User not authenticated, skipping sync')
      return { success: false, reason: 'not_authenticated' }
    }

    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/browser-extension-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: authStatus.user.id,
        limit: 10
      })
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Cache the data
    await chrome.storage.local.set({
      appointments_cache: data,
      last_sync: Date.now()
    })
    
    console.log(`Synced ${data.appointments?.length || 0} appointments`)
    
    // Update badge
    updateBadge()
    
    // Check for urgent appointments
    checkUrgentAppointments(data.appointments || [])
    
    return { success: true, appointments: data.appointments }
    
  } catch (error) {
    console.error('Error syncing appointments:', error)
    return { success: false, error: error.message }
  }
}

// Update badge with appointment count
async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['appointments_cache'])
    const appointments = result.appointments_cache?.appointments || []
    
    // Count appointments in next 24 hours
    const now = new Date()
    const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000))
    
    const urgentCount = appointments.filter(apt => {
      const aptTime = new Date(apt.datetime)
      return aptTime >= now && aptTime <= next24Hours
    }).length
    
    // Update badge
    if (urgentCount > 0) {
      chrome.action.setBadgeText({ text: urgentCount.toString() })
      chrome.action.setBadgeBackgroundColor({ color: '#2563eb' })
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
    
  } catch (error) {
    console.error('Error updating badge:', error)
  }
}

// Check for urgent appointments and show notifications
function checkUrgentAppointments(appointments) {
  if (!appointments || appointments.length === 0) return
  
  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000))
  
  appointments.forEach(apt => {
    const aptTime = new Date(apt.datetime)
    const timeUntilApt = aptTime.getTime() - now.getTime()
    
    // Show notification for appointments starting within 1 hour
    if (timeUntilApt > 0 && timeUntilApt <= (60 * 60 * 1000)) {
      const minutes = Math.floor(timeUntilApt / (60 * 1000))
      
      showNotification({
        title: 'Appointment Starting Soon',
        message: `"${apt.title}" starts in ${minutes} minutes`,
        iconUrl: 'icons/icon48.png',
        type: 'appointment_reminder',
        appointmentId: apt.id
      })
    }
  })
}

// Show browser notification
function showNotification(notificationData) {
  const options = {
    type: 'basic',
    iconUrl: notificationData.iconUrl || 'icons/icon48.png',
    title: notificationData.title,
    message: notificationData.message
  }
  
  chrome.notifications.create(
    `appointment_${notificationData.appointmentId || Date.now()}`,
    options
  )
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('appointment_')) {
    // Open the web app
    chrome.tabs.create({ url: CONFIG.WEB_APP_URL })
  }
  
  // Clear the notification
  chrome.notifications.clear(notificationId)
})

// Handle tab updates to detect web app visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.startsWith(CONFIG.WEB_APP_URL)) {
    
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => {
      // Script may already be injected, ignore error
      console.log('Content script injection skipped:', err.message)
    })
  }
})

// Initial setup
console.log('Bookio background script loaded')
updateBadge()
```

### content.js
```javascript
// Content script for Bookio extension
// Runs on the web app to detect authentication state

(function() {
  'use strict'
  
  // Only run on the main domain
  if (!window.location.hostname.includes('your-app-domain')) {
    return
  }
  
  console.log('Bookio content script loaded')
  
  // Check for authentication state changes
  let lastAuthState = null
  
  function checkAuthState() {
    // Look for auth indicators in the DOM
    const userElement = document.querySelector('[data-user-id]')
    const loginButton = document.querySelector('[data-auth="login"]')
    
    const isAuthenticated = !!userElement && !loginButton
    const currentUser = userElement ? {
      id: userElement.dataset.userId,
      email: userElement.dataset.userEmail,
      name: userElement.dataset.userName,
      avatar: userElement.dataset.userAvatar
    } : null
    
    // Only update if state changed
    if (JSON.stringify({ isAuthenticated, currentUser }) !== JSON.stringify(lastAuthState)) {
      lastAuthState = { isAuthenticated, currentUser }
      
      if (isAuthenticated && currentUser) {
        // Store auth data for extension
        chrome.runtime.sendMessage({
          type: 'STORE_AUTH_TOKEN',
          data: {
            user: currentUser,
            authenticated: true,
            timestamp: Date.now()
          }
        })
        
        console.log('Auth state updated: logged in')
      } else {
        // Clear auth data
        chrome.runtime.sendMessage({
          type: 'CLEAR_AUTH_TOKEN'
        })
        
        console.log('Auth state updated: logged out')
      }
    }
  }
  
  // Check auth state on load
  setTimeout(checkAuthState, 1000)
  
  // Monitor for changes
  const observer = new MutationObserver(() => {
    checkAuthState()
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-user-id', 'data-auth']
  })
  
  // Listen for storage events (localStorage/sessionStorage changes)
  window.addEventListener('storage', checkAuthState)
  
  // Check periodically as fallback
  setInterval(checkAuthState, 30000) // Every 30 seconds
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect()
  })
  
})()
```

## Installation Instructions

1. **Create the extension directory:**
   ```bash
   mkdir Bookio-extension
   cd Bookio-extension
   ```

2. **Add all files above to the directory**

3. **Update configuration:**
   - Replace `YOUR_PROJECT_REF` with your Supabase project reference
   - Replace `your_anon_key` with your Supabase anon key
   - Replace `your-app-domain.vercel.app` with your web app domain

4. **Create icons:**
   - Create 16x16, 48x48, and 128x128 pixel PNG icons
   - Place them in the `icons/` directory

5. **Test locally:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select your extension directory

6. **Package for Chrome Web Store:**
   - Create a ZIP file with all extension files
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload and submit for review

The extension will show upcoming appointments, sync with your web app, and provide quick access to the full application.