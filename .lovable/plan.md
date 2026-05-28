
# Backfill demographics — email con CTA inline

## Idea central

El mail no manda a un form: ofrece 2 caminos.
1. Rehacer las 3D (medirse de nuevo).
2. Tocar un chip de edad → la landing guarda esa edad automáticamente y solo pide el sector.

## Copy del email

**From:** `3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>`
**Asunto:** `Hace 3 meses hiciste las 3D — ¿cómo te comparás por edad?`
(el tiempo se calcula por record; ej. "Hace 12 días", "Hace 1 año")

**Cuerpo (HTML minimal, mismo estilo receipt):**

```
Hace 3 meses (15/02/2026) completaste las 3D:

Dinero        6
Desarrollo    8
Diversión     4

Sumamos comparaciones por sector y edad (como ya hacemos por país: 
https://3d.ceoencamiseta.com/por-pais).

Para que tu medición aparezca en esas comparaciones, faltan dos datos.

Dos opciones:

1. Hacé las 3D de nuevo — te evaluás hoy y completamos los datos:
   https://3d.ceoencamiseta.com/?email=...&utm_campaign=demographics_backfill&utm_content=redo

2. Tocá tu edad y la sumamos ahora:
   [18-24]  [25-34]  [35-44]  [45-54]  [55-64]  [65+]
   
   (cada chip es un link a /completar?token=XXX&age=25-34)

Después te pido el sector en 1 click más.

Leo
```

- Si el record ya tiene sector o edad, mostramos los dos caminos igual (mail unificado). La landing detecta qué falta.
- Sin reintentos.

## Landing `/completar?token=XXX&age=YY`

Componente nuevo `CompletarPage.tsx`. Flujo de 2 pasos según qué falta:

**Paso 1 — guardar edad automáticamente (si vino `age` en URL y el record no tenía):**
- Al montar, llama `update-demographics { token, ageRange }`.
- Muestra: "Listo, gracias. 35-44 guardado."
- Si todavía falta sector → pasa a Paso 2.

**Paso 2 — pedir sector:**
- "Solo falta tu sector:" + `<SectorCombobox />`.
- Al elegir, guarda automáticamente (sin botón submit).

**Paso 3 — confirmación:**
```
Listo. Gracias.

Mirá cómo te comparás:
[Por edad]  [Por sector]

¿Pasaron unos meses? Hacé las 3D de nuevo:
[Medirme otra vez]
```

Casos borde:
- Si no vino `age` en URL → Paso 1 = chips de edad inline en la landing + combobox de sector debajo (form completo).
- Si ya tenía edad y sector → "Ya teníamos tus datos. Gracias." + links a /por-edad, /por-sector.
- Token inválido o expirado → "Link no válido" + link al home.

## Backend

### Migration
- Add `'demographics_backfill'` al CHECK constraint de `outbound_emails.email_type`.

### Edge functions (3 nuevas)

1. **`get-record-for-backfill`** — POST `{ token }` → devuelve `{ email_masked, sector, age_range, days_since, dinero, desarrollo, diversion, created_at }`. Rate limit 10/min/IP.

2. **`update-demographics`** — POST `{ token, sector?, ageRange? }` → valida contra `SECTORS` / `AGE_RANGES`, hace UPDATE del record asociado al token. Rate limit 10/min/IP.

3. **`send-demographics-backfill`** — POST `{ batch_limit: 100 }`. Query: `records_3d` con `sector IS NULL OR age_range IS NULL`, último por email, excluyendo emails ya en `outbound_emails` con `email_type='demographics_backfill'`. Renderiza HTML con chips de edad (links a `/completar?token=<id>&age=<range>&utm_*`), envía vía Resend, registra en `outbound_emails`.

### Cron
- `pg_cron` diario a las 10:00 UTC (7am AR) llamando `send-demographics-backfill` con `batch_limit: 100`. **No se activa todavía** — primero test manual con `batch_limit: 5`.

### Ruta
- Agregar `/completar` en `App.tsx` (lazy).

## Tracking
- UTMs en todos los links del mail: `utm_source=3d&utm_medium=email&utm_campaign=demographics_backfill&utm_content=age_chip|redo|por_pais`.
- `trackFlowEvent('demographics_backfill_completed', { source: 'age_chip'|'form', has_sector, has_age })` en la landing.

## Orden de ejecución
1. Migration (CHECK constraint).
2. Edge functions + deploy.
3. `CompletarPage.tsx` + ruta.
4. Test manual con `batch_limit: 5` a emails de prueba.
5. Revisar copy + rendering en gmail/outlook.
6. Activar cron diario.

## Archivos a crear/tocar
- `supabase/migrations/<ts>_demographics_backfill_constraint.sql`
- `supabase/functions/get-record-for-backfill/index.ts`
- `supabase/functions/update-demographics/index.ts`
- `supabase/functions/send-demographics-backfill/index.ts`
- `src/pages/CompletarPage.tsx`
- `src/components/decision/CompleteDemographicsForm.tsx` (chips + combobox reutilizable)
- `src/App.tsx` (ruta nueva)
- `.lovable/backfill-demographics.md` (actualizar con copy final)
