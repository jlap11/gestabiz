// Absences - Complete absences and vacation system
export const absences = {
  title: 'Absences and Vacations',
  subtitle: 'Manage employee absences',
  requestAbsence: 'Request Absence',
  myAbsences: 'My Absences',
  pendingRequests: 'Pending Requests',
  absenceHistory: 'Absence History',
  
  // Absence Types
  absenceType: {
    label: 'Absence Type',
    vacation: 'Vacation',
    emergency: 'Emergency',
    sick_leave: 'Sick Leave',
    personal: 'Personal',
    other: 'Other'
  },

  // Form fields
  dates: {
    startDate: 'Start Date',
    endDate: 'End Date',
    selectDates: 'Select Dates',
    dateRange: 'Date Range'
  },

  reason: {
    label: 'Reason',
    placeholder: 'Briefly describe the reason for your absence...',
    required: 'Reason is required'
  },

  daysRequested: {
    label: 'Days Requested',
    total: '{{count}} days total',
    businessDays: '{{count}} business days',
    excludingWeekends: 'excluding weekends',
    excludingHolidays: 'excluding holidays'
  },

  // Vacation balance
  vacationBalance: {
    title: 'Vacation Balance',
    available: 'Available',
    used: 'Used',
    pending: 'Pending',
    remaining: 'Remaining',
    days: '{{count}} days',
    accrued: 'Accrued This Year',
    carriedOver: 'Carried Over'
  },

  // Affected appointments
  affectedAppointments: {
    title: 'Affected Appointments',
    count: '{{count}} appointments will be affected',
    noAppointments: 'No appointments scheduled during this period',
    willBeCancelled: 'These appointments will be cancelled:',
    clientsNotified: 'Clients will be notified automatically'
  },

  // Submit
  submit: {
    button: 'Submit Request',
    submitting: 'Submitting...',
    success: 'Request submitted successfully',
    error: 'Error submitting request',
    confirmTitle: 'Confirm Absence Request',
    confirmMessage: 'This will affect {{count}} appointments. Clients will be notified. Continue?',
    confirm: 'Confirm',
    cancel: 'Cancel'
  },

  // Types descriptions
  types: {
    vacation: {
      label: 'Vacation',
      description: 'Planned time off',
      requiresApproval: 'Requires approval'
    },
    emergency: {
      label: 'Emergency',
      description: 'Unexpected urgent situation',
      requiresApproval: 'Immediate, approval can be retroactive'
    },
    sick_leave: {
      label: 'Sick Leave',
      description: 'Medical reasons',
      requiresApproval: 'May require medical certificate'
    },
    personal: {
      label: 'Personal',
      description: 'Personal matters',
      requiresApproval: 'Requires approval'
    },
    other: {
      label: 'Other',
      description: 'Other reasons',
      requiresApproval: 'Requires approval'
    }
  },

  // Validation
  validation: {
    startDateRequired: 'Start date is required',
    endDateRequired: 'End date is required',
    endDateBeforeStart: 'End date must be after start date',
    reasonRequired: 'Reason is required',
    typeRequired: 'Absence type is required',
    insufficientBalance: 'Insufficient vacation balance',
    overlapsExisting: 'Overlaps with existing absence',
    tooFarInAdvance: 'Cannot request more than {{days}} days in advance',
    pastDate: 'Cannot select past dates'
  },

  // Disabled days (calendar)
  disabledDays: {
    weekend: 'Weekends are not counted',
    holiday: 'Public holiday',
    alreadyRequested: 'Already requested',
    pastDate: 'Past date'
  },

  // Invalid days
  invalidDays: {
    title: 'Invalid Days',
    weekends: 'Weekends',
    holidays: 'Holidays',
    total: '{{count}} days will be excluded from the count'
  },

  // Public holidays
  holidays: {
    title: 'Public Holidays',
    inRange: '{{count}} holidays in selected range',
    excluded: 'These days are excluded from the count'
  },

  // Affected section
  affected: {
    appointments: 'Affected Appointments',
    clients: 'Affected Clients',
    willBeNotified: 'Will be notified',
    automaticCancellation: 'Automatic cancellation'
  },

  // Labels for status
  labels: {
    status: 'Status',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    emergency: 'Emergency',
    requestedOn: 'Requested on {{date}}',
    approvedBy: 'Approved by {{name}}',
    rejectedBy: 'Rejected by {{name}}'
  },

  // Vacation widget
  vacationWidget: {
    title: 'Vacation Days',
    available: '{{days}} available',
    used: '{{days}} used',
    pending: '{{days}} pending',
    viewDetails: 'View Details',
    requestVacation: 'Request Vacation'
  }
};
