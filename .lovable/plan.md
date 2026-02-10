

## Auto-retry de reminders por inaccion

### Por que tiene sentido

- 400 usuarios pidieron reminder, solo 7 volvieron hasta ahora
- Los reminders ni siquiera se enviaron todavia (el primero vence el 26/feb)
- Sin auto-retry, el 98% de esos reminders muere despues de un solo intento
- Ya existen 7 usuarios con multiples reminders pendientes (mediciones duplicadas), confirmando que la dedup es necesaria

### Reglas de negocio

1. Se envia el reminder original (1m o 3m segun eligio el usuario)
2. Si no hay "completion" (nueva medicion del mismo email), se agenda otro reminder 30 dias despues
3. Maximo 3 intentos sin completion
4. Despues del 3er intento sin respuesta: se frena (no baja frecuencia, para no molestar)
5. Cualquier nueva medicion del usuario resetea el ciclo (la completion corta la cadena)
6. Solo un reminder activo (pending) por email a la vez

### Que cuenta como "completion"

Un nuevo registro en `records_3d` para ese email con `created_at` posterior al `created_at` del reminder original. Simple, sin tracking adicional de eventos.

### Dedup

Antes de procesar, la query agrupa por `to_email` y toma solo el reminder mas reciente pendiente. Si hay varios (por mediciones multiples), se procesan en orden pero nunca se crean duplicados.

### Cambios a implementar

#### 1. Migracion: agregar columna `reminder_attempt`

```sql
ALTER TABLE outbound_emails 
  ADD COLUMN reminder_attempt integer NOT NULL DEFAULT 1;
```

Los 409 reminders existentes quedan con `reminder_attempt = 1` automaticamente.

#### 2. Modificar `send-reminders/index.ts`

Logica nueva despues de enviar exitosamente un reminder:

```
1. Buscar si el usuario "completo" (nuevo record en records_3d 
   con created_at > fecha del record original)
2. Si NO completo Y attempt < 3:
   - Verificar que no exista otro reminder pending para ese email
   - Crear nuevo outbound_email con:
     - scheduled_for = now + 30 dias
     - reminder_attempt = current + 1
     - mismo record_id (para mantener referencia al original)
3. Si completo: no hacer nada (ciclo terminado)
4. Si attempt >= 3: no hacer nada (maximo alcanzado)
```

La query principal tambien cambia para deduplicar: si un email tiene multiples reminders pending, procesa solo el de `scheduled_for` mas antiguo.

#### 3. Actualizar contenido del email segun intento

- Intento 1: "Hace 1 mes mediste tu 3D:" (el actual)
- Intento 2: "Hace 2 meses mediste tu 3D:" (ajustar periodo)
- Intento 3: "Hace 3 meses mediste tu 3D:" (ultimo empujon)

El calculo del tiempo se hace con la diferencia entre `now()` y `records_3d.created_at` del record original, redondeado a meses.

### Detalles tecnicos

**Query principal con dedup:**
```sql
SELECT DISTINCT ON (to_email) 
  id, record_id, to_email, reminder_attempt
FROM outbound_emails
WHERE email_type = 'reminder'
  AND status = 'pending'
  AND scheduled_for <= now()
ORDER BY to_email, scheduled_for ASC
LIMIT 20
```

**Check de completion:**
```sql
SELECT id FROM records_3d
WHERE email = $to_email
  AND created_at > (
    SELECT created_at FROM records_3d WHERE id = $record_id
  )
LIMIT 1
```

**Prevencion de duplicados al crear follow-up:**
```sql
SELECT id FROM outbound_emails
WHERE to_email = $email
  AND email_type = 'reminder'
  AND status = 'pending'
LIMIT 1
```

Si existe, no crea otro.

### Archivos afectados

- **Migracion SQL**: agregar `reminder_attempt` a `outbound_emails`
- **Modificar**: `supabase/functions/send-reminders/index.ts` (dedup, auto-retry, periodo dinamico)

### Lo que NO cambia

- `save-result` sigue creando el primer reminder igual que hoy
- La UI de seleccion de periodo (1m/3m) sigue igual
- El formato basico del email se mantiene frio y transaccional
- No se agregan tablas nuevas ni campos de tracking extra

