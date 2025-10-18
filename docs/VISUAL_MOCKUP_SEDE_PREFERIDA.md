# Visual Mockup - Sistema de Sede Preferida

## 1. Header del Dashboard - Mostrando Sede

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║ [Logo] Gestabiz                                [Notif] [User]     ║
║        Sede Bogotá                 [Restaurante]                  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
     ↑
     └─ Sede preferida en letra pequeña con icono
```

---

## 2. Pantalla de Preferencias del Negocio (Settings)

```
╔════════════════════════════════════════════════════════════════════╗
║ PREFERENCIAS DEL NEGOCIO                                         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ SEDE ADMINISTRADA                                                 ║
║ ┌──────────────────────────────────────┐                         ║
║ │ [Sede Bogotá                    ▼]   │                         ║
║ └──────────────────────────────────────┘                         ║
║                                                                    ║
║ Opciones disponibles:                                             ║
║ • Todas las sedes                                                 ║
║ • Sede Bogotá                                                     ║
║ • Sede Medellín                                                   ║
║ • Sede Cali                                                       ║
║                                                                    ║
║ Sede configurada correctamente                                    ║
║                                                                    ║
║ [Guardar cambios]                                                 ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 3. Pantalla de Sedes - Badge Visual

```
╔════════════════════════════════════════════════════════════════════╗
║ ADMINISTRAR SEDES                        [+ Nueva Sede]           ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ ┌────────────────────────────────────────────────────────────┐   ║
║ │ Sede Bogotá                                                │   ║
║ │ Administrada                                               │   ║
║ │ Cra 11 #53-45, Bogotá, Colombia                          │   ║
║ │ Tel: +57 (1) 123-4567                                    │   ║
║ │ [Editar] [Eliminar]                                      │   ║
║ └────────────────────────────────────────────────────────────┘   ║
║                                                                    ║
║ ┌────────────────────────────────────────────────────────────┐   ║
║ │ Sede Medellín                                              │   ║
║ │ Cra 43A #55-80, Medellín, Colombia                       │   ║
║ │ Tel: +57 (4) 456-7890                                    │   ║
║ │ [Editar] [Eliminar]                                      │   ║
║ └────────────────────────────────────────────────────────────┘   ║
║                                                                    ║
║ ┌────────────────────────────────────────────────────────────┐   ║
║ │ Sede Cali                                                  │   ║
║ │ Cra 5 #18-45, Cali, Colombia                             │   ║
║ │ Tel: +57 (2) 789-0123                                    │   ║
║ │ [Editar] [Eliminar]                                      │   ║
║ └────────────────────────────────────────────────────────────┘   ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
     ↑
     └─ Badge "Administrada" solo en sede seleccionada
```

---

## 4. Pantalla de Empleados - Filtro por Sede

```
╔════════════════════════════════════════════════════════════════════╗
║ EMPLEADOS                    [Vista: Lista] [Mapa]  [≣ Filtros]  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ FILTROS                                         [Limpiar todo]    ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │                                                              │  ║
║ │ Buscar: [_________________________]                         │  ║
║ │                                                              │  ║
║ │ Sede: [Sede Bogotá                    ▼]                   │  ║
║ │       Pre-seleccionada automáticamente                      │  ║
║ │                                                              │  ║
║ │ Nivel Jerárquico: [Todos los niveles  ▼]                  │  ║
║ │                                                              │  ║
║ │ Tipo de Empleado: [Todos los tipos    ▼]                  │  ║
║ │                                                              │  ║
║ │ Departamento: [Todos los departamentos ▼]                  │  ║
║ │                                                              │  ║
║ │ Ocupación: [━━━━━━━━━━━━━] 0% - 100%                     │  ║
║ │                                                              │  ║
║ │ Rating: [━━━━━━━━━━━━━] 0.0 - 5.0                         │  ║
║ │                                                              │  ║
║ │ Filtros activos:                                            │  ║
║ │ [Sede: Bogotá ✕]                                           │  ║
║ │                                                              │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
║ EMPLEADOS (42 resultados)                                        ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │ Juan García - Peluquero                                     │  ║
║ │ ├─ Nivel: 2 (Manager)                                      │  ║
║ │ ├─ Ocupación: 85%                                          │  ║
║ │ └─ Rating: 4.8                                             │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
║ ... más empleados ...                                             ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 5. Pantalla de Vacantes - Pre-selección

```
╔════════════════════════════════════════════════════════════════════╗
║ CREAR NUEVA VACANTE                                               ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ Información Básica                                                ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │                                                              │  ║
║ │ Título del Puesto: [Peluquero/a Especializado     ]        │  ║
║ │                                                              │  ║
║ │ Descripción:                                                │  ║
║ │ [Buscamos peluquero/a con 3+ años...                ]      │  ║
║ │                                                              │  ║
║ │ Sede: [Sede Bogotá                    ▼]                   │  ║
║ │       Pre-seleccionada de configuraciones                   │  ║
║ │                                                              │  ║
║ │ Cantidad de Plazas: [1]                                     │  ║
║ │                                                              │  ║
║ │ [Siguiente]                                                 │  ║
║ │                                                              │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 6. Pantalla de Ventas Rápidas - Pre-selección

