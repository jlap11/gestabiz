# 📊 Performance Metrics - Testing Exhaustivo 16 Nov 2025

## 🎯 Objetivo
Documentar tiempos de respuesta, network requests, y oportunidades de mejora de CADA funcionalidad.

---

## ⚙️ Configuración de Testing

**Fecha**: 16 de Noviembre 2025  
**Hora Inicio**: 15:01 COT  
**Navegador**: Chrome 142.0.7444.163 (Chromium)  
**DevTools**: Network tab + Performance tab habilitados  

### Servidores Activos
| Puerto | Rol | Usuario | URL |
|--------|-----|---------|-----|
| 5173 | Owner Session | admin@gestabiz.com | http://localhost:5173 ✅ ACTIVO |
| 5174 | Employee Session | employee.test@gestabiz.com | http://localhost:5174 ✅ ACTIVO |
| 5175 | Client Session | client.test@gestabiz.com | http://localhost:5175 ✅ ACTIVO |

---

## 📈 MÉTRICAS POR MÓDULO

### M1: Landing Page (Pre-Auth)

**URL**: http://localhost:5173/  
**Usuario**: Sin autenticar  
**Timestamp Inicio**: 15:01:30  

#### Performance Metrics
- **Total Requests**: 94
- **Total new requests (modal)**: 20
- **Total Time**: ~5.6 segundos (estimado TTI)
- **Console Messages**: 11 (auth flow normal) + 1 (autocomplete warning)

#### Network Requests - Initial Load (94 requests)
| # | Request | Type | Size | Time | Status | Cacheable | Nota |
|---|---------|------|------|------|--------|-----------|------|
| 1 | / | document | — | — | 200 | ❌ | |
| 5-92 | Vite deps (React, Supabase, Radix UI, etc.) | script/chunk | — | — | 200/304 | ✅ | 87 chunks cargados |
| 65 | Sentry envelope | POST | — | — | 200 | ❌ | Telemetry |
| 67 | Google Tag Manager | script | — | — | 200 | ✅ | GA4 init |
| 93 | Sentry envelope | POST | — | — | 200 | ❌ | **DUPLICADO** |
| 94 | Google Analytics collect | POST | — | — | 204 | ❌ | page_view event |

#### Network Requests - Login Modal Render (+20 requests)
| # | Request | Type | Size | Time | Status | Cacheable | Nota |
|---|---------|------|------|------|--------|-----------|------|
| 95 | AuthScreen.tsx | script | — | — | 304 | ✅ | |
| 102 | logo_gestabiz.png | image | — | — | 304 | ✅ | |
| 103-108 | Radix Checkbox + Phosphor Icons | script | — | — | 200/304 | ✅ | |
| 109 | Supabase profiles count (HEAD) | XHR | — | — | 206 | ❌ | **INNECESARIO** ⚠️ |
| 110 | Supabase profiles OPTIONS | XHR | — | — | 200 | ❌ | CORS preflight |
| 111 | Supabase storage buckets | XHR | — | — | 200 | ❌ | **INNECESARIO** ⚠️ |
| 112 | Supabase storage OPTIONS | XHR | — | — | 200 | ❌ | CORS preflight |
| 113 | Sentry envelope | POST | — | — | 200 | ❌ | **3er POST duplicado** ⚠️ |
| 114 | Google Analytics page_view | POST | — | — | 204 | ❌ | /login event ✅ |

**Total Requests**: 114  
**Total Load + Modal**: ~6 segundos  

#### Problemas Detectados
- [x] **Requests duplicados**: 3 Sentry POST (reqid 65, 93, 113) - redundantes
- [x] **Requests innecesarios**: 2 Supabase calls ANTES de login (profiles count + storage buckets) - NO necesarios hasta POST-auth
- [x] **Bundle size**: 87 chunks Vite (normal para dev mode, ok)
- [x] **Autocomplete warning**: Input password falta autocomplete="current-password"

#### Oportunidades de Mejora
1. **P1**: Eliminar Supabase calls pre-auth (profiles count + storage buckets) → Ahorro: 2 requests + 2 OPTIONS
2. **P2**: Reducir Sentry telemetry posts (debounce o single POST) → Ahorro: 2 requests
3. **P3**: Agregar autocomplete attributes a password input (accessibility fix)
4. **P0 (DONE)**: Google Analytics tracking funcionando correctamente ✅

**Timestamp Fin**: 15:02:36  
**Duración Total**: 66 segundos

---

### M2: Login Flow

