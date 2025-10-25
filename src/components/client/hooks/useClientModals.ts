import React from 'react'
import type { Appointment } from '@/types/appointment'

export interface BookingPreselection {
  businessId?: string
  serviceId?: string
  locationId?: string
  employeeId?: string
}

export interface SearchParams {
  term: string
  type: string
}

export const useClientModals = () => {
  // Appointment Wizard
  const [showAppointmentWizard, setShowAppointmentWizard] = React.useState(false)
  const [appointmentWizardBusinessId, setAppointmentWizardBusinessId] = React.useState<string | undefined>()
  const [bookingPreselection, setBookingPreselection] = React.useState<BookingPreselection | undefined>()
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()
  const [preselectedTime, setPreselectedTime] = React.useState<string | undefined>()
  const [appointmentToEdit, setAppointmentToEdit] = React.useState<Appointment | null>(null)

  // Search Modal
  const [searchModalOpen, setSearchModalOpen] = React.useState(false)
  const [searchParams, setSearchParams] = React.useState<SearchParams | null>(null)

  // Appointment Details Modal
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)

  // Business Profile Modal
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | null>(null)

  // Professional Profile Modal
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)

  // Chat
  const [chatConversationId, setChatConversationId] = React.useState<string | null>(null)
  const [isStartingChat, setIsStartingChat] = React.useState(false)

  // Review Modal
  const [shouldShowReviewModal, setShouldShowReviewModal] = React.useState(false)
  const [pendingReviewsCount, setPendingReviewsCount] = React.useState(0)

  // Handler para crear cita desde el calendario
  const handleCreateAppointmentFromCalendar = (date: Date, time?: string) => {
    setPreselectedDate(date)
    setPreselectedTime(time)
    setShowAppointmentWizard(true)
  }

  // Handler para cerrar el wizard y limpiar las preselecciones
  const handleCloseWizard = () => {
    setShowAppointmentWizard(false)
    setPreselectedDate(undefined)
    setPreselectedTime(undefined)
    setAppointmentWizardBusinessId(undefined)
    setBookingPreselection(undefined)
    setAppointmentToEdit(null)
  }

  return {
    // Appointment Wizard
    showAppointmentWizard,
    setShowAppointmentWizard,
    appointmentWizardBusinessId,
    setAppointmentWizardBusinessId,
    bookingPreselection,
    setBookingPreselection,
    preselectedDate,
    setPreselectedDate,
    preselectedTime,
    setPreselectedTime,
    appointmentToEdit,
    setAppointmentToEdit,
    handleCreateAppointmentFromCalendar,
    handleCloseWizard,

    // Search Modal
    searchModalOpen,
    setSearchModalOpen,
    searchParams,
    setSearchParams,

    // Appointment Details Modal
    selectedAppointment,
    setSelectedAppointment,

    // Business Profile Modal
    selectedBusinessId,
    setSelectedBusinessId,

    // Professional Profile Modal
    selectedUserId,
    setSelectedUserId,

    // Chat
    chatConversationId,
    setChatConversationId,
    isStartingChat,
    setIsStartingChat,

    // Review Modal
    shouldShowReviewModal,
    setShouldShowReviewModal,
    pendingReviewsCount,
    setPendingReviewsCount,
  }
}