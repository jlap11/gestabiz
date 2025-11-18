/**
 * Permission Testing Page
 * 
 * Página de prueba para validar funciones RPC de permisos
 * Acceso: Solo OWNERS y admins con permissions.manage
 * 
 * Created: 2025-11-17
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { permissionRPC } from '@/lib/services/permissionRPC';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';

// Tipos para las respuestas de RPC
interface RPCResponse {
  success: boolean;
  message?: string;
  error?: string;
  permission?: string;
}

// Tipo para los resultados (acepta objeto único o array)
type TestResult = RPCResponse | RPCResponse[];

export function PermissionTestingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  
  // Form states
  const [businessId, setBusinessId] = useState('');
  const [userId, setUserId] = useState('');
  const [permission, setPermission] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [notes, setNotes] = useState('');

  // Test 1: Revoke Permission
  const handleRevokePermission = async () => {
    if (!businessId || !userId || !permission) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await permissionRPC.revokePermission(
        businessId,
        userId,
        permission,
        notes || 'Test desde PermissionTestingPage'
      );

      setResult(response);

      if (response.success) {
        toast.success('Permiso revocado exitosamente', {
          description: `Permiso: ${response.permission}`
        });
      } else {
        toast.error('Error al revocar permiso', {
          description: response.message || response.error
        });
      }
    } catch (error) {
      toast.error('Excepción al revocar permiso', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Assign Permission
  const handleAssignPermission = async () => {
    if (!businessId || !userId || !permission) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await permissionRPC.assignPermission(
        businessId,
        userId,
        permission,
        notes || 'Test desde PermissionTestingPage'
      );

      setResult(response);

      if (response.success) {
        toast.success('Permiso asignado exitosamente', {
          description: `Operación: ${response.operation}, Permiso: ${response.permission}`
        });
      } else {
        toast.error('Error al asignar permiso', {
          description: response.message || response.error
        });
      }
    } catch (error) {
      toast.error('Excepción al asignar permiso', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Apply Template
  const handleApplyTemplate = async () => {
    if (!businessId || !userId || !templateId) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await permissionRPC.applyTemplate(
        businessId,
        userId,
        templateId,
        notes || 'Test desde PermissionTestingPage'
      );

      setResult(response);

      if (response.success) {
        toast.success('Template aplicado exitosamente', {
          description: `Template: ${response.template_name}, Permisos: ${response.permissions_applied}`
        });
      } else {
        toast.error('Error al aplicar template', {
          description: response.message || response.error
        });
      }
    } catch (error) {
      toast.error('Excepción al aplicar template', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Bulk Revoke
  const handleBulkRevoke = async () => {
    if (!businessId || !userId || !permission) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const permissions = permission.split(',').map(p => p.trim()).filter(Boolean);

    if (permissions.length === 0) {
      toast.error('Ingresa al menos un permiso (separados por coma)');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const responses = await permissionRPC.bulkRevokePermissions(
        businessId,
        userId,
        permissions,
        notes || 'Bulk revoke test'
      );

      setResult(responses);

      const successful = responses.filter(r => r.success).length;
      const failed = responses.length - successful;

      if (failed === 0) {
        toast.success(`Revocados ${successful} permisos exitosamente`);
      } else {
        toast.warning(`Revocados ${successful}/${responses.length} permisos`, {
          description: `${failed} fallidos`
        });
      }
    } catch (error) {
      toast.error('Excepción en bulk revoke', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Bulk Assign
  const handleBulkAssign = async () => {
    if (!businessId || !userId || !permission) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const permissions = permission.split(',').map(p => p.trim()).filter(Boolean);

    if (permissions.length === 0) {
      toast.error('Ingresa al menos un permiso (separados por coma)');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const responses = await permissionRPC.bulkAssignPermissions(
        businessId,
        userId,
        permissions,
        notes || 'Bulk assign test'
      );

      setResult(responses);

      const successful = responses.filter(r => r.success).length;
      const failed = responses.length - successful;

      if (failed === 0) {
        toast.success(`Asignados ${successful} permisos exitosamente`);
      } else {
        toast.warning(`Asignados ${successful}/${responses.length} permisos`, {
          description: `${failed} fallidos`
        });
      }
    } catch (error) {
      toast.error('Excepción en bulk assign', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Permission RPC Testing</h1>
        <p className="text-muted-foreground mt-2">
          Página de prueba para funciones RPC de permisos. Usuario actual: {user?.email}
        </p>
      </div>

      {/* Form de parámetros comunes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Parámetros de Prueba</CardTitle>
          <CardDescription>
            Completa los campos necesarios para cada test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessId">Business ID *</Label>
              <Input
                id="businessId"
                placeholder="uuid-del-negocio"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="userId">User ID *</Label>
              <Input
                id="userId"
                placeholder="uuid-del-usuario"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="permission">
              Permission(s) * <span className="text-xs text-muted-foreground">(separados por coma para bulk)</span>
            </Label>
            <Input
              id="permission"
              placeholder="services.create, appointments.edit"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="templateId">Template ID (solo para Apply Template)</Label>
            <Input
              id="templateId"
              placeholder="uuid-del-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Razón del cambio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Button
          onClick={handleRevokePermission}
          disabled={loading}
          variant="destructive"
          className="h-auto py-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
          <div className="text-left">
            <div className="font-semibold">Test 1: Revoke</div>
            <div className="text-xs font-normal">Revocar 1 permiso</div>
          </div>
        </Button>

        <Button
          onClick={handleAssignPermission}
          disabled={loading}
          variant="default"
          className="h-auto py-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          <div className="text-left">
            <div className="font-semibold">Test 2: Assign</div>
            <div className="text-xs font-normal">Asignar 1 permiso</div>
          </div>
        </Button>

        <Button
          onClick={handleApplyTemplate}
          disabled={loading}
          variant="secondary"
          className="h-auto py-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          <div className="text-left">
            <div className="font-semibold">Test 3: Template</div>
            <div className="text-xs font-normal">Aplicar template</div>
          </div>
        </Button>

        <Button
          onClick={handleBulkRevoke}
          disabled={loading}
          variant="destructive"
          className="h-auto py-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
          <div className="text-left">
            <div className="font-semibold">Test 4: Bulk Revoke</div>
            <div className="text-xs font-normal">Revocar múltiples</div>
          </div>
        </Button>

        <Button
          onClick={handleBulkAssign}
          disabled={loading}
          variant="default"
          className="h-auto py-4"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          <div className="text-left">
            <div className="font-semibold">Test 5: Bulk Assign</div>
            <div className="text-xs font-normal">Asignar múltiples</div>
          </div>
        </Button>
      </div>

      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                if (Array.isArray(result)) {
                  const allSuccess = result.every(r => r.success);
                  const someSuccess = result.some(r => r.success);
                  
                  if (allSuccess) {
                    return (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Resultado: SUCCESS (Todos)
                      </>
                    );
                  } else if (someSuccess) {
                    return (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Resultado: PARCIAL
                      </>
                    );
                  } else {
                    return (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        Resultado: ERROR (Todos)
                      </>
                    );
                  }
                } else {
                  return result.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Resultado: SUCCESS
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      Resultado: ERROR
                    </>
                  );
                }
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Ayuda */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cómo usar:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Completa Business ID y User ID (obtenerlos de Supabase Dashboard)</li>
            <li>Ingresa permiso(s) válido(s): services.create, appointments.edit, etc.</li>
            <li>Para templates, agrega el Template ID de la tabla permission_templates</li>
            <li>Haz clic en el test que quieras ejecutar</li>
            <li>Revisa el resultado en el panel inferior</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}
