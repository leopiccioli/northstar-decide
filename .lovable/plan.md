## Reducir costos de Lovable Cloud — Ronda 2

### Diagnóstico real (los números importan)

La DB **no son 9 MB, son 269 MB**. El 91% es basura de cron y http logs:

| Tabla | Tamaño | Qué es |
|---|---|---|
| `net._http_response` | **154 MB** | Respuestas HTTP de cada `net.http_post` que dispara el cron |
| `cron.job_run_details` | **91 MB** | Historial de cada ejecución de cron |
| `records_3d` (datos reales) | 9 MB | OK |
| `outbound_emails` | 3 MB | OK |
| Resto | <1 MB | OK |

Y la causa raíz de las invocaciones de edge functions:

| Cron | Frecuencia | Corridas en 3 meses | Estado |
|---|---|---|---|
| `send-legacy-notifications-batch` | **cada 1 min** | **129.405** | **Pendientes hoy: 0**. Lleva semanas invocando al pedo. |
| `send-pending-reminders` | cada 1 hora | 1.846 | OK pero excesivo: solo 3 mediciones/día |
| `refresh-country-stats-daily` | diario | 90 | OK |

Tráfico real del sitio: ~3 mediciones/día. El cron de legacy invoca la edge function **1.440 veces/día sin razón**.

### Plan de acción

#### 1. Eliminar el cron de legacy notifications (ahorro masivo)
Ya no quedan legacy pendientes (`count_pending_legacy_notifications() = 0`). Borrar el cron job `send-legacy-notifications-batch`.
- **Ahorro**: ~43.000 invocaciones/mes de edge function + crecimiento detenido de `_http_response`.
- Si en el futuro hace falta reactivarlo (improbable), se puede correr la función a mano una vez.

#### 2. Bajar frecuencia del cron de reminders
`send-pending-reminders` corre cada hora con 3 mediciones/día de tráfico. Pasarlo a **2 veces por día** (ej: 9:00 y 21:00 UTC) es más que suficiente.
- **Ahorro**: ~720 invocaciones/mes → ~60/mes (12x menos).

#### 3. Limpiar las 245 MB de basura acumulada
Truncar `net._http_response` y `cron.job_run_details` (son tablas de log, no contienen datos del negocio).
- **Ahorro**: DB pasa de 269 MB → ~25 MB. Esto reduce costo de instancia y de backups.

#### 4. Configurar retention para que no vuelva a crecer
Programar un cron diario que borre filas de `net._http_response` y `cron.job_run_details` con más de 7 días. Así nunca más vuelve a inflarse.

#### 5. Eliminar la edge function `send-legacy-notification`
Si el cron desaparece y ya está todo notificado, la función queda muerta. Borrarla del proyecto y de `supabase/config.toml`.
- **Ahorro adicional**: una función menos desplegada.

### Impacto estimado total

- **Invocaciones edge functions: -98%** (de ~44.000/mes a ~700/mes).
- **Tamaño DB: -90%** (de 269 MB a ~25 MB).
- **Cero cambios de UX**. Reminders siguen funcionando, solo se procesan 2x/día en vez de 24x/día.

### Detalle técnico

**Migración SQL:**
```sql
-- 1. Borrar cron muerto
SELECT cron.unschedule('send-legacy-notifications-batch');

-- 2. Bajar frecuencia de reminders a 2x/día
SELECT cron.unschedule('send-pending-reminders');
SELECT cron.schedule(
  'send-pending-reminders',
  '0 9,21 * * *',
  $$ select net.http_post(
    url:='https://bcokciysbyuaeodnsxas.supabase.co/functions/v1/send-reminders',
    headers:='{...}'::jsonb,
    body:='{}'::jsonb
  ); $$
);

-- 3. Limpiar basura acumulada
TRUNCATE net._http_response;
DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days';

-- 4. Cron diario de limpieza para que no vuelva a crecer
SELECT cron.schedule(
  'cleanup-system-logs-daily',
  '0 4 * * *',
  $$
    DELETE FROM net._http_response WHERE created < now() - interval '7 days';
    DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days';
  $$
);
```

**Archivos a eliminar:**
- `supabase/functions/send-legacy-notification/` (directorio completo)
- Su entrada en `supabase/config.toml`

### Lo que NO se toca
- Reminders siguen funcionando (solo más espaciados).
- `refresh_country_stats` diario sigue igual.
- `save-result`, `resend-measurement`, `import-legacy-csv`, `send-reminders` siguen activas.
- Ningún dato de usuarios se borra.
