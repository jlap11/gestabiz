import React, { useRef, useState } from 'react'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native'
import { Text } from 'react-native-paper'
import { useAuth } from '../lib/auth'
import { EFFECTIVE_WEB_URL, SUPABASE_URL } from '../lib/env-config'

interface Props {
  route: string  // Ej: '/app/client', '/app/admin', '/app/employee'
  onMessage?: (data: any) => void
}

/**
 * WebViewDashboard - Componente reutilizable que renderiza contenido web
 * 
 * VENTAJAS:
 * - 100% reutilización de componentes web
 * - Un cambio en web → Automáticamente visible en móvil
 * - Traducciones automáticas
 * - Validaciones automáticas
 * - Diseño responsive del web funciona
 */
export default function WebViewDashboard({ route, onMessage }: Props) {
  const { session, user } = useAuth()
  const webviewRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // URL de la web app (sincronizada automáticamente con variables de sistema)
  const fullUrl = `${EFFECTIVE_WEB_URL}${route}`
  
  // JavaScript inyectado ANTES de cargar la página
  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      // 1. Inyectar sesión de Supabase en localStorage
      try {
          if (window.localStorage && ${session ? `'${JSON.stringify(session)}'` : 'null'}) {
            const session = ${session ? JSON.stringify(session) : 'null'};
            if (session) {
              // Guardar sesión en formato compatible con Supabase
              const projectId = '${SUPABASE_URL.split('https://')[1]?.split('.')[0] || 'default'}';
              window.localStorage.setItem(
                \`sb-\${projectId}-auth-token\`,
                JSON.stringify(session)
              );
              console.log('[Mobile] Session injected:', session.user?.email);
            }
          }
      } catch (e) {
        console.error('[Mobile] Error injecting session:', e);
      }
      
      // 2. Establecer bridge de comunicación React Native ↔ Web
      window.ReactNativeWebView = window.ReactNativeWebView || {};
      
      // 3. Escuchar eventos desde el web para navegar en nativo
      window.addEventListener('message', (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          // Enviar mensaje al nativo
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          }
        } catch (e) {
          console.error('[Web] Error handling message:', e);
        }
      });
      
      // 4. Deshabilitar zoom (mejor UX móvil)
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
      
      console.log('[Mobile] Bridge initialized for:', '${route}');
      
      true;
    })();
  `
  
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      
      console.log('[Mobile] Message from web:', data)
      
      // Manejar diferentes tipos de mensajes
      switch (data.type) {
        case 'navigate':
          // TODO: Implementar navegación nativa
          console.log('[Mobile] Navigate to:', data.route)
          break
        
        case 'deep-link':
          // TODO: Manejar deep links
          console.log('[Mobile] Deep link:', data.url)
          break
        
        case 'reload':
          // Recargar WebView
          webviewRef.current?.reload()
          break
        
        default:
          // Callback personalizado
          onMessage?.(data)
      }
    } catch (e) {
      console.error('[Mobile] Error parsing message:', e)
    }
  }
  
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent
    console.error('[Mobile] WebView error:', nativeEvent)
    setError(`Error cargando contenido: ${nativeEvent.description || 'Desconocido'}`)
    setLoading(false)
  }
  
  const handleLoadStart = () => {
    setLoading(true)
    setError(null)
  }
  
  const handleLoadEnd = () => {
    setLoading(false)
  }
  
  if (!session || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Iniciando sesión...</Text>
      </View>
    )
  }
  
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>
          Verifica tu conexión a internet
        </Text>
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: fullUrl }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        allowsBackForwardNavigationGestures
        style={styles.webview}
        // Configuración de permisos
        geolocationEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Performance
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
})

