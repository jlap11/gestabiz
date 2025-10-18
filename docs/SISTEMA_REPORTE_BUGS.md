# 🐛 Sistema de Reporte de Bugs y Problemas

## 📋 Resumen Ejecutivo

Sistema completo de reporte de problemas que permite a los usuarios de Gestabiz reportar bugs, errores o problemas encontrados en la aplicación. El sistema captura información técnica automáticamente, permite adjuntar evidencias y notifica al equipo de soporte vía email.

**Fecha de Implementación:** 17 de Octubre de 2025  
**Estado:** ✅ Completado y Operacional  
**Progreso:** 100%

---

## 🎯 Características Principales

### 1. **Botón Flotante Accesible**
- Botón flotante en esquina inferior izquierda
- Animación de pulso para llamar la atención
- Expand on hover mostrando texto "Reportar Problema"
- Disponible en TODAS las vistas de la aplicación
- No requiere navegación por menús

### 2. **Captura Automática de Contexto Técnico**
- User Agent del navegador
- Navegador y versión (Chrome 120.0, Firefox 115.0, etc.)
- Tipo de dispositivo (Desktop, Mobile, Tablet)
- Resolución de pantalla
- Página donde ocurrió el problema
- Fecha y hora exacta

### 3. **Clasificación por Severidad**
| Severidad | Icono | Descripción | Prioridad Auto |
|-----------|-------|-------------|----------------|
| **Baja** | 🟢 | Problema menor que no afecta el uso | Normal |
| **Media** | 🟡 | Problema que afecta algunas funciones | Normal |
| **Alta** | 🟠 | Problema grave que impide funciones importantes | Alta |
| **Crítica** | 🔴 | Error bloqueante que impide usar la app | Alta |

### 4. **Sistema de Evidencias**
- Máximo 5 archivos por reporte
- Tamaño máximo: 10MB por archivo
- Formatos soportados:
  - **Imágenes:** JPEG, PNG, GIF, WebP
  - **Videos:** MP4, QuickTime, WebM
  - **Documentos:** PDF, TXT, JSON
- Almacenamiento seguro en Supabase Storage
- Preview de archivos seleccionados

### 5. **Notificaciones Automáticas**
- Email HTML profesional al equipo de soporte
- Incluye todos los detalles del reporte
- Información técnica formateada
- Contador de evidencias adjuntas
- Badges de severidad con colores
- ID único para seguimiento

---

## 🏗️ Arquitectura del Sistema

### Base de Datos

```sql
-- Tabla principal de reportes
bug_reports
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── title (VARCHAR 255)
├── description (TEXT)
├── steps_to_reproduce (TEXT, nullable)
├── severity (ENUM: low, medium, high, critical)
├── category (VARCHAR 100, nullable)
├── affected_page (VARCHAR 255)
├── user_agent (TEXT)
├── browser_version (VARCHAR 100)
├── device_type (VARCHAR 50)
├── screen_resolution (VARCHAR 50)
├── status (ENUM: reported, acknowledged, in_progress, resolved, closed, wont_fix)
├── priority (ENUM: low, normal, high, urgent)
├── assigned_to (UUID, FK → auth.users, nullable)
├── resolution_notes (TEXT, nullable)
├── resolved_at (TIMESTAMPTZ, nullable)
├── resolved_by (UUID, FK → auth.users, nullable)
├── created_at (TIMESTAMPTZ, default NOW())
└── updated_at (TIMESTAMPTZ, default NOW())

-- Tabla de evidencias
bug_report_evidences
├── id (UUID, PK)
├── bug_report_id (UUID, FK → bug_reports)
├── file_name (VARCHAR 255)
├── file_path (TEXT) -- Path en Storage: userId/bugReportId/timestamp-filename
├── file_type (VARCHAR 100)
├── file_size (BIGINT)
├── uploaded_by (UUID, FK → auth.users)
├── uploaded_at (TIMESTAMPTZ, default NOW())
└── description (TEXT, nullable)

-- Tabla de comentarios (para seguimiento)
bug_report_comments
├── id (UUID, PK)
├── bug_report_id (UUID, FK → bug_reports)
├── user_id (UUID, FK → auth.users)
├── comment (TEXT)
├── is_internal (BOOLEAN, default false)
├── created_at (TIMESTAMPTZ, default NOW())
└── updated_at (TIMESTAMPTZ, default NOW())
```

