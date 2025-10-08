# 📍 Script de Inserción de Sedes (Locations)

## 📋 Descripción

Script SQL para insertar múltiples sedes (locations) a los negocios existentes en la base de datos de AppointSync Pro.

**Archivo:** `supabase/seed/03_insert_locations.sql`

---

## 🎯 ¿Qué hace este script?

Inserta **23 sedes** distribuidas en **10 negocios**:

| Negocio | # Sedes | Ciudades |
|---------|---------|----------|
| Spa Relax María | 3 | CDMX (Centro, Sur, Norte) |
| Barbería Clásica Carlos | 2 | Guadalajara, Zapopan |
| Consultorio Médico Ana | 2 | Monterrey, San Pedro |
| Clínica Dental Luis | 3 | CDMX (Insurgentes, Santa Fe, Del Valle) |
| Estética Sofía Beauty | 2 | Guadalajara (Chapultepec, Providencia) |
| Veterinaria Diego | 2 | Monterrey (Universidad, Contry) |
| Gimnasio Valeria Fit | 3 | CDMX (Polanco, Roma, Condesa) |
| Taller Mecánico Ricardo | 2 | Guadalajara, Tlaquepaque |
| Salón Camila Style | 2 | Monterrey (Centro, Linda Vista) |
| Estudio Fotográfico Fernando | 2 | CDMX (Roma Norte, Coyoacán) |

---

## 🚀 Cómo Ejecutar el Script

### **Opción 1: Supabase SQL Editor (Recomendado)**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `03_insert_locations.sql`
5. Click en **Run** o presiona `Ctrl + Enter`

### **Opción 2: Supabase CLI**

```bash
# Desde la raíz del proyecto
npx supabase db execute --file supabase/seed/03_insert_locations.sql
```

### **Opción 3: Comando directo**

```bash
npx supabase db execute < supabase/seed/03_insert_locations.sql
```

---

## 📊 Estructura de Cada Sede

Cada sede insertada contiene:

```sql
{
    business_id: UUID,           -- Referencia al negocio
    name: STRING,                -- Nombre de la sede
    address: STRING,             -- Dirección completa
    city: STRING,                -- Ciudad
    state: STRING,               -- Estado
    country: STRING,             -- País
    postal_code: STRING,         -- Código postal
    phone: STRING,               -- Teléfono
    latitude: DECIMAL?,          -- Coordenadas (opcional)
    longitude: DECIMAL?,         -- Coordenadas (opcional)
    is_active: BOOLEAN,          -- true por defecto
}
```

---

## ✅ Verificación

### **Ver resumen de sedes por negocio:**

```sql
SELECT 
    b.name AS negocio,
    COUNT(l.id) AS total_sedes,
    STRING_AGG(l.name, ', ' ORDER BY l.name) AS nombres_sedes
FROM public.businesses b
LEFT JOIN public.locations l ON l.business_id = b.id
GROUP BY b.id, b.name
ORDER BY b.name;
```

### **Ver todas las sedes con detalles:**

```sql
SELECT 
    b.name AS negocio,
    l.name AS sede,
    l.address,
    l.city,
    l.state,
    l.phone,
    l.is_active,
    l.created_at
FROM public.businesses b
INNER JOIN public.locations l ON l.business_id = b.id
ORDER BY b.name, l.name;
```

---

## 🔧 Personalización

### **Agregar sede a un negocio específico:**

```sql
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Nombre de la Nueva Sede',
    'Dirección completa',
    'Ciudad',
    'Estado',
    'País',
    'CP',
    '+52 XX XXXX XXXX',
    true
FROM public.businesses b
WHERE b.name = 'Nombre del Negocio';
```

### **Agregar múltiples sedes al mismo negocio:**

```sql
INSERT INTO public.locations (business_id, name, address, city, state, country, phone, is_active)
SELECT b.id, 'Sede 1', 'Dirección 1', 'Ciudad', 'Estado', 'País', '+52 XX', true
FROM public.businesses b WHERE b.name = 'Tu Negocio'
UNION ALL
SELECT b.id, 'Sede 2', 'Dirección 2', 'Ciudad', 'Estado', 'País', '+52 YY', true
FROM public.businesses b WHERE b.name = 'Tu Negocio'
UNION ALL
SELECT b.id, 'Sede 3', 'Dirección 3', 'Ciudad', 'Estado', 'País', '+52 ZZ', true
FROM public.businesses b WHERE b.name = 'Tu Negocio';
```

