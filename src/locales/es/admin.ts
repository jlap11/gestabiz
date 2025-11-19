// Módulos de administración y sistema - Recursos, Permisos, Reportes, Admin, Búsqueda
export const businessResources = {
  title: 'Recursos del Negocio',
  subtitle: 'Gestionar recursos físicos',
  addResource: 'Agregar Recurso',
  editResource: 'Editar Recurso',
  deleteResource: 'Eliminar Recurso',
  
  // Form
  form: {
    name: 'Nombre del Recurso',
    namePlaceholder: 'ej: Sala de Reuniones A, Cancha de Tenis 1',
    type: 'Tipo de Recurso',
    location: 'Ubicación',
    capacity: 'Capacidad',
    capacityPlaceholder: 'Número máximo de personas',
    description: 'Descripción',
    descriptionPlaceholder: 'Describe este recurso...',
    hourlyRate: 'Tarifa por Hora',
    hourlyRatePlaceholder: 'Costo por hora',
    status: 'Estado',
    amenities: 'Comodidades',
    amenitiesPlaceholder: 'WiFi, Proyector, Pizarra...'
  },

  // Resource Types
  types: {
    room: 'Habitación',
    table: 'Mesa',
    court: 'Cancha',
    desk: 'Escritorio',
    equipment: 'Equipo',
    vehicle: 'Vehículo',
    space: 'Espacio',
    lane: 'Carril',
    field: 'Campo',
    station: 'Estación',
    parking_spot: 'Espacio de Parqueo',
    bed: 'Cama',
    studio: 'Estudio',
    meeting_room: 'Sala de Reuniones',
    other: 'Otro'
  },

  // Table columns
  table: {
    name: 'Nombre',
    type: 'Tipo',
    location: 'Ubicación',
    capacity: 'Capacidad',
    status: 'Estado',
    rate: 'Tarifa por Hora',
    actions: 'Acciones'
  },

  // Status
  status: {
    available: 'Disponible',
    occupied: 'Ocupado',
    maintenance: 'Mantenimiento',
    reserved: 'Reservado',
    inactive: 'Inactivo'
  },

  // Actions
  actions: {
    view: 'Ver Detalles',
    edit: 'Editar',
    delete: 'Eliminar',
    viewSchedule: 'Ver Agenda',
    assignServices: 'Asignar Servicios',
    viewStats: 'Ver Estadísticas'
  },

  // Stats
  stats: {
    totalBookings: 'Reservas Totales',
    revenue: 'Ingresos',
    utilizationRate: 'Tasa de Utilización',
    avgBookingDuration: 'Duración Prom. de Reserva'
  },

  // Messages
  noResources: 'No hay recursos configurados',
  noResourcesMessage: 'Agrega tu primer recurso para comenzar a gestionar reservas',
  resourceCreated: 'Recurso creado exitosamente',
  resourceUpdated: 'Recurso actualizado exitosamente',
  resourceDeleted: 'Recurso eliminado exitosamente',
  confirmDelete: '¿Estás seguro de que deseas eliminar este recurso?',
  
  // Availability
  availability: 'Disponibilidad',
  checkAvailability: 'Verificar Disponibilidad',
  availableSlots: 'Espacios Disponibles',
  fullyBooked: 'Completamente Reservado'
}

export const permissions = {
  title: 'Permisos',
  roles: 'Roles',
  assign: 'Asignar Permisos',
  revoke: 'Revocar Permisos',
  templates: 'Plantillas de Permisos',
  no_permissions: 'No hay permisos configurados',
}

