// Admin & System modules - Resources, Permissions, Reports, Admin, Search
export const businessResources = {
  title: 'Business Resources',
  subtitle: 'Manage physical resources',
  addResource: 'Add Resource',
  editResource: 'Edit Resource',
  deleteResource: 'Delete Resource',
  
  // Form
  form: {
    name: 'Resource Name',
    namePlaceholder: 'e.g., Meeting Room A, Tennis Court 1',
    type: 'Resource Type',
    location: 'Location',
    capacity: 'Capacity',
    capacityPlaceholder: 'Maximum number of people',
    description: 'Description',
    descriptionPlaceholder: 'Describe this resource...',
    hourlyRate: 'Hourly Rate',
    hourlyRatePlaceholder: 'Cost per hour',
    status: 'Status',
    amenities: 'Amenities',
    amenitiesPlaceholder: 'WiFi, Projector, Whiteboard...'
  },

  // Resource Types
  types: {
    room: 'Room',
    table: 'Table',
    court: 'Court',
    desk: 'Desk',
    equipment: 'Equipment',
    vehicle: 'Vehicle',
    space: 'Space',
    lane: 'Lane',
    field: 'Field',
    station: 'Station',
    parking_spot: 'Parking Spot',
    bed: 'Bed',
    studio: 'Studio',
    meeting_room: 'Meeting Room',
    other: 'Other'
  },

  // Table columns
  table: {
    name: 'Name',
    type: 'Type',
    location: 'Location',
    capacity: 'Capacity',
    status: 'Status',
    rate: 'Hourly Rate',
    actions: 'Actions'
  },

  // Status
  status: {
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
    reserved: 'Reserved',
    inactive: 'Inactive'
  },

  // Actions
  actions: {
    view: 'View Details',
    edit: 'Edit',
    delete: 'Delete',
    viewSchedule: 'View Schedule',
    assignServices: 'Assign Services',
    viewStats: 'View Statistics'
  },

  // Stats
  stats: {
    totalBookings: 'Total Bookings',
    revenue: 'Revenue',
    utilizationRate: 'Utilization Rate',
    avgBookingDuration: 'Avg. Booking Duration'
  },

  // Messages
  noResources: 'No resources configured',
  noResourcesMessage: 'Add your first resource to start managing bookings',
  resourceCreated: 'Resource created successfully',
  resourceUpdated: 'Resource updated successfully',
  resourceDeleted: 'Resource deleted successfully',
  confirmDelete: 'Are you sure you want to delete this resource?',
  
  // Availability
  availability: 'Availability',
  checkAvailability: 'Check Availability',
  availableSlots: 'Available Slots',
  fullyBooked: 'Fully Booked'
}

export const permissions = {
  title: 'Permissions',
  roles: 'Roles',
  assign: 'Assign Permissions',
  revoke: 'Revoke Permissions',
  templates: 'Permission Templates',
  no_permissions: 'No permissions configured',
}

export const reports = {
  title: 'Reports',
  subtitle: 'Business analytics and insights',
  
  // Business Overview Report
  business_overview: {
    title: 'Business Overview',
    totalRevenue: 'Total Revenue',
    totalAppointments: 'Total Appointments',
    totalClients: 'Total Clients',
    avgTicket: 'Average Ticket',
    topServices: 'Top Services',
    topProfessionals: 'Top Professionals',
    growthRate: 'Growth Rate',
    retentionRate: 'Retention Rate'
  },

  // Period Selection
  period_selection: {
    label: 'Select Period',
    today: 'Today',
    yesterday: 'Yesterday',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisQuarter: 'This Quarter',
    lastQuarter: 'Last Quarter',
    thisYear: 'This Year',
    lastYear: 'Last Year',
    custom: 'Custom Range',
    from: 'From',
    to: 'To',
    apply: 'Apply'
  },

  // Stats
  stats: {
    revenue: 'Revenue',
    appointments: 'Appointments',
    clients: 'Clients',
    services: 'Services',
    professionals: 'Professionals',
    avgDuration: 'Avg. Duration',
    completionRate: 'Completion Rate',
    cancellationRate: 'Cancellation Rate',
    noShowRate: 'No-Show Rate'
  },

  // Charts
  charts: {
    revenueOverTime: 'Revenue Over Time',
    appointmentsByStatus: 'Appointments by Status',
    appointmentsByService: 'Appointments by Service',
    clientGrowth: 'Client Growth',
    professionalPerformance: 'Professional Performance',
    servicePopularity: 'Service Popularity',
    hourlyDistribution: 'Hourly Distribution',
    weeklyDistribution: 'Weekly Distribution'
  },

  // Actions
  generate: 'Generate Report',
  export: 'Export',
  download: 'Download',
  print: 'Print',
  share: 'Share',
  schedule: 'Schedule Report',
  
  // Export Options
  exportOptions: {
    title: 'Export Options',
    format: 'Format',
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
    includeCharts: 'Include Charts',
    includeDetails: 'Include Details'
  },

  // Status
  generating: 'Generating report...',
  ready: 'Report ready',
  noData: 'No data available for this period',
  error: 'Error generating report'
}

