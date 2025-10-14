# Variables de Entorno Pendientes - Sistema de Pagos

## ⚠️ ACCIÓN REQUERIDA

Para completar la implementación de Stripe Elements, necesitas agregar una nueva variable de entorno:

## Variable Requerida

### `VITE_STRIPE_PUBLISHABLE_KEY`

**Ubicación**: Archivo `.env` en la raíz del proyecto

**Descripción**: Clave pública de Stripe para inicializar Stripe.js en el frontend

**Valor**: Obtén esta clave desde el Stripe Dashboard

**Pasos para obtenerla**:

1. Ve a https://dashboard.stripe.com/test/apikeys (o https://dashboard.stripe.com/apikeys para producción)
2. Copia la clave que dice **Publishable key** (empieza con `pk_test_...` o `pk_live_...`)
3. Agrégala a tu archivo `.env`:

```env
# Stripe - Frontend (Publishable Key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Qr...tu_clave_aqui
```

## Verificación

Después de agregar la variable:

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Verifica que se carga correctamente**:
   - Abre DevTools → Console
   - No debe haber errores sobre "Stripe key not found"
   - El componente `AddPaymentMethodModal` debe cargar sin errores

3. **Prueba la funcionalidad**:
   - Ve al Dashboard de Billing
   - Clic en "Agregar Método de Pago"
   - Debe aparecer el formulario de Stripe Elements (campos de tarjeta)
   - **NO** debe aparecer el mensaje "Coming Soon"

## Verificación de Variables Completas

Asegúrate de tener todas estas variables en tu `.env`:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Stripe - Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Nota: Las demás variables de Stripe (SECRET_KEY, WEBHOOK_SECRET, PRICE_IDs)
# van en Supabase Dashboard → Settings → Edge Functions → Secrets
```

## Troubleshooting

### Error: "loadStripe() requires a publishable key"
- Verifica que agregaste `VITE_STRIPE_PUBLISHABLE_KEY` al .env
- Reinicia el servidor de desarrollo
- Verifica que el valor empiece con `pk_test_` o `pk_live_`

### Error: "This key cannot be used with the Stripe JS"
- Asegúrate de usar la **Publishable key**, NO la Secret key
- La Publishable key empieza con `pk_`
- La Secret key empieza con `sk_` (NO uses esta en el frontend)

### Modal muestra "Coming Soon"
- El archivo `AddPaymentMethodModal.tsx` debe tener el código actualizado
- Verifica que los paquetes estén instalados:
  ```bash
  npm list @stripe/stripe-js @stripe/react-stripe-js
  ```
- Si no están instalados:
  ```bash
  npm install @stripe/stripe-js @stripe/react-stripe-js
  ```

## Estado Actual

✅ Paquetes instalados: `@stripe/stripe-js`, `@stripe/react-stripe-js`  
✅ Edge Function creada: `create-setup-intent`  
✅ Edge Function desplegada a Supabase  
✅ Webhook actualizado con soporte para `setup_intent.succeeded`  
⏳ **PENDIENTE**: Agregar `VITE_STRIPE_PUBLISHABLE_KEY` a `.env`

## Próximos Pasos

Una vez agregada la variable:

1. ✅ **Completar Stripe Dashboard Config**: Seguir `GUIA_CONFIGURACION_STRIPE.md`
2. ✅ **Probar flujo completo**: Agregar tarjeta de prueba (4242 4242 4242 4242)
3. ⏳ **Crear tests E2E**: Automatizar testing del sistema de pagos
4. ⏳ **Implementar notificaciones**: Emails para trial ending, payment failed

---

**Archivo generado**: $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**Sistema**: AppointSync Pro - Módulo de Pagos y Suscripciones
