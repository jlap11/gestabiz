// Página de inicio y contenido de marketing
export const landing = {
  hero: {
    title: 'Gestiona las Citas de Tu Negocio',
    subtitle: 'La solución todo-en-uno para agendamiento, clientes y crecimiento',
    cta_primary: 'Comenzar',
    cta_secondary: 'Saber Más',
  },
  features: {
    title: 'Todo lo que Necesitas',
    online_booking: {
      title: 'Reservas en Línea',
      description: 'Permite que tus clientes reserven citas 24/7',
    },
    calendar: {
      title: 'Calendario Inteligente',
      description: 'Gestiona tu agenda eficientemente',
    },
    notifications: {
      title: 'Notificaciones Automáticas',
      description: 'Recordatorios por SMS y email',
    },
    analytics: {
      title: 'Analítica',
      description: 'Información sobre tu negocio',
    },
  },
  pricing: {
    title: 'Planes y Precios',
    free: {
      name: 'Gratuito',
      price: 'Gratis',
      features: [
        '1 sede',
        '1 empleado',
        '3 citas/mes',
      ],
      cta: 'Comenzar Gratis',
    },
    starter: {
      name: 'Inicio',
      price: '$80.000/mes',
      features: [
        '3 sedes',
        '5 empleados',
        'Citas ilimitadas',
        'Soporte por email',
      ],
      cta: 'Comenzar',
      popular: true,
    },
    professional: {
      name: 'Profesional',
      price: 'Próximamente',
      features: [
        'Sedes ilimitadas',
        'Empleados ilimitados',
        'Analítica avanzada',
        'Soporte prioritario',
      ],
      cta: 'Próximamente',
      disabled: true,
    },
  },
  testimonials: {
    title: 'Lo que Dicen Nuestros Clientes',
  },
  cta: {
    title: '¿Listo para Comenzar?',
    subtitle: 'Únete a miles de negocios usando Gestabiz',
    button: 'Crear Cuenta Gratuita',
  },
  footer: {
    product: 'Producto',
    company: 'Compañía',
    legal: 'Legal',
    privacy: 'Política de Privacidad',
    terms: 'Términos de Servicio',
    contact: 'Contacto',
  },
}

export const employee = {
  profile: {
    title: 'Perfil de Empleado',
    services: 'Servicios Ofrecidos',
    schedule: 'Horario',
    experience: 'Experiencia',
  },
  schedule: {
    title: 'Mi Horario',
    available: 'Disponible',
    busy: 'Ocupado',
    lunch: 'Hora de Almuerzo',
  },
}
