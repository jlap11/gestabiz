# 📋 Planes de Prueba - Gestabiz

> **Sistema integral de gestión de citas y negocios**  
> **Última actualización**: Enero 2025  
> **Estado**: ✅ Planes completados - Listos para ejecución

---

## 📚 Documentos Disponibles

### 1. Planes de Prueba por Rol

| Documento | Rol | Líneas | Casos | Estado |
|-----------|-----|--------|-------|--------|
| **PLAN_PRUEBAS_ROL_ADMINISTRADOR.md** | Admin | ~4,000 | 50+ | ✅ Completo |
| **PLAN_PRUEBAS_ROL_EMPLEADO.md** | Employee | 2,150 | 28 | ✅ Completo |
| **PLAN_PRUEBAS_ROL_EMPLEADO_SECCIONES_AVANZADAS.md** | Employee (Avanzado) | 2,044 | 75+ | ✅ Completo |
| **PLAN_PRUEBAS_ROL_CLIENTE.md** | Client | ~1,000 | 20+ | ✅ Completo |

### 2. Planes de Prueba de Sistema

| Documento | Enfoque | Estado |
|-----------|---------|--------|
| **PLAN_PRUEBAS_PERMISOS.md** | Sistema de Permisos Granulares v2.0 | ✅ Completo |
| **PLAN_PRUEBAS_PERMISOS_FASE_5.md** | Fase 5 - Testing Completo | ✅ Completo |

---

## 🎯 Cobertura Total

### Por Rol

- **Administrador**: 50+ casos funcionales + performance + edge cases + integración
- **Empleado**: 28 casos base + 30 edge cases + 20 error handling + 15 integración + 5 optimizaciones
- **Cliente**: 20+ casos funcionales + UX + booking flow completo

### Por Tipo de Prueba

- ✅ **Funcionales**: 100+ casos (CRUD, flujos, validaciones)
- ✅ **Performance**: 15+ optimizaciones documentadas (ANTES/DESPUÉS con métricas)
- ✅ **Edge Cases**: 60+ escenarios (límites, concurrencia, datos inválidos)
- ✅ **Error Handling**: 40+ casos (DB constraints, network failures, validaciones)
- ✅ **Integración**: 30+ pruebas (GA4, Brevo, Supabase, Edge Functions)
- ✅ **Permisos**: 79 permisos, 1,919 registros, 25 módulos protegidos

### Por Sistema

- ✅ Autenticación y Roles (3 roles dinámicos)
- ✅ Edición de Citas con Validación
- ✅ Sede Preferida Global
- ✅ Sistema de Ausencias y Vacaciones
- ✅ Sistema de Vacantes Laborales
- ✅ Sistema de Permisos Granulares
- ✅ Sistema de Notificaciones Multicanal
- ✅ Sistema Contable Completo
- ✅ Sistema de Ventas Rápidas
- ✅ Chat en Tiempo Real
- ✅ Reviews Anónimas
- ✅ Billing (Stripe/PayU/MercadoPago)

---

## 🚀 Cómo Usar Estos Documentos

### Para Testers

1. **Seleccionar plan por rol**: Elegir el documento según el rol a probar
2. **Revisar casos de prueba**: Cada caso tiene ID único, precondiciones, pasos y criterios
3. **Ejecutar paso a paso**: Seguir pasos numerados con datos específicos
4. **Validar resultados**: Comparar resultados esperados vs obtenidos
5. **Registrar evidencia**: Screenshots, HAR files, console logs, SQL queries

### Para Desarrolladores

1. **Consultar criterios de aceptación**: Sección 6 en documentos avanzados
2. **Revisar optimizaciones propuestas**: Performance Analysis (ANTES/DESPUÉS)
3. **Implementar fixes**: Edge Cases documentan problemas conocidos
4. **Validar código**: Error Handling documenta validaciones requeridas
5. **Preparar pre-release**: Checklist completo en Roadmap (Sección 10)

### Para Managers

1. **Tracking de progreso**: Tablas de priorización P0-P3
2. **Estimación de esfuerzo**: Roadmap de 6 semanas (Sección 10)
3. **Identificación de riesgos**: 8 riesgos técnicos documentados (Sección 9)
4. **Métricas de calidad**: Evidence requirements (Sección 7)
5. **Definition of Done**: Criterios estrictos (Sección 8)

---

## 📊 Métricas de Calidad

### Documentación

- **Total de líneas**: ~10,000+ líneas de documentación técnica
- **Casos de prueba**: 150+ casos exhaustivos
- **Escenarios edge**: 60+ casos límite
- **Optimizaciones**: 20+ propuestas con métricas ANTES/DESPUÉS

### Cobertura

- **Roles**: 3/3 roles documentados (100%)
- **Módulos**: 30+ componentes cubiertos
- **Flujos**: 15+ flujos end-to-end
- **Permisos**: 79 tipos, 25 módulos protegidos

### Automatización

- **Playwright E2E**: 40+ tests documentados
- **Vitest Unit**: 60+ tests documentados
- **Snapshot Tests**: 15+ componentes UI
- **RPC Functions**: 10+ validaciones SQL

---

## 🔧 Herramientas de Testing

### Requeridas

- **Playwright**: E2E testing (instalado)
- **Vitest**: Unit testing (configurado)
- **React Query DevTools**: Cache inspection
- **Chrome DevTools**: Network, Performance, Console
- **Supabase Dashboard**: DB inspection, RLS validation

### Opcionales

- **Postman/Insomnia**: API testing de Edge Functions
- **pgAdmin/DBeaver**: SQL query advanced validation
- **Lighthouse**: Performance audits
- **Sentry**: Error tracking (configurado)

---

## 📅 Estado del Proyecto

### Fase Actual: **BETA COMPLETADA** ✅

- ✅ Funcionalidad completa implementada
- ✅ Planes de prueba documentados
- 🔄 Testing funcional en progreso
- 📋 Corrección de bugs pendiente
- 🚀 Release: Objetivo Nov 30, 2025

### Próximos Pasos

1. **Ejecutar Plan de Pruebas Admin** (P0 - Crítico)
   - 50+ casos funcionales
   - Validación de permisos
   - Performance baseline

2. **Ejecutar Plan de Pruebas Employee** (P0 - Crítico)
   - 28 casos base
   - 75+ casos avanzados
   - Optimizaciones de red

3. **Ejecutar Plan de Pruebas Client** (P1 - Alto)
   - 20+ casos funcionales
   - Booking flow completo
   - UX validation

4. **Ejecutar Plan de Pruebas Permisos** (P0 - Crítico)
   - 79 permisos validados
   - 25 módulos protegidos
   - Templates funcionales

5. **Pre-Release Checklist** (P0 - Crítico)
   - 27 items documentados
   - Security audit
   - Performance benchmarks
   - Production deployment

---

## 📞 Contacto

**Equipo de Desarrollo**: TI-Turing  
**Proyecto**: Gestabiz  
**Stack**: React 18 + TypeScript 5.7 + Vite 6 + Supabase + Tailwind 4  
**Última actualización**: Enero 2025

---

*Para más información, consultar la documentación principal en `/docs/` o los archivos de configuración en `.github/copilot-instructions.md`*
