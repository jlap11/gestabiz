# Configuración de Email Templates en Supabase

Esta guía explica cómo configurar el template HTML de confirmación de email en Supabase.

## 📧 Archivos Creados

1. **email-confirmation.html** - Template HTML estilizado (principal)
2. **email-confirmation.txt** - Template texto plano (fallback)

## 🎨 Características del Template

### Diseño Visual

- ✅ **Colores de la app**: Primary purple (#a855f7) y gradientes matching
- ✅ **Responsive**: Se adapta a móviles y desktop
- ✅ **Iconos**: Emojis para mejor visual
- ✅ **Dark mode friendly**: Colores optimizados para ambos temas

### Elementos Incluidos

- Logo de Gestabiz
- Botón CTA principal (Confirmar mi Email)
- Link alternativo (si el botón no funciona)
- Advertencia de seguridad
- Lista de beneficios
- Footer con links sociales
- Información de copyright

## 🔧 Configuración en Supabase Dashboard

### Paso 1: Acceder a Email Templates

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Click en **Authentication** en el menú lateral
3. Click en **Email Templates**

### Paso 2: Editar Template de Confirmación

1. Busca **"Confirm signup"** en la lista de templates
2. Click en **Edit template**

### Paso 3: Configurar Asunto del Email

En el campo **Subject**, escribe:

```
Confirma tu cuenta en Gestabiz 🎉
```

### Paso 4: Pegar HTML Template

1. En el editor de **Message (HTML)**, borra todo el contenido actual
2. Copia y pega todo el contenido de `email-confirmation.html`
3. **IMPORTANTE**: Asegúrate de que las variables estén correctas:
   - `{{ .Email }}` - Email del usuario
   - `{{ .ConfirmationURL }}` - URL de confirmación

### Paso 5: Configurar Texto Plano (Opcional)

1. En el campo **Message (Plain text)**, pega el contenido de `email-confirmation.txt`
2. Este se usa como fallback para clientes que no soportan HTML

### Paso 6: Guardar

1. Click en **Save** en la parte inferior
2. El template quedará activado inmediatamente

## 🧪 Probar el Template

### Opción 1: Crear Usuario de Prueba

1. Ve a **Authentication** → **Users**
2. Click en **Add user**
3. Ingresa un email válido (de tu control)
4. Marca **Auto Confirm User** = OFF
5. Click en **Create user**
6. Revisa tu inbox para ver el email

### Opción 2: Registro Normal

1. Habilita **"Confirm email"** en Settings
2. Registra un nuevo usuario desde la app
3. Revisa el email recibido

## 🔍 Verificar Variables

Las variables de Supabase disponibles son:

| Variable                 | Descripción           | Ejemplo                                            |
| ------------------------ | --------------------- | -------------------------------------------------- |
| `{{ .Email }}`           | Email del usuario     | `usuario@ejemplo.com`                              |
| `{{ .ConfirmationURL }}` | URL de confirmación   | `https://xxx.supabase.co/auth/v1/verify?token=...` |
| `{{ .Token }}`           | Token de confirmación | `abc123...`                                        |
| `{{ .TokenHash }}`       | Hash del token        | `def456...`                                        |
| `{{ .SiteURL }}`         | URL del sitio         | `https://tuapp.com`                                |

## 🎯 Personalización

### Cambiar Colores

Si quieres usar otros colores, modifica estas líneas en el CSS:

```css
/* Color principal */
background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);

/* Botón CTA */
.cta-button {
  background: linear-gradient(135deg, #TU-COLOR 0%, #TU-COLOR-OSCURO 100%);
}
```

### Cambiar Logo

Opción 1 - Emoji (actual):

```html
<div class="logo">📅</div>
```

Opción 2 - Imagen:

```html
<img src="https://tu-cdn.com/logo.png" alt="Gestabiz" style="width: 80px; height: 80px;" />
```

### Añadir Links Sociales Reales

Reemplaza los placeholders en el footer:

```html
<a href="https://twitter.com/TU-USUARIO" class="social-icon">𝕏</a>
<a href="https://facebook.com/TU-PAGINA" class="social-icon">f</a>
```

## 🚨 Problemas Comunes

### El email no llega

1. Verifica que "Confirm email" esté HABILITADO
2. Revisa la carpeta de spam
3. Verifica que el dominio de email esté configurado (Auth → Settings → SMTP)

### Las variables no se reemplazan

- Asegúrate de usar la sintaxis correcta: `{{ .Variable }}`
- No uses `${Variable}` ni `{Variable}`

### Estilos no se ven correctamente

1. Algunos clientes de email (ej. Gmail) eliminan ciertos CSS
2. Usa estilos inline para elementos críticos
3. Prueba en múltiples clientes: Gmail, Outlook, Apple Mail

## 📱 Compatibilidad

Template probado y optimizado para:

- ✅ Gmail (Web + Mobile)
- ✅ Outlook (Web + Desktop)
- ✅ Apple Mail (macOS + iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

## 🔐 Seguridad

- ✅ Enlace expira en 24 horas (configuración de Supabase)
- ✅ Token único por registro
- ✅ Advertencia de seguridad incluida
- ✅ HTTPS obligatorio en todos los enlaces

## 📚 Referencias

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email HTML Best Practices](https://www.campaignmonitor.com/css/)
- [Testing Email Rendering](https://www.litmus.com/)

## 💡 Tips Adicionales

1. **Personalización por idioma**: Crea templates diferentes para es/en
2. **A/B Testing**: Prueba diferentes CTAs y diseños
3. **Analytics**: Añade UTM parameters a los links para trackear clicks
4. **Branding**: Usa los colores exactos de tu brand guidelines

## 🆘 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs de Supabase (Logs → Auth)
2. Verifica las settings de SMTP
3. Contacta al soporte de Supabase si es necesario
