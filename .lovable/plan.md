## Objetivo

Propagar `sector` y `age_range` desde el registro más reciente de cada email hacia los registros anteriores del mismo email que los tengan en `NULL`, y refrescar los caches de estadísticas para que `/por-sector` y `/por-edad` reflejen los nuevos datos.

## Alcance

- Solo registros existentes en `records_3d`.
- Solo se rellenan campos `NULL` (nunca se sobrescribe un valor ya cargado).
- Por cada email se toma el valor **más reciente** (`created_at DESC`) de cada campo de forma independiente — si el último cargó solo sector, ese sector se propaga; si otro registro previo cargó age, se propaga ese age.
- Estimación previa: ~336 registros ganan sector y ~338 ganan edad.

## Pasos

1. **Backfill en una sola transacción** (vía herramienta de migración, ya que es un `UPDATE` masivo):
   - Calcular por email el `sector` más reciente no nulo y el `age_range` más reciente no nulo (`DISTINCT ON`).
   - Hacer `UPDATE records_3d` solo en filas con el campo en `NULL` y que tengan email con dato disponible.
   - Pasa por el trigger `validate_demographics` que limpia valores fuera del catálogo permitido — comportamiento deseado.

2. **Refrescar caches**: `SELECT public.refresh_all_stats();` para que `/por-sector` y `/por-edad` muestren los conteos y promedios actualizados.

3. **Verificación**: query de control comparando el conteo de registros con sector/edad antes/después y mostrando el delta.

## Lo que NO se toca

- Código de la app, edge functions, RLS, triggers, schema, otros campos de `records_3d`.
- Flujo de medición, emails, recordatorios.
- Email de `demographics_backfill` (sigue capturando nuevos casos a futuro).

## Riesgo

- Bajo. Es un `UPDATE` idempotente acotado a ~670 filas. Si se vuelve a correr no hace nada nuevo (solo toca `NULL`s).
- No hay `updated_at` en `records_3d`, así que no se altera ningún timestamp visible.

## Detalle técnico (SQL que se enviará)

```sql
WITH latest_sector AS (
  SELECT DISTINCT ON (LOWER(email)) LOWER(email) AS email_lc, sector
  FROM records_3d
  WHERE email IS NOT NULL AND sector IS NOT NULL
  ORDER BY LOWER(email), created_at DESC
),
latest_age AS (
  SELECT DISTINCT ON (LOWER(email)) LOWER(email) AS email_lc, age_range
  FROM records_3d
  WHERE email IS NOT NULL AND age_range IS NOT NULL
  ORDER BY LOWER(email), created_at DESC
)
UPDATE records_3d r
SET sector    = COALESCE(r.sector,    ls.sector),
    age_range = COALESCE(r.age_range, la.age_range)
FROM latest_sector ls
FULL OUTER JOIN latest_age la ON ls.email_lc = la.email_lc
WHERE LOWER(r.email) = COALESCE(ls.email_lc, la.email_lc)
  AND (
    (r.sector    IS NULL AND ls.sector    IS NOT NULL) OR
    (r.age_range IS NULL AND la.age_range IS NOT NULL)
  );

SELECT public.refresh_all_stats();
```
