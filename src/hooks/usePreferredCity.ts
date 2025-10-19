import { useState, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'preferred-city';
const DEFAULT_REGION_ID = '7f9b5c84-93ab-44e7-b07d-4f6e7d4c6e4b'; // Bogotá D.C.
const DEFAULT_CITY_ID = null; // Bogotá D.C. no necesita ciudad

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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
      if (stored) {
        const data: PreferredCityData = JSON.parse(stored);
        setPreferredRegionId(data.regionId);
        setPreferredRegionName(data.regionName);
        setPreferredCityId(data.cityId);
        setPreferredCityName(data.cityName);
      } else {
        // Set default to Bogotá D.C.
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
  }, []);

  const setPreferredCity = (regionId: string, regionName: string, cityId: string | null, cityName: string | null) => {
    try {
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
