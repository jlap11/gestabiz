# 📍 Cómo Abrir Vacantes como Administrador - Guía Visual

**Fecha**: 17 de octubre de 2025  
**Usuario**: Administrador de Negocio  
**Acción**: Publicar Vacante Laboral

---

## 🎯 Ruta Rápida

### URL Directa
```
http://localhost:5173/admin
```

---

## 📋 Paso a Paso (Con Capturas Visuales)

### 1️⃣ Acceder al Dashboard de Admin

```
┌─────────────────────────────────────────┐
│  🏠 AppointSync Pro                     │
│  ┌───────────────────────────────────┐  │
│  │ Selector de Rol: [ADMIN ▼]       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Acción**: Seleccionar rol "ADMIN" si no está activo

---

### 2️⃣ Encontrar el Menú de Reclutamiento

```
SIDEBAR IZQUIERDO:
┌─────────────────────────┐
│ 📊 Resumen              │
│ 📍 Sedes                │
│ 💼 Servicios            │
│ 👥 Empleados            │
│ 💼 Reclutamiento ◄──────┼─── ¡CLICK AQUÍ!
│ 🧮 Contabilidad         │
│ 📄 Reportes             │
│ 💳 Facturación          │
│ 🛡️  Permisos            │
└─────────────────────────┘
```

**Ubicación**: Entre "Empleados" y "Contabilidad"  
**Ícono**: 💼 BriefcaseBusiness  
**Acción**: Click en "Reclutamiento"

---

### 3️⃣ Ver el Dashboard de Reclutamiento

```
┌────────────────────────────────────────────────────────────┐
│  RECLUTAMIENTO                                             │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Vacantes     │ Aplicaciones │ Candidatos   │          │
│  │  Activas ✓   │              │              │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  ┌────────────────────────────────────────────┐          │
│  │         + Nueva Vacante                    │ ◄─ AQUÍ │
│  └────────────────────────────────────────────┘          │
│                                                            │
│  Vacantes Publicadas: 0                                   │
│  [ Todavía no hay vacantes ]                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Tab Activa**: "Vacantes Activas"  
**Botón Principal**: "+ Nueva Vacante" (verde)  
**Acción**: Click en el botón verde

---

### 4️⃣ Llenar el Formulario de Vacante

