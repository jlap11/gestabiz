import React, { useState } from 'react';
import { Flask, Warning, Rocket } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface TestUser {
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'employee' | 'client';
}

const testUsers: TestUser[] = [
  // Admins (10)
  { email: 'maria.rodriguez@example.com', name: 'María Rodríguez', phone: '+52 55 1234 5678', role: 'admin' },
  { email: 'carlos.garcia@example.com', name: 'Carlos García', phone: '+52 33 2345 6789', role: 'admin' },
  { email: 'ana.martinez@example.com', name: 'Ana Martínez', phone: '+52 81 3456 7890', role: 'admin' },
  { email: 'luis.hernandez@example.com', name: 'Luis Hernández', phone: '+52 55 4567 8901', role: 'admin' },
  { email: 'sofia.lopez@example.com', name: 'Sofía López', phone: '+52 33 5678 9012', role: 'admin' },
  { email: 'diego.morales@example.com', name: 'Diego Morales', phone: '+52 81 6789 0123', role: 'admin' },
  { email: 'valeria.cruz@example.com', name: 'Valeria Cruz', phone: '+52 55 7890 1234', role: 'admin' },
  { email: 'ricardo.jimenez@example.com', name: 'Ricardo Jiménez', phone: '+52 33 8901 2345', role: 'admin' },
  { email: 'camila.ruiz@example.com', name: 'Camila Ruiz', phone: '+52 81 9012 3456', role: 'admin' },
  { email: 'fernando.castillo@example.com', name: 'Fernando Castillo', phone: '+52 55 0123 4567', role: 'admin' },
  
  // Empleados (10)
  { email: 'elena.vargas@example.com', name: 'Elena Vargas', phone: '+52 33 1111 2222', role: 'employee' },
  { email: 'pablo.soto@example.com', name: 'Pablo Soto', phone: '+52 81 3333 4444', role: 'employee' },
  { email: 'natalia.reyes@example.com', name: 'Natalia Reyes', phone: '+52 55 5555 6666', role: 'employee' },
  { email: 'andres.torres@example.com', name: 'Andrés Torres', phone: '+52 33 7777 8888', role: 'employee' },
  { email: 'isabella.mendez@example.com', name: 'Isabella Méndez', phone: '+52 81 9999 0000', role: 'employee' },
  { email: 'miguel.romero@example.com', name: 'Miguel Romero', phone: '+52 55 1212 3434', role: 'employee' },
  { email: 'adriana.silva@example.com', name: 'Adriana Silva', phone: '+52 33 5656 7878', role: 'employee' },
  { email: 'javier.paredes@example.com', name: 'Javier Paredes', phone: '+52 81 9090 1212', role: 'employee' },
  { email: 'larissa.gutierrez@example.com', name: 'Larissa Gutiérrez', phone: '+52 55 3434 5656', role: 'employee' },
  { email: 'oscar.navarro@example.com', name: 'Oscar Navarro', phone: '+52 33 7878 9090', role: 'employee' },
  
  // Clientes (10)
  { email: 'lucia.moreno@example.com', name: 'Lucía Moreno', phone: '+52 81 2468 1357', role: 'client' },
  { email: 'alberto.vega@example.com', name: 'Alberto Vega', phone: '+52 55 9876 5432', role: 'client' },
  { email: 'patricia.ortega@example.com', name: 'Patricia Ortega', phone: '+52 33 1357 9246', role: 'client' },
  { email: 'gabriel.delgado@example.com', name: 'Gabriel Delgado', phone: '+52 81 8642 9753', role: 'client' },
  { email: 'daniela.campos@example.com', name: 'Daniela Campos', phone: '+52 55 7531 8642', role: 'client' },
  { email: 'roberto.aguilar@example.com', name: 'Roberto Aguilar', phone: '+52 33 9642 7531', role: 'client' },
  { email: 'monica.herrera@example.com', name: 'Mónica Herrera', phone: '+52 81 3579 1468', role: 'client' },
  { email: 'sergio.ramos@example.com', name: 'Sergio Ramos', phone: '+52 55 8024 6913', role: 'client' },
  { email: 'teresa.flores@example.com', name: 'Teresa Flores', phone: '+52 33 4682 5791', role: 'client' },
  { email: 'emilio.santos@example.com', name: 'Emilio Santos', phone: '+52 81 7139 4826', role: 'client' }
];

export function TestDataSeeder() {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] });
  const [currentUser] = useState<string>('');

  const createTestUsers = async () => {
    setIsCreating(true);
    setProgress(0);
    setResults({ success: 0, errors: [] });

    try {
      const response = await fetch('/api/create-test-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: testUsers }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults({ success: data.created_users, errors: data.errors || [] });
      } else {
        setResults({ success: 0, errors: [data.error || 'Error desconocido'] });
      }
    } catch (error) {
      setResults({ success: 0, errors: [error.message] });
    } finally {
      setIsCreating(false);
      setProgress(100);
    }
  };



  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flask size={24} weight="fill" /> Crear Usuarios de Prueba
        </CardTitle>
        <CardDescription>
          Crea 30 usuarios de ejemplo (10 admin, 10 empleados, 10 clientes) para pruebas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isCreating && results.success === 0 && results.errors.length === 0 && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="flex items-start gap-2">
                <Warning size={18} weight="fill" className="mt-0.5 shrink-0" />
                <span>
                  <strong>Importante:</strong> Esta acción requiere permisos de administrador y 
                  creará 30 usuarios reales en tu base de datos de Supabase.
                </span>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Se crearán:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 10 usuarios admin (dueños de negocios)</li>
                <li>• 10 empleados (para asignar a negocios)</li>
                <li>• 10 clientes (usuarios finales)</li>
              </ul>
            </div>

            <Button 
              onClick={createTestUsers} 
              className="w-full flex items-center gap-2"
              variant="default"
            >
              <Rocket size={18} weight="fill" /> Crear Usuarios de Prueba
            </Button>
          </div>
        )}

        {isCreating && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            {currentUser && (
              <p className="text-sm text-gray-600">
                Creando: {currentUser}
              </p>
            )}
          </div>
        )}

        {(results.success > 0 || results.errors.length > 0) && !isCreating && (
          <div className="space-y-4">
            <Alert className={results.errors.length > 0 ? "border-orange-200" : "border-green-200"}>
              <AlertDescription>
                ✅ <strong>{results.success} usuarios creados exitosamente</strong>
                {results.errors.length > 0 && (
                  <>
                    <br />
                    ❌ <strong>{results.errors.length} errores encontrados</strong>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Errores:</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {results.errors.map((error) => (
                    <li key={error} className="text-xs">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={() => setResults({ success: 0, errors: [] })} 
              variant="outline"
              className="w-full"
            >
              Limpiar Resultados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}