**URL**: http://localhost:5173/login  
**Usuario**: admin@gestabiz.com  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render formulario**: ____ ms
- **Tiempo validación cliente**: ____ ms
- **Tiempo llamada Supabase auth**: ____ ms
- **Tiempo redirect post-login**: ____ ms
- **Total Login Flow**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Cacheable |
|---|---------|------|------|------|--------|-----------|
| 1 | POST /auth/v1/token | XHR | ___ KB | ___ ms | 200 | ❌ |
| 2 | GET /rest/v1/profiles | XHR | ___ KB | ___ ms | 200 | ❌ |
| 3 | GET /rest/v1/businesses | XHR | ___ KB | ___ ms | 200 | ❌ |
| 4 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Size**: ___ KB  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Requests duplicados: _______________
- [ ] N+1 queries: _______________
- [ ] Falta de parallel fetching: _______________
- [ ] Credential validation lenta: _______________

#### Oportunidades de Mejora
1. _______________
2. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M3: Dashboard Load (Owner)

**URL**: http://localhost:5173/app/dashboard  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render skeleton**: ____ ms
- **Tiempo fetch user roles**: ____ ms
- **Tiempo fetch businesses**: ____ ms
- **Tiempo fetch dashboard stats**: ____ ms
- **Tiempo fetch permissions**: ____ ms
- **Tiempo render completo**: ____ ms
- **Total Dashboard Load**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Cacheable | Paralelo |
|---|---------|------|------|------|--------|-----------|----------|
| 1 | GET /rest/v1/business_roles | XHR | ___ KB | ___ ms | 200 | ⚠️ | ❌ |
| 2 | GET /rest/v1/businesses | XHR | ___ KB | ___ ms | 200 | ⚠️ | ❌ |
| 3 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 | ⚠️ | ❌ |
| 4 | RPC get_business_hierarchy | XHR | ___ KB | ___ ms | 200 | ❌ | ❌ |
| 5 | GET /rest/v1/appointments | XHR | ___ KB | ___ ms | 200 | ❌ | ❌ |
| 6 | ... | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Requests Paralelos**: ___ / ___  
**Requests Secuenciales**: ___ / ___  
**Total Size**: ___ KB  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Requests duplicados: _______________
- [ ] Requests secuenciales (deberían ser paralelos): _______________
- [ ] Queries N+1: _______________
- [ ] Falta de memoization: _______________
- [ ] Re-renders innecesarios: _______________
- [ ] useEffect dependencies incorrectas: _______________

#### Oportunidades de Mejora
1. **Paralelizar queries**: _______________
2. **Implementar React Query**: _______________
3. **Memoizar componentes**: _______________
4. **Reducir re-renders**: _______________
5. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M4: ServicesManager - Listar Servicios

**URL**: http://localhost:5173/app/services  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render inicial**: ____ ms
- **Tiempo fetch servicios**: ____ ms
- **Tiempo render lista completa**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Cacheable |
|---|---------|------|------|------|--------|-----------|
| 1 | GET /rest/v1/services | XHR | ___ KB | ___ ms | 200 | ⚠️ |
| 2 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 | ⚠️ |
| 3 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Size**: ___ KB  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Permissions re-fetched (ya cargados en dashboard): _______________
- [ ] Servicios no cacheados: _______________
- [ ] Renders innecesarios al verificar permisos: _______________

#### Oportunidades de Mejora
1. **Cache de permissions global**: _______________
2. **Prefetch de servicios en dashboard**: _______________
3. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M5: ServicesManager - Crear Servicio

**URL**: http://localhost:5173/app/services (Modal Create)  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo abrir modal**: ____ ms
- **Tiempo render formulario**: ____ ms
- **Tiempo validación cliente**: ____ ms
- **Tiempo POST request**: ____ ms
- **Tiempo refresh lista**: ____ ms
- **Tiempo cerrar modal**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Notes |
|---|---------|------|------|------|--------|-------|
| 1 | POST /rest/v1/services | XHR | ___ KB | ___ ms | 201 | Crear servicio |
| 2 | GET /rest/v1/services | XHR | ___ KB | ___ ms | 200 | Refresh lista |
| 3 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Size**: ___ KB  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Refresh innecesario (podría optimistic update): _______________
- [ ] Re-fetch completo en vez de agregar 1 item: _______________
- [ ] Form re-renders durante typing: _______________

#### Oportunidades de Mejora
1. **Optimistic updates**: Agregar servicio localmente sin esperar response
2. **Debounce en validaciones**: _______________
3. **Memoizar componentes del formulario**: _______________
4. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M6: ServicesManager - Editar Servicio

