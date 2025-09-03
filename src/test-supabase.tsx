import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Componente de prueba para verificar conexión a Supabase
export function TestSupabase() {
  const [status, setStatus] = useState('Iniciando...')
  const [details, setDetails] = useState<any>({})

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🧪 Testing Supabase connection...')
        setStatus('Probando conexión...')

        // Test 1: Verificar configuración
        const config = {
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
          hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
        }
        
        console.log('🔧 Config:', config)
        setDetails(prev => ({ ...prev, config }))

        // Test 2: Verificar cliente Supabase
        console.log('📡 Testing client...')
        setStatus('Probando cliente...')
        
        const client = supabase
        console.log('✅ Client created:', !!client)
        setDetails(prev => ({ ...prev, clientExists: !!client }))

        // Test 3: Probar getSession
        console.log('🔑 Getting session...')
        setStatus('Obteniendo sesión...')
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('📊 Session result:', { 
          session: sessionData?.session?.user?.email || 'No session',
          error: sessionError?.message || 'No error'
        })
        
        setDetails(prev => ({ 
          ...prev, 
          session: sessionData?.session?.user?.email || 'No session',
          sessionError: sessionError?.message || null
        }))

        // Test 4: Probar una query simple
        console.log('📋 Testing simple query...')
        setStatus('Probando query...')
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
        
        console.log('📋 Profiles query:', { 
          data: profilesData?.length || 0,
          error: profilesError?.message || 'No error'
        })
        
        setDetails(prev => ({ 
          ...prev, 
          profilesCount: profilesData?.length || 0,
          profilesError: profilesError?.message || null
        }))

        setStatus('✅ Pruebas completadas')
        console.log('✅ All tests completed')

      } catch (error) {
        console.error('💥 Test error:', error)
        setStatus('❌ Error en pruebas')
        setDetails(prev => ({ ...prev, error: String(error) }))
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Supabase Connection</h1>
      
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Detalles:</h2>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Abre las herramientas de desarrollador (F12) para ver logs detallados en la consola.
      </div>
    </div>
  )
}
