// Reviews - Complete reviews module
export const reviews = {
  title: 'Reviews',
  subtitle: 'Client reviews and ratings',
  
  // Rating
  rating: {
    overall: 'Overall Rating',
    stars: '{{count}} stars',
    outOf: 'out of 5',
    based: 'Based on {{count}} reviews',
    distribution: 'Rating Distribution',
    avgRating: 'Average Rating'
  },

  // Comments
  comments: {
    title: 'Client Comments',
    noComments: 'No comments yet',
    writeReview: 'Write a Review',
    yourReview: 'Your Review',
    editReview: 'Edit Review',
    deleteReview: 'Delete Review',
    helpful: 'Was this helpful?',
    reportReview: 'Report Review'
  },

  // Form
  form: {
    title: 'Leave a Review',
    ratingLabel: 'Your Rating',
    commentLabel: 'Your Comment',
    commentPlaceholder: 'Share your experience...',
    submit: 'Submit Review',
    submitting: 'Submitting...',
    cancel: 'Cancel',
    required: 'Rating is required',
    minLength: 'Comment must be at least {{min}} characters',
    maxLength: 'Comment must not exceed {{max}} characters'
  },

  // Filters
  filters: {
    all: 'All Reviews',
    mostRecent: 'Most Recent',
    highestRating: 'Highest Rating',
    lowestRating: 'Lowest Rating',
    mostHelpful: 'Most Helpful',
    verified: 'Verified Only',
    withPhotos: 'With Photos'
  },

  // Stats
  stats: {
    totalReviews: 'Total Reviews',
    averageRating: 'Average Rating',
    fiveStars: '5 Stars',
    fourStars: '4 Stars',
    threeStars: '3 Stars',
    twoStars: '2 Stars',
    oneStar: '1 Star',
    percentage: '{{percent}}%'
  },

  // Response
  response: {
    businessResponse: 'Business Response',
    respondToReview: 'Respond to Review',
    yourResponse: 'Your Response',
    responsePlaceholder: 'Thank you for your feedback...',
    submitResponse: 'Submit Response',
    editResponse: 'Edit Response',
    deleteResponse: 'Delete Response',
    respondedOn: 'Responded on {{date}}'
  },

  // Verified badge
  verified: {
    label: 'Verified',
    tooltip: 'This review is from a verified client'
  },

  // Actions
  actions: {
    view: 'View Review',
    edit: 'Edit',
    delete: 'Delete',
    respond: 'Respond',
    report: 'Report',
    hide: 'Hide Review',
    show: 'Show Review',
    markHelpful: 'Mark as Helpful'
  },

  // Messages
  messages: {
    reviewSubmitted: 'Review submitted successfully',
    reviewUpdated: 'Review updated successfully',
    reviewDeleted: 'Review deleted successfully',
    responseSubmitted: 'Response submitted successfully',
    cannotReview: 'You must complete an appointment to leave a review',
    alreadyReviewed: 'You have already reviewed this {{type}}',
    confirmDelete: 'Are you sure you want to delete this review?'
  },

  // Empty states
  empty: {
    noReviews: 'No reviews yet',
    beFirst: 'Be the first to leave a review!',
    noReviewsForFilter: 'No reviews match this filter'
  }
};