**URL**: http://localhost:5173/app/services (Modal Edit)  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo abrir modal con datos**: ____ ms
- **Tiempo cargar servicio actual**: ____ ms
- **Tiempo validación**: ____ ms
- **Tiempo PATCH request**: ____ ms
- **Tiempo refresh lista**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Notes |
|---|---------|------|------|------|--------|-------|
| 1 | GET /rest/v1/services?id=eq.{id} | XHR | ___ KB | ___ ms | 200 | Cargar datos |
| 2 | PATCH /rest/v1/services?id=eq.{id} | XHR | ___ KB | ___ ms | 200 | Actualizar |
| 3 | GET /rest/v1/services | XHR | ___ KB | ___ ms | 200 | Refresh |
| 4 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Datos ya disponibles, GET innecesario: _______________
- [ ] Refresh completo innecesario: _______________

#### Oportunidades de Mejora
1. **Pasar datos al modal, evitar GET**: _______________
2. **Optimistic update local**: _______________
3. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M7: ServicesManager - Eliminar Servicio

**URL**: http://localhost:5173/app/services  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo confirmar eliminación**: ____ ms
- **Tiempo DELETE request**: ____ ms
- **Tiempo refresh lista**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Notes |
|---|---------|------|------|------|--------|-------|
| 1 | DELETE /rest/v1/services?id=eq.{id} | XHR | ___ KB | ___ ms | 204 | Eliminar |
| 2 | GET /rest/v1/services | XHR | ___ KB | ___ ms | 200 | Refresh |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Refresh innecesario: _______________

#### Oportunidades de Mejora
1. **Optimistic delete**: Remover localmente, revertir si falla
2. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M8: BusinessRecurringExpenses - Listar ⭐ NUEVO

**URL**: http://localhost:5173/app/settings?tab=recurring-expenses  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render tab**: ____ ms
- **Tiempo fetch expenses**: ____ ms
- **Tiempo render lista**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Cacheable |
|---|---------|------|------|------|--------|-----------|
| 1 | GET /rest/v1/business_recurring_expenses | XHR | ___ KB | ___ ms | 200 | ⚠️ |
| 2 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 | ⚠️ |
| 3 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Permissions re-fetch: _______________
- [ ] Cache: _______________

#### Oportunidades de Mejora
1. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M9: BusinessRecurringExpenses - Crear ⭐ NUEVO

**URL**: http://localhost:5173/app/settings?tab=recurring-expenses (Modal)  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo abrir modal**: ____ ms
- **Tiempo render formulario**: ____ ms
- **Tiempo POST request**: ____ ms
- **Tiempo refresh lista**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | POST /rest/v1/business_recurring_expenses | XHR | ___ KB | ___ ms | 201 |
| 2 | GET /rest/v1/business_recurring_expenses | XHR | ___ KB | ___ ms | 200 |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] _______________

#### Oportunidades de Mejora
1. **Optimistic update**: _______________
2. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M10: BusinessRecurringExpenses - Eliminar ⭐ NUEVO

**URL**: http://localhost:5173/app/settings?tab=recurring-expenses  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo confirmar**: ____ ms
- **Tiempo DELETE request**: ____ ms
- **Tiempo refresh**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | DELETE /rest/v1/business_recurring_expenses?id=eq.{id} | XHR | ___ KB | ___ ms | 204 |
| 2 | GET /rest/v1/business_recurring_expenses | XHR | ___ KB | ___ ms | 200 |

**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] _______________

#### Oportunidades de Mejora
1. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M11: EmployeeSalaryConfig - Cargar ⭐ NUEVO

**URL**: http://localhost:5173/app/employees/{employeeId}/salary  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**employeeId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render tab/sección**: ____ ms
- **Tiempo fetch employee data**: ____ ms
- **Tiempo fetch salary config**: ____ ms
- **Tiempo render formulario**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | GET /rest/v1/business_employees?employee_id=eq.{id} | XHR | ___ KB | ___ ms | 200 |
| 2 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Employee data ya disponible: _______________
- [ ] Permissions re-fetch: _______________

#### Oportunidades de Mejora
1. **Usar datos de contexto del empleado**: _______________
2. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M12: EmployeeSalaryConfig - Guardar ⭐ NUEVO

