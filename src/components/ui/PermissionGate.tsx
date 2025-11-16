/**
 * PermissionGate - Componente de control de acceso basado en permisos v2.0
 * 
 * Protege secciones de UI según permisos granulares del usuario.
 * Soporta 4 modos de operación para diferentes casos de uso.
 * 
 * @version 2.0.0
 * @date 16/11/2025
 */

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/types';
import { AccessDenied } from './AccessDenied';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export interface PermissionGateProps {
  /** Permiso requerido (ej: 'accounting.view', 'employees.edit') */
  permission: Permission;
  
  /** Componente hijo a renderizar si tiene permiso */
  children: React.ReactNode;
  
  /** Componente a mostrar si NO tiene permiso (default: AccessDenied) */
  fallback?: React.ReactNode;
  
  /** ID del negocio (opcional, usa contexto si no se provee) */
  businessId?: string;
  
  /** Si true, muestra warning en dev pero permite acceso (útil para debugging) */
  showWarning?: boolean;
  
  /** Modo de operación del gate */
  mode?: 'block' | 'hide' | 'disable' | 'warn';
  
  /** Mensaje adicional a mostrar en AccessDenied */
  deniedMessage?: string;
}

/**
 * PermissionGate - Componente de control de acceso basado en permisos v2.0
 * 
 * Soporta 4 modos:
 * - 'block' (default): Muestra AccessDenied si no tiene permiso
 * - 'hide': No renderiza nada (útil para elementos de menú)
 * - 'disable': Renderiza pero deshabilitado con overlay (botones)
 * - 'warn': Solo en dev, muestra alerta pero permite acceso (debugging)
 * 
 * @example Proteger página completa
 * ```tsx
 * <PermissionGate permission="accounting.view">
 *   <AccountingPage />
 * </PermissionGate>
 * ```
 * 
 * @example Con fallback custom
 * ```tsx
 * <PermissionGate 
 *   permission="reports.export" 
 *   fallback={<ContactSupport />}
 * >
 *   <ExportButton />
 * </PermissionGate>
 * ```
 * 
 * @example Ocultar elemento de menú
 * ```tsx
 * <PermissionGate permission="employees.view" mode="hide">
 *   <MenuItem>Empleados</MenuItem>
 * </PermissionGate>
 * ```
 * 
 * @example Botón deshabilitado
 * ```tsx
 * <PermissionGate permission="clients.delete" mode="disable">
 *   <Button>Eliminar Cliente</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  children,
  fallback,
  businessId,
  showWarning = false,
  mode = 'block',
  deniedMessage
}: PermissionGateProps) {
  const { checkPermission, isOwner } = usePermissions(businessId);
  
  // Verificar permiso
  const result = checkPermission(permission);
  const { hasPermission, reason } = result;
  
  // Owners siempre pasan (bypass total)
  if (isOwner || hasPermission) {
    return <>{children}</>;
  }
  
  // Modo warn - Solo en desarrollo, muestra alert pero permite acceso
  if ((showWarning || mode === 'warn') && process.env.NODE_ENV === 'development') {
    return (
      <>
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ Permiso faltante (DEV only):</strong> {permission}
            <br />
            <span className="text-xs text-muted-foreground">{reason}</span>
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }
  
  // Modo hide - No renderiza nada (útil para menús condicionales)
  if (mode === 'hide') {
    return null;
  }
  
  // Modo disable - Renderiza pero bloqueado con overlay
  if (mode === 'disable') {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 bg-background/30 flex items-center justify-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground px-3 py-1 bg-background/90 rounded-md border">
            🔒 Acceso restringido
          </p>
        </div>
      </div>
    );
  }
  
  // Modo block (default) - Muestra fallback o AccessDenied
  return (
    <>
      {fallback || (
        <AccessDenied 
          permission={permission} 
          reason={reason}
          description={deniedMessage}
        />
      )}
    </>
  );
}