export const reports = {
  title: 'Reportes',
  subtitle: 'Analítica e insights del negocio',
  
  // Business Overview Report
  business_overview: {
    title: 'Resumen del Negocio',
    totalRevenue: 'Ingresos Totales',
    totalAppointments: 'Citas Totales',
    totalClients: 'Clientes Totales',
    avgTicket: 'Ticket Promedio',
    topServices: 'Servicios Principales',
    topProfessionals: 'Profesionales Principales',
    growthRate: 'Tasa de Crecimiento',
    retentionRate: 'Tasa de Retención'
  },

  // Period Selection
  period_selection: {
    label: 'Seleccionar Período',
    today: 'Hoy',
    yesterday: 'Ayer',
    last7days: 'Últimos 7 Días',
    last30days: 'Últimos 30 Días',
    thisWeek: 'Esta Semana',
    lastWeek: 'Semana Pasada',
    thisMonth: 'Este Mes',
    lastMonth: 'Mes Pasado',
    thisQuarter: 'Este Trimestre',
    lastQuarter: 'Trimestre Pasado',
    thisYear: 'Este Año',
    lastYear: 'Año Pasado',
    custom: 'Rango Personalizado',
    from: 'Desde',
    to: 'Hasta',
    apply: 'Aplicar'
  },

  // Stats
  stats: {
    revenue: 'Ingresos',
    appointments: 'Citas',
    clients: 'Clientes',
    services: 'Servicios',
    professionals: 'Profesionales',
    avgDuration: 'Duración Prom.',
    completionRate: 'Tasa de Finalización',
    cancellationRate: 'Tasa de Cancelación',
    noShowRate: 'Tasa de Inasistencia'
  },

  // Charts
  charts: {
    revenueOverTime: 'Ingresos en el Tiempo',
    appointmentsByStatus: 'Citas por Estado',
    appointmentsByService: 'Citas por Servicio',
    clientGrowth: 'Crecimiento de Clientes',
    professionalPerformance: 'Rendimiento de Profesionales',
    servicePopularity: 'Popularidad de Servicios',
    hourlyDistribution: 'Distribución por Hora',
    weeklyDistribution: 'Distribución Semanal'
  },

  // Actions
  generate: 'Generar Reporte',
  export: 'Exportar',
  download: 'Descargar',
  print: 'Imprimir',
  share: 'Compartir',
  schedule: 'Programar Reporte',
  
  // Export Options
  exportOptions: {
    title: 'Opciones de Exportación',
    format: 'Formato',
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
    includeCharts: 'Incluir Gráficos',
    includeDetails: 'Incluir Detalles'
  },

  // Status
  generating: 'Generando reporte...',
  ready: 'Reporte listo',
  noData: 'No hay datos disponibles para este período',
  error: 'Error al generar reporte'
}

