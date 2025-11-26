import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface PendingReview {
  appointment_id: string;
  business_id: string;
  business_name: string;
  service_name: string;
  completed_at: string;
  employee_id?: string;
  employee_name?: string;
  // DEBUG fields
  status: string;
  start_time: string;
  end_time: string;
  payment_status?: string;
}

interface PreviousRating {
  rating: number;
  comment?: string;
  created_at: string;
}

interface MandatoryReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
  userId: string;
}

export const MandatoryReviewModal: React.FC<MandatoryReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewSubmitted,
  userId,
}) => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  
  // Business rating state
  const [businessRating, setBusinessRating] = useState(0);
  const [businessHoverRating, setBusinessHoverRating] = useState(0);
  const [previousBusinessRating, setPreviousBusinessRating] = useState<PreviousRating | null>(null);
  
  // Employee rating state
  const [employeeRating, setEmployeeRating] = useState(0);
  const [employeeHoverRating, setEmployeeHoverRating] = useState(0);
  const [previousEmployeeRating, setPreviousEmployeeRating] = useState<PreviousRating | null>(null);
  
  // Shared state
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fetchingReviews, setFetchingReviews] = useState(true);

  // Computed values - deben estar antes de los useEffect que los usan
  const currentReview = pendingReviews[currentReviewIndex];
  const hasMoreReviews = currentReviewIndex < pendingReviews.length - 1;
  const isLastReview = currentReviewIndex === pendingReviews.length - 1;

  // Fetch pending reviews on mount
  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (!isOpen || !userId) {
        setFetchingReviews(false);
        return;
      }

      try {
        setFetchingReviews(true);

        // Fetch appointments that need reviews
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            business_id,
            service_id,
            employee_id,
            status,
            start_time,
            end_time,
            completed_at,
            payment_status,
            business:businesses!appointments_business_id_fkey(name),
            service:services!appointments_service_id_fkey(name),
            employee:profiles!appointments_employee_id_fkey(full_name)
          `)
          .eq('client_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Get appointment IDs that already have reviews
        const appointmentIds = (data || []).map(apt => apt.id);
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('appointment_id')
          .in('appointment_id', appointmentIds);

        const reviewedAppointmentIds = new Set(
          (existingReviews || []).map(r => r.appointment_id)
        );

        // Filter out appointments that already have reviews
        const appointmentsWithoutReviews = (data || []).filter(
          apt => !reviewedAppointmentIds.has(apt.id)
        );

        // Agrupar por (business_id, employee_id) - mostrar solo una review por esa combinación
        const groupedByBusinessAndEmployee = new Map<string, typeof appointmentsWithoutReviews[0]>();
        appointmentsWithoutReviews.forEach(apt => {
          // Usar employee_id o 'no-employee' si no hay empleado
          const employeeKey = apt.employee_id || 'no-employee';
          const key = `${apt.business_id}|${employeeKey}`;
          
          // Mantener solo el primer (más reciente) de cada grupo
          if (!groupedByBusinessAndEmployee.has(key)) {
            groupedByBusinessAndEmployee.set(key, apt);
          }
        });

        // Convertir map a array de appointments únicos
        const uniqueAppointments = Array.from(groupedByBusinessAndEmployee.values());

        // Cargar todas las reviews previas del usuario para filtrar duplicados
        const { data: allPreviousReviews } = await supabase
          .from('reviews')
          .select('business_id, employee_id')
          .eq('client_id', userId);

        // Crear set de combinaciones (business_id, employee_id) ya calificadas
        const ratedCombinations = new Set<string>(
          (allPreviousReviews || []).map(r => `${r.business_id}|${r.employee_id || 'no-employee'}`)
        );

        // Filtrar: solo incluir citas donde NO existen ambas calificaciones (negocio y empleado)
        const reviewsNeedingRating = uniqueAppointments.filter(apt => {
          const employeeKey = apt.employee_id || 'no-employee';
          const key = `${apt.business_id}|${employeeKey}`;
          
          // Si la combinación ya está calificada, excluirla
          return !ratedCombinations.has(key);
        });

        const reviews: PendingReview[] = reviewsNeedingRating.map((appointment) => {
          const business = Array.isArray(appointment.business) 
            ? appointment.business[0] 
            : appointment.business;
          const service = Array.isArray(appointment.service)
            ? appointment.service[0]
            : appointment.service;
          const employee = Array.isArray(appointment.employee)
            ? appointment.employee[0]
            : appointment.employee;

          return {
            appointment_id: appointment.id,
            business_id: appointment.business_id,
            business_name: business?.name || 'Negocio',
            service_name: service?.name || 'Servicio',
            completed_at: appointment.completed_at,
            employee_id: appointment.employee_id,
            employee_name: employee?.full_name,
            // DEBUG fields
            status: appointment.status,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            payment_status: appointment.payment_status,
          };
        });

        setPendingReviews(reviews);

        // Si no hay reviews pendientes, simplemente no mostramos el modal (sin toast ni close)
        // El modal ya no debería estar abierto si llegamos aquí con 0 reviews
      } catch (err) {
        const error = err as Error;
        toast.error('Error al cargar reviews pendientes', {
          description: error.message,
        });
      } finally {
        setFetchingReviews(false);
      }
    };

    fetchPendingReviews();
  }, [isOpen, userId, onClose]);

  // Load previous ratings when review changes
  useEffect(() => {
    const loadPreviousRatings = async () => {
      if (!currentReview) return;

      try {
        // Load previous business rating
        const { data: businessReview } = await supabase
          .from('reviews')
          .select('rating, comment, created_at')
          .eq('business_id', currentReview.business_id)
          .eq('client_id', userId)
          .is('employee_id', null) // Solo reviews de negocio
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (businessReview) {
          setPreviousBusinessRating({
            rating: businessReview.rating,
            comment: businessReview.comment || undefined,
            created_at: businessReview.created_at,
          });
          setBusinessRating(businessReview.rating); // Pre-cargar la calificación
        } else {
          setPreviousBusinessRating(null);
          setBusinessRating(0);
        }

        // Load previous employee rating (if employee exists)
        if (currentReview.employee_id) {
          const { data: employeeReview } = await supabase
            .from('reviews')
            .select('rating, comment, created_at')
            .eq('business_id', currentReview.business_id)
            .eq('employee_id', currentReview.employee_id)
            .eq('client_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (employeeReview) {
            setPreviousEmployeeRating({
              rating: employeeReview.rating,
              comment: employeeReview.comment || undefined,
              created_at: employeeReview.created_at,
            });
            setEmployeeRating(employeeReview.rating); // Pre-cargar la calificación
          } else {
            setPreviousEmployeeRating(null);
            setEmployeeRating(0);
          }
        } else {
          setPreviousEmployeeRating(null);
          setEmployeeRating(0);
        }
      } catch (err) {
        console.error('Error loading previous ratings:', err);
      }
    };

    loadPreviousRatings();
  }, [currentReviewIndex, currentReview, userId]);

  // Reset form when review changes
  useEffect(() => {
    // Don't reset ratings - they're loaded from previous ratings
    setBusinessHoverRating(0);
    setEmployeeHoverRating(0);
    setComment('');
    setRecommend(null);
    setValidationError(null);
  }, [currentReviewIndex]);

  const handleSubmitReview = async () => {
    try {
      setLoading(true);
      setValidationError(null);

      // Validations
      const needsBusinessRating = !previousBusinessRating;
      const needsEmployeeRating = currentReview.employee_id && !previousEmployeeRating;

      if (needsBusinessRating && businessRating === 0) {
        setValidationError('Debes calificar el negocio');
        return;
      }

      if (needsEmployeeRating && employeeRating === 0) {
        setValidationError('Debes calificar al profesional');
        return;
      }

      if (recommend === null) {
        setValidationError('Debes indicar si recomendarías este negocio');
        return;
      }

      // Create business review (solo si no existe preview o si cambió la calificación)
      if (!previousBusinessRating || businessRating !== previousBusinessRating?.rating) {
        const { error: businessError } = await supabase
          .from('reviews')
          .insert({
            business_id: currentReview.business_id,
            appointment_id: currentReview.appointment_id, // ⭐ FIX BUG-019: appointment_id es REQUIRED
            client_id: userId,
            rating: businessRating,
            comment: comment.trim() || null,
            is_visible: true,
            is_verified: true,
            review_type: 'business', // ⭐ FIX BUG-020: Especificar tipo de review
          });

        if (businessError) throw businessError;
      }

      // Create employee review (solo si hay empleado y no existe previa o cambió)
      if (currentReview.employee_id) {
        if (!previousEmployeeRating || employeeRating !== previousEmployeeRating?.rating) {
          const { error: employeeError } = await supabase
            .from('reviews')
            .insert({
              business_id: currentReview.business_id,
              appointment_id: currentReview.appointment_id, // appointment_id siempre requerido
              client_id: userId,
              employee_id: currentReview.employee_id,
              rating: employeeRating,
              comment: comment.trim() || null,
              is_visible: true,
              is_verified: true,
              review_type: 'employee', // ⭐ FIX BUG-020: Review de empleado
            });

          if (employeeError) throw employeeError;
        }
      }

      toast.success('Review enviada exitosamente');

      // Move to next review or close
      if (hasMoreReviews) {
        setCurrentReviewIndex((prev) => prev + 1);
      } else {
        // All reviews completed
        onReviewSubmitted?.();
        onClose();
        toast.success('¡Todas las reviews completadas!', {
          description: 'Gracias por tu feedback',
        });
      }
    } catch (err) {
      const error = err as Error;
      toast.error('Error al enviar review', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipReview = () => {
    if (hasMoreReviews) {
      setCurrentReviewIndex((prev) => prev + 1);
      toast.info('Review omitida, puedes dejarla después');
    } else {
      onClose();
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (fetchingReviews) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentReview) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} hideClose={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Review Obligatoria
          </DialogTitle>
          <DialogDescription>
            {pendingReviews.length > 1 ? (
              <span>
                Review {currentReviewIndex + 1} de {pendingReviews.length}
              </span>
            ) : (
              <span>Completa tu review para continuar</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Review Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{currentReview.business_name}</h3>
              <span className="text-sm text-muted-foreground">
                {formatDate(currentReview.completed_at)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{currentReview.service_name}</p>
            {currentReview.employee_name && (
              <p className="text-sm text-muted-foreground">
                Atendido por: {currentReview.employee_name}
              </p>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Business Rating */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Calificación para el negocio {!previousBusinessRating && '*'}</Label>
              {previousBusinessRating && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Calificado anteriormente
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setBusinessRating(star)}
                  onMouseEnter={() => setBusinessHoverRating(star)}
                  onMouseLeave={() => setBusinessHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={loading || !!previousBusinessRating}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (businessHoverRating || businessRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {businessRating > 0 && (
              <p className="text-sm text-muted-foreground">
                {businessRating === 1 && 'Muy insatisfecho'}
                {businessRating === 2 && 'Insatisfecho'}
                {businessRating === 3 && 'Neutral'}
                {businessRating === 4 && 'Satisfecho'}
                {businessRating === 5 && 'Muy satisfecho'}
              </p>
            )}
          </div>

          {/* Employee Rating (si hay empleado) */}
          {currentReview.employee_name && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>
                  Calificación para {currentReview.employee_name} {!previousEmployeeRating && '*'}
                </Label>
                {previousEmployeeRating && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Calificado anteriormente
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEmployeeRating(star)}
                    onMouseEnter={() => setEmployeeHoverRating(star)}
                    onMouseLeave={() => setEmployeeHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    disabled={loading || !!previousEmployeeRating}
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        star <= (employeeHoverRating || employeeRating)
                          ? 'fill-blue-400 text-blue-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {employeeRating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {employeeRating === 1 && 'Muy insatisfecho'}
                  {employeeRating === 2 && 'Insatisfecho'}
                  {employeeRating === 3 && 'Neutral'}
                  {employeeRating === 4 && 'Satisfecho'}
                  {employeeRating === 5 && 'Muy satisfecho'}
                </p>
              )}
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              Comentario <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia con este negocio... (opcional)"
              className="min-h-[120px] resize-y"
              disabled={loading}
            />
          </div>

          {/* Recommendation */}
          <div className="space-y-2">
            <Label>¿Recomendarías este negocio? *</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={recommend === true ? 'default' : 'outline'}
                onClick={() => setRecommend(true)}
                disabled={loading}
                className="flex-1 flex items-center gap-2"
              >
                <ThumbsUp size={18} weight="fill" /> Sí, lo recomiendo
              </Button>
              <Button
                type="button"
                variant={recommend === false ? 'destructive' : 'outline'}
                onClick={() => setRecommend(false)}
                disabled={loading}
                className="flex-1 flex items-center gap-2"
              >
                <ThumbsDown size={18} weight="fill" /> No lo recomiendo
              </Button>
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Tu review será publicada de forma anónima. El negocio no verá tu nombre.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onClose();
                // Callback para indicar "recordar luego"
                if (onReviewSubmitted) {
                  onReviewSubmitted();
                }
              }}
              disabled={loading}
              className="text-muted-foreground"
            >
              Recordar luego (5 min)
            </Button>
            <div className="flex gap-2">
              {!isLastReview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipReview}
                  disabled={loading}
                >
                  Omitir esta
                </Button>
              )}
              <Button onClick={handleSubmitReview} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    {hasMoreReviews ? 'Siguiente Review' : 'Enviar y Finalizar'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
