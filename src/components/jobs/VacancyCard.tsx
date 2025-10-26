import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Users, 
  Clock,
  Home,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { JobVacancy } from '@/hooks/useJobVacancies';
import type { MatchingVacancy } from '@/hooks/useMatchingVacancies';

// Union type que acepta ambos formatos
type VacancyWithExtras = (JobVacancy | MatchingVacancy) & {
  match_score?: number;
  business_name?: string;
  experience_level?: 'junior' | 'mid' | 'senior';
};

interface VacancyCardProps {
  vacancy: VacancyWithExtras;
  onApply: (vacancyId: string) => void;
  onViewDetails: (vacancyId: string) => void;
  showMatchScore?: boolean;
}

export const VacancyCard: React.FC<VacancyCardProps> = ({
  vacancy,
  onApply,
  onViewDetails,
  showMatchScore = true,
}) => {
  const {
    id,
    title,
    business_name,
    location_city,
    position_type,
    experience_level,
    salary_min,
    salary_max,
    number_of_positions,
    applications_count,
    published_at,
    benefits,
    match_score,
  } = vacancy;

  // Compatibilidad con ambos formatos de remote
  const isRemote = 'is_remote' in vacancy ? vacancy.is_remote : vacancy.remote_allowed;

  // Calcular disponibilidad de posiciones
  const positionsAvailable = number_of_positions - (applications_count || 0);
  const isFullyBooked = positionsAvailable <= 0;

  // Determinar color del match score
  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Formatear salario
  const formatSalary = (min?: number, max?: number): string => {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    if (min) {
      return `Desde ${formatter.format(min)}`;
    }
    return 'Salario a convenir';
  };

  // Formatear tiempo transcurrido
  const timeAgo = published_at
    ? formatDistanceToNow(new Date(published_at), { addSuffix: true, locale: es })
    : '';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{business_name}</p>
          </div>
          
          {/* Match Score Badge */}
          {showMatchScore && match_score !== undefined && (
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={getMatchScoreColor(match_score)}>
                <Star className="w-3 h-3 mr-1 fill-current" />
                {match_score}%
              </Badge>
              <Progress value={match_score} className="w-20 h-2" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Ubicación */}
        <div className="flex items-center gap-2 text-sm">
          {isRemote ? (
            <>
              <Home className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Remoto</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{location_city || 'No especificado'}</span>
            </>
          )}
        </div>

        {/* Tipo de posición y experiencia */}
        <div className="flex flex-wrap gap-2">
          {position_type && (
            <Badge variant="secondary">
              <Briefcase className="w-3 h-3 mr-1" />
              {position_type === 'full_time' && 'Tiempo Completo'}
              {position_type === 'part_time' && 'Medio Tiempo'}
              {position_type === 'contract' && 'Contrato'}
              {position_type === 'temporary' && 'Temporal'}
            </Badge>
          )}
          {experience_level && (
            <Badge variant="outline">
              {experience_level === 'junior' && 'Junior'}
              {experience_level === 'mid' && 'Intermedio'}
              {experience_level === 'senior' && 'Senior'}
            </Badge>
          )}
        </div>

        {/* Salario */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{formatSalary(salary_min, salary_max)}</span>
        </div>

        {/* Posiciones disponibles */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className={isFullyBooked ? 'text-red-600' : 'text-muted-foreground'}>
            {isFullyBooked
              ? 'Sin vacantes disponibles'
              : `${positionsAvailable} ${positionsAvailable === 1 ? 'vacante' : 'vacantes'}`}
          </span>
        </div>

        {/* Beneficios (mostrar máximo 3) */}
        {benefits && benefits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {benefits.slice(0, 3).map((benefit, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {benefit}
              </Badge>
            ))}
            {benefits.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{benefits.length - 3} más
              </Badge>
            )}
          </div>
        )}

        {/* Tiempo transcurrido */}
        {timeAgo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onViewDetails(id)}
        >
          Ver Detalles
        </Button>
        <Button
          className="flex-1"
          onClick={() => onApply(id)}
          disabled={isFullyBooked}
        >
          {isFullyBooked ? 'Completo' : 'Aplicar'}
        </Button>
      </CardFooter>
    </Card>
  );
};