export const admin = {
  title: 'Administración',
  subtitle: 'Gestiona tu negocio',
  
  // Client Management
  clientManagement: {
    title: 'Gestión de Clientes',
    subtitle: 'Ver y gestionar tus clientes',
    search_placeholder: 'Buscar clientes por nombre, email o teléfono...',
    searchPlaceholder: 'Buscar clientes por nombre, email o teléfono...',
    filter_by_status: 'Filtrar por estado',
    filterByStatus: 'Filtrar por estado',
    all_statuses: 'Todos los estados',
    allStatuses: 'Todos los Estados',
    tabs: {
      all: 'Todos',
      active: 'Activos',
      inactive: 'Inactivos',
      recurring: 'Recurrentes',
      at_risk: 'En Riesgo',
      lost: 'Perdidos',
      favorites: 'Favoritos',
      atrisk: 'En Riesgo'
    },
    status: {
      active: 'Activo',
      inactive: 'Inactivo',
      blocked: 'Bloqueado',
      unknown: 'Desconocido',
      active_plural: 'Activos',
      inactive_plural: 'Inactivos',
      blocked_plural: 'Bloqueados'
    },
    empty: {
      title: 'No se encontraron clientes',
      description_search: 'Intenta con términos de búsqueda diferentes',
      description_category: 'No hay clientes en esta categoría'
    },
    emptyState: {
      title: 'No hay clientes aún',
      description: 'Los clientes aparecerán aquí una vez que reserven citas',
      action: 'Ir al Calendario'
    },
    badges: {
      new: 'Nuevo',
      vip: 'VIP',
      atrisk: 'En Riesgo',
      total_appointments: 'Citas Totales',
      total_value: 'Valor Total'
    },
    last_appointment_prefix: 'Última cita',
    never: 'Nunca',
    actions: {
      viewProfile: 'Ver Perfil',
      sendMessage: 'Enviar Mensaje',
      scheduleAppointment: 'Programar Cita',
      schedule: 'Programar',
      contact: 'Contactar',
      markAsFavorite: 'Marcar como Favorito',
      markAsVIP: 'Marcar como VIP',
      exportList: 'Exportar Lista'
    },
    risk: {
      at_risk: 'Cliente en riesgo ({{days}} días)',
      lost: 'Cliente perdido ({{days}} días)'
    },
    riskIndicators: {
      title: 'Cliente en Riesgo',
      noRecentAppointments: 'Sin citas en {{days}} días',
      cancelledAppointments: '{{count}} citas canceladas',
      lowEngagement: 'Baja interacción'
    },
    whatsappIntegration: {
      button: 'Enviar WhatsApp',
      tooltip: 'Enviar mensaje vía WhatsApp',
      opening: 'Abriendo WhatsApp...',
      defaultMessage: 'Hola {{name}}, queremos ofrecerte...'
    },
    whatsapp: {
      missing: 'El cliente no tiene número de WhatsApp',
      message_template: 'Hola {{name}}, esperamos que estés bien. ¿Te gustaría reservar tu próxima cita?'
    }
  },

  // Comprehensive Reports
  comprehensiveReports: {
    title: 'Reportes Completos',
    subtitle: 'Analítica avanzada y métricas',
    actions: {
      update: 'Actualizar',
      updating: 'Actualizando...'
    },
    metrics: {
      title: 'Métricas Clave',
      total_appointments: 'Citas Totales',
      revenue: 'Ingresos',
      average: 'Promedio',
      completion_rate: 'Tasa de Completación',
      new_in_period: 'nuevos en este período',
      totalRevenue: 'Ingresos Totales',
      avgTicket: 'Ticket Promedio',
      conversionRate: 'Tasa de Conversión',
      clientRetention: 'Retención de Clientes',
      appointmentRate: 'Tasa de Citas',
      cancellationRate: 'Tasa de Cancelación',
      noShowRate: 'Tasa de Inasistencia',
      professionalUtilization: 'Utilización de Profesionales'
    },
    tabs: {
      summary: 'Resumen',
      overview: 'Resumen',
      revenue: 'Ingresos',
      appointments: 'Citas',
      clients: 'Clientes',
      professionals: 'Profesionales',
      services: 'Servicios'
    },
    descriptions: {
      by_status: 'Distribución por estado en el período seleccionado',
      client_metrics: 'Métricas de retención y crecimiento',
      peak_hours: 'Días y horas con más citas programadas',
      employee_performance: 'Estadísticas de productividad y eficiencia',
      top_services: 'Servicios más demandados y rentables',
      recurring_clients: 'Análisis de clientes frecuentes y estado de actividad',
      revenue: 'Análisis de ingresos y pagos',
      appointments: 'Estadísticas y tendencias de citas',
      clients: 'Comportamiento y retención de clientes',
      professionals: 'Rendimiento de profesionales',
      services: 'Servicios más populares'
    },
    cards: {
      revenueByPeriod: 'Ingresos por Período',
      revenueByService: 'Ingresos por Servicio',
      revenueByProfessional: 'Ingresos por Profesional',
      appointmentsByStatus: 'Citas por Estado',
      appointmentsByService: 'Citas por Servicio',
      appointmentsByProfessional: 'Citas por Profesional',
      clientGrowth: 'Crecimiento de Clientes',
      clientRetention: 'Retención de Clientes',
      clientsBySegment: 'Clientes por Segmento',
      professionalPerformance: 'Rendimiento de Profesionales',
      professionalRevenue: 'Ingresos por Profesional',
      professionalUtilization: 'Utilización de Profesionales',
      topServices: 'Servicios Principales',
      serviceRevenue: 'Ingresos por Servicio',
      serviceDemand: 'Demanda de Servicios'
    },
    labels: {
      period: 'Período',
      compare: 'Comparar con',
      export: 'Exportar',
      download: 'Descargar PDF',
      share: 'Compartir',
      filter: 'Filtrar'
    },
    status: {
      loading: 'Cargando datos...',
      noData: 'No hay datos disponibles para este período',
      error: 'Error al cargar datos'
    },
    errors: {
      loadFailed: 'Error al cargar datos del reporte',
      exportFailed: 'Error al exportar reporte',
      shareFailed: 'Error al compartir reporte'
    }
  }
}