**URL**: http://localhost:5173/app/employees/{employeeId}/salary  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**employeeId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo validación**: ____ ms
- **Tiempo PATCH request**: ____ ms
- **Tiempo feedback UI**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | PATCH /rest/v1/business_employees?employee_id=eq.{id} | XHR | ___ KB | ___ ms | 200 |

**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] _______________

#### Oportunidades de Mejora
1. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M13: EmployeesManager - Listar Empleados

**URL**: http://localhost:5173/app/employees  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render inicial**: ____ ms
- **Tiempo fetch employees**: ____ ms
- **Tiempo fetch permissions**: ____ ms
- **Tiempo render lista completa**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | GET /rest/v1/business_employees | XHR | ___ KB | ___ ms | 200 |
| 2 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 |
| 3 | GET /rest/v1/profiles | XHR | ___ KB | ___ ms | 200 |
| 4 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] N+1 query para profiles: _______________
- [ ] Permissions re-fetch: _______________

#### Oportunidades de Mejora
1. **JOIN employees con profiles en 1 query**: _______________
2. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M14: EmployeesManager - Aprobar Solicitud

**URL**: http://localhost:5173/app/employees?tab=requests  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo fetch requests**: ____ ms
- **Tiempo click aprobar**: ____ ms
- **Tiempo PATCH request**: ____ ms
- **Tiempo refresh lista**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | GET /rest/v1/business_employees?status=pending | XHR | ___ KB | ___ ms | 200 |
| 2 | PATCH /rest/v1/business_employees?id=eq.{id} | XHR | ___ KB | ___ ms | 200 |
| 3 | GET /rest/v1/business_employees | XHR | ___ KB | ___ ms | 200 |

**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Refresh completo: _______________

#### Oportunidades de Mejora
1. **Optimistic update**: _______________
2. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M15: UserPermissionsManager - Listar Permisos

**URL**: http://localhost:5173/app/permissions/users  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo render inicial**: ____ ms
- **Tiempo fetch employees**: ____ ms
- **Tiempo fetch user_permissions**: ____ ms
- **Tiempo render UI**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Size Impact |
|---|---------|------|------|------|--------|-------------|
| 1 | GET /rest/v1/business_employees | XHR | ___ KB | ___ ms | 200 | ___ |
| 2 | GET /rest/v1/user_permissions?business_id=eq.{id} | XHR | ___ KB | ___ ms | 200 | ⚠️ GRANDE |
| 3 | ... | ... | ... | ... | ... | ... |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] user_permissions query muy grande (1,919 registros): _______________
- [ ] No hay paginación: _______________
- [ ] No hay filtrado server-side: _______________

#### Oportunidades de Mejora
1. **CRÍTICO - Paginación de permisos**: Cargar solo página actual
2. **Filtrado server-side**: Filter by user_id primero
3. **Lazy loading**: Cargar permisos solo cuando se selecciona usuario
4. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M16: UserPermissionsManager - Asignar Permisos

**URL**: http://localhost:5173/app/permissions/users  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Target User**: employee.test@gestabiz.com  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo seleccionar usuario**: ____ ms
- **Tiempo cargar permisos actuales**: ____ ms
- **Tiempo render checkboxes (79 permisos)**: ____ ms
- **Tiempo toggle permisos**: ____ ms
- **Tiempo POST/PATCH batch**: ____ ms
- **Tiempo refresh**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Notes |
|---|---------|------|------|------|--------|-------|
| 1 | GET /rest/v1/user_permissions?user_id=eq.{id} | XHR | ___ KB | ___ ms | 200 | Cargar actuales |
| 2 | POST /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 201 | Batch insert |
| 3 | DELETE /rest/v1/user_permissions?id=in.(...) | XHR | ___ KB | ___ ms | 204 | Batch delete |
| 4 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 | Refresh |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Render de 79 checkboxes puede ser lento: _______________
- [ ] Re-renders al toggle cada checkbox: _______________
- [ ] Batch updates pueden ser grandes: _______________

#### Oportunidades de Mejora
1. **Virtualización de lista**: Renderizar solo permisos visibles
2. **Debounce de updates**: Guardar solo al terminar de editar
3. **Optimistic updates**: _______________
4. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M17: LocationsManager - Listar Ubicaciones

**URL**: http://localhost:5173/app/locations  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo fetch locations**: ____ ms
- **Tiempo render lista**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | GET /rest/v1/locations?business_id=eq.{id} | XHR | ___ KB | ___ ms | 200 |
| 2 | GET /rest/v1/user_permissions | XHR | ___ KB | ___ ms | 200 |

**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] _______________

#### Oportunidades de Mejora
1. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M18: AppointmentWizard - Flujo Completo

