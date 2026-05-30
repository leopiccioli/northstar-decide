## Qué se hace

Ejecutar una sola sentencia SQL en la base:

```sql
SELECT public.refresh_all_stats();
```

Esa función ya existe y, internamente, llama a:
- `refresh_country_stats()` → recalcula `country_stats_cache`
- `refresh_sector_stats()` → recalcula `sector_stats_cache`
- `refresh_age_range_stats()` → recalcula `age_range_stats_cache`

Cada una hace `TRUNCATE` del cache correspondiente y lo vuelve a poblar desde `records_3d` para los períodos `all` y `quarter`, en las 4 dimensiones (dinero, desarrollo, diversión, promedio), y actualiza el `updated_at`.

## Efecto visible

- `/por-pais`, `/por-sector` y `/por-edad` pasan a mostrar promedios y conteos al día.
- El indicador "Actualizado…" (StatsFreshness) se mueve a la hora de ejecución.

## Qué NO cambia

- Sin cambios de código, esquema, RLS, ni edge functions.
- Sin tocar `records_3d` ni ninguna otra tabla fuente.
- No afecta el flujo de medición ni los emails.

## Riesgo

Mínimo. Los caches se reconstruyen en una sola transacción; durante el TRUNCATE+INSERT las páginas podrían ver datos parciales por unos segundos, pero el volumen es chico y el impacto es despreciable.
