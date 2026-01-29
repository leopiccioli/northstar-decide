

# Plan: Solución Definitiva para Legacy Notifications

## Problema Actual

El código tiene 3 queries problemáticas que sufren del límite de 1000 registros:

1. **Línea 114-118**: `SELECT` de `records_3d` sin límite explícito
2. **Línea 137-140**: `SELECT` de `outbound_emails` sin límite explícito  
3. **Línea 251-254**: Otro `SELECT` de `records_3d` sin límite

Cambiar el orden (ASC/DESC) no soluciona el problema fundamental: el cliente JavaScript nunca ve más de 1000 registros.

## Solución: Database Function (RPC)

Crear una función PostgreSQL que haga TODO el trabajo de filtrado en el servidor:

```text
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                           │
│  ┌──────────────┐    LEFT JOIN    ┌─────────────────┐  │
│  │  records_3d  │ ──────────────► │ outbound_emails │  │
│  │  (12,028)    │    WHERE null   │     (811)       │  │
│  └──────────────┘                 └─────────────────┘  │
│           │                                             │
│           ▼                                             │
│   Solo emails NO notificados (8,301)                   │
│   Agrupados + scores más recientes                     │
│   LIMIT batchSize                                      │
└─────────────────────────────────────────────────────────┘
           │
           ▼ (máximo 15 registros por batch)
    Edge Function envía emails
```

## Implementación

### 1. Crear Database Function via Migration

```sql
CREATE OR REPLACE FUNCTION get_pending_legacy_notifications(batch_limit INTEGER DEFAULT 15)
RETURNS TABLE (
  email TEXT,
  record_count BIGINT,
  dinero INTEGER,
  desarrollo INTEGER,
  diversion INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH legacy_emails AS (
    -- Obtener todos los emails únicos de legacy con su conteo
    SELECT 
      r.email,
      COUNT(*) as record_count
    FROM records_3d r
    WHERE r.option_name = 'legacy'
    GROUP BY r.email
  ),
  notified_emails AS (
    -- Emails que ya fueron notificados (exitosamente o no)
    SELECT DISTINCT to_email 
    FROM outbound_emails 
    WHERE email_type = 'legacy_notification'
  ),
  pending_emails AS (
    -- Emails legacy que NO están en notificados
    SELECT le.email, le.record_count
    FROM legacy_emails le
    LEFT JOIN notified_emails ne ON le.email = ne.to_email
    WHERE ne.to_email IS NULL
    LIMIT batch_limit
  ),
  latest_records AS (
    -- Para cada email pendiente, obtener su registro más reciente
    SELECT DISTINCT ON (r.email)
      r.email,
      r.dinero,
      r.desarrollo,
      r.diversion,
      r.created_at
    FROM records_3d r
    INNER JOIN pending_emails pe ON r.email = pe.email
    WHERE r.option_name = 'legacy'
    ORDER BY r.email, r.created_at DESC
  )
  SELECT 
    lr.email,
    pe.record_count,
    lr.dinero,
    lr.desarrollo,
    lr.diversion,
    lr.created_at
  FROM latest_records lr
  INNER JOIN pending_emails pe ON lr.email = pe.email;
$$;
```

### 2. Actualizar Edge Function

Simplificar `send-legacy-notification/index.ts` para usar solo el RPC:

```typescript
// Líneas 103-163: Reemplazar todo el bloque de queries por:
const { data: usersToNotify, error: queryError } = await supabase
  .rpc('get_pending_legacy_notifications', { batch_limit: batchSize });

if (queryError) {
  throw new Error(`Failed to fetch pending users: ${queryError.message}`);
}
```

### 3. Simplificar cálculo de "remaining"

```typescript
// Líneas 250-257: Reemplazar por query eficiente
const { count: pendingCount } = await supabase
  .rpc('count_pending_legacy_notifications');

results.remaining = pendingCount || 0;
```

Con una segunda función helper:

```sql
CREATE OR REPLACE FUNCTION count_pending_legacy_notifications()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT r.email)
  FROM records_3d r
  LEFT JOIN outbound_emails oe 
    ON r.email = oe.to_email 
    AND oe.email_type = 'legacy_notification'
  WHERE r.option_name = 'legacy'
    AND oe.to_email IS NULL;
$$;
```

## Archivos a Modificar

1. **Migration SQL** - Crear las 2 funciones de base de datos
2. **supabase/functions/send-legacy-notification/index.ts** - Simplificar usando RPC

## Ventajas de Esta Solución

| Aspecto | Antes | Después |
|---------|-------|---------|
| Límite 1000 | Afecta todo | No aplica (PostgreSQL) |
| Queries | 3+ roundtrips | 1 RPC call |
| Filtrado | JavaScript (lento) | PostgreSQL (rápido) |
| Escalabilidad | Falla con +1000 | Funciona con millones |
| Código | 60 líneas | 10 líneas |

## Resultado Esperado

- El cron job empezará a procesar los 8,301 usuarios pendientes inmediatamente
- A razón de 15 emails/minuto, se completará en ~9 horas
- No habrá más problemas de límite sin importar cuántos usuarios haya

## Sección Técnica

### Performance de la Query

La función usa CTEs (Common Table Expressions) que PostgreSQL optimiza eficientemente:
- Índice existente en `records_3d(option_name)` acelera el filtro
- Índice existente en `outbound_emails(email_type)` acelera el JOIN
- `DISTINCT ON` es más eficiente que `GROUP BY` + subquery para "último registro"

### Seguridad

- `SECURITY DEFINER` permite que la función acceda a las tablas aunque RLS esté activo
- Solo retorna los campos necesarios, no expone datos sensibles

