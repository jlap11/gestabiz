import React, { useState, useEffect } from 'react';
import { Star, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReviewCard } from './ReviewCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviews } from '@/hooks/useReviews';
import type { ReviewFilters } from '@/types/types';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';

interface ReviewListProps {
  businessId: string;
  employeeId?: string; // Filter by specific employee
  canModerate?: boolean; // Admin/owner can moderate
  canRespond?: boolean; // Admin/owner can respond
}

export function ReviewList({
  businessId,
  employeeId,
  canModerate = false,
  canRespond = false,
}: ReviewListProps) {
  const { t } = useLanguage();
  
  const [filters, setFilters] = useState<ReviewFilters>({
    business_id: businessId,
    employee_id: employeeId,
    rating: [],
  });

  const {
    reviews,
    stats,
    loading,
    respondToReview,
    toggleReviewVisibility,
    deleteReview,
    refetch,
  } = useReviews(filters);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('all');

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const handleRatingFilter = (value: string) => {
    setSelectedRating(value);
    if (value === 'all') {
      setFilters(prev => ({ ...prev, rating: [] }));
    } else {
      const ratingValue = parseInt(value) as 1 | 2 | 3 | 4 | 5;
      setFilters(prev => ({ ...prev, rating: [ratingValue] }));
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      review.comment?.toLowerCase().includes(search) ||
      review.client_name?.toLowerCase().includes(search) ||
      review.employee_name?.toLowerCase().includes(search)
    );
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats?.rating_distribution) return null;

    const total = Object.values(stats.rating_distribution).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution] || 0;
          const percentage = (count / total) * 100;
          return (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm w-12 flex items-center gap-1">
                {rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-16 text-right">
                {count} ({Math.round(percentage)}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      {stats && stats.total > 0 && (
        <Card className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('reviews.overallRating')}
              </h3>
              <div className="flex items-end gap-3">
                <div className="text-5xl font-bold">{stats.average_rating.toFixed(1)}</div>
                  <div className="pb-2">
                  {renderStars(Math.round(stats.average_rating))}
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('reviews.basedOn', { count: stats.total.toString() })}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t('reviews.ratingDistribution')}
              </h3>
              {renderRatingDistribution()}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('reviews.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Rating Filter */}
          <Select value={selectedRating} onValueChange={handleRatingFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('reviews.filterByRating')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reviews.allRatings')}</SelectItem>
              <SelectItem value="5">5 {t('reviews.stars')}</SelectItem>
              <SelectItem value="4">4 {t('reviews.stars')}</SelectItem>
              <SelectItem value="3">3 {t('reviews.stars')}</SelectItem>
              <SelectItem value="2">2 {t('reviews.stars')}</SelectItem>
              <SelectItem value="1">1 {t('reviews.star')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading && (
          <Card className="p-8 text-center text-muted-foreground">
            {t('common.loading')}...
          </Card>
        )}

        {!loading && filteredReviews.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            {searchTerm || selectedRating !== 'all'
              ? t('reviews.noResultsFound')
              : t('reviews.noReviews')}
          </Card>
        )}

        {!loading && filteredReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            canRespond={canRespond}
            canModerate={canModerate}
            onRespond={async (reviewId: string, response: string) => {
              // Get current user ID from Supabase auth
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Usuario no autenticado');
              await respondToReview(reviewId, response, user.id);
            }}
            onToggleVisibility={toggleReviewVisibility}
            onDelete={deleteReview}
          />
        ))}
      </div>

      {/* Load More (if implementing pagination) */}
      {filteredReviews.length > 0 && filteredReviews.length < stats.total && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" disabled={loading}>
            {t('common.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}
