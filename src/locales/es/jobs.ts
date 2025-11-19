// Jobs - Módulo completo de reclutamiento
export const jobs = {
  title: 'Vacantes Laborales',
  subtitle: 'Reclutamiento y aplicaciones',
  
  // Vacancy management
  vacancies: {
    title: 'Vacantes',
    create: 'Crear Vacante',
    edit: 'Editar Vacante',
    delete: 'Eliminar Vacante',
    viewApplications: 'Ver Aplicaciones',
    noVacancies: 'No hay vacantes activas',
    createFirst: 'Crea tu primera vacante para comenzar a reclutar'
  },

  // Application
  application: {
    title: 'Aplicación Laboral',
    apply: 'Aplicar Ahora',
    applyFor: 'Aplicar para {{position}}',
    submit: 'Enviar Aplicación',
    sending: 'Enviando aplicación...',
    success: 'Aplicación enviada exitosamente',
    error: 'Error al enviar aplicación',
    alreadyApplied: 'Ya has aplicado para esta posición',
    deadline: 'Fecha límite de aplicación',
    closed: 'Aplicaciones cerradas'
  },

  // Form fields
  form: {
    position: 'Posición',
    positionPlaceholder: 'ej: Estilista, Recepcionista',
    description: 'Descripción',
    descriptionPlaceholder: 'Describe las responsabilidades y requisitos...',
    location: 'Ubicación',
    salary: 'Rango Salarial',
    salaryMin: 'Mínimo',
    salaryMax: 'Máximo',
    salaryPlaceholder: 'ej: 1.500.000',
    commissionBased: 'Basado en comisiones',
    employmentType: 'Tipo de Empleo',
    requiredSkills: 'Habilidades Requeridas',
    skillPlaceholder: 'Agregar una habilidad',
    addSkill: 'Agregar',
    experience: 'Experiencia Requerida',
    yearsExperience: '{{years}} años',
    deadline: 'Fecha Límite',
    contactEmail: 'Email de Contacto',
    contactPhone: 'Teléfono de Contacto'
  },

  // Employment types
  employmentType: {
    fullTime: 'Tiempo Completo',
    partTime: 'Medio Tiempo',
    contract: 'Contrato',
    temporary: 'Temporal',
    internship: 'Pasantía',
    freelance: 'Freelance'
  },

  // Applications list
  applications: {
    title: 'Aplicaciones',
    pending: 'Pendientes',
    reviewed: 'Revisadas',
    accepted: 'Aceptadas',
    rejected: 'Rechazadas',
    noApplications: 'No hay aplicaciones aún',
    viewProfile: 'Ver Perfil',
    viewResume: 'Ver Currículum',
    accept: 'Aceptar',
    reject: 'Rechazar',
    contact: 'Contactar',
    applicantInfo: 'Información del Aplicante',
    appliedOn: 'Aplicó el {{date}}',
    experience: '{{years}} años de experiencia'
  },

  // Applicant profile
  profile: {
    summary: 'Resumen Profesional',
    experience: 'Experiencia',
    skills: 'Habilidades',
    certifications: 'Certificaciones',
    languages: 'Idiomas',
    availability: 'Disponibilidad',
    expectedSalary: 'Salario Esperado',
    resume: 'Currículum',
    downloadResume: 'Descargar Currículum'
  },

  // Status
  status: {
    active: 'Activa',
    closed: 'Cerrada',
    filled: 'Posición Ocupada',
    onHold: 'En Espera',
    draft: 'Borrador'
  },

  // Actions
  actions: {
    publish: 'Publicar',
    unpublish: 'Despublicar',
    close: 'Cerrar Vacante',
    reopen: 'Reabrir Vacante',
    duplicate: 'Duplicar',
    markAsFilled: 'Marcar como Ocupada'
  },

  // Messages
  messages: {
    vacancyCreated: 'Vacante creada exitosamente',
    vacancyUpdated: 'Vacante actualizada exitosamente',
    vacancyDeleted: 'Vacante eliminada exitosamente',
    applicationSubmitted: 'Aplicación enviada exitosamente',
    applicationAccepted: 'Aplicación aceptada',
    applicationRejected: 'Aplicación rechazada',
    confirmDelete: '¿Estás seguro de que deseas eliminar esta vacante?',
    confirmClose: '¿Estás seguro de que deseas cerrar esta vacante?'
  },

  // Filters
  filters: {
    all: 'Todas las Vacantes',
    active: 'Activas',
    closed: 'Cerradas',
    byLocation: 'Por Ubicación',
    byType: 'Por Tipo'
  },

  // Empty states
  empty: {
    noVacancies: 'No hay vacantes disponibles',
    noApplications: 'No se han recibido aplicaciones aún',
    noPending: 'No hay aplicaciones pendientes'
  }
};
