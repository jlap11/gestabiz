/**
 * Hooks personalizados para acceder a datos de catálogos
 * Incluye caché en memoria para optimizar queries repetidas
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface Country {
  id: string;
  name: string;
  code: string;
  phone_prefix: string;
}

export interface Region {
  id: string;
  name: string;
  country_id: string;
}

export interface City {
  id: string;
  name: string;
  region_id: string;
}

export interface Gender {
  id: string;
  name: string;
  abbreviation: string;
}

export interface DocumentType {
  id: string;
  name: string;
  abbreviation: string;
  country_id: string;
  is_for_company?: boolean; // NIT es solo para empresas
}

export interface HealthInsurance {
  id: string;
  name: string;
  abbreviation: string;
}

// =====================================================
// CACHE EN MEMORIA
// =====================================================

const catalogCache: {
  countries?: Country[];
  regions?: Region[];
  cities?: City[];
  genders?: Gender[];
  documentTypes?: DocumentType[];
  healthInsurance?: HealthInsurance[];
} = {};

// =====================================================
// HOOK: useCountries
// =====================================================

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      // Usar caché si existe
      if (catalogCache.countries) {
        setCountries(catalogCache.countries);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('countries')
          .select('id, name, code, phone_prefix')
          .order('name');

        if (fetchError) throw fetchError;

        catalogCache.countries = data || [];
        setCountries(data || []);
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar países');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
}

// =====================================================
// HOOK: useRegions
// =====================================================

export function useRegions(countryId?: string) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      // Si no hay countryId, limpiar regiones
      if (!countryId) {
        setRegions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('regions')
          .select('id, name, country_id')
          .eq('country_id', countryId)
          .order('name');

        if (fetchError) throw fetchError;

        setRegions(data || []);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar regiones');
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, [countryId]);

  return { regions, loading, error };
}

// =====================================================
// HOOK: useCities
// =====================================================

export function useCities(regionId?: string) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      // Si no hay regionId, limpiar ciudades
      if (!regionId) {
        setCities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('cities')
          .select('id, name, region_id')
          .eq('region_id', regionId)
          .order('name');

        if (fetchError) throw fetchError;

        setCities(data || []);
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar ciudades');
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [regionId]);

  return { cities, loading, error };
}

// =====================================================
// HOOK: useGenders
// =====================================================

export function useGenders() {
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenders = async () => {
      // Usar caché si existe
      if (catalogCache.genders) {
        setGenders(catalogCache.genders);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('genders')
          .select('id, name, abbreviation')
          .order('name');

        if (fetchError) throw fetchError;

        catalogCache.genders = data || [];
        setGenders(data || []);
      } catch (err) {
        console.error('Error fetching genders:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar géneros');
      } finally {
        setLoading(false);
      }
    };

    fetchGenders();
  }, []);

  return { genders, loading, error };
}

// =====================================================
// HOOK: useDocumentTypes
// =====================================================

export function useDocumentTypes(countryId?: string, forCompany?: boolean) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (!countryId) {
        // No country specified — as a fallback, load all document types
        try {
          setLoading(true);
          const { data, error: fetchError } = await supabase
            .from('document_types')
            .select('id, name, abbreviation, country_id')
            .order('name');

          if (fetchError) throw fetchError;

          setDocumentTypes(data || []);
        } catch (err) {
          console.error('Error fetching document types (fallback all):', err);
          setError(err instanceof Error ? err.message : 'Error al cargar tipos de documento');
        } finally {
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        // Try to fetch by provided countryId (may be UUID, country code or name)
        let data: DocumentType[] | null = null;
        let fetchError: any = null;

        // First attempt: treat countryId as country UUID
        try {
          const resp = await supabase
            .from('document_types')
            .select('id, name, abbreviation, country_id')
            .eq('country_id', countryId)
            .order('name');

          data = resp.data as DocumentType[] | null;
          fetchError = resp.error;
        } catch (e) {
          fetchError = e;
        }

        // If nothing found, try to resolve country by code or name and re-query
        if ((!data || data.length === 0) && !fetchError) {
          try {
            const countryResp = await supabase
              .from('countries')
              .select('id')
              .or(`code.eq.${countryId},name.ilike.%${countryId}%`)
              .limit(1)
              .maybeSingle();

            const countryRow = countryResp.data as { id: string } | null;
            const resolvedCountryId = countryRow?.id;

            if (resolvedCountryId) {
              const resp2 = await supabase
                .from('document_types')
                .select('id, name, abbreviation, country_id')
                .eq('country_id', resolvedCountryId)
                .order('name');

              data = resp2.data as DocumentType[] | null;
              fetchError = resp2.error;
            }
          } catch (e) {
            fetchError = e;
          }
        }

        // Final fallback: if still empty, load all document types (so dropdown stays enabled)
        if ((!data || data.length === 0) && !fetchError) {
          try {
            const respAll = await supabase
              .from('document_types')
              .select('id, name, abbreviation, country_id')
              .order('name');

            data = respAll.data as DocumentType[] | null;
            fetchError = respAll.error;
          } catch (e) {
            fetchError = e;
          }
        }

        if (fetchError) throw fetchError;

        // Filtrar según tipo de entidad
  let filteredData = (data || []) as DocumentType[];
        
        if (forCompany !== undefined) {
          // NIT es para empresas, los demás para personas
          filteredData = filteredData.filter(dt => {
            const isNIT = dt.abbreviation === 'NIT';
            return forCompany ? isNIT : !isNIT;
          });
        }

        setDocumentTypes(filteredData);
      } catch (err) {
        console.error('Error fetching document types:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar tipos de documento');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, [countryId, forCompany]);

  return { documentTypes, loading, error };
}

// =====================================================
// HOOK: useHealthInsurance
// =====================================================

export function useHealthInsurance() {
  const [healthInsurance, setHealthInsurance] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthInsurance = async () => {
      // Usar caché si existe
      if (catalogCache.healthInsurance) {
        setHealthInsurance(catalogCache.healthInsurance);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('health_insurance')
          .select('id, name, abbreviation')
          .order('name');

        if (fetchError) throw fetchError;

        catalogCache.healthInsurance = data || [];
        setHealthInsurance(data || []);
      } catch (err) {
        console.error('Error fetching health insurance:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar EPS');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthInsurance();
  }, []);

  return { healthInsurance, loading, error };
}

// =====================================================
// HELPER: Obtener país Colombia (más usado)
// =====================================================

export async function getColombiaId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id')
      .eq('code', 'CO')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (err) {
    console.error('Error getting Colombia ID:', err);
    return null;
  }
}
