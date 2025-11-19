// Landing page and marketing content - COMPLETE
export const landing = {
  nav: {
    features: 'Features',
    benefits: 'Benefits',
    pricing: 'Pricing',
    testimonials: 'Testimonials',
    signIn: 'Sign In',
    getStarted: 'Get Started Free'
  },
  hero: {
    badge: 'Designed for Colombian SMBs',
    title: 'Manage your business on',
    titleHighlight: 'autopilot',
    subtitle: 'The ALL-IN-ONE platform to manage appointments, clients, employees, accounting, and more. Save time, increase revenue, and grow without limits.',
    cta: {
      trial: '30-Day FREE Trial',
      pricing: 'View Plans & Pricing',
      noCreditCard: 'No credit card required',
      cancelAnytime: 'Cancel anytime'
    },
    stats: {
      businesses: 'Active Businesses',
      appointments: 'Appointments Scheduled',
      satisfaction: 'Satisfaction'
    }
  },
  dashboard: {
    title: 'Dashboard',
    today: 'Today',
    appointments: 'Appointments Today',
    revenue: 'Monthly Revenue',
    upcoming: 'Upcoming Appointments',
    client: 'Client',
    haircut: 'Haircut',
    confirmed: 'Confirmed',
    secureData: 'Secure & encrypted data'
  },
  features: {
    badge: 'Features',
    title: 'Everything you need in one platform',
    subtitle: 'Stop using 5 different tools. Gestabiz has it ALL.',
    list: {
      appointments: {
        title: 'Appointment Management',
        description: 'Smart calendar with conflict prevention and Google Calendar sync.'
      },
      reminders: {
        title: 'Auto Reminders',
        description: 'WhatsApp, Email & SMS. Reduce no-shows by 70%. Your clients never forget.'
      },
      clients: {
        title: 'Client Management',
        description: 'Complete database with history, notes, and recurring client analysis.'
      },
      accounting: {
        title: 'Accounting System',
        description: 'VAT, ICA, Retention. Automatic P&L reports. Ready for Colombian DIAN.'
      },
      mobile: {
        title: 'Native Mobile App',
        description: 'iOS & Android. Manage your business from anywhere, anytime.'
      },
      jobs: {
        title: 'Job Portal',
        description: 'Post vacancies, manage applications, and find the talent you need.'
      },
      analytics: {
        title: 'Advanced Analytics',
        description: 'Interactive dashboards, real-time charts, and exportable reports.'
      },
      automation: {
        title: 'Automation',
        description: 'Confirmations, reminders, invoices. All automatic while you sleep.'
      },
      security: {
        title: 'Total Security',
        description: 'Data encryption, automatic backups, and privacy compliance.'
      }
    }
  },
  benefits: {
    badge: 'Real Benefits',
    title: 'Recover up to $1.5M pesos monthly in lost appointments',
    subtitle: "It's not magic, it's data. Our clients recover an average of 70% of appointments that were previously lost due to forgetfulness or cancellations.",
    stats: {
      noShows: {
        value: '70%',
        label: 'Reduction in No-Shows',
        description: 'Automatic reminders work'
      },
      timeSaved: {
        value: '8-12h',
        label: 'Weekly Time Saved',
        description: 'No more time wasted on manual scheduling'
      },
      bookings: {
        value: '35%',
        label: 'Increase in Bookings',
        description: 'Your clients book 24/7, even while you sleep'
      },
      roi: {
        value: '900%',
        label: 'Average ROI',
        description: 'Investment pays for itself in the first month'
      }
    },
    cta: 'Start Recovering Money Today',
    calculator: {
      lost: 'Monthly Lost Money',
      lostDescription: 'If you lose 25 appointments/month at $50,000 each',
      withGestabiz: 'With Gestabiz',
      recovered: 'You Recover',
      appointmentsRecovered: 'Appointments recovered (70%)',
      cost: 'AppointSync Cost',
      netProfit: 'Net Profit',
      paysSelf: '🎉 Investment pays for ITSELF in the first month'
    }
  },
  pricing: {
    badge: 'Plans & Pricing',
    title: 'Transparent pricing. No surprises.',
    subtitle: 'Cheaper than competitors. More features. Fair pricing for your business.'
  },
  testimonials: {
    badge: 'Testimonials',
    title: 'What our clients say',
    subtitle: 'More than 800 businesses in Colombia trust Gestabiz',
    list: {
      maria: {
        name: 'María González',
        business: 'Glamour Salon - Medellín',
        text: "I can't believe I didn't start sooner. My clients say it looks super professional and I'm much calmer. I recovered $720,000/month in lost appointments.",
        stat: '900% ROI'
      },
      carlos: {
        name: 'Dr. Carlos Ramírez',
        business: 'SmileCare Dental Office - Bogotá',
        text: "As a doctor, my time is gold. AppointSync gave me back 10 hours a week. Now I see more patients and my accountant is happy.",
        stat: '800% ROI'
      },
      juan: {
        name: 'Juan Martínez',
        business: 'Personal Trainer - Cali',
        text: 'I invested $29,900 and it changed my life. Now I look like a professional business. I even raised my prices. Best investment ever.',
        stat: '2000% ROI'
      }
    }
  },
  cta: {
    title: 'Ready to transform your business?',
    subtitle: 'Join over 800 businesses already saving time and increasing revenue with Gestabiz.',
    buttons: {
      trial: 'Start FREE for 30 Days',
      login: 'I already have an account'
    },
    benefits: {
      noCreditCard: 'No credit card required',
      cancelAnytime: 'Cancel anytime',
      spanishSupport: 'Spanish support'
    }
  },
  footer: {
    tagline: 'The #1 business management platform for Colombian SMBs.',
    product: {
      title: 'Product',
      features: 'Features',
      pricing: 'Pricing',
      integrations: 'Integrations',
      api: 'API'
    },
    resources: {
      title: 'Resources',
      blog: 'Blog',
      help: 'Help',
      tutorials: 'Tutorials',
      contact: 'Contact'
    },
    legal: {
      title: 'Legal',
      terms: 'Terms',
      privacy: 'Privacy',
      cookies: 'Cookies',
      licenses: 'Licenses'
    },
    copyright: '© 2025 Gestabiz. All rights reserved.',
    madeIn: 'Made with ❤️ in Colombia 🇨🇴',
    developedBy: 'Developed by',
    company: 'Ti Turing',
    version: 'Version 1.0.0'
  }
};