**URL**: http://localhost:5175/app/book-appointment  
**Usuario**: client.test@gestabiz.com (Client)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics por Paso

**Paso 1: Seleccionar Servicio**
- Tiempo fetch servicios: ____ ms
- Tiempo render: ____ ms

**Paso 2: Seleccionar Ubicación**
- Tiempo fetch locations: ____ ms
- Tiempo render: ____ ms

**Paso 3: Seleccionar Empleado**
- Tiempo fetch employees: ____ ms
- Tiempo fetch employee_services: ____ ms
- Tiempo render: ____ ms

**Paso 4: Seleccionar Fecha**
- Tiempo cargar calendario: ____ ms
- Tiempo render: ____ ms

**Paso 5: Seleccionar Hora**
- Tiempo fetch appointments existentes: ____ ms
- Tiempo fetch employee schedule: ____ ms
- Tiempo fetch location hours: ____ ms
- Tiempo calcular slots disponibles: ____ ms
- Tiempo render slots: ____ ms

**Paso 6: Confirmar**
- Tiempo render resumen: ____ ms
- Tiempo POST appointment: ____ ms
- Tiempo redirect: ____ ms

**TOTAL WIZARD FLOW**: ____ ms (____ segundos)

#### Network Requests
| # | Request | Type | Size | Time | Status | Step |
|---|---------|------|------|------|--------|------|
| 1 | GET /rest/v1/services | XHR | ___ KB | ___ ms | 200 | 1 |
| 2 | GET /rest/v1/locations | XHR | ___ KB | ___ ms | 200 | 2 |
| 3 | GET /rest/v1/business_employees | XHR | ___ KB | ___ ms | 200 | 3 |
| 4 | GET /rest/v1/employee_services | XHR | ___ KB | ___ ms | 200 | 3 |
| 5 | GET /rest/v1/appointments | XHR | ___ KB | ___ ms | 200 | 5 |
| 6 | GET /rest/v1/business_employees?id=eq.{id} | XHR | ___ KB | ___ ms | 200 | 5 |
| 7 | GET /rest/v1/locations?id=eq.{id} | XHR | ___ KB | ___ ms | 200 | 5 |
| 8 | POST /rest/v1/appointments | XHR | ___ KB | ___ ms | 201 | 6 |

**Total Requests**: ___  
**Requests Paralelos**: ___ / ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Requests secuenciales en paso 5 (deberían ser paralelos): _______________
- [ ] Employee data re-fetched (ya cargado en paso 3): _______________
- [ ] Location data re-fetched (ya cargado en paso 2): _______________
- [ ] No hay prefetching entre pasos: _______________

#### Oportunidades de Mejora
1. **CRÍTICO - Paralelizar queries en paso 5**: Fetch simultáneo de appointments + employee + location
2. **Cache de datos entre pasos**: Reutilizar servicios/locations/employees
3. **Prefetch**: Cargar datos del siguiente paso mientras usuario completa actual
4. **Optimistic slot calculation**: Calcular slots antes de fetch completo
5. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M19: AbsencesTab - Listar y Aprobar

**URL**: http://localhost:5173/app/absences  
**Usuario**: admin@gestabiz.com (Owner)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo fetch absence requests**: ____ ms
- **Tiempo render lista**: ____ ms
- **Tiempo aprobar request**: ____ ms
- **Tiempo actualizar balance**: ____ ms
- **Total Flow Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status |
|---|---------|------|------|------|--------|
| 1 | GET /rest/v1/employee_absences | XHR | ___ KB | ___ ms | 200 |
| 2 | GET /rest/v1/vacation_balance | XHR | ___ KB | ___ ms | 200 |
| 3 | POST /functions/v1/approve-reject-absence | XHR | ___ KB | ___ ms | 200 |
| 4 | GET /rest/v1/employee_absences | XHR | ___ KB | ___ ms | 200 |
| 5 | GET /rest/v1/vacation_balance | XHR | ___ KB | ___ ms | 200 |

**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] Refresh completo post-approval: _______________
- [ ] Edge function podría ser lenta: _______________

#### Oportunidades de Mejora
1. **Optimistic update**: _______________
2. **Response de Edge Function incluye datos actualizados**: Evitar re-fetch
3. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

### M20: BusinessProfile (Public) - Favoritos

**URL**: http://localhost:5175/negocio/{slug}  
**Usuario**: client.test@gestabiz.com (Client)  
**businessId**: _______________  
**Timestamp Inicio**: ___:___  

