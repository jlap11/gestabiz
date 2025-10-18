import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react";

import App from './App.tsx'

import "./main.css"
import "./index.css"

// ===== SENTRY INITIALIZATION =====
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const SAMPLE_RATE = Number.parseFloat(import.meta.env.VITE_SENTRY_SAMPLE_RATE || '0.3');
const IS_PRODUCTION = import.meta.env.PROD;

// Inicializar Sentry solo si hay DSN configurado
if (SENTRY_DSN && SENTRY_DSN !== 'https://examplePublicKey@o0.ingest.sentry.io/0') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? 'production' : 'development',
    release: `appointsync-pro@${APP_VERSION}`,
    
    // Sampling
    tracesSampleRate: IS_PRODUCTION ? SAMPLE_RATE : 1, // 30% en prod, 100% en dev
    sampleRate: IS_PRODUCTION ? SAMPLE_RATE : 1,
    
    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Session Replay (solo errores en prod para ahorrar cuota)
    replaysSessionSampleRate: 0, // No grabar sesiones normales
    replaysOnErrorSampleRate: IS_PRODUCTION ? 1 : 0, // Grabar 100% de sesiones con error en prod
    
    // Filtros
    beforeSend(event) {
      // Siempre enviar errores fatales
      if (event.level === 'fatal') {
        return event;
      }
      
      // En desarrollo, enviar 100% de errores
      if (!IS_PRODUCTION) {
        return event;
      }
      
      // En producción, aplicar sampling
      return event;
    },
    
    // Ignorar errores conocidos
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /^cancelled$/i,
    ],
  });
}

// Simple error fallback component
// Entry file intentionally has no exports; suppress Fast Refresh warning for this file
// eslint-disable-next-line react-refresh/only-export-components
function ErrorFallback({ error }: Readonly<{ error: Error }>) {
  // Enviar a Sentry
  Sentry.captureException(error);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <button 
          onClick={() => globalThis.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reload page
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