```
┌───────────────────────────────────────────────────────────┐
│  CREAR NUEVA VACANTE                                  [X] │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Título del Puesto *                                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Ej: Desarrollador React Senior                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Descripción del Puesto *                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Buscamos un desarrollador con experiencia...        │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Tipo de Posición *          Nivel de Experiencia *      │
│  ┌──────────────────────┐    ┌──────────────────────┐   │
│  │ ▼ Tiempo Completo    │    │ ▼ Senior             │   │
│  └──────────────────────┘    └──────────────────────┘   │
│                                                           │
│  Salario (COP) *                                          │
│  Mínimo            Máximo                                 │
│  ┌───────────┐    ┌───────────┐                         │
│  │ 4000000   │    │ 6000000   │                         │
│  └───────────┘    └───────────┘                         │
│                                                           │
│  Número de Plazas *                                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 1                                                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Skills Requeridos *                                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ React, TypeScript, Node.js                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Beneficios                                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Seguro médico, Trabajo remoto, Bonos               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Horario Laboral                                          │
│  Lunes a Viernes: 8:00 AM - 5:00 PM                     │
│                                                           │
│  Ubicación                                                │
│  Ciudad: Bogotá                                           │
│  Tipo: ◉ Remoto  ○ Híbrido  ○ Presencial               │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          🚀 Publicar Vacante                        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 📊 Campos del Formulario

### Campos Obligatorios (*)

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| **Título del Puesto** | Texto | "Desarrollador React Senior" |
| **Descripción** | Textarea | "Buscamos un desarrollador con 5+ años..." |
| **Tipo de Posición** | Select | Tiempo Completo, Medio Tiempo, Contrato, Temporal |
| **Nivel de Experiencia** | Select | Entry, Mid, Senior, Expert |
| **Salario Mínimo** | Número (COP) | 4000000 |
| **Salario Máximo** | Número (COP) | 6000000 |
| **Número de Plazas** | Número | 1 |
| **Skills Requeridos** | Array | ["React", "TypeScript", "Node.js"] |

### Campos Opcionales

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| **Beneficios** | Array | ["Seguro médico", "Trabajo remoto"] |
| **Horario Laboral** | JSON | {"monday": "8:00-17:00"} |
| **Ubicación** | Objeto | {city: "Bogotá", type: "remote"} |

---

## ✅ Después de Publicar

### Vista de Confirmación
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Vacante publicada exitosamente                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  VACANTES ACTIVAS (1)                                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 💼 Desarrollador React Senior                        │ │
│  │ 📍 Bogotá (Remoto)                                   │ │
│  │ 💰 $4,000,000 - $6,000,000 COP                      │ │
│  │ 👥 1 plaza disponible                                │ │
│  │ 📅 Publicado: Hoy                                    │ │
│  │                                                      │ │
│  │ Estado: 🟢 Abierta                                   │ │
│  │ Aplicaciones: 0                                      │ │
│  │                                                      │ │
│  │ [Ver Detalles] [Editar] [Cerrar]                    │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🔔 Notificaciones Automáticas

Cuando alguien aplique a tu vacante, recibirás:

### 1. Notificación In-App
```
┌─────────────────────────────────────┐
│  🔔 (1)                             │
│  ┌───────────────────────────────┐ │
│  │ 👤 Nueva Aplicación            │ │
│  │ Juan Pérez aplicó a:           │ │
│  │ "Desarrollador React Senior"   │ │
│  │ Match Score: 85%               │ │
│  │ ⏰ Hace 2 minutos              │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Email (si AWS SES configurado)
```
De: noreply@appointsync.pro
Asunto: Nueva aplicación recibida - Desarrollador React Senior

📧 Template HTML profesional con:
- Match score visual (barra verde 85%)
- Datos del aplicante
- Link al dashboard
- Botón "Ver Aplicación"
```

---

## 📱 Ver Aplicaciones Recibidas

### Tab "Aplicaciones"
```
┌────────────────────────────────────────────────────────────┐
│  RECLUTAMIENTO                                             │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Vacantes     │ Aplicaciones │ Candidatos   │          │
│  │  Activas     │      ✓       │              │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  Filtros: [Todas] [Pendientes] [En Revisión] [Aceptadas] │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 👤 Juan Pérez                    Match: 85% 🟢      │ │
│  │ Vacante: Desarrollador React Senior                 │ │
│  │ 📅 Aplicó: Hoy, 10:30 AM                            │ │
│  │ 📍 Bogotá | 💼 5 años exp | 💰 $5,000,000         │ │
│  │                                                      │ │
│  │ [Ver Perfil] [✅ Aceptar] [❌ Rechazar]             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 👤 María González                Match: 72% 🟡      │ │
│  │ Vacante: Desarrollador React Senior                 │ │
│  │ 📅 Aplicó: Ayer, 3:45 PM                            │ │
│  │ 📍 Medellín | 💼 3 años exp | 💰 $4,500,000       │ │
│  │                                                      │ │
│  │ [Ver Perfil] [✅ Aceptar] [❌ Rechazar]             │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 🔍 Ver Perfil del Aplicante

### Modal con 3 Tabs
```
┌───────────────────────────────────────────────────────────┐
│  PERFIL DE JUAN PÉREZ                                 [X] │
├───────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Información  │ Experiencia  │ Comparación  │          │
│  │      ✓       │              │              │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                           │
│  📧 juan.perez@email.com                                  │
│  📱 +57 300 123 4567                                      │
│  📍 Bogotá, Colombia                                      │
│                                                           │
│  💼 Resumen Profesional                                   │
│  Desarrollador Full Stack con 5 años de experiencia      │
│  especializado en React, TypeScript y Node.js...          │
│                                                           │
│  🎯 Skills                                                │
│  ✅ React (5 años)                                        │
│  ✅ TypeScript (3 años)                                   │
│  ✅ Node.js (4 años)                                      │
│  ✅ MongoDB (2 años)                                      │
│                                                           │
│  🏆 Certificaciones                                       │
│  - AWS Certified Developer (2023)                         │
│  - React Advanced Patterns (2022)                         │
│                                                           │
│  💰 Expectativa Salarial                                  │
│  $4,500,000 - $5,500,000 COP                             │
│                                                           │
│  🔗 Enlaces                                               │
│  Portfolio | LinkedIn | GitHub                            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          ✅ Aceptar Aplicación                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 🎯 Match Score Explicado

