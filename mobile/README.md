# Gestabiz Mobile App

Versión móvil con arquitectura **Hybrid WebView**: Navegación nativa + Contenido web reutilizado.

## Setup Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar (variables se sincronizan automáticamente desde la raíz)
npm start
```

**Nota**: Las variables de entorno se reutilizan automáticamente desde la configuración web:
- `VITE_SUPABASE_URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- No necesitas configurar nada adicional ✅

## Desarrollo Local

Para desarrollar con la web app local:

```bash
# Terminal 1: Web app (debe estar corriendo en puerto 5173)
cd ..
npm run dev

# Terminal 2: Mobile app
npm start
# Presiona 'a' para Android, 'i' para iOS
```

## Arquitectura

- **5% Nativo**: Tabs, header, autenticación
- **95% Web**: Todo el contenido renderizado vía WebView
- **Ventaja**: Un cambio en web → Automáticamente en móvil

## Documentación

Ver `PLAN_DE_ACCION_HYBRID_WEBVIEW.md` para detalles técnicos.

