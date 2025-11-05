/**
 * Hook personalizado para obtener nombres de regiones y ciudades
 * con caché en memoria para optimizar rendimiento
 */
import { useState, useEffect } from 'react';
import { getRegionName, getCityName } from './useCatalogs';
import { supabase } from '@/lib/supabase';

// Cache en memoria para nombres
const nameCache: {
  regions: Record<string, string>;
  cities: Record<string, string>;
  countries: Record<string, string>;
  countryByRegion: Record<string, string>; // regionId -> countryName
} = {
  regions: {},
  cities: {},
  countries: {},
  countryByRegion: {}
};

export function useLocationNames(regionId?: string, cityId?: string) {
  const [regionName, setRegionName] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      if (!regionId && !cityId) {
        setRegionName(null);
        setCityName(null);
        setCountryName(null);
        return;
      }

      setLoading(true);

      try {
        // Obtener nombre de región y país (derivado de la región)
        if (regionId) {
          if (nameCache.regions[regionId]) {
            setRegionName(nameCache.regions[regionId]);
          }

          // Intentar resolver nombre de país desde caché por región
          if (nameCache.countryByRegion[regionId]) {
            setCountryName(nameCache.countryByRegion[regionId]);
          }

          if (!nameCache.regions[regionId] || !nameCache.countryByRegion[regionId]) {
            // Consultar región para obtener name y country_id
            try {
              const { data: regionData } = await supabase
                .from('regions')
                .select('name, country_id')
                .eq('id', regionId)
                .single();

              const rName = regionData?.name || null;
              const countryId: string | null = regionData?.country_id || null;

              if (rName) {
                nameCache.regions[regionId] = rName;
                setRegionName(rName);
              } else {
                // Fallback: usar helper existente
                const fallbackName = await getRegionName(regionId);
                if (fallbackName) {
                  nameCache.regions[regionId] = fallbackName;
                  setRegionName(fallbackName);
                }
              }

              if (countryId) {
                if (nameCache.countries[countryId]) {
                  const cName = nameCache.countries[countryId];
                  nameCache.countryByRegion[regionId] = cName;
                  setCountryName(cName);
                } else {
                  const { data: countryData } = await supabase
                    .from('countries')
                    .select('name')
                    .eq('id', countryId)
                    .single();
                  const cName = countryData?.name || null;
                  if (cName) {
                    nameCache.countries[countryId] = cName;
                    nameCache.countryByRegion[regionId] = cName;
                    setCountryName(cName);
                  }
                }
              } else {
                setCountryName(null);
              }
            } catch (e) {
              // Si falla, al menos no romper la UI
              console.error('Error resolving region/country names:', e);
            }
          }
        } else {
          setRegionName(null);
          setCountryName(null);
        }

        // Obtener nombre de ciudad
        if (cityId) {
          if (nameCache.cities[cityId]) {
            setCityName(nameCache.cities[cityId]);
          } else {
            const name = await getCityName(cityId);
            if (name) {
              nameCache.cities[cityId] = name;
              setCityName(name);
            }
          }
        } else {
          setCityName(null);
        }
      } catch (error) {
        console.error('Error fetching location names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNames();
  }, [regionId, cityId]);

  return { regionName, cityName, countryName, loading };
}

// Hook para obtener solo nombre de región
export function useRegionName(regionId?: string) {
  const { regionName, loading } = useLocationNames(regionId);
  return { regionName, loading };
}

// Hook para obtener solo nombre de ciudad
export function useCityName(cityId?: string) {
  const { cityName, loading } = useLocationNames(undefined, cityId);
  return { cityName, loading };
}
