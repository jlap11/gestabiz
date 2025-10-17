# Fix: Código de País Colombia (17 Oct 2025)

## Problema
El error `GET .../countries?select=id&code=eq.COL 406 (Not Acceptable)` ocurría porque:
- Código de Colombia en DB: `CO` (ISO 3166-1 alpha-2)
- Código usado en código: `COL` (ISO 3166-1 alpha-3)
- Campo usado en código: `iso_code` 
- Campo real en DB: `code`

## Solución Aplicada

### 1. `src/hooks/useCatalogs.ts`
```diff
export async function getColombiaId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('id')
-     .eq('code', 'COL')
+     .eq('code', 'CO')
      .single();
```

### 2. `src/components/catalog/CountrySelect.tsx`
```diff
  const colombiaCountry = useMemo(() => {
-   return countries.find(c => c.iso_code === 'COL');
+   return countries.find(c => c.code === 'CO');
  }, [countries]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countries;

    const search = searchTerm.toLowerCase();
    return countries.filter(
      country =>
        country.name.toLowerCase().includes(search) ||
-       country.iso_code.toLowerCase().includes(search)
+       country.code.toLowerCase().includes(search)
    );
  }, [countries, searchTerm]);

  {filteredCountries.map(country => (
    <SelectItem key={country.id} value={country.id}>
-     {country.name} ({country.iso_code})
+     {country.name} ({country.code})
    </SelectItem>
  ))}
```

### 3. `src/components/catalog/PhonePrefixSelect.tsx`
```diff
  const colombiaPrefix = useMemo(() => {
-   return countries.find(c => c.iso_code === 'COL')?.phone_prefix;
+   return countries.find(c => c.code === 'CO')?.phone_prefix;
  }, [countries]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countriesWithPrefix;

    const search = searchTerm.toLowerCase();
    return countriesWithPrefix.filter(
      country =>
        country.name.toLowerCase().includes(search) ||
        country.phone_prefix?.includes(search) ||
-       country.iso_code.toLowerCase().includes(search)
+       country.code.toLowerCase().includes(search)
    );
  }, [countriesWithPrefix, searchTerm]);
```

## Estructura Correcta de la Tabla `countries`

```sql
SELECT * FROM countries WHERE name='Colombia';

id: 01b4e9d1-a84e-41c9-8768-253209225a21
name: Colombia
code: CO              -- ✅ ISO 3166-1 alpha-2 (2 caracteres)
phone_prefix: +57    -- ✅ Prefijo telefónico
```

## Cambios de Interfaz

```typescript
// ✅ Interfaz correcta en useCatalogs.ts
export interface Country {
  id: string;
  name: string;
  code: string;        // ✅ NO: iso_code
  phone_prefix: string;
}
```

## Impacto

| Componente | Error Anterior | Estado Actual |
|-----------|---------------|--------------|
| getColombiaId() | 406 Not Acceptable | ✅ Retorna ID correcto |
| CountrySelect | No encuentra Colombia | ✅ Encuentra y filtra por `CO` |
| PhonePrefixSelect | No auto-selecciona +57 | ✅ Auto-selecciona +57 |
| Búsqueda de países | No funciona por código | ✅ Busca por `code` correcto |

## Testing

```sql
-- Verificar que la query funciona:
SELECT id FROM countries 
WHERE code = 'CO'
-- Retorna: 01b4e9d1-a84e-41c9-8768-253209225a21
```

---

**Status**: 🟢 COMPLETADO
**Fecha**: 17 de octubre de 2025
**Archivos modificados**: 3
