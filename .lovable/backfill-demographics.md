# Campaña retroactiva: pedir sector y edad a usuarios existentes

**Estado:** Diferida — pendiente de ejecutar.

## Objetivo

Pedirles sector y rango etáreo a quienes ya respondieron 3D para enriquecer las estadísticas (`/por-sector` y `/por-edad`) sin esperar a que vuelvan a medirse.

## Mensaje

- **Asunto:** `¡Novedades en 3D! ¿Cómo te comparás con otros sectores?`
- **From:** `3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>` (mismo `SITE_CONFIG.emailFrom`).
- **Tono:** ultra-minimal, mismo estilo receipt-like que los demás emails.
- **Cuerpo sugerido (revisar antes de enviar):**

  ```
  Sumamos páginas nuevas para ver el 3D por sector y por edad.

  Para que tu medición aparezca en esas comparaciones, falta un dato:

  [Completar en 30 segundos](https://3d.ceoencamiseta.com/completar?token=<RECORD_ID>&utm_source=3d&utm_medium=email&utm_campaign=demographics_backfill)

  Si no querés, ignorá este email — no te volvemos a escribir por esto.

  Leo
  ```

- **Sin reintentos.** Si no abren / no completan, no se manda recordatorio.

## Audiencia

Emails únicos en `records_3d` donde:
- `sector IS NULL` Y `age_range IS NULL` (último record por email).
- NO existe ya un `outbound_emails` con `email_type = 'demographics_backfill'` para ese email (anti-duplicado, igual patrón que `legacy_notification`).
- Incluir tanto usuarios reales como `option_name = 'legacy'` (definir en el momento de enviar).

Query base:
```sql
WITH latest AS (
  SELECT DISTINCT ON (LOWER(email))
    id, LOWER(email) AS email, sector, age_range
  FROM public.records_3d
  ORDER BY LOWER(email), created_at DESC
),
notified AS (
  SELECT DISTINCT LOWER(to_email) AS email
  FROM public.outbound_emails
  WHERE email_type = 'demographics_backfill'
)
SELECT l.id, l.email
FROM latest l
LEFT JOIN notified n ON l.email = n.email
WHERE l.sector IS NULL AND l.age_range IS NULL
  AND n.email IS NULL;
```

## Mecánica

1. **Landing pública `/completar?token=<record_id>`** (no expone email):
   - Edge function `get-record-for-backfill` valida el token y devuelve el email enmascarado + sector/age_range actuales (si hay).
   - UI con `SectorCombobox` + `AgeRangeChips` + botón "Guardar".
   - Edge function `update-demographics` recibe `{ token, sector, ageRange }`, valida contra `ALLOWED_SECTORS` / `ALLOWED_AGE_RANGES` y hace `UPDATE` sobre el último record del email asociado al token (no crea registros nuevos).
   - Confirmación: `Listo. Gracias.` + link al tool.

2. **Edge function `send-demographics-backfill`**:
   - Recibe `{ batch_limit: number }`, por defecto 50.
   - Recorre la audiencia y envía vía Resend.
   - Registra cada envío en `outbound_emails` con `email_type = 'demographics_backfill'`.
   - Antes de la primera ejecución: sumar `'demographics_backfill'` al CHECK constraint de `outbound_emails.email_type`.

3. **Tracking de conversiones:**
   - UTMs en el link: `utm_source=3d&utm_medium=email&utm_campaign=demographics_backfill`.
   - Se puede medir conversión cruzando `email_events` (clicks) con `records_3d` (sector/age completado después del envío).

## Pendiente de decidir antes de ejecutar

- ¿Permitir editar país desde la landing también, o estricto sector + edad?
- ¿Incluir emails de import legacy (CSV) o solo emails de mediciones reales?
- ¿Tamaño y ritmo de batches (todos de una vs 100/día)?

## Archivos a crear cuando se ejecute

- `src/pages/CompletarPage.tsx`
- `src/components/decision/CompleteDemographicsForm.tsx`
- `supabase/functions/get-record-for-backfill/index.ts`
- `supabase/functions/update-demographics/index.ts`
- `supabase/functions/send-demographics-backfill/index.ts`
- Migration: sumar `demographics_backfill` al CHECK constraint de `outbound_emails.email_type`.
- Ruta `/completar` en `App.tsx`.