export const search = {
  placeholder: 'Buscar...',
  searchPlaceholder: 'Buscar negocios, servicios o profesionales...',
  
  // Search Types
  types: {
    all: 'Todos',
    businesses: 'Negocios',
    services: 'Servicios',
    professionals: 'Profesionales'
  },

  // Placeholders by type
  placeholders: {
    businesses: 'Buscar por nombre de negocio, categoría...',
    services: 'Buscar por nombre de servicio, categoría...',
    professionals: 'Buscar por nombre, especialidad...'
  },

  // Results
  results: {
    title: 'Resultados de Búsqueda',
    showing: 'Mostrando {{count}} resultados',
    noResults: 'No se encontraron resultados',
    tryDifferent: 'Intenta con un término diferente',
    filters: 'Filtros',
    clearFilters: 'Limpiar Filtros'
  },

  // Sorting
  sorting: {
    label: 'Ordenar por',
    relevance: 'Relevancia',
    rating: 'Calificación',
    distance: 'Distancia',
    priceAsc: 'Precio: Menor a Mayor',
    priceDesc: 'Precio: Mayor a Menor',
    nameAsc: 'Nombre: A-Z',
    nameDesc: 'Nombre: Z-A',
    newest: 'Más Recientes'
  },

  // Filters
  filters: {
    title: 'Filtros',
    category: 'Categoría',
    priceRange: 'Rango de Precio',
    rating: 'Calificación',
    distance: 'Distancia',
    availability: 'Disponibilidad',
    openNow: 'Abierto Ahora',
    acceptsOnlineBooking: 'Acepta Reservas en Línea',
    minRating: 'Mínimo {{stars}} estrellas',
    within: 'Dentro de {{distance}} km',
    apply: 'Aplicar Filtros',
    clear: 'Limpiar Todo'
  },

  // Results Page
  resultsPage: {
    businesses: {
      viewProfile: 'Ver Perfil',
      bookNow: 'Reservar Ahora',
      openNow: 'Abierto Ahora',
      closed: 'Cerrado',
      opensAt: 'Abre a las {{time}}',
      rating: '{{rating}} ({{count}} reseñas)',
      distance: '{{distance}} km de distancia'
    },
    services: {
      duration: '{{duration}} min',
      from: 'Desde {{price}}',
      viewDetails: 'Ver Detalles',
      bookService: 'Reservar Servicio'
    },
    professionals: {
      specialist: 'Especialista en {{specialty}}',
      yearsExp: '{{years}} años de experiencia',
      viewProfile: 'Ver Perfil',
      bookAppointment: 'Reservar Cita'
    }
  },

  // No Results
  no_results: 'No se encontraron resultados',
  no_results_message: 'Intenta ajustar tu búsqueda o filtros',
  
  // Loading
  searching: 'Buscando...',
  loading: 'Cargando resultados...'
}

