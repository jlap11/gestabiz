// Settings - Completo con TODAS las preferencias
export const settings = {
  title: 'Configuraciones',
  subtitle: 'Configura tu cuenta y preferencias',
  profile: 'Perfil',
  appearance: 'Apariencia',
  theme: 'Tema',
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
  language: 'Idioma',
  spanish: 'Español',
  english: 'English',
  notifications: 'Notificaciones',
  email_notifications: 'Notificaciones por Email',
  push_notifications: 'Notificaciones Push',
  browser_notifications: 'Notificaciones del Navegador',
  whatsapp_notifications: 'Notificaciones de WhatsApp',
  reminder_24h: 'Recordatorios de 24 horas',
  reminder_1h: 'Recordatorios de 1 hora',
  reminder_15m: 'Recordatorios de 15 minutos',
  daily_digest: 'Resumen diario',
  weekly_report: 'Reportes semanales',
  save_preferences: 'Guardar Preferencias',
  preferences_saved: 'Preferencias guardadas exitosamente',
  
  // Tabs
  tabs: {
    general: 'Configuración General',
    profile: 'Perfil',
    notifications: 'Notificaciones',
    businessPreferences: 'Preferencias del Negocio',
    employeePreferences: 'Preferencias de Empleado',
    clientPreferences: 'Preferencias de Cliente',
    dangerZone: 'Zona de Peligro'
  },

  // Theme section
  themeSection: {
    title: 'Apariencia y Sistema',
    subtitle: 'Personaliza el tema y el idioma de la aplicación',
    themeLabel: 'Tema de la interfaz',
    themeDescription: 'Selecciona tu tema preferido para la aplicación',
    themes: {
      light: {
        label: 'Claro',
        description: 'Interfaz de colores claros'
      },
      dark: {
        label: 'Oscuro',
        description: 'Interfaz de colores oscuros'
      },
      system: {
        label: 'Sistema',
        description: 'Según las preferencias del sistema'
      }
    },
    currentTheme: 'Tema actual: {{theme}}',
    systemThemeNote: 'El tema cambia automáticamente según las preferencias de tu sistema operativo',
    changeAnytime: 'Puedes cambiar el tema en cualquier momento'
  },

  // Language section
  languageSection: {
    label: 'Idioma de la Interfaz',
    description: 'Selecciona el idioma de la interfaz'
  },

  // Admin Business Preferences
  businessInfo: {
    title: 'Información del Negocio',
    subtitle: 'Información básica del negocio',
    tabs: {
      info: 'Información del Negocio',
      notifications: 'Notificaciones del Negocio',
      tracking: 'Historial'
    },
    basicInfo: {
      title: 'Información Básica',
      nameLabel: 'Nombre del Negocio *',
      namePlaceholder: 'Ingresa el nombre del negocio',
      descriptionLabel: 'Descripción',
      descriptionPlaceholder: 'Describe tu negocio...'
    },
    contactInfo: {
      title: 'Información de Contacto',
      phoneLabel: 'Teléfono',
      phonePlaceholder: 'Número de teléfono',
      emailLabel: 'Email',
      emailPlaceholder: 'contacto@negocio.com',
      websiteLabel: 'Sitio Web',
      websitePlaceholder: 'https://www.negocio.com'
    },
    addressInfo: {
      title: 'Dirección',
      addressLabel: 'Dirección',
      addressPlaceholder: 'Calle, número, barrio',
      cityLabel: 'Ciudad',
      cityPlaceholder: 'Ciudad',
      stateLabel: 'Departamento/Estado',
      statePlaceholder: 'Departamento o Estado'
    },
    legalInfo: {
      title: 'Información Legal',
      legalNameLabel: 'Razón Social',
      legalNamePlaceholder: 'Razón social del negocio',
      taxIdLabel: 'NIT / ID Fiscal',
      taxIdPlaceholder: 'Número de identificación tributaria'
    },
    operationSettings: {
      title: 'Configuración de Operación',
      allowOnlineBooking: 'Permitir reservas en línea',
      autoConfirm: 'Confirmación automática',
      autoReminders: 'Recordatorios automáticos',
      showPrices: 'Mostrar precios públicamente'
    },
    nameRequired: 'El nombre del negocio es requerido',
    saveSettings: 'Guardar Configuración'
  },

  // Employee Preferences
  employeePrefs: {
    title: 'Preferencias de Empleado',
    subtitle: 'Configura tus preferencias de trabajo',
    availability: {
      title: 'Disponibilidad',
      availableForAppointments: 'Disponible para nuevas citas',
      notifyNewAssignments: 'Notificar nuevas asignaciones',
      appointmentReminders: 'Recordatorios de citas'
    },
    schedule: {
      title: 'Mi Horario de Trabajo',
      workingDay: 'Día laboral',
      restDay: 'Día de descanso',
      startTime: 'Inicio',
      endTime: 'Fin',
      lunchBreak: 'Almuerzo',
      saveSchedule: 'Guardar Horarios'
    },
    messages: {
      title: 'Mensajes de Clientes',
      allowMessages: 'Permitir mensajes de clientes',
      description: 'Cuando está habilitado, los clientes pueden enviarte mensajes directos'
    },
    professionalInfo: {
      title: 'Información Profesional',
      subtitle: 'Tu experiencia y tipo de trabajo preferido',
      summaryLabel: 'Resumen Profesional',
      summaryPlaceholder: 'Describe tu experiencia, habilidades y especialidades...',
      yearsExperienceLabel: 'Años de Experiencia',
      workTypeLabel: 'Tipo de Trabajo Preferido',
      workTypes: {
        fullTime: 'Tiempo Completo',
        partTime: 'Medio Tiempo',
        contract: 'Contrato',
        flexible: 'Flexible'
      }
    },
    salary: {
      title: 'Expectativas Salariales',
      minLabel: 'Salario Mínimo Esperado',
      maxLabel: 'Salario Máximo Esperado',
      minPlaceholder: 'Monto mínimo',
      maxPlaceholder: 'Monto máximo',
      invalidRange: 'El salario mínimo no puede ser mayor que el máximo'
    },
    specializations: {
      title: 'Especializaciones',
      noSpecializations: 'No hay especializaciones agregadas aún',
      newPlaceholder: 'Nueva especialización',
      addButton: 'Agregar'
    },
    languages: {
      title: 'Idiomas',
      noLanguages: 'No hay idiomas agregados aún',
      newPlaceholder: 'Idioma (ej: Inglés - Avanzado)',
      addButton: 'Agregar'
    },
    certifications: {
      title: 'Certificaciones y Licencias',
      noCertifications: 'No hay certificaciones agregadas aún',
      addButton: 'Agregar Certificación',
      form: {
        nameLabel: 'Nombre de la Certificación',
        namePlaceholder: 'Nombre de la certificación o licencia',
        issuerLabel: 'Entidad Emisora',
        issuerPlaceholder: 'Entidad que emitió la certificación',
        dateLabel: 'Fecha de Obtención',
        datePlaceholder: 'MM/AAAA',
        urlLabel: 'URL de Credencial (opcional)',
        urlPlaceholder: 'https://...',
        cancelButton: 'Cancelar',
        saveButton: 'Guardar'
      },
      issued: 'Emitido',
      verifyCredential: 'Verificar credencial',
      deleteButton: 'Eliminar'
    },
    links: {
      title: 'Enlaces Profesionales',
      portfolioLabel: 'Portafolio / Sitio Web',
      portfolioPlaceholder: 'https://tu-portafolio.com',
      linkedinLabel: 'LinkedIn',
      linkedinPlaceholder: 'https://linkedin.com/in/tuperfil'
    },
    saveButton: 'Guardar Preferencias',
    resetButton: 'Restablecer'
  },

  // Client Preferences
  clientPrefs: {
    title: 'Preferencias de Cliente',
    subtitle: 'Configura tus preferencias de reserva',
    bookingPrefs: {
      title: 'Preferencias de Reserva',
      appointmentReminders: 'Recordatorios de citas',
      emailConfirmation: 'Confirmación por email',
      promotionNotifications: 'Notificaciones de promociones',
      savePaymentMethods: 'Guardar métodos de pago'
    },
    advanceTime: {
      title: 'Tiempo de Anticipación Preferido',
      label: 'Tiempo de aviso preferido para citas',
      options: {
        sameDay: 'Mismo día',
        oneDay: '1 día',
        twoDays: '2 días',
        threeDays: '3 días',
        oneWeek: '1 semana'
      }
    },
    serviceHistory: {
      title: 'Historial de Servicios',
      label: 'Guardar mi historial de servicios para recomendaciones',
      description: 'Usamos esto para sugerir servicios similares'
    },
    paymentMethods: {
      title: 'Métodos de Pago',
      noneAdded: 'No hay métodos de pago agregados',
      types: {
        card: 'Tarjeta de Crédito/Débito',
        pse: 'PSE',
        cash: 'Efectivo',
        transfer: 'Transferencia Bancaria'
      },
      addButton: 'Agregar Método de Pago'
    },
    savePreferences: 'Guardar Preferencias'
  },

  // Danger Zone
  dangerZone: {
    title: 'Zona de Peligro',
    subtitle: 'Acciones irreversibles de la cuenta',
    deactivate: {
      title: 'Desactivar Cuenta',
      description: 'Suspender temporalmente tu cuenta. Puedes reactivarla en cualquier momento.',
      button: 'Desactivar Cuenta',
      confirmTitle: '¿Estás seguro de que deseas desactivar tu cuenta?',
      confirmDescription: 'Tu cuenta será suspendida temporalmente. Todos tus datos se conservarán y podrás reactivarla en cualquier momento iniciando sesión nuevamente.',
      inputLabel: 'Confirma tu email para continuar:',
      inputPlaceholder: 'tu@email.com',
      checkbox: 'Entiendo que mi cuenta será suspendida temporalmente',
      cancel: 'Cancelar',
      confirm: 'Sí, desactivar mi cuenta'
    },
    delete: {
      title: 'Eliminar Cuenta',
      description: 'Eliminar permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.',
      button: 'Eliminar Cuenta',
      confirmTitle: 'Eliminar cuenta permanentemente',
      warningTitle: 'Advertencia: Esta acción es irreversible',
      warningDescription: 'Estás a punto de eliminar permanentemente tu cuenta y todos los datos asociados. Esto incluye:',
      warningItems: {
        profile: 'Tu perfil e información personal',
        appointments: 'Todas tus citas (pasadas y futuras)',
        history: 'Tu historial completo de servicios',
        payments: 'Historial de pagos y métodos',
        preferences: 'Todas tus preferencias y configuraciones'
      },
      confirmText: 'Escribe "DESACTIVAR CUENTA" para confirmar',
      confirmPlaceholder: 'DESACTIVAR CUENTA',
      mustTypeCorrectly: 'Debes escribir "DESACTIVAR CUENTA" para confirmar',
      cancel: 'Cancelar',
      confirm: 'Sí, eliminar permanentemente',
      processing: 'Procesando...'
    }
  }
};
