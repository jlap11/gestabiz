import React from 'react';
import { CreateTestUsers } from '@/components/admin/CreateTestUsers';

export function AdminTestDataPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🛠️ Datos de Prueba</h1>
        <p className="text-muted-foreground">
          Herramientas para crear datos de ejemplo en tu instancia de Supabase
        </p>
      </div>

      <CreateTestUsers />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>💡 Tip: Después de crear usuarios, podrás crear negocios y asignar empleados</p>
      </div>
    </div>
  );
}