// Employee module
export const employee = {
  join: {
    title: 'Join a Business',
    description: 'Search and request to join a business as an employee',
    search_placeholder: 'Search by business name, category, or city...',
    request_to_join: 'Request to Join',
    request_form_title: 'Join Request',
    request_form_description: 'Send a request to join {{businessName}}',
    message_label: 'Message (Optional)',
    message_placeholder: 'Tell the business owner why you want to join their team...',
    message_hint: 'Include your experience and skills relevant to this business',
    send_request: 'Send Request',
    sending: 'Sending...',
    request_sent_success: 'Join request sent successfully',
    request_error: 'Error sending join request',
    no_results_title: 'No businesses found',
    no_results_description: 'Try adjusting your search terms',
    no_businesses_title: 'No businesses available',
    no_businesses_description: 'There are no businesses you can join at the moment'
  },
  requests: {
    pending_title: 'Pending Requests',
    pending_description: 'Review and approve employee join requests',
    processed_title: 'Processed Requests', 
    processed_description: 'Previously reviewed requests',
    approve: 'Approve',
    reject: 'Reject',
    requested_on: 'Requested on',
    processed_on: 'Processed on',
    approved_success: 'Employee request approved',
    rejected_success: 'Employee request rejected',
    error: 'Error processing request',
    no_requests_title: 'No employee requests',
    no_requests_description: 'When users request to join your business, they will appear here',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    }
  }
};