export const taxConfiguration = {
  title: 'Configuración Tributaria',
  subtitle: 'Configurar impuestos y obligaciones fiscales para tu negocio',
  resetSuccess: 'Configuración restablecida',
  tabs: {
    general: 'General',
    iva: 'IVA',
    ica: 'ICA',
    retention: 'Retención',
  },
  general: {
    taxRegime: 'Régimen Tributario',
    taxRegimeDescription: 'Régimen común cobra IVA, simplificado generalmente no',
    taxId: 'Número de Identificación Tributaria (NIT)',
    taxIdPlaceholder: '900123456-7',
    taxIdDescription: 'Incluir dígito de verificación',
    city: 'Ciudad (para ICA)',
    cityDescription: 'Cada ciudad tiene una tarifa ICA diferente',
    regimes: {
      common: 'Régimen Común',
      simple: 'Régimen Simplificado',
      special: 'Régimen Especial',
    },
  },
  iva: {
    title: 'IVA',
    enable: 'Cobrar IVA',
    description: 'Impuesto al Valor Agregado',
    rate: 'Tasa de IVA (%)',
    rateDescription: '19% es la tasa general en Colombia',
    rates: {
      exempt: '0% (Exento)',
      basic: '5% (Productos básicos)',
      general: '19% (General)',
    },
    infoNote: 'El IVA se calcula sobre el subtotal de cada transacción. Los productos pueden tener diferentes tasas (0%, 5%, 19%).',
  },
  ica: {
    title: 'ICA',
    enable: 'Cobrar ICA',
    description: 'Impuesto de Industria y Comercio',
    rate: 'Tasa de ICA',
    rateCalculated: '(calculada por ciudad)',
    selectCityHint: 'Selecciona ciudad en la pestaña General para actualizar la tasa',
    cityRates: 'ICA por ciudad:',
  },
  retention: {
    title: 'Retención',
    enable: 'Aplicar Retención en la Fuente',
    description: 'Para grandes contribuyentes',
    activityType: 'Tipo de Actividad',
    rate: 'Tasa de Retención',
    rateDescription: 'Tasa automática basada en el tipo de actividad seleccionada',
    infoNote: 'La retención en la fuente se deduce del monto a pagar al proveedor y debe declararse mensualmente a la DIAN.',
  },
  summary: {
    title: 'Resumen de Configuración',
    regime: 'Régimen:',
    taxId: 'NIT:',
    city: 'Ciudad:',
    notConfigured: 'No configurado',
    notSelected: 'No seleccionado',
    active: 'Activo',
    inactive: 'Inactivo',
  },
  alerts: {
    simpleRegimeTitle: 'Régimen Simplificado',
    simpleRegimeDescription: 'En régimen simplificado no se cobra IVA. El ICA puede aplicar dependiendo de la ciudad.',
  },
}

export const userProfile = {
  tabs: {
    services: 'Servicios',
    experience: 'Experiencia',
    reviews: 'Reseñas',
  },
  header: {
    completedAppointments: 'citas completadas',
    verifiedProfessional: 'profesional verificado',
  },
  services: {
    title: 'Servicios',
    noServices: 'No hay servicios disponibles',
    schedule: 'Horario',
  },
  experience: {
    title: 'Experiencia',
    businessesTitle: 'Negocios donde trabaja',
    independentProfessional: 'Profesional independiente',
    aboutMe: 'Acerca de mí',
    statistics: 'Estadísticas',
    stats: {
      completedAppointments: 'Citas completadas',
      rating: 'Calificación',
      services: 'Servicios',
    },
  },
  reviews: {
    title: 'Reseñas',
    leaveReview: 'Dejar reseña',
  },
  footer: {
    scheduleWith: 'Agendar Cita con {name}',
    notAvailable: 'Profesional no disponible',
    notLinkedMessage: 'Este profesional no está vinculado a ningún negocio activo',
  },
  errors: {
    loadError: 'No se pudo cargar la información del profesional',
    submitReviewError: 'No se pudo enviar la reseña en este momento',
  },
  actions: {
    close: 'Cerrar',
    sendMessage: 'Enviar Mensaje',
    reportProblem: 'Reportar Problema',
  }
}
