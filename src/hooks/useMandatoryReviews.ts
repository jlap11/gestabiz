import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

export function useMandatoryReviews(userId?: string) {
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkPendingReviews = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Check if user has "remind later" active
      const remindLater = getRemindLaterStatus(userId);
      if (remindLater) {
        setShouldShowModal(false);
        return;
      }

      // Count completed appointments without reviews
      // Get all completed appointments for the user
      const { data: completedAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', userId)
        .eq('status', 'completed');

      if (appointmentsError) throw appointmentsError;

      if (!completedAppointments || completedAppointments.length === 0) {
        setPendingReviewsCount(0);
        setShouldShowModal(false);
        return;
      }

      // Get appointments that have reviews
      const appointmentIds = completedAppointments.map(a => a.id);
      const { data: reviewedAppointments, error: reviewsError } = await supabase
        .from('reviews')
        .select('appointment_id')
        .in('appointment_id', appointmentIds);

      if (reviewsError) throw reviewsError;

      const reviewedIds = new Set(reviewedAppointments?.map(r => r.appointment_id) || []);
      const pendingCount = appointmentIds.filter(id => !reviewedIds.has(id)).length;

      setPendingReviewsCount(pendingCount);

      // Show modal if there are pending reviews
      setShouldShowModal(pendingCount > 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking pending reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
    loading,
    checkPendingReviews,
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
