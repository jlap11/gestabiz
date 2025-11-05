/**
 * Componente para mostrar direcciones de ubicación con nombres en lugar de IDs
 */
import React from 'react';
import { useLocationNames } from '@/hooks/useLocationNames';

interface LocationAddressProps {
  address?: string;
  cityId?: string;
  stateId?: string;
  postalCode?: string;
  className?: string;
  showFullAddress?: boolean;
  showCountry?: boolean;
}

export function LocationAddress({
  address,
  cityId,
  stateId,
  postalCode,
  className = '',
  showFullAddress = true,
  showCountry = true
}: LocationAddressProps) {
  const { regionName, cityName, countryName, loading } = useLocationNames(stateId, cityId);

  if (loading) {
    return <span className={`text-muted-foreground ${className}`}>Cargando...</span>;
  }

  const parts = [];
  
  if (showFullAddress && address) {
    parts.push(address);
  }
  
  if (cityName) {
    parts.push(cityName);
  }
  
  if (regionName) {
    parts.push(regionName);
  }
  
  if (postalCode) {
    parts.push(postalCode);
  }

  if (showCountry && countryName) {
    parts.push(countryName);
  }

  const fullAddress = parts.join(', ');

  return (
    <span className={className}>
      {fullAddress || 'Dirección no disponible'}
    </span>
  );
}
