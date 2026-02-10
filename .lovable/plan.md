

## Atribución de reminder: saber qué intento convirtió

### Qué pasa hoy

El link del reminder ya lleva UTMs del registro original, pero no indica **qué número de intento** trajo al usuario de vuelta. Si alguien vuelve después del reminder #2, no hay forma de distinguirlo del #1.

### Solución

Agregar `utm_content=reminder_N` al link del email de reminder (donde N es 1, 2 o 3). Ese valor ya se guarda automáticamente en `records_3d.utm_content` cuando el usuario completa una nueva medición.

### Cambios

**1 solo archivo**: `supabase/functions/send-reminders/index.ts`

En la función `buildReminderLink`, recibir el `reminder_attempt` y setearlo como UTM content:

```
params.set('utm_content', `reminder_${attempt}`);
```

Esto sobreescribe el `utm_content` original del primer registro (que típicamente es null o un valor de campaña viejo). El `utm_source` y `utm_medium` originales se mantienen para no perder la atribución de canal.

### Qué ganás

Con una query simple podés saber exactamente qué intento funcionó:

```sql
SELECT utm_content, COUNT(*) 
FROM records_3d 
WHERE utm_content LIKE 'reminder_%' 
GROUP BY utm_content;
```

Resultado ejemplo:
- `reminder_1`: 12 completados
- `reminder_2`: 5 completados  
- `reminder_3`: 2 completados

### Lo que NO cambia

- No se agregan columnas nuevas
- No se modifica `save-result` (ya guarda `utm_content` automáticamente)
- No se modifica la UI
- No se necesita migración de base de datos