```
╔════════════════════════════════════════════════════════════════════╗
║ REGISTRAR VENTA RÁPIDA                                            ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ Información del Cliente                                           ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │                                                              │  ║
║ │ Cliente: [María González         ]                          │  ║
║ │                                                              │  ║
║ │ Teléfono: [(+57) 301-2345678    ]                          │  ║
║ │                                                              │  ║
║ │ Email: [maria@email.com          ]                          │  ║
║ │                                                              │  ║
║ │ Documento: [1.023.456.789        ]                          │  ║
║ │                                                              │  ║
║ │ Sede: [Sede Bogotá               ▼] Requerido             │  ║
║ │       Pre-seleccionada                                      │  ║
║ │                                                              │  ║
║ │ Servicio: [Corte + Tinte         ▼] Requerido             │  ║
║ │                                                              │  ║
║ │ Valor: [₡85,000                  ]                          │  ║
║ │                                                              │  ║
║ │ [Registrar venta]  [Cancelar]                              │  ║
║ │                                                              │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 7. Pantalla de Reportes - Filtro de Sede

```
╔════════════════════════════════════════════════════════════════════╗
║ REPORTES FINANCIEROS                                              ║
║ Dashboard interactivo con gráficos, filtros y exportación         ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ FILTRAR POR SEDE                                                  ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │ Sede: [Todas las sedes            ▼]                        │  ║
║ │       Opciones: Todas | Bogotá | Medellín | Cali           │  ║
║ │                                                              │  ║
║ │ Mostrando reportes de: Todas las sedes                      │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
║ DASHBOARD FINANCIERO                                              ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │                                                              │  ║
║ │  Ingresos Totales        Gastos Totales     Ganancia Neta  │  ║
║ │  ₡2.450.000              ₡850.000           ₡1.600.000     │  ║
║ │                                                              │  ║
║ │  Gráfico: Ingresos por Mes (últimos 12 meses)             │  ║
║ │  [Gráfico de líneas: ╱╲╱╲╱...]                             │  ║
║ │                                                              │  ║
║ │  Distribución de Servicios                                 │  ║
║ │  [Gráfico de pastel: 40% Cortes, 35% Tintes, 25% Otros] │  ║
║ │                                                              │  ║
║ │  [Descargar PDF]  [Descargar Excel]  [Enviar por Email]    │  ║
║ │                                                              │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 8. Comportamiento del Selector de Sede

### Opción 1: Todas las Sedes

```
User selecciona: "Todas las sedes" en Settings
                        ↓
localStorage: preferred-location-{businessId} = 'all'
                        ↓
usePreferredLocation retorna: {
  preferredLocationId: null,
  isAllLocations: true
}
                        ↓
Todos los filtros en empleados/reportes: location_id = null
                        ↓
Resultado: Mostrar datos de TODAS las sedes
```

### Opción 2: Sede Específica

```
User selecciona: "Sede Bogotá" en Settings
                        ↓
localStorage: preferred-location-{businessId} = 'abc123'
                        ↓
usePreferredLocation retorna: {
  preferredLocationId: 'abc123',
  isAllLocations: false
}
                        ↓
Filtros pre-seleccionados: location_id = 'abc123'
                        ↓
Resultado: Mostrar datos SOLO de Sede Bogotá
```

---

## 9. Indicadores Visuales

### Sede Administrada (Settings)

```
Cuando se guarda:
┌─────────────────────────────┐
│ Sede guardada               │ ← Toast verde
│ Mostrando: Sede Bogotá      │
└─────────────────────────────┘

O para todas las sedes:
┌─────────────────────────────┐
│ Configuración guardada      │ ← Toast verde
│ Mostrando: Todas las sedes  │
└─────────────────────────────┘
```
### Badge en LocationsManager

```
┌──────────────────────────┐
│  Sede Bogotá             │
│  Administrada            │ ← Verde, solo en sede seleccionada
│  Dirección: ...          │
└──────────────────────────┘
```

### Filtro Activo en Empleados

```
Filtros activos:
[Sede: Bogotá ✕]    ← Click en ✕ limpia este filtro

O si se selecciona "Todas las sedes":
(Sin badges de filtro activo - está limpio)
```

---

## 10. Validaciones y Restricciones

| Validación | Comportamiento |
|---|---|
| **Sin sede configurada** | Muestra todas las sedes por defecto |
| **Sede eliminada después** | Vuelve a mostrar todas las sedes |
| **Cambio de negocio** | Carga sede preferida del nuevo negocio |
| **localStorage vacío** | Inicia con todas las sedes |
| **Recarga de página** | Mantiene sede configurada (persistencia) |

---

## 11. UX Flow Completo

```
        ┌─────────────────────────┐
        │ Usuario entra al app    │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ AdminDashboard monta    │
        │ Header muestra: [Logo]  │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐         ┌──────────────────┐
        │ usePreferredLocation    │────────→│ localStorage     │
        │ obtiene sede            │         │ preferred-loc... │
        └────────────┬────────────┘         └──────────────────┘
                     ↓
        ┌─────────────────────────┐
        │ UnifiedLayout renderiza │
        │ Header: "Sede Bogotá"   │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ User navega a Empleados │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ Pre-selecciona sede en  │
        │ FiltersPanel            │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ Muestra 42 empleados    │
        │ de Sede Bogotá          │
        └─────────────────────────┘
```

---

**Estado**: Sistema listo para producción
**Versión**: 1.0.0
**Build**: 14.34s
