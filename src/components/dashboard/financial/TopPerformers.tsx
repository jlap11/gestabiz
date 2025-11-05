import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Calendar, Award, Medal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import supabase from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface TopPerformersProps {
  businessId: string;
  locationId?: string;
}

interface PerformerData {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  total_appointments: number;
  completed_appointments: number;
  total_revenue: number;
  average_rating: number;
  review_count: number;
  completion_rate: number;
  average_ticket: number;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

export function TopPerformers({
  businessId,
  locationId,
}: Readonly<TopPerformersProps>) {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<Period>('month');
  const [performers, setPerformers] = useState<PerformerData[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  useEffect(() => {
    const fetchTopPerformers = async () => {
      setLoading(true);
      try {
        const { start, end } = getDateRange();

        // Fetch all employees for the business
        let employeeQuery = supabase
          .from('business_employees')
          .select('employee_id, profiles(id, full_name, avatar_url, email)')
          .eq('business_id', businessId);

        if (locationId) {
          employeeQuery = employeeQuery.eq('location_id', locationId);
        }

        const { data: employees, error: empError } = await employeeQuery as {
          data: Array<{
            employee_id: string;
            profiles: {
              id: string;
              full_name: string;
              avatar_url?: string;
              email: string;
            };
          }> | null;
          error: any;
        };
        if (empError) throw empError;

        if (!employees || employees.length === 0) {
          setPerformers([]);
          setLoading(false);
          return;
        }

        const employeeIds = employees.map(e => e.employee_id);

        // Fetch appointments for these employees
        const { data: appointments, error: appError } = await supabase
          .from('appointments')
          .select('employee_id, status, service:services(price)')
          .eq('business_id', businessId)
          .in('employee_id', employeeIds)
          .gte('start_time', start)
          .lte('start_time', end);

        if (appError) throw appError;

        // Fetch reviews for these employees
        const { data: reviews, error: revError } = await supabase
          .from('reviews')
          .select('employee_id, rating')
          .eq('business_id', businessId)
          .in('employee_id', employeeIds)
          .gte('created_at', start)
          .lte('created_at', end);

        if (revError) throw revError;

        // Calculate metrics for each employee
        // eslint-disable-next-line sonarjs/cognitive-complexity
        const performersData: PerformerData[] = employees.map(emp => {
          const profile = emp.profiles;
          
          const empAppointments = appointments?.filter(a => a.employee_id === emp.employee_id) || [];
          const completedAppointments = empAppointments.filter(a => a.status === 'completed');
          const empReviews = reviews?.filter(r => r.employee_id === emp.employee_id) || [];
          
          // Calculate revenue
          let totalRevenue = 0;
          for (const appt of completedAppointments) {
            const service = appt.service;
            const price = Array.isArray(service) ? service[0]?.price : service?.price;
            totalRevenue += price || 0;
          }
          
          // Calculate average rating
          let averageRating = 0;
          if (empReviews && empReviews.length > 0) {
            const sumRatings = empReviews.reduce((sum, r) => sum + r.rating, 0);
            averageRating = sumRatings / empReviews.length;
          }

          const completionRate = empAppointments.length > 0
            ? (completedAppointments.length / empAppointments.length) * 100
            : 0;

          const averageTicket = completedAppointments.length > 0
            ? totalRevenue / completedAppointments.length
            : 0;

          return {
            id: emp.employee_id,
            full_name: profile.full_name || 'Unknown',
            avatar_url: profile.avatar_url,
            email: profile.email || '',
            total_appointments: empAppointments.length,
            completed_appointments: completedAppointments.length,
            total_revenue: totalRevenue,
            average_rating: averageRating,
            review_count: empReviews.length,
            completion_rate: completionRate,
            average_ticket: averageTicket,
          };
        });

        // Sort by total revenue (descending) and take top 10
        const sortedPerformers = [...performersData];
        sortedPerformers.sort((a, b) => b.total_revenue - a.total_revenue);
        const topTen = sortedPerformers.slice(0, 10);

        setPerformers(topTen);
      } catch {
        setPerformers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, locationId, period]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 2:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getRankBadgeClass = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 border-yellow-300';
      case 1:
        return 'bg-gray-100 border-gray-300';
      case 2:
        return 'bg-orange-100 border-orange-300';
      default:
        return 'bg-muted border-muted-foreground/20';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{t('financial.topPerformers')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('financial.topPerformersDescription')}
            </p>
          </div>
        </div>

        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('financial.lastWeek')}</SelectItem>
            <SelectItem value="month">{t('financial.lastMonth')}</SelectItem>
            <SelectItem value="quarter">{t('financial.lastQuarter')}</SelectItem>
            <SelectItem value="year">{t('financial.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((skeletonId) => (
            <div key={`skeleton-${skeletonId}`} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}
      
      {!loading && performers.length === 0 && (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('financial.noPerformersData')}</p>
          </div>
        </div>
      )}
      
      {!loading && performers.length > 0 && (
        <div className="space-y-3">
          {performers.map((performer, index) => (
            <div
              key={performer.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md',
                getRankBadgeClass(index)
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-10 h-10">
                {getRankIcon(index)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={performer.avatar_url || undefined} alt={performer.full_name} />
                  <AvatarFallback className="text-lg font-semibold text-primary">
                    {performer.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{performer.full_name}</h4>
                <p className="text-xs text-muted-foreground truncate">{performer.email}</p>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6">
                {/* Revenue */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-sm font-bold">
                      {formatCurrency(performer.total_revenue)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('financial.revenue')}</p>
                </div>

                {/* Appointments */}
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {performer.completed_appointments}/{performer.total_appointments}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('financial.appointments')}</p>
                </div>

                {/* Rating */}
                {performer.review_count > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold">
                        {performer.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performer.review_count} {t('financial.reviews')}
                    </p>
                  </div>
                )}

                {/* Average Ticket */}
                {performer.average_ticket > 0 && (
                  <div className="text-right">
                    <span className="text-sm font-semibold">
                      {formatCurrency(performer.average_ticket)}
                    </span>
                    <p className="text-xs text-muted-foreground">{t('financial.avgTicket')}</p>
                  </div>
                )}

                {/* Completion Rate */}
                <div className="text-right">
                  <span className="text-sm font-semibold">
                    {performer.completion_rate.toFixed(0)}%
                  </span>
                  <p className="text-xs text-muted-foreground">{t('financial.completionRate')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