### Storage Bucket

```
bug-reports-evidence/
├── {user_id}/
│   ├── {bug_report_id}/
│   │   ├── {timestamp}-{filename}.jpg
│   │   ├── {timestamp}-{filename}.mp4
│   │   └── {timestamp}-{filename}.pdf
```

**Configuración:**
- **Público:** No (solo accesible por el usuario que lo subió)
- **Límite de tamaño:** 10MB por archivo
- **Tipos MIME permitidos:** Ver lista en migración
- **RLS Policies:** Solo el usuario puede ver/subir/eliminar sus evidencias

### Edge Function: send-bug-report-email

```typescript
Endpoint: /functions/v1/send-bug-report-email
Método: POST
Autenticación: Supabase API Key

Body: {
  bugReportId: string
  userId: string
  title: string
  description: string
  stepsToReproduce?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userEmail: string
  userName: string
  userAgent?: string
  browserVersion?: string
  deviceType?: string
  screenResolution?: string
  affectedPage?: string
}

Response: {
  success: boolean
  messageId?: string (AWS SES Message ID)
  message: string
  error?: string
}
```

**Integración con AWS SES:**
- Usa SDK oficial de AWS (`@aws-sdk/client-ses`)
- Envía email con formato HTML profesional
- Texto alternativo para clientes sin soporte HTML
- Tracking de MessageId en `notification_log`

---

## 📦 Componentes Frontend

### 1. FloatingBugReportButton

**Ubicación:** `src/components/bug-report/FloatingBugReportButton.tsx`

```tsx
<FloatingBugReportButton />
```

**Características:**
- Botón circular con gradiente naranja-rojo
- Icono `AlertCircle` de Lucide
- Animación de pulso infinita
- Expand on hover con texto
- Fixed position en `bottom-6 left-6`
- Z-index: 50 (por encima de contenido, por debajo de modales)

**Props:**
```typescript
interface FloatingBugReportButtonProps {
  className?: string // Clases CSS adicionales
}
```

### 2. BugReportModal

**Ubicación:** `src/components/bug-report/BugReportModal.tsx`

```tsx
<BugReportModal 
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

**Campos del formulario:**
1. **Título** (requerido, min 10 caracteres, max 255)
2. **Severidad** (requerido, select con descripciones)
3. **Categoría** (opcional, 10 categorías predefinidas)
4. **Descripción** (requerido, min 20 caracteres, textarea)
5. **Pasos para Reproducir** (opcional, textarea mono)
6. **Evidencias** (opcional, file upload múltiple)

**Validaciones:**
- Título mínimo 10 caracteres
- Descripción mínimo 20 caracteres
- Máximo 5 archivos
- Tamaño máximo 10MB por archivo
- Tipos MIME permitidos según configuración

**UI/UX:**
- Badge visual de severidad con emoji y color
- Preview de archivos seleccionados con tamaño
- Botón eliminar archivo individual
- Info box sobre captura técnica automática
- Loading spinner durante envío
- Disable submit si faltan campos requeridos

### 3. useBugReports Hook

**Ubicación:** `src/hooks/useBugReports.ts`

```typescript
const {
  loading,
  error,
  createBugReport,
  uploadEvidence,
  getBugReports,
  getBugReportById,
  getEvidences,
  deleteBugReport,
  deleteEvidence
} = useBugReports()
```

**Métodos principales:**

#### `createBugReport(data, files?)`
```typescript
interface CreateBugReportData {
  title: string
  description: string
  stepsToReproduce?: string
  severity: BugReportSeverity
  category?: string
  affectedPage?: string
}

const report = await createBugReport(data, files)
// Returns: BugReport | null
```

**Flujo:**
1. Captura información técnica del navegador
2. Inserta reporte en `bug_reports`
3. Sube archivos a Storage (si existen)
4. Crea registros en `bug_report_evidences`
5. Llama Edge Function para enviar email
6. Muestra toast de éxito/error
7. Retorna el reporte creado

#### `uploadEvidence(bugReportId, file, description?)`
```typescript
const evidence = await uploadEvidence(
  '123e4567-e89b-12d3-a456-426614174000',
  file,
  'Screenshot del error'
)
// Returns: BugReportEvidence | null
```

#### `getBugReports()`
```typescript
const reports = await getBugReports()
// Returns: BugReport[]
// Ordenados por created_at DESC
```

#### `getEvidences(bugReportId)`
```typescript
const evidences = await getEvidences(bugReportId)
// Returns: BugReportEvidence[]
```

---

## 🔐 Seguridad (RLS Policies)

### bug_reports

```sql
-- SELECT: Ver solo reportes propios
CREATE POLICY bug_reports_select_own
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Crear reportes autenticados
CREATE POLICY bug_reports_insert_own
  ON bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Actualizar solo reportes propios no resueltos
