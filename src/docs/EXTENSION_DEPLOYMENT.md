# AppointmentPro - Browser Extension Deployment Guide

## Chrome/Edge Extension Setup

### 1. Project Structure

```
appointmentpro-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── background.js
├── content.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── lib/
    └── supabase.js
```

### 2. Manifest Configuration

Create `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "AppointmentPro",
  "version": "1.0.0",
  "description": "Quick access to your upcoming appointments",
  "permissions": [
    "storage",
    "activeTab",
    "notifications",
    "alarms"
  ],
  "host_permissions": [
    "https://*.supabase.co/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "AppointmentPro",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 3. Popup HTML

Create `popup.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AppointmentPro</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="icons/icon48.png" alt="AppointmentPro" class="logo">
      <h1>AppointmentPro</h1>
      <button id="refreshBtn" class="refresh-btn" title="Refresh">⟳</button>
    </div>

    <!-- Authentication Section -->
    <div id="authSection" class="auth-section hidden">
      <p>Please log in to view your appointments</p>
      <button id="loginBtn" class="btn btn-primary">Login to Web App</button>
    </div>

    <!-- Loading Section -->
    <div id="loadingSection" class="loading-section hidden">
      <div class="loading-spinner"></div>
      <p>Loading appointments...</p>
    </div>

    <!-- Appointments Section -->
    <div id="appointmentsSection" class="appointments-section hidden">
      <div class="section-header">
        <h2>Upcoming Appointments</h2>
        <span id="appointmentCount" class="count">0</span>
      </div>
      
      <div id="appointmentsList" class="appointments-list">
        <!-- Appointments will be populated here -->
      </div>

      <div class="actions">
        <button id="viewAllBtn" class="btn btn-secondary">View All</button>
        <button id="newAppointmentBtn" class="btn btn-primary">New Appointment</button>
      </div>
    </div>

    <!-- Empty State -->
    <div id="emptySection" class="empty-section hidden">
      <div class="empty-icon">📅</div>
      <h3>No upcoming appointments</h3>
      <p>You're all caught up!</p>
      <button id="createFirstBtn" class="btn btn-primary">Create Appointment</button>
    </div>

    <!-- Error Section -->
    <div id="errorSection" class="error-section hidden">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load appointments</h3>
      <p id="errorMessage">Please check your connection and try again.</p>
      <button id="retryBtn" class="btn btn-secondary">Retry</button>
    </div>
  </div>

  <script src="lib/supabase.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

### 4. Popup Styles

Create `popup.css`:

```css
body {
  width: 350px;
  min-height: 400px;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f8fafc;
  color: #1e293b;
}

.container {
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.logo {
  width: 24px;
  height: 24px;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
  flex: 1;
}

.refresh-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #64748b;
}

.refresh-btn:hover {
  background: #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.count {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.appointments-list {
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.appointment-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.appointment-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.appointment-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #1e293b;
}

.appointment-client {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
}

.appointment-time {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 500;
}

.appointment-status {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  margin-top: 4px;
}

.status-scheduled {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.auth-section, .loading-section, .empty-section, .error-section {
  text-align: center;
  padding: 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon, .error-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.hidden {
  display: none;
}

/* Scrollbar styling */
.appointments-list::-webkit-scrollbar {
  width: 4px;
}

.appointments-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.appointments-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.appointments-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

### 5. Supabase Client for Extension

Create `lib/supabase.js`:

```javascript
// Simple Supabase client for browser extension
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.url}/rest/v1${endpoint}`;
    const response = await fetch(url, {
      headers: this.headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  from(table) {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          limit: (count) => this.request(
            `/${table}?select=${columns}&${column}=eq.${value}&limit=${count}&order=start_time.asc`
          ),
          execute: () => this.request(
            `/${table}?select=${columns}&${column}=eq.${value}&order=start_time.asc`
          )
        }),
        execute: () => this.request(`/${table}?select=${columns}&order=start_time.asc`)
      })
    };
  }
}

// Configuration
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 6. Popup JavaScript

Create `popup.js`:

```javascript
class AppointmentExtension {
  constructor() {
    this.currentUser = null;
    this.appointments = [];
    this.init();
  }

  async init() {
    await this.loadUser();
    this.bindEvents();
    await this.loadAppointments();
  }

