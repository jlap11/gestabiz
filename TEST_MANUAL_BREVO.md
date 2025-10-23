# 🧪 GUÍA DE TEST - Brevo Email System

**Objetivo**: Verificar que el sistema de emails con Brevo está funcionando correctamente.

**Tiempo estimado**: 5-10 minutos

---

## 📋 Antes de Comenzar

✅ Verifica que tengas:
- Acceso a Supabase Dashboard
- Un email personal para recibir el test
- Conexión a internet

---

## 🧪 Test Paso a Paso

### PASO 1: Abrir Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Selecciona el proyecto `gestabiz` (o tu proyecto)
3. Observa que estés logueado correctamente

**Screenshot esperado**: Dashboard con lista de proyectos

---

### PASO 2: Ir a Edge Functions

1. En el menú lateral, busca **"Edge Functions"**
2. Clic en Edge Functions
3. Deberías ver estas funciones listadas:
   - ✅ `send-notification` (Status: Active)
   - ✅ `send-bug-report-email` (Status: Active)

**Screenshot esperado**: Lista de funciones con status verde

---

### PASO 3: Invocar send-notification

1. Clic en **"send-notification"**
2. En el panel de la derecha, busca botón **"Invoke"**
3. Clic en "Invoke"

**Screenshot esperado**: Panel lateral con área de entrada de parámetros

---

### PASO 4: Preparar Payload

En el área de texto, reemplaza TODO con este payload:

```json
{
  "type": "email_verification",
  "recipient_email": "TU_EMAIL_AQUI@gmail.com",
  "recipient_name": "Test Usuario",
  "data": {
    "verification_code": "123456",
    "verification_link": "https://gestabiz.com/verify/test-123"
  },
  "force_channels": ["email"]
}
```

**⚠️ IMPORTANTE**: Reemplaza `TU_EMAIL_AQUI@gmail.com` con TU EMAIL REAL

Ejemplo correcto:
```json
{
  "type": "email_verification",
  "recipient_email": "juanperez@gmail.com",
  "recipient_name": "Juan Pérez",
  ...
}
```

---

### PASO 5: Ejecutar la Función

1. Clic en botón **"Run"** (abajo del payload)
2. Espera 2-3 segundos
3. Deberías ver respuesta exitosa:

**Respuesta exitosa**:
```json
{
  "success": true,
  "messageId": "...",
  "status": 200
}
```

**Respuesta fallida** (NO deseada):
```json
{
  "success": false,
  "error": "...",
  "status": 400/401/500
}
```

---

### PASO 6: Revisar tu Email

1. Ve a tu **bandeja de entrada**
2. Busca email de: `no-reply@gestabiz.com` o `Gestabiz`
3. Si no lo ves, **revisa carpeta SPAM/Promociones**
4. Abre el email

**Tiempo de espera**: 1-2 minutos (puede ser más si está en spam)

---

## ✅ Verificaciones del Email

Cuando recibas el email, verifica que tenga:

### Header ✅
- [ ] Fondo gradiente púrpura (morado oscuro a claro)
- [ ] Logo 📅 en círculo blanco
- [ ] Texto "Gestabiz" en blanco

### Contenido Principal ✅
- [ ] Título: "¡Bienvenido a Gestabiz! 🎉"
- [ ] Saludo: "Hola Test Usuario," (tu nombre)
- [ ] Mensaje descriptivo
- [ ] **Botón CTA** púrpura con texto: "Confirmar mi Email"

### Alternativa ✅
- [ ] Sección gris con borde
- [ ] Texto: "¿El botón no funciona?"
- [ ] Link copiable: "https://gestabiz.com/verify/test-123"

### Seguridad ✅
- [ ] Fondo amarillo con borde naranja
- [ ] ⚠️ Icono de advertencia
- [ ] Texto: "Si no creaste una cuenta..."
- [ ] "Este enlace expirará en 24 horas"

### Footer ✅
- [ ] Fondo gris claro
- [ ] © 2025 Gestabiz
- [ ] Links: Sitio Web, Soporte, Privacidad, Términos
- [ ] Iconos de redes sociales (Twitter, Facebook, Instagram, LinkedIn)

---

## 🎨 Visual Reference

Aquí es cómo debería verse:

