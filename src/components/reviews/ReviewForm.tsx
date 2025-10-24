import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

interface ReviewFormProps {
  appointmentId: string
  businessId: string
  employeeId?: string
  onSubmit: (rating: number, comment: string) => Promise<void>
  onCancel?: () => void
}

export function ReviewForm({
  appointmentId,
  businessId,
  employeeId,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { t } = useLanguage()
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error(t('reviews.errors.ratingRequired'))
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(rating, comment.trim())
      toast.success(t('reviews.submitSuccess'))
      // Reset form
      setRating(0)
      setComment('')
    } catch {
      toast.error(t('reviews.errors.submitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => {
          const isActive = star <= (hoveredRating || rating)
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  isActive
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-200'
                )}
              />
            </button>
          )
        })}
      </div>
    )
  }

  const getRatingLabel = (rating: number): string => {
    const labels = {
      1: t('reviews.ratings.poor'),
      2: t('reviews.ratings.fair'),
      3: t('reviews.ratings.good'),
      4: t('reviews.ratings.veryGood'),
      5: t('reviews.ratings.excellent'),
    }
    return labels[rating as keyof typeof labels] || ''
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold">{t('reviews.leaveReview')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('reviews.reviewDescription')}</p>
        </div>

        {/* Rating Stars */}
        <div className="space-y-2">
          <Label>{t('reviews.rating')}</Label>
          <div className="flex items-center gap-4">
            {renderStars()}
            {(hoveredRating || rating) > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {getRatingLabel(hoveredRating || rating)}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">
            {t('reviews.comment')}{' '}
            <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
          </Label>
          <Textarea
            id="comment"
            placeholder={t('reviews.commentPlaceholder')}
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('reviews.shareExperience')}</span>
            <span>{comment.length}/1000</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={rating === 0 || isSubmitting} className="flex-1">
            {isSubmitting ? t('common.submitting') : t('reviews.submitReview')}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
