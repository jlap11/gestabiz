# Utilidades de Zona Horaria

Este proyecto centraliza la lógica de zona horaria en `src/lib/utils.ts` para asegurar consistencia entre hooks y componentes.

## Helpers disponibles

- `DEFAULT_TIME_ZONE`: zona horaria predeterminada (`America/Bogota`).
- `extractTimeZoneParts(date: Date, timeZone?: string)`: obtiene `year`, `month`, `day`, `hour`, `minute` de una fecha en una zona horaria dada, con fallback seguro.
- `getTimeZoneParts(date: Date, timeZone: string)`: obtiene solo `hour` y `minute` en la zona horaria indicada.
- `getDayOfWeekInTZ(date: Date, timeZone: string)`: devuelve día de la semana en zona horaria (1=Lunes ... 7=Domingo), respetando formato ISO.

## Guía de uso

- Para mostrar y calcular horas en Colombia, usa `extractTimeZoneParts(now, DEFAULT_TIME_ZONE)`.
- Para comparaciones por hora (p. ej. agrupar citas por hora), usa `getTimeZoneParts(new Date(iso), DEFAULT_TIME_ZONE)`.
- Para lógica que depende del día de la semana (p. ej. horarios laborales), usa `getDayOfWeekInTZ`.

## Ejemplos

```ts
import { DEFAULT_TIME_ZONE, extractTimeZoneParts, getTimeZoneParts, getDayOfWeekInTZ } from '@/lib/utils'

// Hora actual en Colombia
const now = new Date()
const { hour, minute } = extractTimeZoneParts(now, DEFAULT_TIME_ZONE)

// Agrupar cita por hora en TZ
const aptHour = getTimeZoneParts(new Date(appointment.start_time), DEFAULT_TIME_ZONE).hour

// Día de la semana (1-7)
const dow = getDayOfWeekInTZ(new Date(), DEFAULT_TIME_ZONE)
```

## Convenciones

- Evita offsets manuales (p. ej. `UTC-5`); usa `Intl.DateTimeFormat` con `timeZone`.
- Para visualización de tiempo en 12h/24h, deriva desde `extractTimeZoneParts` y formatea según diseño.
- Si en el futuro se agrega `user.settings.timezone`, sustituye `DEFAULT_TIME_ZONE` por la preferencia del usuario.

## Migraciones realizadas

- `useEmployeeActiveBusiness`: helpers TZ centralizados y tests validados.
- `AppointmentsCalendar`: usa `DEFAULT_TIME_ZONE` y `extractTimeZoneParts`.

## Siguientes pasos sugeridos

- Adoptar estos helpers en vistas cliente/semana/día donde se comparan horas.
- Mantener esta documentación actualizada al introducir nuevas utilidades de tiempo.
