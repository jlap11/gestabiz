# Sistema de Chat - Instalación Manual

## ⚠️ INSTRUCCIONES

Las tablas y funciones del sistema de chat deben ejecutarse manualmente en Supabase.

### Pasos:

1. **Abrir Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/editor

2. **Abrir SQL Editor**
   - Click en "SQL Editor" en el menú lateral izquierdo
   - Click en "+ New query"

3. **Copiar y ejecutar el SQL**
   - Abre el archivo: `supabase/migrations/20251015000000_chat_system_complete.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Click en "Run" o presiona Ctrl+Enter

4. **Verificar instalación**
   - Deberías ver mensaje de éxito
   - Verifica que aparecen las siguientes tablas en "Table Editor":
     - chat_conversations
     - chat_participants  
     - chat_messages
     - chat_typing_indicators

5. **Verificar funciones RPC**
   - Ve a "Database" → "Functions"
   - Deberías ver:
     - get_or_create_direct_conversation
     - send_message
     - mark_messages_as_read
     - get_conversation_with_participants
     - cleanup_expired_typing_indicators

## ✅ Verificación Rápida

Ejecuta esta query para verificar que todo está instalado:

```sql
SELECT 
  'chat_conversations' as table_name,
  count(*) as row_count
FROM chat_conversations
UNION ALL
SELECT 'chat_participants', count(*) FROM chat_participants
UNION ALL
SELECT 'chat_messages', count(*) FROM chat_messages
UNION ALL  
SELECT 'chat_typing_indicators', count(*) FROM chat_typing_indicators;
```

Si ves 4 filas (aunque el count sea 0), las tablas existen correctamente.

## 🔧 Troubleshooting

### Error: "relation already exists"
- ✅ **Normal**: Significa que la tabla ya existe
- **Solución**: Continúa ejecutando el resto del script

### Error: "function already exists"
- ✅ **Normal**: Las funciones se reemplazan automáticamente con `CREATE OR REPLACE`
- **Solución**: Continúa ejecutando

### Error: "permission denied"
- ❌ **Problema**: No tienes permisos de administrador
- **Solución**: 
  1. Ve a Supabase Dashboard
  2. Settings → Database
  3. Verifica que estás usando el password correcto
  4. Asegúrate de estar en el proyecto correcto

## 📝 Notas

- Este script es **idempotente**: Puedes ejecutarlo múltiples veces sin problema
- Las políticas RLS se recrean automáticamente (DROP IF EXISTS + CREATE)
- Los índices se crean solo si no existen (CREATE INDEX IF NOT EXISTS)

## 🎯 Próximos Pasos

Después de ejecutar el SQL:

1. Refresca la aplicación (F5)
2. Intenta crear una cita
3. Click en "Chatear con el profesional"
4. Deberías ver el chat abierto sin errores

---

**Archivo SQL**: `supabase/migrations/20251015000000_chat_system_complete.sql`  
**Fecha**: 15 de octubre de 2025
