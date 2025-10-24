import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

interface CreateUsersResponse {
  success: boolean
  created_users: number
  users: Array<{
    id: string
    email: string
    role: string
  }>
  errors: Array<{
    email: string
    error: string
  }>
}

export function CreateTestUsers() {
  const { t } = useLanguage()
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<CreateUsersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createUsers = async () => {
    setIsCreating(true)
    setError(null)
    setResult(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-test-users', {
        body: {},
      })

      if (fnError) {
        setError(`Error en la función: ${fnError.message}`)
        return
      }

      if (data) {
        setResult(data)
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setIsCreating(false)
    }
  }

  const getRoleStats = () => {
    if (!result?.users) return null

    const stats = result.users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return stats
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Crear 30 Usuarios de Prueba</CardTitle>
        <CardDescription>
          Crea usuarios de ejemplo usando Supabase Edge Function (10 admin, 10 empleados, 10
          clientes)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!result && !error && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                ⚠️ <strong>Importante:</strong> Esta acción creará 30 usuarios reales en tu base de
                datos de Supabase. Los usuarios tendrán contraseña temporal:{' '}
                <code>TestPassword123!</code>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Se crearán:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 10 usuarios admin (dueños de negocios)</li>
                <li>• 10 empleados (para asignar a negocios)</li>
                <li>• 10 clientes (usuarios finales)</li>
              </ul>
            </div>

            <Button onClick={createUsers} disabled={isCreating} className="w-full">
              {isCreating ? 'Creando usuarios...' : '🚀 Crear Usuarios de Prueba'}
            </Button>
          </div>
        )}

        {isCreating && (
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">
              Creando usuarios en Supabase...
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Alert className={result.errors.length > 0 ? 'border-orange-200' : 'border-green-200'}>
              <AlertDescription>
                ✅ <strong>{result.created_users} usuarios creados exitosamente</strong>
                {result.errors.length > 0 && (
                  <>
                    <br />❌ <strong>{result.errors.length} errores encontrados</strong>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {result.users.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Usuarios por rol:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {Object.entries(getRoleStats() || {}).map(([role, count]) => (
                    <div key={role} className="text-center p-2 bg-muted rounded">
                      <div className="font-medium capitalize">{role}</div>
                      <div className="text-lg font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-orange-600">Errores encontrados:</h4>
                <ul className="text-xs text-orange-600 space-y-1 max-h-32 overflow-y-auto bg-orange-50 p-2 rounded">
                  {result.errors.map(error => (
                    <li key={error.email}>
                      • {error.email}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  setResult(null)
                  setError(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Limpiar Resultados
              </Button>

              <Button
                onClick={createUsers}
                variant="secondary"
                className="flex-1"
                disabled={isCreating}
              >
                Crear Más Usuarios
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
