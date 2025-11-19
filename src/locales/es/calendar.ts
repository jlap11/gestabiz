// Calendar - Módulo completo de calendario
export const calendar = {
  title: 'Calendario',
  subtitle: 'Gestiona tus citas',
  
  // Views
  views: {
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    list: 'Lista'
  },

  // Navigation
  navigation: {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    goToDate: 'Ir a Fecha',
    currentWeek: 'Semana Actual',
    currentMonth: 'Mes Actual'
  },

  // Events
  events: {
    noEvents: 'No hay eventos para este período',
    newEvent: 'Nuevo Evento',
    viewDetails: 'Ver Detalles',
    editEvent: 'Editar Evento',
    deleteEvent: 'Eliminar Evento',
    allDay: 'Todo el Día',
    recurring: 'Recurrente'
  },

  // Time slots
  slots: {
    available: 'Disponible',
    occupied: 'Ocupado',
    blocked: 'Bloqueado',
    unavailable: 'No Disponible',
    lunchBreak: 'Hora de Almuerzo',
    holiday: 'Festivo'
  },

  // Filters
  filters: {
    showAll: 'Mostrar Todo',
    myAppointments: 'Mis Citas',
    byStatus: 'Por Estado',
    byService: 'Por Servicio',
    byLocation: 'Por Sede',
    byProfessional: 'Por Profesional'
  },

  // Actions
  actions: {
    sync: 'Sincronizar Calendario',
    export: 'Exportar',
    print: 'Imprimir',
    share: 'Compartir',
    settings: 'Configuración del Calendario'
  },

  // Integration
  integration: {
    googleCalendar: 'Google Calendar',
    syncWith: 'Sincronizar con {{provider}}',
    lastSync: 'Última sincronización: {{time}}',
    syncNow: 'Sincronizar Ahora',
    disconnect: 'Desconectar'
  },

  // Week days
  days: {
    sunday: 'Domingo',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sun: 'Dom',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb'
  },

  // Months
  months: {
    january: 'Enero',
    february: 'Febrero',
    march: 'Marzo',
    april: 'Abril',
    may: 'Mayo',
    june: 'Junio',
    july: 'Julio',
    august: 'Agosto',
    september: 'Septiembre',
    october: 'Octubre',
    november: 'Noviembre',
    december: 'Diciembre'
  }
};