---

## ⚠️ Consideraciones Importantes

### **1. Nombres de Negocios**
El script usa nombres de negocios para hacer el JOIN. Si los nombres en tu BD son diferentes, el INSERT no fallará pero no insertará nada.

**Solución:** Verifica los nombres primero:
```sql
SELECT id, name FROM public.businesses ORDER BY name;
```

### **2. IDs Directos**
Si prefieres usar UUIDs directamente en lugar de nombres:

```sql
INSERT INTO public.locations (business_id, name, address, city, country, phone, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- UUID del negocio
    'Sede Nueva',
    'Dirección',
    'Ciudad',
    'País',
    '+52 XX',
    true
);
```

### **3. Coordenadas GPS**
Algunas sedes incluyen `latitude` y `longitude` para funcionalidad de mapas. Puedes:
- **Usar coordenadas reales** para mapas precisos
- **Dejar NULL** si no las necesitas
- **Usar [LatLong.net](https://www.latlong.net/)** para obtener coordenadas

### **4. RLS (Row Level Security)**
Las políticas RLS están configuradas para que:
- **Todos** puedan VER las sedes
- Solo **dueños** del negocio puedan crear/editar/eliminar sedes

---

## 🗑️ Limpieza

### **Eliminar todas las sedes (CUIDADO!):**

```sql
DELETE FROM public.locations;
```

### **Eliminar sedes de un negocio específico:**

```sql
DELETE FROM public.locations 
WHERE business_id IN (
    SELECT id FROM public.businesses WHERE name = 'Nombre del Negocio'
);
```

### **Desactivar una sede (recomendado en lugar de eliminar):**

```sql
UPDATE public.locations 
SET is_active = false, updated_at = NOW()
WHERE name = 'Nombre de la Sede';
```

---

## 🧪 Testing

Después de ejecutar el script, prueba:

1. ✅ **Abrir AppointmentWizard** en la app
2. ✅ **Seleccionar un negocio**
3. ✅ **Ver si aparece el paso de "Selección de Sede"**
4. ✅ **Verificar que muestre las sedes insertadas**
5. ✅ **Seleccionar una sede y continuar el flujo**
6. ✅ **Verificar que la cita creada tenga `location_id`**

---

## 📈 Próximos Pasos

Una vez insertadas las sedes, considera:

1. **Agregar horarios por sede** - Algunas sedes pueden tener horarios diferentes
2. **Servicios por sede** - No todas las sedes ofrecen todos los servicios
3. **Empleados por sede** - Asignar empleados específicos a cada sede
4. **Imágenes de sedes** - Agregar campo `image_url` para fotos
5. **Capacidad por sede** - Limitar citas simultáneas según tamaño

---

## 🆘 Troubleshooting

### **Problema: No se insertaron sedes**

**Causa:** Los nombres de negocios no coinciden

**Solución:**
```sql
-- Ver nombres exactos en la BD
SELECT name FROM public.businesses;

-- Ajustar el WHERE en el script
WHERE b.name = 'Nombre Exacto De La BD'
```

### **Problema: Error de foreign key**

**Causa:** El `business_id` no existe

**Solución:**
```sql
-- Verificar que el negocio existe
SELECT id, name FROM public.businesses WHERE name = 'Tu Negocio';
```

### **Problema: Duplicados**

**Causa:** Ejecutaste el script múltiples veces

**Solución:**
```sql
-- Eliminar duplicados (mantiene el más reciente)
DELETE FROM public.locations a USING public.locations b
WHERE a.created_at < b.created_at
AND a.business_id = b.business_id
AND a.name = b.name;
```

---

## 📚 Referencias

- **Schema completo:** `database/schema.sql` líneas 52-66
- **Componente UI:** `src/components/appointments/wizard-steps/LocationSelection.tsx`
- **Documentación:** `WIZARD_FLOW_UPDATE.md`

---

**Última actualización:** 7 de octubre de 2025  
**Autor:** AppointSync Pro Team
