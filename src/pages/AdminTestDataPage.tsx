import React from 'react';
import { Wrench, Lightbulb } from '@phosphor-icons/react';
import { CreateTestUsers } from '@/components/admin/CreateTestUsers';

export function AdminTestDataPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Wrench size={32} weight="fill" /> Datos de Prueba
        </h1>
        <p className="text-muted-foreground">
          Herramientas para crear datos de ejemplo en tu instancia de Supabase
        </p>
      </div>

      <CreateTestUsers />
      
      <div className="text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2">
          <Lightbulb size={18} weight="fill" /> Tip: Después de crear usuarios, podrás crear negocios y asignar empleados
        </p>
      </div>
    </div>
  );
}