CREATE POLICY bug_reports_update_own
  ON bug_reports FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    status NOT IN ('resolved', 'closed')
  );
```

### bug_report_evidences

```sql
-- SELECT: Ver evidencias de reportes propios
CREATE POLICY bug_report_evidences_select_own
  ON bug_report_evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bug_reports
      WHERE bug_reports.id = bug_report_evidences.bug_report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

-- INSERT: Subir evidencias a reportes propios
CREATE POLICY bug_report_evidences_insert_own
  ON bug_report_evidences FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (...)
  );

-- DELETE: Eliminar evidencias propias
CREATE POLICY bug_report_evidences_delete_own
  ON bug_report_evidences FOR DELETE
  USING (
    uploaded_by = auth.uid() AND
    EXISTS (...)
  );
```

### Storage Policies

```sql
-- Upload: Solo a carpeta con user_id
CREATE POLICY "Users can upload evidence for their own bug reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- View/Download: Solo de carpeta con user_id
CREATE POLICY "Users can view their own bug report evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bug-reports-evidence' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 📧 Email de Notificación

### Diseño HTML

El email enviado incluye:

1. **Header con gradiente** (púrpura)
   - Emoji de bug 🐛
   - Título "Nuevo Reporte de Bug"

2. **Badge de severidad** (color dinámico según severidad)

3. **Información del reporte:**
   - Título del bug
   - Descripción completa
   - Pasos para reproducir (si existen)

4. **Información del usuario:**
   - Nombre completo
   - Email
   - ID de usuario

5. **Detalles técnicos:**
   - Página afectada
   - Navegador y versión
   - Dispositivo
   - Resolución de pantalla
   - Número de evidencias adjuntas

6. **ID del reporte** (UUID para seguimiento)

7. **Footer** con disclaimer

### Variables de Configuración

```bash
# En Edge Function (Supabase)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@gestabiz.com
SUPPORT_EMAIL=soporte@gestabiz.com

# En Frontend (.env)
VITE_SUPPORT_EMAIL=soporte@gestabiz.com
```

---

## 🚀 Instalación y Configuración

### 1. Aplicar Migraciones

```bash
# Tabla de reportes
npx supabase db push supabase/migrations/20251017100000_bug_reports_system.sql

# Bucket de Storage
npx supabase db push supabase/migrations/20251017100001_create_bug_reports_bucket.sql
```

### 2. Desplegar Edge Function

```bash
# Desplegar función
npx supabase functions deploy send-bug-report-email

# Configurar secrets
npx supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
npx supabase secrets set AWS_SECRET_ACCESS_KEY=...
npx supabase secrets set AWS_REGION=us-east-1
npx supabase secrets set SES_FROM_EMAIL=noreply@gestabiz.com
npx supabase secrets set SUPPORT_EMAIL=soporte@gestabiz.com
```

### 3. Configurar AWS SES

1. Ir a [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verificar email de origen (`SES_FROM_EMAIL`)
3. Verificar email de destino (`SUPPORT_EMAIL`)
4. Crear credenciales IAM con permisos:
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "ses:SendEmail",
       "ses:SendRawEmail"
     ],
     "Resource": "*"
   }
   ```
5. Copiar Access Key ID y Secret Access Key

### 4. Configurar Frontend

```bash
# .env.local
VITE_SUPPORT_EMAIL=soporte@gestabiz.com
```

### 5. Verificar Integración

```bash
# 1. Verificar bucket existe
npx supabase storage list

# 2. Verificar tablas existen
npx supabase db dump --schema public --table bug_reports

# 3. Verificar función desplegada
npx supabase functions list

# 4. Test de envío de email
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-bug-report-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bugReportId": "test-id",
    "userId": "test-user",
    "title": "Test Bug",
    "description": "Test description",
    "severity": "low",
    "userEmail": "test@example.com",
    "userName": "Test User"
  }'
