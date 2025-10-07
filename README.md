# Bookio — Gestión de Citas (Web · Móvil · Extensión) con Supabase

Bookio es un monorepo que reúne la app web (React/Vite), la app móvil (Expo/React Native) y una extensión de navegador, con backend en Supabase y sincronización en tiempo real. Incluye modo demo para explorar la UI sin backend.

---

## ✅ Qué incluye

- Web (Vite + React 19 + TypeScript)
- Móvil (Expo/React Native)
- Extensión (Chrome/Edge)
- Backend en Supabase (Postgres, Auth, Realtime, Edge Functions)
- Tailwind CSS 4, Radix/shadcn y Phosphor Icons

Consulta detalles de arquitectura y convenciones en `./.github/copilot-instructions.md`.

---

## 🚀 Inicio rápido

Prerrequisitos: Node.js 18+, cuenta en Supabase (opcional en modo demo), y para móvil: Expo CLI.

### 1) Web (carpeta raíz)

```bash
npm install

# Variables (crear .env.local)
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
# Opcional: activa UI sin backend real
VITE_DEMO_MODE=true
# Opcional: Google OAuth (solo si usarás sincronización de Calendario)
VITE_GOOGLE_CLIENT_ID=<client-id>
VITE_GOOGLE_CLIENT_SECRET=<client-secret>

npm run dev      # desarrollo
npm run build    # producción
npm run preview  # revisar build
```

### 2) Móvil (carpeta `mobile/`)

```bash
cd mobile
npm install

# Variables (.env o app.config - Expo)
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

npm run start   # abre Expo
# opcionales
npm run android
npm run ios
npm run web
```

### 3) Extensión

Hay dos superficies:

- `src/browser-extension/`: assets simples para carga “unpacked” rápida en Chrome.
- `extension/`: paquete con scripts de build/zip.

Pasos (opción rápida, unpacked):
- Chrome > chrome://extensions > activar Developer mode > Load unpacked > seleccionar `src/browser-extension/`.

Pasos (opción empaquetada):
- `cd extension && npm install`
- `npm run dev` (copia en `dist/` y sirve estático) o `npm run build` (genera zip)
- Cargar `extension/dist` como “unpacked” o subir el zip a la store.

Nota: scripts del paquete de extensión usan utilidades Unix (cp, zip). En Windows puedes usar Git Bash, WSL o adaptar los comandos.

### 4) Backend (Supabase)

- Esquemas: `database/schema.sql` y `src/database/supabase-schema.sql`
- Guías: `SUPABASE_INTEGRATION_GUIDE.md`, `src/docs/deployment-guide.md`, `supabase/functions/README.md`
- Realtime: el cliente se suscribe a cambios en `appointments` por `user_id`.

Modo demo: si `VITE_DEMO_MODE=true` o la URL contiene `demo.supabase.co`, `src/lib/supabase.ts` usa un cliente simulado para flujos de UI sin backend real.

---

## 🧭 Arquitectura (resumen útil)

- Tipos: `src/types/types.ts` (fuente de verdad para roles, permisos, Appointment, Business, etc.)
- Cliente y utils Supabase: `src/lib/supabase.ts`
- Hooks de datos: `src/hooks/useSupabase.ts`, `src/hooks/useSupabaseData.ts`
- Estado/UI: `src/contexts/AppStateContext.tsx`, `src/contexts/LanguageContext.tsx`, estilos con Tailwind y util `cn` en `src/lib/utils.ts`
- Permisos: `src/lib/permissions.ts` (`ROLE_PERMISSIONS`, `hasPermission`, …)
- Google Calendar: `src/lib/googleCalendar.ts` (OAuth client-side y sync)

Más en `src/docs/` y `docs/`.

---

## 🧪 Comandos

Raíz (web):
- `npm run dev` — servidor de desarrollo Vite
- `npm run build` — build de producción (tsc + vite)
- `npm run preview` — preview local del build
- `npm run lint` / `npm run lint:check`
- `npm run type-check`
- `npm run clean` / `npm run clean:install`

Móvil (`mobile/`):
- `npm run start | android | ios | web`
- `npm run build:android | build:ios`
- `npm run submit:android | submit:ios`

Extensión (`extension/`):
- `npm run dev` — copia a `dist/` y sirve estático
- `npm run build` — empaqueta zip

---

## 🔧 Variables de entorno

Web (Vite):
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (requeridas)
- `VITE_DEMO_MODE` (opcional)
- `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_SECRET` (opcional)

Móvil (Expo):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge Functions (según tu implementación): ver `supabase/functions/README.md`.

---

## 📁 Estructura principal

```
appointsync-pro/
├─ src/
│  ├─ components/             # UI web (admin, dashboard, calendar, etc.)
│  ├─ hooks/                  # useSupabase*, usePermissions, etc.
│  ├─ lib/                    # supabase.ts, googleCalendar.ts, utils, translations
│  ├─ contexts/               # AppState, Language, Theme
│  ├─ browser-extension/      # assets “unpacked” de la extensión
│  └─ types/                  # tipos de dominio y supabase
├─ mobile/                    # app Expo/React Native
├─ extension/                 # empaquetado/zip de extensión
├─ supabase/                  # edge functions y config
├─ database/                  # esquemas y datos de ejemplo
└─ docs/, src/docs/           # guías de despliegue e integración
```

---

## � Documentación relevante

- `FEATURES_IMPLEMENTED.md` — alcance actual
- `INTEGRATION_VALIDATION.md` — verificación de integraciones
- `SUPABASE_INTEGRATION_GUIDE.md` — integración con Supabase
- `src/docs/google-calendar-setup.md` — configuración de Google Calendar
- `src/docs/deployment-guide.md` y `docs/DEPLOYMENT.md` — despliegue

---

## 🤝 Contribuir

1) Crea una rama: `git checkout -b feat/mi-cambio`
2) Ejecuta linters y type-check: `npm run lint && npm run type-check`
3) Abre PR con contexto (screenshots/logs si aplica)

---

## � Licencia

MIT — ver `LICENSE`.

---

Si te sirve, una estrella ayuda a que más gente lo encuentre.