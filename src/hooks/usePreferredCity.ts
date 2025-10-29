import { useState, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'preferred-city';
const BOGOTA_REGION_ID = 'fc6cc79b-dfd1-42c9-b35d-3d0df51c1c83';
const BOGOTA_CITY_ID = 'c5861b80-bd05-48a9-9e24-d8c93e0d1d6b';
const BOGOTA_CITY_NAME = 'Bogotá';
const DEFAULT_REGION_ID = BOGOTA_REGION_ID; // Bogotá D.C.
const DEFAULT_CITY_ID = null; // Opción 1: región sin ciudad explícita

interface PreferredCityData {
  regionId: string;
  regionName: string;
  cityId: string | null;
  cityName: string | null;
}

export function usePreferredCity() {
  const [preferredRegionId, setPreferredRegionId] = useState<string | null>(null);
  const [preferredRegionName, setPreferredRegionName] = useState<string | null>(null);
  const [preferredCityId, setPreferredCityId] = useState<string | null>(null);
  const [preferredCityName, setPreferredCityName] = useState<string | null>(null);

  // Load from localStorage on mount and listen for storage changes
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
        if (stored) {
          const data: PreferredCityData = JSON.parse(stored);
          setPreferredRegionId(data.regionId);
          setPreferredRegionName(data.regionName);
          setPreferredCityId(data.cityId);
          setPreferredCityName(data.cityName);
        } else {
        // Set default to Bogotá D.C. (sin ciudad explícita)
          setPreferredRegionId(DEFAULT_REGION_ID);
          setPreferredRegionName('Bogotá D.C.');
          setPreferredCityId(DEFAULT_CITY_ID);
          setPreferredCityName(null);
        }
      } catch {
        // Fallback to default on error
        setPreferredRegionId(DEFAULT_REGION_ID);
        setPreferredRegionName('Bogotá D.C.');
        setPreferredCityId(DEFAULT_CITY_ID);
        setPreferredCityName(null);
      }
    };

    // Load on mount
    loadFromStorage();

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_PREFIX) {
        loadFromStorage();
      }
    };

    // Also listen for custom storage events from same tab
    const handleCustomStorageChange = () => {
      loadFromStorage();
    };

    globalThis.window?.addEventListener('storage', handleStorageChange);
    globalThis.window?.addEventListener('preferred-city-changed', handleCustomStorageChange);

    return () => {
      globalThis.window?.removeEventListener('storage', handleStorageChange);
      globalThis.window?.removeEventListener('preferred-city-changed', handleCustomStorageChange);
    };
  }, []);

  const setPreferredCity = (regionId: string, regionName: string, cityId: string | null, cityName: string | null) => {
    try {
      // Opción 2: si región es Bogotá D.C. y no hay ciudad, seleccionar Bogotá en segundo plano
      if (regionId === BOGOTA_REGION_ID && !cityId) {
        cityId = BOGOTA_CITY_ID;
        cityName = BOGOTA_CITY_NAME;
      }
      const data: PreferredCityData = {
        regionId,
        regionName,
        cityId,
        cityName
      };
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(data));
      setPreferredRegionId(regionId);
      setPreferredRegionName(regionName);
      setPreferredCityId(cityId);
      setPreferredCityName(cityName);
      
      // Emit custom event to notify other components using this hook
      if (typeof globalThis !== 'undefined' && globalThis.window) {
        globalThis.window.dispatchEvent(new CustomEvent('preferred-city-changed'));
      }
    } catch {
      // Silent error - continue with operation
    }
  };

  return {
    preferredRegionId,
    preferredRegionName,
    preferredCityId,
    preferredCityName,
    setPreferredCity
  };
}
