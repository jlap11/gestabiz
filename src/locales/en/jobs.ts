// Jobs - Complete recruitment module
export const jobs = {
  title: 'Job Vacancies',
  subtitle: 'Recruitment and applications',
  
  // Vacancy management
  vacancies: {
    title: 'Vacancies',
    create: 'Create Vacancy',
    edit: 'Edit Vacancy',
    delete: 'Delete Vacancy',
    viewApplications: 'View Applications',
    noVacancies: 'No active vacancies',
    createFirst: 'Create your first vacancy to start recruiting'
  },

  // Application
  application: {
    title: 'Job Application',
    apply: 'Apply Now',
    applyFor: 'Apply for {{position}}',
    submit: 'Submit Application',
    sending: 'Sending application...',
    success: 'Application submitted successfully',
    error: 'Error submitting application',
    alreadyApplied: 'You have already applied for this position',
    deadline: 'Application deadline',
    closed: 'Applications closed'
  },

  // Form fields
  form: {
    position: 'Position',
    positionPlaceholder: 'e.g., Hair Stylist, Receptionist',
    description: 'Description',
    descriptionPlaceholder: 'Describe the responsibilities and requirements...',
    location: 'Location',
    salary: 'Salary Range',
    salaryMin: 'Minimum',
    salaryMax: 'Maximum',
    salaryPlaceholder: 'e.g., 1,500,000',
    commissionBased: 'Commission-based',
    employmentType: 'Employment Type',
    requiredSkills: 'Required Skills',
    skillPlaceholder: 'Add a skill',
    addSkill: 'Add',
    experience: 'Required Experience',
    yearsExperience: '{{years}} years',
    deadline: 'Application Deadline',
    contactEmail: 'Contact Email',
    contactPhone: 'Contact Phone'
  },

  // Employment types
  employmentType: {
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    temporary: 'Temporary',
    internship: 'Internship',
    freelance: 'Freelance'
  },

  // Applications list
  applications: {
    title: 'Applications',
    pending: 'Pending',
    reviewed: 'Reviewed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    noApplications: 'No applications yet',
    viewProfile: 'View Profile',
    viewResume: 'View Resume',
    accept: 'Accept',
    reject: 'Reject',
    contact: 'Contact',
    applicantInfo: 'Applicant Information',
    appliedOn: 'Applied on {{date}}',
    experience: '{{years}} years experience'
  },

  // Applicant profile
  profile: {
    summary: 'Professional Summary',
    experience: 'Experience',
    skills: 'Skills',
    certifications: 'Certifications',
    languages: 'Languages',
    availability: 'Availability',
    expectedSalary: 'Expected Salary',
    resume: 'Resume',
    downloadResume: 'Download Resume'
  },

  // Status
  status: {
    active: 'Active',
    closed: 'Closed',
    filled: 'Position Filled',
    onHold: 'On Hold',
    draft: 'Draft'
  },

  // Actions
  actions: {
    publish: 'Publish',
    unpublish: 'Unpublish',
    close: 'Close Vacancy',
    reopen: 'Reopen Vacancy',
    duplicate: 'Duplicate',
    markAsFilled: 'Mark as Filled'
  },

  // Messages
  messages: {
    vacancyCreated: 'Vacancy created successfully',
    vacancyUpdated: 'Vacancy updated successfully',
    vacancyDeleted: 'Vacancy deleted successfully',
    applicationSubmitted: 'Application submitted successfully',
    applicationAccepted: 'Application accepted',
    applicationRejected: 'Application rejected',
    confirmDelete: 'Are you sure you want to delete this vacancy?',
    confirmClose: 'Are you sure you want to close this vacancy?'
  },

  // Filters
  filters: {
    all: 'All Vacancies',
    active: 'Active',
    closed: 'Closed',
    byLocation: 'By Location',
    byType: 'By Type'
  },

  // Empty states
  empty: {
    noVacancies: 'No vacancies available',
    noApplications: 'No applications received yet',
    noPending: 'No pending applications'
  }
};
