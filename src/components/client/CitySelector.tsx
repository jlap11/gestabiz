import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useRegions, useCities } from '@/hooks/useCatalogs';
import { useLanguage } from '@/contexts/LanguageContext';
import { BOGOTA_REGION_ID, BOGOTA_CITY_ID, BOGOTA_CITY_NAME } from '@/constants';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Region {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  region_id: string;
}

interface CitySelectorProps {
  preferredRegionId: string | null;
  preferredRegionName: string | null;
  preferredCityId: string | null;
  preferredCityName: string | null;
  onCitySelect: (regionId: string, regionName: string, cityId: string | null, cityName: string | null) => void;
}

const COLOMBIA_ID = '01b4e9d1-a84e-41c9-8768-253209225a21';
// BOGOTA_REGION_ID provided by '@/constants'

export function CitySelector({
  preferredRegionId,
  preferredRegionName,
  preferredCityId,
  preferredCityName,
  onCitySelect
}: CitySelectorProps) {
  const { t } = useLanguage();
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [regionsLocal, setRegionsLocal] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(preferredRegionId);
  
  const regionMenuRef = useRef<HTMLDivElement>(null);
  const cityMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedRegion(preferredRegionId);
  }, [preferredRegionId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionMenuRef.current && !regionMenuRef.current.contains(event.target as Node)) {
        setRegionMenuOpen(false);
      }
      if (cityMenuRef.current && !cityMenuRef.current.contains(event.target as Node)) {
        setCityMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const { regions, loading: regionsLoading } = useRegions(COLOMBIA_ID);
  const { cities: hookCities, loading: citiesLoading } = useCities(selectedRegion || undefined);

  useEffect(() => {
    setRegionsLocal(regions);
  }, [regions]);

  const reloadRegions = () => {
    fetchRegionsFallback();
  };

  const fetchRegionsFallback = async () => {
    try {
      setRegionsLocal([]);
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, country_id')
        .eq('country_id', COLOMBIA_ID)
        .order('name');

      if (error) return;
      setRegionsLocal(data || []);
    } catch {
      // silent
    }
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region.id);
    // Opción 2: si la región es Bogotá D.C., seleccionar Bogotá en segundo plano
    if (region.id === BOGOTA_REGION_ID) {
      onCitySelect(region.id, region.name, BOGOTA_CITY_ID, BOGOTA_CITY_NAME);
    } else {
      onCitySelect(region.id, region.name, null, null);
    }
    setRegionMenuOpen(false);
    setCityMenuOpen(false);
  };

  const handleCitySelect = (city: City) => {
    const region = regionsLocal.find(r => r.id === selectedRegion);
    if (region) {
      onCitySelect(region.id, region.name, city.id, city.name);
      setCityMenuOpen(false);
    }
  };

  // Ocultar selector de ciudades si la región seleccionada es Bogotá D.C.
  // (verifica tanto el id como el nombre por resiliencia ante valores temporales)
  const isBogota = selectedRegion === BOGOTA_REGION_ID || preferredRegionName === 'Bogotá D.C.';
  const showCitySelector = !isBogota && !!selectedRegion && !!hookCities && hookCities.length > 0;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 text-sm">
      <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      
      <div className="inline-flex items-center gap-2">
        <div className="relative inline-block" ref={regionMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRegionMenuOpen(!regionMenuOpen);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <span className="truncate max-w-[120px] sm:max-w-[150px]">
              {preferredRegionName || t('citySelector.selectRegion')}
            </span>
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          </button>

          {regionMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
              {regionsLocal.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {regionsLoading ? t('citySelector.loading') : t('citySelector.noRegions')}
                  <button onClick={reloadRegions} className="ml-2 underline text-primary text-xs">
                    {t('citySelector.retry')}
                  </button>
                </div>
              ) : (
                regionsLocal.map((region) => (
                  <button
                    key={region.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegionSelect(region);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                      selectedRegion === region.id && "bg-primary/20 text-foreground font-semibold"
                    )}
                  >
                    {region.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {showCitySelector && (
          <>
            <span className="text-muted-foreground">/</span>
            <div className="relative inline-block" ref={cityMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCityMenuOpen(!cityMenuOpen);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <span className="truncate max-w-[120px] sm:max-w-[150px]">
                  {preferredCityName || t('citySelector.allCities')}
                </span>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </button>

              {cityMenuOpen && (
                <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const region = regionsLocal.find(r => r.id === selectedRegion);
                      if (region) {
                        onCitySelect(region.id, region.name, null, null);
                      }
                      setCityMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    {t('citySelector.allCities')}
                  </button>
                  {citiesLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {t('citySelector.loadingCities')}
                    </div>
                  ) : (
                    hookCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCitySelect(city);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                          preferredCityId === city.id && "bg-primary/20 text-foreground font-semibold"
                        )}
                      >
                        {city.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// Moved Bogotá constants to '@/constants' to avoid redeclarations
