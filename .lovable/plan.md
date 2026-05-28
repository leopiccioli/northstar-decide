
# Backfill demográfico — Plan de ejecución

El flujo de email + `/completar` ya está testeado y funcionando (confirmado con `leopiccioli@gmail.com`: edad y sector quedaron guardados). Falta decidir cómo activar el envío masivo.

## 1. Universo objetivo

Un email entra al backfill si cumple **todas** estas condiciones:

- Tiene al menos un registro en `records_3d` (reales **o** legacy).
- Su registro **más reciente** no tiene ni `sector` ni `age_range` (le falta al menos uno).
- Nunca recibió un `demographics_backfill` (no existe en `outbound_emails` con ese `email_type`).
- No tuvo bounce/complaint/unsubscribe en `email_events`.

Usamos el registro **más reciente** como base del email (scores, fecha, token = `record_id`).

## 2. Ritmo y ventana

- **100 emails/día**, todos los días.
- Cron: `0 13 * * *` (UTC) → **10:00 AR**.
- Edge function: `send-demographics-backfill` con `{ batch_limit: 100 }` (ya soporta el parámetro).
- Estimado: con ~N pendientes, el backfill termina en ~N/100 días. Antes de activar te muestro el número exacto.

## 3. Infraestructura a agregar

### a) Migration: `pg_cron` job

```sql
SELECT cron.schedule(
  'demographics-backfill-daily',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bcokciysbyuaeodnsxas.supabase.co/functions/v1/send-demographics-backfill',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer <SERVICE_ROLE_KEY>'
    ),
    body := jsonb_build_object('batch_limit', 100)
  ) AS request_id;
  $$
);
```

(El service role key se inyecta vía secret `SUPABASE_SERVICE_ROLE_KEY`.)

### b) Función SQL `get_pending_demographics_backfill(batch_limit int)`

Para que la edge function tome el batch con una sola query, en vez de filtrar en JS:

- Devuelve `email`, `record_id` (el más reciente), `dinero`, `desarrollo`, `diversion`, `created_at`, `has_sector`, `has_age`.
- Excluye: ya notificados (`demographics_backfill`), bounces/complaints/unsubscribes.
- `LIMIT batch_limit`.

Esto reemplaza la lógica actual de la edge function (que hoy filtra en memoria y no escala bien).

### c) Ajuste en `send-demographics-backfill`

- Si **no** viene `test_email`, llamar a `get_pending_demographics_backfill(batch_limit)` en vez del flujo actual.
- Registrar cada envío en `outbound_emails` con `email_type='demographics_backfill'` y `record_id` (clave para no re-enviar).
- Mantener el modo `test_email` para QA puntual.

## 4. Salvaguardas

- **Idempotencia**: `outbound_emails` actúa como ledger. Si la función corre dos veces el mismo día, el segundo batch excluye los ya notificados.
- **Pausa de emergencia**: `SELECT cron.unschedule('demographics-backfill-daily');`
- **Throttle Resend**: 100/día queda muy por debajo del límite del plan.
- **Observabilidad**: cada corrida loguea `{ sent, skipped, errors }`. Podemos consultar `outbound_emails` filtrando por `email_type` y fecha.

## 5. Orden de ejecución propuesto

1. Crear la función SQL `get_pending_demographics_backfill` + un `SELECT count(*)` para ver el universo real.
2. Te muestro el número (ej.: "hay 1.247 pendientes, ~13 días").
3. Refactor de `send-demographics-backfill` para usar la nueva función.
4. Correr 1 batch manual con `batch_limit: 5` como dry-run (a emails reales pero pequeño).
5. Si OK, agendar el cron diario.

## 6. Decisión pendiente

¿Arrancamos por el paso 1 (crear la función SQL + contar el universo) y con ese número decidimos si 100/día está bien o lo ajustamos?
