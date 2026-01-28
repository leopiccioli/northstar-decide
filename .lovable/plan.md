

# Plan: Migrar datos de staging a records_3d

## Datos Verificados

| Verificación | Resultado |
|--------------|-----------|
| Total registros en staging | 12,106 |
| Emails únicos | 9,186 |
| Scores dinero | 1-10 (correcto) |
| Scores desarrollo | 1-10 (correcto) |
| Scores diversion | 1-10 (correcto) |
| Registros con fecha | 12,075 (99.7%) |
| Registros con pais | 6,501 (53.7%) |
| Registros legacy previos en records_3d | 0 |

## Estrategia de Migración

Insertar todos los registros de `staging_legacy_3d` a `records_3d` con:
- `option_name = 'legacy'` para identificarlos
- `created_at` parseado desde el campo `fecha`
- Mapeo directo de scores y comentario

## SQL de Migración

```sql
INSERT INTO records_3d (
  email,
  option_name,
  dinero,
  desarrollo,
  diversion,
  comment,
  country,
  created_at
)
SELECT 
  email,
  'legacy' as option_name,
  dinero,
  desarrollo,
  diversion,
  comentario as comment,
  pais as country,
  -- Parsear fecha "2026-01-27 19:53" a timestamp
  CASE 
    WHEN fecha IS NOT NULL AND fecha != '' 
    THEN (fecha || ':00')::timestamp with time zone
    ELSE NOW()
  END as created_at
FROM staging_legacy_3d
WHERE dinero IS NOT NULL 
  AND desarrollo IS NOT NULL 
  AND diversion IS NOT NULL;
```

## Resultado Esperado

- ~12,030 registros migrados (los que tienen scores completos)
- Todos marcados con `option_name = 'legacy'`
- Fechas preservadas del sistema original

## Post-Migración

Después de confirmar la migración exitosa:
1. Verificar conteo en `records_3d WHERE option_name = 'legacy'`
2. La tabla `staging_legacy_3d` puede eliminarse o dejarse como backup

## Sección Técnica

La migración usa un INSERT directo sin conflictos porque:
- No hay constraint UNIQUE en email (un usuario puede tener múltiples registros)
- Cada registro legacy es una "foto" histórica del 3D del usuario
- Los duplicados de email representan múltiples completados a lo largo del tiempo

El parseo de fecha agrega `:00` para los segundos ya que el formato original es `YYYY-MM-DD HH:MM`.

