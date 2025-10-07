# 🚀 Script Node.js para Crear Usuarios de Prueba

## 📋 Requisitos

1. **Node.js** (versión 18 o superior)
2. **Service Role Key** de Supabase

## ⚙️ Configuración

### 1. Obtener Service Role Key

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/settings/api
2. En la sección "Project API keys", copia la **Service Role Key** (secret)
3. **⚠️ IMPORTANTE**: Esta clave tiene permisos de administrador, nunca la expongas en frontend

### 2. Configurar variables de entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://dkancockzvcqorqbwtyh.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

## 🚀 Ejecutar el script

```bash
# Desde la raíz del proyecto
node scripts/create-test-users.mjs
```

## 📊 Qué hace el script

El script creará **30 usuarios** automáticamente:

### 👑 10 Administradores (dueños de negocios)
- maria.rodriguez@example.com - María Rodríguez
- carlos.garcia@example.com - Carlos García
- ana.martinez@example.com - Ana Martínez
- luis.hernandez@example.com - Luis Hernández
- sofia.lopez@example.com - Sofía López
- diego.morales@example.com - Diego Morales
- valeria.cruz@example.com - Valeria Cruz
- ricardo.jimenez@example.com - Ricardo Jiménez
- camila.ruiz@example.com - Camila Ruiz
- fernando.castillo@example.com - Fernando Castillo

### 👨‍💼 10 Empleados
- elena.vargas@example.com - Elena Vargas
- pablo.soto@example.com - Pablo Soto
- natalia.reyes@example.com - Natalia Reyes
- andres.torres@example.com - Andrés Torres
- isabella.mendez@example.com - Isabella Méndez
- miguel.romero@example.com - Miguel Romero
- adriana.silva@example.com - Adriana Silva
- javier.paredes@example.com - Javier Paredes
- larissa.gutierrez@example.com - Larissa Gutiérrez
- oscar.navarro@example.com - Oscar Navarro

### 👥 10 Clientes
- lucia.moreno@example.com - Lucía Moreno
- alberto.vega@example.com - Alberto Vega
- patricia.ortega@example.com - Patricia Ortega
- gabriel.delgado@example.com - Gabriel Delgado
- daniela.campos@example.com - Daniela Campos
- roberto.aguilar@example.com - Roberto Aguilar
- monica.herrera@example.com - Mónica Herrera
- sergio.ramos@example.com - Sergio Ramos
- teresa.flores@example.com - Teresa Flores
- emilio.santos@example.com - Emilio Santos

## 🔑 Datos de acceso

- **Contraseña temporal**: `TestPassword123!` (para todos los usuarios)
- **Email confirmado**: Automáticamente
- **Estado**: Activos

## 📄 Archivos generados

El script generará:
- `usuarios_creados.csv` - Lista de todos los usuarios creados con sus IDs

## 🛡️ Seguridad

- ✅ Usa Service Role Key de forma segura
- ✅ Crea usuarios en `auth.users` y perfiles en `public.profiles`
- ✅ Maneja errores y rate limiting
- ✅ No expone claves sensibles

## 📝 Logs del script

El script mostrará:
- ⏳ Progreso en tiempo real
- ✅ Usuarios creados exitosamente
- ❌ Errores encontrados
- 📊 Resumen final por roles
- ⏱️ Tiempo transcurrido

## 🔧 Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY no está configurada"
- Verifica que agregaste la clave al archivo `.env`
- La clave debe empezar con `eyJhbG...`

### Error: "Invalid JWT" o "Unauthorized"  
- Verifica que la Service Role Key sea correcta
- Asegúrate de no usar la Anon Key por error

### Error: "User already exists"
- El script continuará con los siguientes usuarios
- Los errores se mostrarán en el resumen final

## ⏭️ Próximos pasos

Después de crear los usuarios:
1. Actualizar negocios para asignar owners reales
2. Distribuir empleados entre negocios  
3. Generar CSV final con todos los datos