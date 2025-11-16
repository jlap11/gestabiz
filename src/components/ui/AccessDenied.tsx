/**
 * AccessDenied - Vista estándar de acceso denegado
 * 
 * Muestra mensaje profesional cuando usuario no tiene permisos necesarios.
 * Incluye contexto sobre el permiso faltante y acciones disponibles.
 * 
 * @version 2.0.0
 * @date 16/11/2025
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Mail, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Permission } from '@/types/types';
import { PERMISSION_DESCRIPTIONS } from '@/lib/permissions-v2';

export interface AccessDeniedProps {
  /** Permiso que faltó (opcional, para mostrar más contexto) */
  permission?: Permission;
  
  /** Razón detallada del rechazo (de checkPermission) */
  reason?: string;
  
  /** Título custom (default: "Acceso Denegado") */
  title?: string;
  
  /** Descripción custom (override del mensaje default) */
  description?: string;
  
  /** Mostrar botón de contacto al admin */
  showContactButton?: boolean;
  
  /** Mostrar botón de volver al home */
  showHomeButton?: boolean;
  
  /** Callback al hacer clic en "Volver" */
  onGoBack?: () => void;
}

/**
 * AccessDenied - Vista estándar de acceso denegado
 * 
 * Muestra información contextual sobre el permiso faltante y opciones
 * para volver o contactar al administrador.
 * 
 * @example Básico
 * ```tsx
 * <AccessDenied permission="accounting.view" />
 * ```
 * 
 * @example Con mensaje custom
 * ```tsx
 * <AccessDenied 
 *   title="Módulo Restringido"
 *   description="Este módulo requiere permisos de contador."
 *   showContactButton={true}
 * />
 * ```
 */
export function AccessDenied({
  permission,
  reason,
  title = 'Acceso Denegado',
  description,
  showContactButton = true,
  showHomeButton = true,
  onGoBack
}: AccessDeniedProps) {
  const navigate = useNavigate();
  
  // Obtener descripción amigable del permiso
  const permissionDescription = permission 
    ? PERMISSION_DESCRIPTIONS[permission] 
    : undefined;
  
  // Mensaje default si no se provee uno custom
  const defaultDescription = 'No tienes los permisos necesarios para acceder a esta sección. ' +
    'Contacta al administrador de tu negocio si crees que deberías tener acceso.';
  
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate(-1); // Volver a la página anterior
    }
  };
  
  const handleGoHome = () => {
    navigate('/app'); // Navegar al dashboard principal
  };
  
  const handleContactAdmin = () => {
    // Navegar a página de permisos (donde puede ver qué necesita)
    navigate('/app/admin/permissions');
  };
  
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          {/* Icono de escudo con X */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          
          <CardTitle className="text-2xl">{title}</CardTitle>
          
          <CardDescription className="text-base mt-2">
            {description || defaultDescription}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bloque de permiso faltante */}
          {permission && (
            <div className="bg-muted p-4 rounded-md space-y-2">
              <p className="font-medium text-sm">Permiso requerido:</p>
              <code className="text-xs bg-background px-2 py-1 rounded block font-mono">
                {permission}
              </code>
              
              {permissionDescription && (
                <p className="text-muted-foreground text-xs mt-2">
                  📋 {permissionDescription}
                </p>
              )}
            </div>
          )}
          
          {/* Razón detallada (de checkPermission) */}
          {reason && !permission && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Detalles:</p>
              <p className="text-xs">{reason}</p>
            </div>
          )}
          
          {/* Acciones disponibles */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Botón Volver */}
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            {/* Botón Home */}
            {showHomeButton && (
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            )}
          </div>
          
          {/* Botón Contactar Admin (full width) */}
          {showContactButton && (
            <Button
              variant="default"
              onClick={handleContactAdmin}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Solicitar Acceso al Administrador
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
