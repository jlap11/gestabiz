import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { Review, ReviewFilters } from '@/types/types';
import { toast } from 'sonner';

/**
 * Hook para gestionar reviews (calificaciones de clientes)
 */
export function useReviews(filters?: ReviewFilters) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    average_rating: 0,
    rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(id, full_name, email, avatar_url),
          employee:profiles!reviews_employee_id_fkey(id, full_name, email, avatar_url),
          appointment:appointments(id, start_time, service_id)
        `);

      // Apply filters
      if (filters?.business_id) query = query.eq('business_id', filters.business_id);
      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.client_id) query = query.eq('client_id', filters.client_id);
      if (filters?.rating && filters.rating.length > 0) query = query.in('rating', filters.rating);
      if (filters?.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      query = query.eq('is_visible', true).order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setReviews(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const total = data.length;
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        const average = sum / total;
        const distribution = data.reduce(
          (acc, review) => {
            acc[review.rating as keyof typeof acc]++;
            return acc;
          },
          { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        );

        setStats({
          total,
          average_rating: Math.round(average * 100) / 100,
          rating_distribution: distribution,
        });
      } else {
        setStats({
          total: 0,
          average_rating: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Error al cargar reviews: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create review
  const createReview = async (
    appointmentId: string,
    clientId: string,
    businessId: string,
    employeeId: string | undefined,
    rating: 1 | 2 | 3 | 4 | 5,
    comment?: string
  ) => {
    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          appointment_id: appointmentId,
          client_id: clientId,
          business_id: businessId,
          employee_id: employeeId,
          rating,
          comment,
          is_visible: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Review creada exitosamente');
      fetchReviews();
      return data;
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al crear review: ${error.message}`);
      throw error;
    }
  };

  // Update review
  const updateReview = async (reviewId: string, updates: { rating?: 1 | 2 | 3 | 4 | 5; comment?: string }) => {
    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId);

      if (updateError) throw updateError;

      toast.success('Review actualizada exitosamente');
      fetchReviews();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar review: ${error.message}`);
      throw error;
    }
  };

  // Respond to review (business owner)
  const respondToReview = async (reviewId: string, response: string, responseBy: string) => {
    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          response,
          response_at: new Date().toISOString(),
          response_by: responseBy,
        })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      toast.success('Respuesta publicada exitosamente');
      fetchReviews();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al responder review: ${error.message}`);
      throw error;
    }
  };

  // Delete review
  const deleteReview = async (reviewId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) throw deleteError;

      toast.success('Review eliminada');
      fetchReviews();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al eliminar review: ${error.message}`);
      throw error;
    }
  };

  // Hide/show review
  const toggleReviewVisibility = async (reviewId: string, isVisible: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ is_visible: isVisible })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      toast.success(isVisible ? 'Review publicada' : 'Review oculta');
      fetchReviews();
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar visibilidad: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.business_id,
    filters?.employee_id,
    filters?.client_id,
    filters?.rating,
    filters?.is_verified,
    filters?.date_range,
  ]);

  return {
    reviews,
    loading,
    error,
    stats,
    createReview,
    updateReview,
    respondToReview,
    deleteReview,
    toggleReviewVisibility,
    refetch: fetchReviews,
  };
}
