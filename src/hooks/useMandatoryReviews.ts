// =====================================================
// Hook: useMandatoryReviews (REFACTORIZADO v2.0)
// =====================================================
// ANTES: Hacía query propia a completed appointments + reviews
// AHORA: Recibe datos como parámetros (del hook useClientDashboard)
// Beneficio: Elimina queries duplicadas
// =====================================================

import { useState, useEffect, useCallback } from 'react';

export interface PendingReviewCheck {
  hasPendingReviews: boolean;
  count: number;
  shouldShowModal: boolean;
}

const REMIND_LATER_KEY = 'appointsync_remind_later_reviews';
const REMIND_LATER_DURATION = 5 * 60 * 1000; // 5 minutes

interface RemindLaterEntry {
  userId: string;
  timestamp: number;
}

/**
 * Hook para gestionar modal de reviews obligatorias
 * 
 * @param userId - ID del usuario
 * @param completedAppointments - Citas completadas (del dashboard hook)
 * @param reviewedAppointmentIds - IDs de citas con review (del dashboard hook)
 * @returns Estado del modal y funciones de control
 */
export function useMandatoryReviews(
  userId: string | undefined,
  completedAppointments: any[] = [],
  reviewedAppointmentIds: string[] = []
) {
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  // ✅ Calcular pending reviews SIN hacer query adicional
  const checkPendingReviews = useCallback(() => {
    if (!userId || completedAppointments.length === 0) {
      setPendingReviewsCount(0);
      setShouldShowModal(false);
      return;
    }

    // Check if user has "remind later" active
    const remindLater = getRemindLaterStatus(userId);
    if (remindLater) {
      setShouldShowModal(false);
      return;
    }

    // Calcular pending reviews (completed appointments sin review)
    const reviewedSet = new Set(reviewedAppointmentIds);
    const pendingCount = completedAppointments.filter(
      (apt) => !reviewedSet.has(apt.id)
    ).length;

    setPendingReviewsCount(pendingCount);
    setShouldShowModal(pendingCount > 0);
  }, [userId, completedAppointments, reviewedAppointmentIds]);

  useEffect(() => {
    checkPendingReviews();
  }, [checkPendingReviews]);

  const dismissModal = useCallback(() => {
    setShouldShowModal(false);
  }, []);

  const remindLater = useCallback(() => {
    if (!userId) return;

    const entry: RemindLaterEntry = {
      userId,
      timestamp: Date.now(),
    };

    try {
      const existing = localStorage.getItem(REMIND_LATER_KEY);
      const entries: RemindLaterEntry[] = existing ? JSON.parse(existing) : [];

      // Remove old entry for this user
      const filtered = entries.filter((e) => e.userId !== userId);

      // Add new entry
      filtered.push(entry);

      localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
      setShouldShowModal(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting remind later:', error);
    }
  }, [userId]);

  const clearRemindLater = useCallback(() => {
    if (!userId) return;

    try {
      const existing = localStorage.getItem(REMIND_LATER_KEY);
      if (!existing) return;

      const entries: RemindLaterEntry[] = JSON.parse(existing);
      const filtered = entries.filter((e) => e.userId !== userId);

      if (filtered.length > 0) {
        localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
      } else {
        localStorage.removeItem(REMIND_LATER_KEY);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error clearing remind later:', error);
    }
  }, [userId]);

  return {
    pendingReviewsCount,
    shouldShowModal,
    checkPendingReviews, // Ahora es síncrono (no async)
    dismissModal,
    remindLater,
    clearRemindLater,
  };
}

// Helper function to check remind later status
function getRemindLaterStatus(userId: string): boolean {
  try {
    const existing = localStorage.getItem(REMIND_LATER_KEY);
    if (!existing) return false;

    const entries: RemindLaterEntry[] = JSON.parse(existing);
    const userEntry = entries.find((e) => e.userId === userId);

    if (!userEntry) return false;

    // Check if remind later has expired
    const now = Date.now();
    const elapsed = now - userEntry.timestamp;

    if (elapsed >= REMIND_LATER_DURATION) {
      // Expired, remove entry
      const filtered = entries.filter((e) => e.userId !== userId);
      if (filtered.length > 0) {
        localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
      } else {
        localStorage.removeItem(REMIND_LATER_KEY);
      }
      return false;
    }

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting remind later status:', error);
    return false;
  }
}

// Cleanup expired entries periodically
export function cleanupExpiredRemindLater() {
  try {
    const existing = localStorage.getItem(REMIND_LATER_KEY);
    if (!existing) return;

    const entries: RemindLaterEntry[] = JSON.parse(existing);
    const now = Date.now();

    const filtered = entries.filter((entry) => {
      const elapsed = now - entry.timestamp;
      return elapsed < REMIND_LATER_DURATION;
    });

    if (filtered.length > 0) {
      localStorage.setItem(REMIND_LATER_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(REMIND_LATER_KEY);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error cleaning up remind later:', error);
  }
}