export const admin = {
  title: 'Administration',
  subtitle: 'Manage your business',
  
  // Client Management
  clientManagement: {
    title: 'Client Management',
    subtitle: 'View and manage your clients',
    searchPlaceholder: 'Search clients by name, email or phone...',
    filterByStatus: 'Filter by status',
    allStatuses: 'All Statuses',
    tabs: {
      all: 'All',
      active: 'Active',
      inactive: 'Inactive',
      favorites: 'Favorites',
      atrisk: 'At Risk'
    },
    emptyState: {
      title: 'No clients yet',
      description: 'Clients will appear here once they book appointments',
      action: 'Go to Calendar'
    },
    badges: {
      new: 'New',
      vip: 'VIP',
      atrisk: 'At Risk'
    },
    actions: {
      viewProfile: 'View Profile',
      sendMessage: 'Send Message',
      scheduleAppointment: 'Schedule Appointment',
      markAsFavorite: 'Mark as Favorite',
      markAsVIP: 'Mark as VIP',
      exportList: 'Export List'
    },
    riskIndicators: {
      title: 'Client at Risk',
      noRecentAppointments: 'No appointments in {{days}} days',
      cancelledAppointments: '{{count}} cancelled appointments',
      lowEngagement: 'Low engagement'
    },
    whatsappIntegration: {
      button: 'Send WhatsApp',
      tooltip: 'Send message via WhatsApp',
      opening: 'Opening WhatsApp...',
      defaultMessage: 'Hello {{name}}, we want to offer you...'
    }
  },

  // Comprehensive Reports
  comprehensiveReports: {
    title: 'Comprehensive Reports',
    subtitle: 'Advanced analytics and metrics',
    metrics: {
      title: 'Key Metrics',
      totalRevenue: 'Total Revenue',
      avgTicket: 'Average Ticket',
      conversionRate: 'Conversion Rate',
      clientRetention: 'Client Retention',
      appointmentRate: 'Appointment Rate',
      cancellationRate: 'Cancellation Rate',
      noShowRate: 'No-Show Rate',
      professionalUtilization: 'Professional Utilization'
    },
    tabs: {
      overview: 'Overview',
      revenue: 'Revenue',
      appointments: 'Appointments',
      clients: 'Clients',
      professionals: 'Professionals',
      services: 'Services'
    },
    descriptions: {
      revenue: 'Income and payment analysis',
      appointments: 'Appointment statistics and trends',
      clients: 'Client behavior and retention',
      professionals: 'Professional performance',
      services: 'Most popular services'
    },
    cards: {
      revenueByPeriod: 'Revenue by Period',
      revenueByService: 'Revenue by Service',
      revenueByProfessional: 'Revenue by Professional',
      appointmentsByStatus: 'Appointments by Status',
      appointmentsByService: 'Appointments by Service',
      appointmentsByProfessional: 'Appointments by Professional',
      clientGrowth: 'Client Growth',
      clientRetention: 'Client Retention',
      clientsBySegment: 'Clients by Segment',
      professionalPerformance: 'Professional Performance',
      professionalRevenue: 'Revenue by Professional',
      professionalUtilization: 'Professional Utilization',
      topServices: 'Top Services',
      serviceRevenue: 'Revenue by Service',
      serviceDemand: 'Service Demand'
    },
    labels: {
      period: 'Period',
      compare: 'Compare with',
      export: 'Export',
      download: 'Download PDF',
      share: 'Share',
      filter: 'Filter'
    },
    status: {
      loading: 'Loading data...',
      noData: 'No data available for this period',
      error: 'Error loading data'
    },
    errors: {
      loadFailed: 'Failed to load report data',
      exportFailed: 'Failed to export report',
      shareFailed: 'Failed to share report'
    }
  }
}

