import React, { useState } from 'react'
import { Eye, EyeOff, MessageSquare, Star, ThumbsUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Review } from '@/types/types'

interface ReviewCardProps {
  review: Review
  canRespond?: boolean // Admin/owner can respond
  canModerate?: boolean // Admin/owner can delete/hide
  onRespond?: (reviewId: string, response: string) => Promise<void>
  onToggleVisibility?: (reviewId: string, isVisible: boolean) => Promise<void>
  onDelete?: (reviewId: string) => Promise<void>
  onHelpful?: (reviewId: string) => Promise<void>
}

export function ReviewCard({
  review,
  canRespond = false,
  canModerate = false,
  onRespond,
  onToggleVisibility,
  onDelete,
  onHelpful,
}: ReviewCardProps) {
  const { t, language } = useLanguage()

  const formatDate = (date: Date, style: 'short' | 'long' = 'short') => {
    return new Intl.DateTimeFormat(language === 'es' ? 'es-MX' : 'en-US', {
      dateStyle: style === 'short' ? 'short' : 'medium',
    }).format(date)
  }
  const [isResponding, setIsResponding] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !onRespond) return

    setIsSubmitting(true)
    try {
      await onRespond(review.id, responseText.trim())
      setResponseText('')
      setIsResponding(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            aria-hidden="true"
            className={cn(
              'h-4 w-4',
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className={cn('p-4 space-y-3', !review.is_visible && 'opacity-60 bg-gray-50')}>
      {/* Header: Cliente, Rating, Fecha */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {review.client_name?.[0]?.toUpperCase() || 'C'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{review.client_name || t('reviews.anonymous')}</h4>
              {review.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  {t('reviews.verified')}
                </Badge>
              )}
              {!review.is_visible && (
                <Badge variant="outline" className="text-xs">
                  {t('reviews.hidden')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {renderStars(review.rating)}
              <span>•</span>
              <span>{formatDate(new Date(review.created_at), 'long')}</span>
            </div>
          </div>
        </div>

        {/* Actions for moderators */}
        {canModerate && (
          <div className="flex items-center gap-1">
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(review.id, !review.is_visible)}
                title={review.is_visible ? t('reviews.hide') : t('reviews.show')}
                aria-label={review.is_visible ? t('reviews.hide') : t('reviews.show')}
                className="min-h-[44px] min-w-[44px]"
              >
                {review.is_visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(t('reviews.confirmDelete'))) {
                    onDelete(review.id)
                  }
                }}
                title={t('reviews.delete')}
                aria-label={t('reviews.delete')}
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Employee info (if available) */}
      {review.employee_name && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('reviews.employeeLabel')}:</span>
          <span className="font-medium text-foreground">{review.employee_name}</span>
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
      )}

      {/* Business Response */}
      {review.response && (
        <div className="pl-4 border-l-2 border-primary/20 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">{t('reviews.businessResponse')}</span>
            {review.response_at && (
              <span className="text-muted-foreground">
                • {formatDate(new Date(review.response_at), 'short')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.response}</p>
        </div>
      )}

      {/* Response Form */}
      {isResponding && canRespond && !review.response && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
          <Textarea
            placeholder={t('reviews.responsePlaceholder')}
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            rows={3}
            className="text-sm"
            aria-label={t('reviews.responsePlaceholder')}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitResponse}
              disabled={!responseText.trim() || isSubmitting}
              className="min-h-[44px] min-w-[44px]"
              aria-label={t('reviews.submitResponse')}
              title={t('reviews.submitResponse')}
            >
              {isSubmitting ? t('common.saving') : t('reviews.submitResponse')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsResponding(false)
                setResponseText('')
              }}
              disabled={isSubmitting}
              className="min-h-[44px] min-w-[44px]"
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Footer: Helpful count & Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-4">
          {onHelpful && (
            <button
              onClick={() => onHelpful(review.id)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px] min-w-[44px]"
              aria-label={t('reviews.helpful')}
              title={t('reviews.helpful')}
            >
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              <span>
                {t('reviews.helpful')} ({review.helpful_count || 0})
              </span>
            </button>
          )}
        </div>

        {canRespond && !review.response && !isResponding && (
          <Button variant="outline" size="sm" onClick={() => setIsResponding(true)} className="min-h-[44px] min-w-[44px]" aria-label={t('reviews.respond')} title={t('reviews.respond')}>
            <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('reviews.respond')}
          </Button>
        )}
      </div>
    </Card>
  )
}