```
╔══════════════════════════════════════╗
║  [HEADER PÚRPURA]                  ║
║  📅 Gestabiz                       ║
╠══════════════════════════════════════╣
║                                      ║
║  ¡Bienvenido a Gestabiz! 🎉        ║
║                                      ║
║  Hola Test Usuario,                 ║
║                                      ║
║  Gracias por unirte a Gestabiz.    ║
║  Para completar tu registro...      ║
║                                      ║
║  ┌──────────────────────────────┐  ║
║  │ Confirmar mi Email           │  ║
║  │ (botón púrpura)              │  ║
║  └──────────────────────────────┘  ║
║                                      ║
║  ─────────────────────────────────  ║
║                                      ║
║  ┌──────────────────────────────┐  ║
║  │ ¿El botón no funciona?       │  ║
║  │                              │  ║
║  │ https://gestabiz.com/verify/ │  ║
║  └──────────────────────────────┘  ║
║                                      ║
║  ┌──────────────────────────────┐  ║
║  │ ⚠️ IMPORTANTE:               │  ║
║  │ Si no creaste una cuenta...  │  ║
║  │ Este enlace expira en 24h    │  ║
║  └──────────────────────────────┘  ║
║                                      ║
╠══════════════════════════════════════╣
║ © 2025 Gestabiz                      ║
║ Sitio Web | Soporte | Términos       ║
║ 𝕏 f 📷 in (redes sociales)           ║
╚══════════════════════════════════════╝
```

---

## ✅ Checklist Final

Marca las casillas conforme verifiques:

### Ejecución
- [ ] Dashboard abierto
- [ ] Edge Functions visibles
- [ ] send-notification encontrado
- [ ] Payload correcto
- [ ] Run ejecutado exitosamente
- [ ] Respuesta sin errores

### Email Recibido
- [ ] Email llegó a bandeja
- [ ] De: "no-reply@gestabiz.com" o "Gestabiz"
- [ ] Asunto visible
- [ ] No está en spam

### Diseño Verificado
- [ ] Header púrpura
- [ ] Logo 📅 visible
- [ ] Título correcto
- [ ] Botón CTA funcional
- [ ] Link alternativo presente
- [ ] Nota de seguridad amarilla
- [ ] Footer completo

### Funcionalidad
- [ ] Botón CTA es clickeable
- [ ] Link alternativo es clickeable
- [ ] Imagen responsiva en móvil
- [ ] Colores correctos (sin corrupción)

---

## 🐛 Troubleshooting

### El email no llega

**Opción 1**: Revisar spam/promociones
1. Ve a tu cuenta de Gmail/Outlook
2. Abre carpeta "Spam" o "Promociones"
3. Busca email de "gestabiz.com"

**Opción 2**: Esperar más tiempo
- Brevo puede tardar 2-3 minutos
- Espera y recarga

**Opción 3**: Verificar logs en Supabase
1. Ve a Edge Functions → send-notification
2. Abre tab "Logs"
3. Busca tu email
4. Revisa si hay mensajes de error

### El email llega pero con formato incorrecto

**Posibles causas**:
1. Cliente de email no soporta CSS (Outlook viejo)
2. Resolución pantalla muy pequeña
3. Email que se visualiza en app móvil

**Solución**: Probar en diferentes clientes:
- Gmail (web y app)
- Outlook (web y app)
- Apple Mail

### Error en respuesta de la función

**Error 401/403**: Credenciales inválidas
- Verificar: `npx supabase secrets list`
- Confirmar que BREVO_API_KEY está configurado

**Error 500**: Error en la función
- Revisar logs en Supabase Dashboard
- Contactar soporte

---

## 📞 Contacto si hay Problemas

Si todo falla:

1. **Revisa logs en Supabase**:
   - Dashboard → Edge Functions → send-notification → Logs
   - Busca mensajes de error

2. **Verifica secrets**:
   ```powershell
   npx supabase secrets list
   ```

3. **Contacta soporte**:
   - Email: soporte@gestabiz.com
   - GitHub: https://github.com/jlap11/gestabiz

---

## 🎉 Resultado Esperado

Si TODO funciona correctamente:

✅ Recibirás un email profesional desde Brevo  
✅ Template moderno con gradiente púrpura  
✅ Botón CTA funcional  
✅ Design responsive  
✅ Sin errores en logs  

**¡FELICIDADES! 🎊 El sistema está 100% operativo**

---

## 📝 Documentación Adicional

Si necesitas más info:
- Setup completo: `supabase/functions/_shared/BREVO_SETUP.md`
- Despliegue: `DESPLIEGUE_BREVO_EXITOSO.md`
- Código: `supabase/functions/_shared/brevo.ts`

---

*Test completado: [Fecha/Hora]*  
*Resultado: [ ] EXITOSO [ ] FALLÓ [ ] PARCIAL*

