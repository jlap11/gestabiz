import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface PendingReview {
  appointment_id: string
  business_id: string
  business_name: string
  service_name: string
  completed_at: string
  employee_name?: string
}

interface MandatoryReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onReviewSubmitted?: () => void
  userId: string
}

export const MandatoryReviewModal: React.FC<MandatoryReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewSubmitted,
  userId,
}) => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [fetchingReviews, setFetchingReviews] = useState(true)

  // Fetch pending reviews on mount
  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (!isOpen || !userId) return

      try {
        setFetchingReviews(true)

        // Fetch appointments that need reviews
        const { data, error } = await supabase
          .from('appointments')
          .select(
            `
            id,
            business_id,
            service_id,
            employee_id,
            completed_at,
            business:businesses!inner(name),
            service:services(name),
            employee:profiles(full_name)
          `
          )
          .eq('client_id', userId)
          .eq('status', 'completed')
          .is('review_id', null)
          .order('completed_at', { ascending: false })
          .limit(10)

        if (error) throw error

        const reviews: PendingReview[] = (data || []).map(appointment => {
          const business = Array.isArray(appointment.business)
            ? appointment.business[0]
            : appointment.business
          const service = Array.isArray(appointment.service)
            ? appointment.service[0]
            : appointment.service
          const employee = Array.isArray(appointment.employee)
            ? appointment.employee[0]
            : appointment.employee

          return {
            appointment_id: appointment.id,
            business_id: appointment.business_id,
            business_name: business?.name || 'Negocio',
            service_name: service?.name || 'Servicio',
            completed_at: appointment.completed_at,
            employee_name: employee?.full_name,
          }
        })

        setPendingReviews(reviews)

        if (reviews.length === 0) {
          // No pending reviews, close modal
          onClose()
          toast.info('No tienes citas pendientes de review')
        }
      } catch (err) {
        const error = err as Error
        toast.error('Error al cargar reviews pendientes', {
          description: error.message,
        })
      } finally {
        setFetchingReviews(false)
      }
    }

    fetchPendingReviews()
  }, [isOpen, userId, onClose])

  // Reset form when review changes
  useEffect(() => {
    setRating(0)
    setHoverRating(0)
    setComment('')
    setRecommend(null)
    setValidationError(null)
  }, [currentReviewIndex])

  const currentReview = pendingReviews[currentReviewIndex]
  const hasMoreReviews = currentReviewIndex < pendingReviews.length - 1
  const isLastReview = currentReviewIndex === pendingReviews.length - 1

  const handleSubmitReview = async () => {
    try {
      setLoading(true)
      setValidationError(null)

      // Validations
      if (rating === 0) {
        setValidationError('Debes seleccionar una calificación')
        return
      }

      if (comment.trim().length < 50) {
        setValidationError('El comentario debe tener al menos 50 caracteres')
        return
      }

      if (recommend === null) {
        setValidationError('Debes indicar si recomendarías este negocio')
        return
      }

      // Create review
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          business_id: currentReview.business_id,
          user_id: userId,
          rating,
          comment: comment.trim(),
          review_type: 'business',
          is_visible: true,
        })
        .select()
        .single()

      if (reviewError) throw reviewError

      // Update appointment with review_id
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ review_id: reviewData.id })
        .eq('id', currentReview.appointment_id)

      if (updateError) throw updateError

      toast.success('Review enviada exitosamente')

      // Move to next review or close
      if (hasMoreReviews) {
        setCurrentReviewIndex(prev => prev + 1)
      } else {
        // All reviews completed
        onReviewSubmitted?.()
        onClose()
        toast.success('¡Todas las reviews completadas!', {
          description: 'Gracias por tu feedback',
        })
      }
    } catch (err) {
      const error = err as Error
      toast.error('Error al enviar review', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSkipReview = () => {
    if (hasMoreReviews) {
      setCurrentReviewIndex(prev => prev + 1)
      toast.info('Review omitida, puedes dejarla después')
    } else {
      onClose()
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (fetchingReviews) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!currentReview) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-2xl" onInteractOutside={e => e.preventDefault()}>
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

        <div className="space-y-6 py-4">
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

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Calificación *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={loading}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Muy insatisfecho'}
                {rating === 2 && 'Insatisfecho'}
                {rating === 3 && 'Neutral'}
                {rating === 4 && 'Satisfecho'}
                {rating === 5 && 'Muy satisfecho'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              Comentario *{' '}
              <span className="text-xs text-muted-foreground">(mínimo 50 caracteres)</span>
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia con este negocio..."
              className="min-h-[120px] resize-y"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">{comment.length} / 50 caracteres</p>
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
                className="flex-1"
              >
                👍 Sí, lo recomiendo
              </Button>
              <Button
                type="button"
                variant={recommend === false ? 'destructive' : 'outline'}
                onClick={() => setRecommend(false)}
                disabled={loading}
                className="flex-1"
              >
                👎 No lo recomiendo
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
                onClose()
                // Callback para indicar "recordar luego"
                if (onReviewSubmitted) {
                  onReviewSubmitted()
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
                  <>{hasMoreReviews ? 'Siguiente Review' : 'Enviar y Finalizar'}</>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