export const search = {
  placeholder: 'Search...',
  searchPlaceholder: 'Search businesses, services, or professionals...',
  
  // Search Types
  types: {
    all: 'All',
    businesses: 'Businesses',
    services: 'Services',
    professionals: 'Professionals'
  },

  // Placeholders by type
  placeholders: {
    businesses: 'Search by business name, category...',
    services: 'Search by service name, category...',
    professionals: 'Search by name, specialty...'
  },

  // Results
  results: {
    title: 'Search Results',
    showing: 'Showing {{count}} results',
    noResults: 'No results found',
    tryDifferent: 'Try a different search term',
    filters: 'Filters',
    clearFilters: 'Clear Filters'
  },

  // Sorting
  sorting: {
    label: 'Sort by',
    relevance: 'Relevance',
    rating: 'Rating',
    distance: 'Distance',
    priceAsc: 'Price: Low to High',
    priceDesc: 'Price: High to Low',
    nameAsc: 'Name: A-Z',
    nameDesc: 'Name: Z-A',
    newest: 'Newest First'
  },

  // Filters
  filters: {
    title: 'Filters',
    category: 'Category',
    priceRange: 'Price Range',
    rating: 'Rating',
    distance: 'Distance',
    availability: 'Availability',
    openNow: 'Open Now',
    acceptsOnlineBooking: 'Accepts Online Booking',
    minRating: 'Minimum {{stars}} stars',
    within: 'Within {{distance}} km',
    apply: 'Apply Filters',
    clear: 'Clear All'
  },

  // Results Page
  resultsPage: {
    businesses: {
      viewProfile: 'View Profile',
      bookNow: 'Book Now',
      openNow: 'Open Now',
      closed: 'Closed',
      opensAt: 'Opens at {{time}}',
      rating: '{{rating}} ({{count}} reviews)',
      distance: '{{distance}} km away'
    },
    services: {
      duration: '{{duration}} min',
      from: 'From {{price}}',
      viewDetails: 'View Details',
      bookService: 'Book Service'
    },
    professionals: {
      specialist: 'Specialist in {{specialty}}',
      yearsExp: '{{years}} years experience',
      viewProfile: 'View Profile',
      bookAppointment: 'Book Appointment'
    }
  },

  // No Results
  no_results: 'No results found',
  no_results_message: 'Try adjusting your search or filters',
  
  // Loading
  searching: 'Searching...',
  loading: 'Loading results...'
}

export const taxConfiguration = {
  title: 'Tax Configuration',
  subtitle: 'Configure taxes and tax obligations for your business',
  resetSuccess: 'Configuration reset',
  tabs: {
    general: 'General',
    iva: 'VAT',
    ica: 'ICA',
    retention: 'Retention',
  },
  general: {
    taxRegime: 'Tax Regime',
    taxRegimeDescription: 'Common regime charges VAT, simplified generally does not',
    taxId: 'Tax ID Number (NIT)',
    taxIdPlaceholder: '900123456-7',
    taxIdDescription: 'Include verification digit',
    city: 'City (for ICA)',
    cityDescription: 'Each city has a different ICA rate',
    regimes: {
      common: 'Common Regime',
      simple: 'Simplified Regime',
      special: 'Special Regime',
    },
  },
  iva: {
    title: 'VAT',
    enable: 'Charge VAT',
    description: 'Value Added Tax',
    rate: 'VAT Rate (%)',
    rateDescription: '19% is the general rate in Colombia',
    rates: {
      exempt: '0% (Exempt)',
      basic: '5% (Basic products)',
      general: '19% (General)',
    },
    infoNote: 'VAT is calculated on the subtotal of each transaction. Products may have different rates (0%, 5%, 19%).',
  },
  ica: {
    title: 'ICA',
    enable: 'Charge ICA',
    description: 'Industry and Commerce Tax',
    rate: 'ICA Rate',
    rateCalculated: '(calculated by city)',
    selectCityHint: 'Select city in General tab to update rate',
    cityRates: 'ICA by city:',
  },
  retention: {
    title: 'Retention',
    enable: 'Apply Withholding Tax',
    description: 'For large taxpayers',
    activityType: 'Activity Type',
    rate: 'Retention Rate',
    rateDescription: 'Automatic rate based on selected activity type',
    infoNote: 'Withholding tax is deducted from the amount to be paid to the supplier and must be declared monthly to DIAN.',
  },
  summary: {
    title: 'Configuration Summary',
    regime: 'Regime:',
    taxId: 'Tax ID:',
    city: 'City:',
    notConfigured: 'Not configured',
    notSelected: 'Not selected',
    active: 'Active',
    inactive: 'Inactive',
  },
  alerts: {
    simpleRegimeTitle: 'Simplified Regime',
    simpleRegimeDescription: 'In simplified regime, VAT is not charged. ICA may apply depending on the city.',
  },
}

export const userProfile = {
  tabs: {
    services: 'Services',
    experience: 'Experience',
    reviews: 'Reviews',
  },
  header: {
    completedAppointments: 'completed appointments',
    verifiedProfessional: 'Verified professional',
  },
  services: {
    title: 'Services',
    noServices: 'No services available',
    schedule: 'Schedule',
  },
  experience: {
    title: 'Experience',
    businessesTitle: 'Businesses where they work',
    independentProfessional: 'Independent professional',
    aboutMe: 'About me',
    statistics: 'Statistics',
    stats: {
      completedAppointments: 'Completed appointments',
      rating: 'Rating',
      services: 'Services',
    },
  },
  reviews: {
    title: 'Reviews',
    leaveReview: 'Leave review',
  },
  footer: {
    scheduleWith: 'Schedule Appointment with {name}',
    notAvailable: 'Professional not available',
    notLinkedMessage: 'This professional is not linked to any active business',
  },
  errors: {
    loadError: 'Could not load professional information',
    submitReviewError: 'Could not send review at this time',
  },
  actions: {
    close: 'Close',
  },
}
