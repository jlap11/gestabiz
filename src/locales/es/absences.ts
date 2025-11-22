// Absences - Sistema completo de ausencias y vacaciones
export const absences = {
  title: 'Ausencias y Vacaciones',
  subtitle: 'Gestionar ausencias de empleados',
  requestAbsence: 'Solicitar Ausencia',
  myAbsences: 'Mis Ausencias',
  pendingRequests: 'Solicitudes Pendientes',
  absenceHistory: 'Historial de Ausencias',
  
  // Absence Types
  absenceType: {
    label: 'Tipo de Ausencia',
    vacation: 'Vacaciones',
    emergency: 'Emergencia',
    sick_leave: 'Licencia Médica',
    personal: 'Personal',
    other: 'Otro'
  },

  // Form fields
  dates: {
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Fin',
    selectDates: 'Seleccionar Fechas',
    dateRange: 'Rango de Fechas'
  },

  reason: {
    label: 'Razón',
    placeholder: 'Describe brevemente la razón de tu ausencia...',
    required: 'La razón es requerida'
  },

  daysRequested: {
    label: 'Días Solicitados',
    total: '{{count}} días en total',
    businessDays: '{{count}} días hábiles',
    excludingWeekends: 'excluyendo fines de semana',
    excludingHolidays: 'excluyendo festivos'
  },

  // Vacation balance
  vacationBalance: {
    title: 'Balance de Vacaciones',
    available: 'Disponibles',
    used: 'Usados',
    pending: 'Pendientes',
    remaining: 'Restantes',
    days: '{{count}} días',
    accrued: 'Acumulados Este Año',
    carriedOver: 'Transferidos'
  },

  // Affected appointments
  affectedAppointments: {
    title: 'Citas Afectadas',
    count: '{{count}} citas serán afectadas',
    noAppointments: 'No hay citas programadas durante este período',
    willBeCancelled: 'Estas citas serán canceladas:',
    clientsNotified: 'Los clientes serán notificados automáticamente'
  },

  // Submit
  submit: {
    button: 'Enviar Solicitud',
    submitting: 'Enviando...',
    success: 'Solicitud enviada exitosamente',
    error: 'Error al enviar solicitud',
    confirmTitle: 'Confirmar Solicitud de Ausencia',
    confirmMessage: 'Esto afectará {{count}} citas. Los clientes serán notificados. ¿Continuar?',
    confirm: 'Confirmar',
    cancel: 'Cancelar'
  },

  // Types descriptions
  types: {
    vacation: {
      label: 'Vacaciones',
      description: 'Tiempo libre planificado',
      requiresApproval: 'Requiere aprobación'
    },
    emergency: {
      label: 'Emergencia',
      description: 'Situación urgente inesperada',
      requiresApproval: 'Inmediato, aprobación puede ser retroactiva'
    },
    sick_leave: {
      label: 'Licencia Médica',
      description: 'Razones médicas',
      requiresApproval: 'Puede requerir certificado médico'
    },
    personal: {
      label: 'Personal',
      description: 'Asuntos personales',
      requiresApproval: 'Requiere aprobación'
    },
    other: {
      label: 'Otro',
      description: 'Otras razones',
      requiresApproval: 'Requiere aprobación'
    }
  },

  // Validation
  validation: {
    startDateRequired: 'La fecha de inicio es requerida',
    endDateRequired: 'La fecha de fin es requerida',
    endDateBeforeStart: 'La fecha de fin debe ser posterior a la de inicio',
    reasonRequired: 'La razón es requerida',
    typeRequired: 'El tipo de ausencia es requerido',
    insufficientBalance: 'Balance de vacaciones insuficiente',
    overlapsExisting: 'Se superpone con ausencia existente',
    tooFarInAdvance: 'No se puede solicitar con más de {{days}} días de anticipación',
    pastDate: 'No se pueden seleccionar fechas pasadas'
  },

  // Disabled days (calendar)
  disabledDays: {
    weekend: 'Los fines de semana no se cuentan',
    holiday: 'Festivo público',
    alreadyRequested: 'Ya solicitado',
    pastDate: 'Fecha pasada'
  },

  // Invalid days
  invalidDays: {
    title: 'Días Inválidos',
    weekends: 'Fines de Semana',
    holidays: 'Festivos',
    total: '{{count}} días serán excluidos del conteo'
  },

  // Public holidays
  holidays: {
    title: 'Festivos Públicos',
    inRange: '{{count}} festivos en el rango seleccionado',
    excluded: 'Estos días están excluidos del conteo'
  },

  // Affected section
  affected: {
    appointments: 'Citas Afectadas',
    clients: 'Clientes Afectados',
    willBeNotified: 'Serán notificados',
    automaticCancellation: 'Cancelación automática'
  },

  // Labels for status
  labels: {
    status: 'Estado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    emergency: 'Emergencia',
    requestedOn: 'Solicitado el {{date}}',
    approvedBy: 'Aprobado por {{name}}',
    rejectedBy: 'Rechazado por {{name}}'
  },

  // Vacation widget
  vacationWidget: {
    title: 'Días de Vacaciones',
    titleWithYear: 'Días de Vacaciones {year}',
    totalDays: 'Total de Días',
    daysAvailable: 'Días Disponibles',
    daysUsed: 'Días Usados',
    daysPending: 'Días Pendientes',
    daysFree: 'Días Libres',
    noInfo: 'Información de vacaciones no disponible',
    used: 'Usados',
    pending: 'Pendientes',
    available: '{{days}} disponibles',
    viewDetails: 'Ver Detalles',
    requestVacation: 'Solicitar Vacaciones'
  }
};