```

---

## 📊 Uso del Sistema

### Para Usuarios

1. **Acceder al botón:**
   - Botón naranja flotante en esquina inferior izquierda
   - Visible en TODAS las páginas de la app
   - Clic para abrir modal

2. **Completar formulario:**
   - Título descriptivo (min 10 caracteres)
   - Seleccionar severidad apropiada
   - Descripción detallada del problema
   - Pasos para reproducir (opcional pero recomendado)
   - Adjuntar screenshots/videos si es posible

3. **Enviar reporte:**
   - Clic en "Enviar Reporte"
   - El sistema captura automáticamente info técnica
   - Se sube evidencias a Storage
   - Se envía email a soporte
   - Toast de confirmación

4. **Seguimiento:**
   - El ID del reporte queda registrado
   - El usuario puede ver sus reportes en el futuro
   - (Feature futura: Dashboard de reportes propios)

### Para Equipo de Soporte

1. **Recibir notificación:**
   - Email llega a `SUPPORT_EMAIL`
   - Contiene toda la información necesaria
   - ID único para referencia

2. **Revisar reporte:**
   - Leer descripción y pasos para reproducir
   - Verificar severidad asignada
   - Revisar detalles técnicos
   - Acceder a evidencias (si existen)

3. **Gestionar reporte:**
   - Cambiar status en base de datos
   - Asignar a desarrollador (`assigned_to`)
   - Cambiar prioridad si es necesario
   - Agregar comentarios de seguimiento

4. **Resolver:**
   - Actualizar `status` a 'resolved'
   - Agregar `resolution_notes`
   - Establecer `resolved_at` y `resolved_by`

---

## 🔍 Queries Útiles

### Ver todos los reportes pendientes

```sql
SELECT 
  br.id,
  br.title,
  br.severity,
  br.status,
  br.created_at,
  p.full_name as reporter_name,
  p.email as reporter_email,
  (SELECT COUNT(*) FROM bug_report_evidences WHERE bug_report_id = br.id) as evidence_count
FROM bug_reports br
LEFT JOIN profiles p ON p.id = br.user_id
WHERE br.status NOT IN ('resolved', 'closed')
ORDER BY 
  CASE br.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  br.created_at DESC;
```

### Estadísticas por severidad

```sql
SELECT 
  severity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'reported') as pending,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved
FROM bug_reports
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;
```

### Reportes con más evidencias

```sql
SELECT 
  br.id,
  br.title,
  br.severity,
  COUNT(bre.id) as evidence_count
FROM bug_reports br
LEFT JOIN bug_report_evidences bre ON bre.bug_report_id = br.id
GROUP BY br.id, br.title, br.severity
HAVING COUNT(bre.id) > 0
ORDER BY evidence_count DESC
LIMIT 10;
```

### Función RPC: Estadísticas de usuario

```sql
SELECT * FROM get_bug_report_stats('user-id-here');