  async loadUser() {
    try {
      // Try to get user session from storage
      const result = await chrome.storage.local.get(['supabase_user']);
      if (result.supabase_user) {
        this.currentUser = result.supabase_user;
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  async loadAppointments() {
    if (!this.currentUser) {
      this.showAuthSection();
      return;
    }

    this.showLoadingSection();

    try {
      // Get upcoming appointments
      const now = new Date().toISOString();
      const data = await supabase
        .from('appointments')
        .select('id,title,client_name,start_time,end_time,status,location')
        .eq('user_id', this.currentUser.id)
        .gte('start_time', now)
        .eq('status', 'scheduled')
        .limit(5);

      this.appointments = data || [];
      this.renderAppointments();
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showErrorSection('Failed to load appointments. Please check your connection.');
    }
  }

  renderAppointments() {
    if (this.appointments.length === 0) {
      this.showEmptySection();
      return;
    }

    this.showAppointmentsSection();
    
    const appointmentsList = document.getElementById('appointmentsList');
    const appointmentCount = document.getElementById('appointmentCount');
    
    appointmentCount.textContent = this.appointments.length;
    
    appointmentsList.innerHTML = this.appointments.map(appointment => {
      const startTime = new Date(appointment.start_time);
      const formattedDate = startTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return `
        <div class="appointment-item" data-id="${appointment.id}">
          <div class="appointment-title">${this.escapeHtml(appointment.title)}</div>
          ${appointment.client_name ? `<div class="appointment-client">${this.escapeHtml(appointment.client_name)}</div>` : ''}
          <div class="appointment-time">${formattedDate} at ${formattedTime}</div>
          <span class="appointment-status status-${appointment.status}">${appointment.status}</span>
        </div>
      `;
    }).join('');

    // Add click handlers for appointments
    appointmentsList.querySelectorAll('.appointment-item').forEach(item => {
      item.addEventListener('click', () => {
        const appointmentId = item.dataset.id;
        this.openAppointment(appointmentId);
      });
    });
  }

  bindEvents() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadAppointments();
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
      this.openWebApp('/auth');
    });

    document.getElementById('viewAllBtn').addEventListener('click', () => {
      this.openWebApp('/dashboard');
    });

    document.getElementById('newAppointmentBtn').addEventListener('click', () => {
      this.openWebApp('/appointments/new');
    });

    document.getElementById('createFirstBtn').addEventListener('click', () => {
      this.openWebApp('/appointments/new');
    });

    document.getElementById('retryBtn').addEventListener('click', () => {
      this.loadAppointments();
    });
  }

  openWebApp(path = '') {
    const webAppUrl = 'https://your-appointment-app.vercel.app';
    chrome.tabs.create({ url: `${webAppUrl}${path}` });
    window.close();
  }

  openAppointment(appointmentId) {
    this.openWebApp(`/appointments/${appointmentId}`);
  }

  showSection(sectionId) {
    const sections = ['authSection', 'loadingSection', 'appointmentsSection', 'emptySection', 'errorSection'];
    sections.forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
  }

  showAuthSection() {
    this.showSection('authSection');
  }

  showLoadingSection() {
    this.showSection('loadingSection');
  }

  showAppointmentsSection() {
    this.showSection('appointmentsSection');
  }

  showEmptySection() {
    this.showSection('emptySection');
  }

  showErrorSection(message) {
    this.showSection('errorSection');
    document.getElementById('errorMessage').textContent = message;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
  new AppointmentExtension();
});
```

### 7. Background Script

Create `background.js`:

```javascript
// Background script for handling notifications and data sync
class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.setupPeriodicSync();
    });

    // Listen for messages from popup/content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Setup alarm for periodic appointment checks
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'checkAppointments') {
        this.checkUpcomingAppointments();
      }
    });
  }

  setupPeriodicSync() {
    // Check for upcoming appointments every 15 minutes
    chrome.alarms.create('checkAppointments', {
      periodInMinutes: 15
    });
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'updateUser':
        await this.updateUser(message.user);
        sendResponse({ success: true });
        break;
      case 'clearUser':
        await this.clearUser();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async updateUser(user) {
    await chrome.storage.local.set({ supabase_user: user });
  }

  async clearUser() {
    await chrome.storage.local.remove(['supabase_user']);
  }

  async checkUpcomingAppointments() {
    try {
      // Get user from storage
      const result = await chrome.storage.local.get(['supabase_user']);
      if (!result.supabase_user) return;

      // Check for appointments in the next hour
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      // This would typically make an API call to check appointments
      // For now, we'll just create a simple notification
      this.createNotification('Appointment Reminder', 'Check your upcoming appointments');
    } catch (error) {
      console.error('Error checking appointments:', error);
    }
  }

  createNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }
}

new BackgroundService();
```

### 8. Content Script (Optional)

Create `content.js` for web app integration:

```javascript
// Content script to communicate with the web app
(function() {
  'use strict';

  // Listen for user authentication changes in the web app
  window.addEventListener('supabase-auth-change', (event) => {
    const { user, session } = event.detail;
    
    // Send user data to extension background script
    chrome.runtime.sendMessage({
      action: 'updateUser',
      user: user
    });
  });

  // Listen for user logout
  window.addEventListener('supabase-auth-logout', () => {
    chrome.runtime.sendMessage({
      action: 'clearUser'
    });
  });
})();
```

### 9. Building and Packaging

1. **Prepare icons** (16x16, 48x48, 128x128 pixels)
2. **Test locally**:
   - Open Chrome/Edge
   - Go to `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select your extension folder

3. **Package for distribution**:
   ```bash
   # Create a zip file with all extension files
   zip -r appointmentpro-extension.zip . -x "*.git*" "node_modules/*" "*.DS_Store"
   ```

### 10. Store Submission

#### Chrome Web Store:
1. Create developer account ($5 one-time fee)
2. Upload zip file
3. Fill out store listing
4. Submit for review (1-3 days)

#### Microsoft Edge Add-ons:
1. Create developer account (free)
2. Upload zip file
3. Fill out store listing
4. Submit for review (7-10 days)

### 11. Deployment Configuration

Update the following URLs in your extension files:

- `popup.js`: Update `webAppUrl` to your deployed web app
- `lib/supabase.js`: Update `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `manifest.json`: Update `host_permissions` to include your domain

### 12. Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup displays correctly
- [ ] Authentication flow works
- [ ] Appointments load and display
- [ ] Click handlers open correct web app pages
- [ ] Refresh functionality works
- [ ] Error states display properly
- [ ] Notifications work (if implemented)

This extension provides a quick view of upcoming appointments and easy access to the full web application while maintaining a lightweight, focused experience.