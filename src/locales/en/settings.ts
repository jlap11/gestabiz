// Settings - Complete with ALL preferences
export const settings = {
  title: 'Settings',
  subtitle: 'Configure your account and preferences',
  profile: 'Profile',
  appearance: 'Appearance',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
  language: 'Language',
  spanish: 'Español',
  english: 'English',
  notifications: 'Notifications',
  email_notifications: 'Email Notifications',
  push_notifications: 'Push Notifications',
  browser_notifications: 'Browser Notifications',
  whatsapp_notifications: 'WhatsApp Notifications',
  reminder_24h: '24 hour reminders',
  reminder_1h: '1 hour reminders',
  reminder_15m: '15 minute reminders',
  daily_digest: 'Daily digest',
  weekly_report: 'Weekly reports',
  save_preferences: 'Save Preferences',
  preferences_saved: 'Preferences saved successfully',
  
  // Tabs
  tabs: {
    general: 'General Settings',
    profile: 'Profile',
    notifications: 'Notifications',
    businessPreferences: 'Business Preferences',
    employeePreferences: 'Employee Preferences',
    clientPreferences: 'Client Preferences',
    dangerZone: 'Danger Zone'
  },

  // Theme section
  themeSection: {
    title: 'Appearance and System',
    subtitle: 'Customize the theme and language of the application',
    themeLabel: 'Interface theme',
    themeDescription: 'Select your preferred theme for the application',
    themes: {
      light: {
        label: 'Light',
        description: 'Light colored interface'
      },
      dark: {
        label: 'Dark',
        description: 'Dark colored interface'
      },
      system: {
        label: 'System',
        description: 'According to system preferences'
      }
    },
    currentTheme: 'Current theme: {{theme}}',
    systemThemeNote: 'The theme automatically changes according to your operating system preferences',
    changeAnytime: 'You can change the theme at any time'
  },

  // Language section
  languageSection: {
    label: 'Interface Language',
    description: 'Select the interface language'
  },

  // Admin Business Preferences
  businessInfo: {
    title: 'Business Information',
    subtitle: 'Basic business information',
    tabs: {
      info: 'Business Information',
      notifications: 'Business Notifications',
      tracking: 'History'
    },
    basicInfo: {
      title: 'Basic Information',
      nameLabel: 'Business Name *',
      namePlaceholder: 'Enter business name',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Describe your business...'
    },
    contactInfo: {
      title: 'Contact Information',
      phoneLabel: 'Phone',
      phonePlaceholder: 'Phone number',
      emailLabel: 'Email',
      emailPlaceholder: 'contact@business.com',
      websiteLabel: 'Website',
      websitePlaceholder: 'https://www.business.com'
    },
    addressInfo: {
      title: 'Address',
      addressLabel: 'Address',
      addressPlaceholder: 'Street, number, neighborhood',
      cityLabel: 'City',
      cityPlaceholder: 'City',
      stateLabel: 'Department/State',
      statePlaceholder: 'Department or State'
    },
    legalInfo: {
      title: 'Legal Information',
      legalNameLabel: 'Legal Name',
      legalNamePlaceholder: 'Legal business name',
      taxIdLabel: 'Tax ID / NIT',
      taxIdPlaceholder: 'Tax identification number'
    },
    operationSettings: {
      title: 'Operation Settings',
      allowOnlineBooking: 'Allow online bookings',
      autoConfirm: 'Automatic confirmation',
      autoReminders: 'Automatic reminders',
      showPrices: 'Show prices publicly'
    },
    nameRequired: 'Business name is required',
    saveSettings: 'Save Settings'
  },

  // Employee Preferences
  employeePrefs: {
    title: 'Employee Preferences',
    subtitle: 'Configure your work preferences',
    availability: {
      title: 'Availability',
      availableForAppointments: 'Available for new appointments',
      notifyNewAssignments: 'Notify new assignments',
      appointmentReminders: 'Appointment reminders'
    },
    schedule: {
      title: 'My Work Schedule',
      workingDay: 'Working day',
      restDay: 'Rest day',
      startTime: 'Start',
      endTime: 'End',
      lunchBreak: 'Lunch',
      saveSchedule: 'Save Schedules'
    },
    messages: {
      title: 'Client Messages',
      allowMessages: 'Allow messages from clients',
      description: 'When enabled, clients can send you direct messages'
    },
    professionalInfo: {
      title: 'Professional Information',
      subtitle: 'Your experience and preferred work type',
      summaryLabel: 'Professional Summary',
      summaryPlaceholder: 'Describe your experience, skills, and specialties...',
      yearsExperienceLabel: 'Years of Experience',
      workTypeLabel: 'Preferred Work Type',
      workTypes: {
        fullTime: 'Full Time',
        partTime: 'Part Time',
        contract: 'Contract',
        flexible: 'Flexible'
      }
    },
    salary: {
      title: 'Salary Expectations',
      minLabel: 'Minimum Expected Salary',
      maxLabel: 'Maximum Expected Salary',
      minPlaceholder: 'Min amount',
      maxPlaceholder: 'Max amount',
      invalidRange: 'The minimum salary cannot be greater than the maximum'
    },
    specializations: {
      title: 'Specializations',
      noSpecializations: 'No specializations added yet',
      newPlaceholder: 'New specialization',
      addButton: 'Add'
    },
    languages: {
      title: 'Languages',
      noLanguages: 'No languages added yet',
      newPlaceholder: 'Language (e.g., English - Advanced)',
      addButton: 'Add'
    },
    certifications: {
      title: 'Certifications and Licenses',
      noCertifications: 'No certifications added yet',
      addButton: 'Add Certification',
      form: {
        nameLabel: 'Certification Name',
        namePlaceholder: 'Name of certification or license',
        issuerLabel: 'Issuing Entity',
        issuerPlaceholder: 'Entity that issued the certification',
        dateLabel: 'Date Obtained',
        datePlaceholder: 'MM/YYYY',
        urlLabel: 'Credential URL (optional)',
        urlPlaceholder: 'https://...',
        cancelButton: 'Cancel',
        saveButton: 'Save'
      },
      issued: 'Issued',
      verifyCredential: 'Verify credential',
      deleteButton: 'Delete'
    },
    links: {
      title: 'Professional Links',
      portfolioLabel: 'Portfolio / Website',
      portfolioPlaceholder: 'https://your-portfolio.com',
      linkedinLabel: 'LinkedIn',
      linkedinPlaceholder: 'https://linkedin.com/in/yourprofile'
    },
    saveButton: 'Save Preferences',
    resetButton: 'Reset'
  },

  // Client Preferences
  clientPrefs: {
    title: 'Client Preferences',
    subtitle: 'Configure your booking preferences',
    bookingPrefs: {
      title: 'Booking Preferences',
      appointmentReminders: 'Appointment reminders',
      emailConfirmation: 'Email confirmation',
      promotionNotifications: 'Promotion notifications',
      savePaymentMethods: 'Save payment methods'
    },
    advanceTime: {
      title: 'Preferred Advance Time',
      label: 'Preferred notice time for appointments',
      options: {
        sameDay: 'Same day',
        oneDay: '1 day',
        twoDays: '2 days',
        threeDays: '3 days',
        oneWeek: '1 week'
      }
    },
    serviceHistory: {
      title: 'Service History',
      label: 'Save my service history for recommendations',
      description: 'We use this to suggest similar services'
    },
    paymentMethods: {
      title: 'Payment Methods',
      noneAdded: 'No payment methods added',
      types: {
        card: 'Credit/Debit Card',
        pse: 'PSE',
        cash: 'Cash',
        transfer: 'Bank Transfer'
      },
      addButton: 'Add Payment Method'
    },
    savePreferences: 'Save Preferences'
  },

  // Danger Zone
  dangerZone: {
    title: 'Danger Zone',
    subtitle: 'Irreversible account actions',
    deactivate: {
      title: 'Deactivate Account',
      description: 'Temporarily suspend your account. You can reactivate it anytime.',
      button: 'Deactivate Account',
      confirmTitle: 'Are you sure you want to deactivate your account?',
      confirmDescription: 'Your account will be temporarily suspended. All your data will be preserved and you can reactivate it anytime by signing in again.',
      inputLabel: 'Confirm your email to continue:',
      inputPlaceholder: 'your@email.com',
      checkbox: 'I understand that my account will be temporarily suspended',
      cancel: 'Cancel',
      confirm: 'Yes, deactivate my account'
    },
    delete: {
      title: 'Delete Account',
      description: 'Permanently delete your account and all associated data. This action cannot be undone.',
      button: 'Delete Account',
      confirmTitle: 'Delete account permanently',
      warningTitle: 'Warning: This action is irreversible',
      warningDescription: 'You are about to permanently delete your account and all associated data. This includes:',
      warningItems: {
        profile: 'Your profile and personal information',
        appointments: 'All your appointments (past and future)',
        history: 'Your complete service history',
        payments: 'Payment history and methods',
        preferences: 'All your preferences and settings'
      },
      confirmText: 'Type "DEACTIVATE ACCOUNT" to confirm',
      confirmPlaceholder: 'DEACTIVATE ACCOUNT',
      mustTypeCorrectly: 'You must type "DEACTIVATE ACCOUNT" to confirm',
      cancel: 'Cancel',
      confirm: 'Yes, delete permanently',
      processing: 'Processing...'
    }
  }
};
