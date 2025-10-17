# 🎯 Quick Start - Sistema de Vacantes (1 minuto)

## 👨‍💼 ADMIN - Publicar Vacante

```
1. Login → /admin
2. Sidebar → "Reclutamiento" 📋
3. Tab → "Vacantes Activas"
4. Botón → "+ Nueva Vacante"
5. Llenar formulario → "Publicar"
```

**Ver aplicaciones recibidas**:
- Tab "Aplicaciones" → Ver todos los aplicantes
- Match Score visible (0-100)
- Acciones: Aceptar ✅ / Rechazar ❌ / Ver Perfil 👤

---

## 👷 EMPLOYEE - Aplicar a Vacante

```
1. Login → /employee
2. (PRIMERO) Configuración → "Perfil Profesional" ⚙️
   - Completar skills, experiencia, expectativa salarial
3. Sidebar → "Vacantes Disponibles" 💼
4. Ver Match Score (verde = mejor match)
5. Click → "Aplicar"
6. Llenar cover letter → "Enviar"
```

**Sistema verifica automáticamente**:
- ⚠️ Conflictos de horario con trabajos actuales
- ✅ Match score basado en tu perfil

---

## 👤 CLIENT - Dejar Review

```
1. Login → /client
2. Dashboard → Modal automático aparece
3. Review del Negocio:
   - ⭐⭐⭐⭐⭐ (1-5 estrellas)
   - 💬 Comentario (min 50 chars)
   - 👍 ¿Recomiendas? Sí/No
4. Review del Empleado:
   - ⭐⭐⭐⭐⭐
   - 💬 Comentario
   - 👍 ¿Recomiendas?
5. Click → "Enviar Reviews"
```

**Modal no se puede cerrar** hasta completar o click en "Recordar luego" (5 min)

---

## 🔑 URLs Directas

```
Admin Dashboard:     http://localhost:5173/admin
Employee Dashboard:  http://localhost:5173/employee
Client Dashboard:    http://localhost:5173/client

Reclutamiento:       /admin/recruitment
Vacantes:            /employee/vacancies
Perfil Profesional:  /employee/profile/professional
```

---

## 🎯 Match Score

| Score | Color | Significado |
|-------|-------|-------------|
| 80-100 | 🟢 Verde | Excelente match |
| 60-79 | 🟡 Amarillo | Buen match |
| 40-59 | 🟠 Naranja | Match moderado |
| 0-39 | ⚪ Gris | Match bajo |

**Componentes del Score**:
- 40% - Skills matching (especializations)
- 25% - Experience level
- 20% - Salary expectations
- 15% - Position type preference

---

## 📊 Features Automáticas

### Notificaciones 🔔
- ✅ **In-app**: Siempre activas (badge con contador)
- 📧 **Email**: Si AWS SES configurado

### Detección de Conflictos ⚠️
- Compara horarios de trabajos actuales vs vacante
- Alert rojo si hay solapamiento
- Opción de continuar o cancelar

### Reviews Obligatorias ⭐
- Modal aparece después de citas completadas
- Flujo dual: Negocio + Empleado
- Average rating se actualiza automáticamente

### Auto-Cierre de Vacantes 🔒
- Vacante se cierra cuando `applications_count >= slots`
- Status cambia a 'filled'
- No se aceptan más aplicaciones

---

## 🧪 Testing Rápido

**Crear usuarios de prueba**:

```sql
-- Admin
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@test.com', crypt('Test123456!', gen_salt('bf')));

-- Employee
INSERT INTO auth.users (email, encrypted_password)
VALUES ('employee@test.com', crypt('Test123456!', gen_salt('bf')));
```

**Ejecutar tests**:
```bash
npm run test tests/job-vacancy-complete-flow.test.ts
```

---

## ❓ Problemas Comunes

**No veo "Reclutamiento" en sidebar**:
→ Verifica que seas owner de un negocio (`businesses.owner_id`)

**Match score es 0**:
→ Completa tu perfil profesional (especializaciones requeridas)

**No puedo aplicar**:
→ Revisa: perfil completo, vacante 'open', no aplicado antes

**Modal de review no aparece**:
→ Solo para clientes con citas 'completed' sin review

---

## 📚 Docs Completas

- **Guía Completa**: `docs/GUIA_ACCESO_SISTEMA_VACANTES.md`
- **Documentación Técnica**: `docs/FASE_7_COMPLETADA_TESTING.md`
- **Resumen del Sistema**: `docs/SISTEMA_VACANTES_COMPLETADO_RESUMEN_FINAL.md`

---

**¿Listo para empezar? Login → Selecciona tu rol → ¡Explora!** 🚀
