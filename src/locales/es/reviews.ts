// Reviews - Módulo completo de reseñas
export const reviews = {
  title: 'Reseñas',
  subtitle: 'Reseñas y calificaciones de clientes',
  
  // Rating
  rating: {
    overall: 'Calificación General',
    stars: '{{count}} estrellas',
    outOf: 'de 5',
    based: 'Basado en {{count}} reseñas',
    distribution: 'Distribución de Calificaciones',
    avgRating: 'Calificación Promedio'
  },

  // Comments
  comments: {
    title: 'Comentarios de Clientes',
    noComments: 'No hay comentarios aún',
    writeReview: 'Escribir una Reseña',
    yourReview: 'Tu Reseña',
    editReview: 'Editar Reseña',
    deleteReview: 'Eliminar Reseña',
    helpful: '¿Fue útil?',
    reportReview: 'Reportar Reseña'
  },

  // Form
  form: {
    title: 'Dejar una Reseña',
    ratingLabel: 'Tu Calificación',
    commentLabel: 'Tu Comentario',
    commentPlaceholder: 'Comparte tu experiencia...',
    submit: 'Enviar Reseña',
    submitting: 'Enviando...',
    cancel: 'Cancelar',
    required: 'La calificación es requerida',
    minLength: 'El comentario debe tener al menos {{min}} caracteres',
    maxLength: 'El comentario no debe exceder {{max}} caracteres'
  },

  // Filters
  filters: {
    all: 'Todas las Reseñas',
    mostRecent: 'Más Recientes',
    highestRating: 'Mejor Calificación',
    lowestRating: 'Peor Calificación',
    mostHelpful: 'Más Útiles',
    verified: 'Solo Verificadas',
    withPhotos: 'Con Fotos'
  },

  // Stats
  stats: {
    totalReviews: 'Total de Reseñas',
    averageRating: 'Calificación Promedio',
    fiveStars: '5 Estrellas',
    fourStars: '4 Estrellas',
    threeStars: '3 Estrellas',
    twoStars: '2 Estrellas',
    oneStar: '1 Estrella',
    percentage: '{{percent}}%'
  },

  // Response
  response: {
    businessResponse: 'Respuesta del Negocio',
    respondToReview: 'Responder a Reseña',
    yourResponse: 'Tu Respuesta',
    responsePlaceholder: 'Gracias por tus comentarios...',
    submitResponse: 'Enviar Respuesta',
    editResponse: 'Editar Respuesta',
    deleteResponse: 'Eliminar Respuesta',
    respondedOn: 'Respondió el {{date}}'
  },

  // Verified badge
  verified: {
    label: 'Verificado',
    tooltip: 'Esta reseña es de un cliente verificado'
  },

  // Actions
  actions: {
    view: 'Ver Reseña',
    edit: 'Editar',
    delete: 'Eliminar',
    respond: 'Responder',
    report: 'Reportar',
    hide: 'Ocultar Reseña',
    show: 'Mostrar Reseña',
    markHelpful: 'Marcar como Útil'
  },

  // Messages
  messages: {
    reviewSubmitted: 'Reseña enviada exitosamente',
    reviewUpdated: 'Reseña actualizada exitosamente',
    reviewDeleted: 'Reseña eliminada exitosamente',
    responseSubmitted: 'Respuesta enviada exitosamente',
    cannotReview: 'Debes completar una cita para dejar una reseña',
    alreadyReviewed: 'Ya has reseñado este {{type}}',
    confirmDelete: '¿Estás seguro de que deseas eliminar esta reseña?'
  },

  // Empty states
  empty: {
    noReviews: 'No hay reseñas aún',
    beFirst: '¡Sé el primero en dejar una reseña!',
    noReviewsForFilter: 'No hay reseñas que coincidan con este filtro'
  }
};
