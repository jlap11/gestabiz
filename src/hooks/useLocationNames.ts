/**
 * Hook personalizado para obtener nombres de regiones y ciudades
 * con caché en memoria para optimizar rendimiento
 */
import { useState, useEffect } from 'react';
import { getRegionName, getCityName } from './useCatalogs';

// Cache en memoria para nombres
const nameCache: {
  regions: Record<string, string>;
  cities: Record<string, string>;
} = {
  regions: {},
  cities: {}
};

export function useLocationNames(regionId?: string, cityId?: string) {
  const [regionName, setRegionName] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      if (!regionId && !cityId) {
        setRegionName(null);
        setCityName(null);
        return;
      }

      setLoading(true);

      try {
        // Obtener nombre de región
        if (regionId) {
          if (nameCache.regions[regionId]) {
            setRegionName(nameCache.regions[regionId]);
          } else {
            const name = await getRegionName(regionId);
            if (name) {
              nameCache.regions[regionId] = name;
              setRegionName(name);
            }
          }
        } else {
          setRegionName(null);
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

  return { regionName, cityName, loading };
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