El sistema calcula automáticamente un **Match Score** de 0-100:

### Factores Considerados:
1. **Skills Match** (40%):
   - Coincidencia entre skills requeridos y del aplicante
   - Ej: 3/4 skills = 75%

2. **Experiencia** (30%):
   - Años de experiencia vs requeridos
   - Ej: 5 años cuando se piden 3+ = 100%

3. **Salario** (20%):
   - Expectativa vs presupuesto
   - Ej: Aplicante pide $5M, oferta $4-6M = 90%

4. **Ubicación** (10%):
   - Match de ciudad/tipo de trabajo
   - Ej: Ambos en Bogotá + remoto = 100%

### Interpretación:
- 🟢 **80-100**: Excelente candidato
- 🟡 **60-79**: Buen candidato
- 🟠 **40-59**: Candidato moderado
- ⚪ **<40**: Candidato no ideal

---

## ⚡ Acciones Rápidas

### Shortcuts de Teclado
- `Alt + R`: Ir a Reclutamiento
- `Ctrl + N`: Nueva Vacante (en tab Vacantes)
- `Ctrl + F`: Buscar aplicantes
- `Enter`: Ver perfil del aplicante seleccionado

### Acciones Masivas
```
☑️ Seleccionar múltiples aplicaciones
- Rechazar todas las seleccionadas
- Marcar como "En revisión"
- Exportar a CSV
```

---

## 📊 Estadísticas en Tiempo Real

```
┌─────────────────────────────────────────┐
│  RESUMEN DE RECLUTAMIENTO               │
│                                         │
│  📋 Vacantes Activas: 3                 │
│  📨 Aplicaciones Totales: 24            │
│  ⏳ Pendientes de Revisión: 12          │
│  ✅ Aceptadas: 5                        │
│  ❌ Rechazadas: 7                       │
│                                         │
│  🎯 Promedio Match Score: 67%           │
│  ⏱️  Tiempo Promedio de Respuesta: 2d   │
└─────────────────────────────────────────┘
```

---

## ❓ Preguntas Frecuentes

### ¿Cuántas vacantes puedo publicar?
- **Plan Básico**: 2 vacantes activas
- **Plan Pro**: 10 vacantes activas
- **Plan Enterprise**: Ilimitadas

### ¿Cómo cierro una vacante?
1. Ir a tab "Vacantes Activas"
2. Click en la vacante
3. Botón "Cerrar Vacante"
4. Confirmar

### ¿Qué pasa cuando acepto una aplicación?
1. Se crea un registro en `business_employees`
2. El aplicante recibe notificación
3. La vacante reduce el número de plazas
4. Si las plazas llegan a 0, la vacante se cierra automáticamente

---

## 🚀 Siguiente Paso

Después de aceptar un aplicante:
1. El empleado aparecerá en "Empleados" del sidebar
2. Puedes asignarle servicios y horarios
3. Configurar permisos
4. Agregar a equipos jerárquicos

---

**¡Listo para reclutar talento!** 🎉

**Última actualización**: 17 de octubre de 2025  
**Versión**: 1.0.0  
**Soporte**: Ver `docs/GUIA_ACCESO_SISTEMA_VACANTES.md`