#### Performance Metrics
- **Tiempo fetch business profile**: ____ ms
- **Tiempo fetch servicios**: ____ ms
- **Tiempo fetch locations**: ____ ms
- **Tiempo fetch reviews**: ____ ms
- **Tiempo render completo**: ____ ms
- **Tiempo toggle favorito**: ____ ms
- **Total Load Time**: ____ ms

#### Network Requests
| # | Request | Type | Size | Time | Status | Paralelo |
|---|---------|------|------|------|--------|----------|
| 1 | GET /rest/v1/businesses?slug=eq.{slug} | XHR | ___ KB | ___ ms | 200 | ✅ |
| 2 | GET /rest/v1/services | XHR | ___ KB | ___ ms | 200 | ✅ |
| 3 | GET /rest/v1/locations | XHR | ___ KB | ___ ms | 200 | ✅ |
| 4 | GET /rest/v1/reviews | XHR | ___ KB | ___ ms | 200 | ✅ |
| 5 | GET /rest/v1/business_favorites | XHR | ___ KB | ___ ms | 200 | ❌ |
| 6 | POST /rest/v1/business_favorites | XHR | ___ KB | ___ ms | 201 | - |

**Total Requests**: ___  
**Total Time**: ___ ms  

#### Problemas Detectados
- [ ] business_favorites no paralelizado: _______________
- [ ] Toggle favorito causa re-render completo: _______________

#### Oportunidades de Mejora
1. **Paralelizar todas las queries iniciales**: _______________
2. **Optimistic toggle de favorito**: _______________
3. _______________

**Timestamp Fin**: ___:___  
**Duración Total**: ___ segundos

---

## 📊 RESUMEN EJECUTIVO DE PERFORMANCE

### Top 5 Módulos Más Lentos
| Ranking | Módulo | Tiempo Total | Requests | Principales Cuellos de Botella |
|---------|--------|--------------|----------|--------------------------------|
| 1 | ____________ | ____ ms | ___ | _____________________________ |
| 2 | ____________ | ____ ms | ___ | _____________________________ |
| 3 | ____________ | ____ ms | ___ | _____________________________ |
| 4 | ____________ | ____ ms | ___ | _____________________________ |
| 5 | ____________ | ____ ms | ___ | _____________________________ |

### Top 10 Problemas Críticos Detectados

#### P1: _______________________
**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Módulos Afectados**: _______________  
**Impacto**: _______________  
**Solución Propuesta**: _______________  
**Esfuerzo Estimado**: ___ horas  

#### P2: _______________________
**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Módulos Afectados**: _______________  
**Impacto**: _______________  
**Solución Propuesta**: _______________  
**Esfuerzo Estimado**: ___ horas  

#### P3: _______________________
**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Módulos Afectados**: _______________  
**Impacto**: _______________  
**Solución Propuesta**: _______________  
**Esfuerzo Estimado**: ___ horas  

#### P4: _______________________
**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Módulos Afectados**: _______________  
**Impacto**: _______________  
**Solución Propuesta**: _______________  
**Esfuerzo Estimado**: ___ horas  

#### P5: _______________________
**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Módulos Afectados**: _______________  
**Impacto**: _______________  
**Solución Propuesta**: _______________  
**Esfuerzo Estimado**: ___ horas  

#### P6-10: _______________________
_______________

### Métricas Generales

**Total Módulos Probados**: ___  
**Total Network Requests Analizados**: ___  
**Total Tiempo de Testing**: ___ horas  
**Total Datos Transferidos**: ___ MB  

**Promedio Tiempo de Carga**: ___ ms  
**Módulo Más Rápido**: ____________ (___ ms)  
**Módulo Más Lento**: ____________ (___ ms)  

**Requests Duplicados Detectados**: ___  
**Requests Innecesarios**: ___  
**Oportunidades de Paralelización**: ___  
**Oportunidades de Caching**: ___  

### Plan de Acción Priorizado

#### Prioridad P0 (Mañana - Crítico)
1. _______________
2. _______________
3. _______________

#### Prioridad P1 (Esta Semana - Importante)
1. _______________
2. _______________
3. _______________

#### Prioridad P2 (Próxima Semana - Mejora)
1. _______________
2. _______________

#### Prioridad P3 (Backlog - Nice to Have)
1. _______________

---

**Documento Creado**: 16 Nov 2025  
**Testing por**: Chrome DevTools + Manual Analysis  
**Próxima Actualización**: 17 Nov 2025 (Post-Fixes)