-- Retorna:
{
  "total": 5,
  "reported": 2,
  "in_progress": 1,
  "resolved": 2,
  "by_severity": {
    "low": 1,
    "medium": 2,
    "high": 1,
    "critical": 1
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Missing SUPPORT_EMAIL or SES_FROM_EMAIL"

**Causa:** Variables de entorno no configuradas en Edge Function

**Solución:**
```bash
npx supabase secrets set SUPPORT_EMAIL=soporte@gestabiz.com
npx supabase secrets set SES_FROM_EMAIL=noreply@gestabiz.com
```

### Error: "Email not verified in SES"

**Causa:** El email de destino no está verificado en AWS SES (modo sandbox)

**Solución:**
1. Ir a AWS SES Console
2. Identity Management → Email Addresses
3. Verify a New Email Address
4. Verificar en bandeja de entrada

**Nota:** En producción con dominio verificado, no se requiere verificar cada email.

### Error: "File size exceeds limit"

**Causa:** Usuario intenta subir archivo mayor a 10MB

**Solución:** El sistema ya valida y muestra error. Si necesitas aumentar:
1. Actualizar `file_size_limit` en bucket:
   ```sql
   UPDATE storage.buckets 
   SET file_size_limit = 20971520 -- 20MB
   WHERE id = 'bug-reports-evidence';
   ```
2. Actualizar validación en `useBugReports.ts`:
   ```typescript
   if (file.size > 20 * 1024 * 1024) { // 20MB
   ```

### Error: "Upload failed"

**Causa:** RLS policy no permite subir archivo

**Solución:**
1. Verificar que el path del archivo incluye el user_id:
   ```typescript
   const filePath = `${user.id}/${bugReportId}/${timestamp}-${fileName}`
   ```
2. Verificar que el usuario está autenticado
3. Verificar políticas de Storage:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'bug-reports-evidence';
   ```

### Modal no abre

**Causa:** Estado no está siendo actualizado

**Solución:**
1. Verificar que `FloatingBugReportButton` está en DOM
2. Verificar console para errores de React
3. Verificar que `BugReportModal` recibe props correctos

---

## 🔮 Mejoras Futuras

### Fase 1: Dashboard de Reportes (Usuario)
- [ ] Página para ver historial de reportes propios
- [ ] Filtros por estado, severidad, fecha
- [ ] Ver detalles de cada reporte
- [ ] Descargar evidencias subidas
- [ ] Agregar comentarios adicionales

### Fase 2: Panel de Administración (Soporte)
- [ ] Dashboard administrativo en app
- [ ] Ver todos los reportes con filtros avanzados
- [ ] Asignar reportes a developers
- [ ] Cambiar status y prioridad
- [ ] Sistema de comentarios internos
- [ ] Analytics de bugs (más comunes, más críticos, etc.)

### Fase 3: Integraciones
- [ ] Webhook a Slack/Discord cuando llega reporte crítico
- [ ] Integración con GitHub Issues (crear issue automático)
- [ ] Integración con Jira/Linear
- [ ] Export a CSV/PDF

### Fase 4: Mejoras UX
- [ ] Captura de screenshot automática al abrir modal
- [ ] Grabación de sesión (ReplayIO style)
- [ ] Sugerencias de reportes similares (evitar duplicados)
- [ ] Templates de reporte por tipo de problema
- [ ] Rating de reportes (¿fue útil?)

### Fase 5: Analytics
- [ ] Dashboard con métricas:
  - Tiempo promedio de resolución
  - % de bugs por severidad
  - % de bugs resueltos vs no resueltos
  - Páginas con más reportes
  - Usuarios con más reportes
- [ ] Gráficas de tendencias
- [ ] Export de reportes

---

## 📚 Referencias

### Archivos Clave

```
appointsync-pro/
├── supabase/
│   ├── migrations/
│   │   ├── 20251017100000_bug_reports_system.sql
│   │   └── 20251017100001_create_bug_reports_bucket.sql
│   └── functions/
│       └── send-bug-report-email/
│           └── index.ts
├── src/
│   ├── components/
│   │   └── bug-report/
│   │       ├── BugReportModal.tsx
│   │       └── FloatingBugReportButton.tsx
│   ├── hooks/
│   │   └── useBugReports.ts
│   └── components/
│       └── layouts/
│           └── UnifiedLayout.tsx (integración)
├── .env.example (configuración VITE_SUPPORT_EMAIL)
└── docs/
    └── SISTEMA_REPORTE_BUGS.md (este archivo)
```

### Enlaces Externos

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)

---

## ✅ Checklist de Deployment

- [x] Migraciones aplicadas en Supabase
- [x] Bucket `bug-reports-evidence` creado
- [x] Edge Function `send-bug-report-email` desplegada
- [x] Secrets de AWS configurados en Supabase
- [x] Email de origen verificado en AWS SES
- [x] Email de soporte verificado en AWS SES
- [x] Variable `VITE_SUPPORT_EMAIL` en `.env`
- [x] Botón flotante visible en app
- [x] Modal funcional con validaciones
- [x] Upload de archivos funcionando
- [x] Emails llegando correctamente
- [x] RLS policies funcionando
- [ ] Dashboard de reportes (usuario) - Futuro
- [ ] Panel administrativo (soporte) - Futuro

---

## 📞 Soporte

Para dudas sobre este sistema:
- **Email:** dev@gestabiz.com
- **Documentación:** Este archivo
- **Issues:** GitHub Issues del proyecto

---

**Última actualización:** 17 de Octubre de 2025  
**Versión:** 1.0.0  
**Autor:** TI-Turing Team
