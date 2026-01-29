
# Plan: Normalizar Emails para Evitar Duplicados

## Problema

El CSV legacy se importo sin normalizar los emails a minusculas. Como resultado:

- **records_3d** tiene 9,187 emails unicos (case-sensitive) pero solo 8,823 unicos reales (case-insensitive)
- **364 usuarios duplicados** por diferencia de mayusculas
- **312 notificaciones duplicadas** ya enviadas (el mismo usuario recibio 2+ emails)

Ejemplo: `Rocio_accornero@hotmail.com` y `rocio_accornero@hotmail.com` se tratan como 2 personas.

## Solucion

### 1. Normalizar emails existentes en records_3d

Ejecutar una migracion que convierta todos los emails a minusculas:

```sql
UPDATE records_3d
SET email = LOWER(email)
WHERE email != LOWER(email);
```

### 2. Actualizar las funciones RPC para usar LOWER()

Modificar `get_pending_legacy_notifications` y `count_pending_legacy_notifications` para hacer comparaciones case-insensitive:

```sql
-- En get_pending_legacy_notifications:
LEFT JOIN notified_emails ne ON LOWER(le.email) = LOWER(ne.to_email)

-- En count_pending_legacy_notifications:
LEFT JOIN outbound_emails oe 
  ON LOWER(r.email) = LOWER(oe.to_email)
```

### 3. Evitar envios duplicados futuros

Agregar los emails ya notificados (en cualquier case) al filtro. Esto evita reenviar a quien ya recibio el email con diferente capitalizacion.

## Migracion SQL Completa

```sql
-- 1. Normalizar emails existentes en records_3d
UPDATE records_3d
SET email = LOWER(email)
WHERE email != LOWER(email);

-- 2. Normalizar emails en outbound_emails (para consistencia)
UPDATE outbound_emails
SET to_email = LOWER(to_email)
WHERE to_email != LOWER(to_email);

-- 3. Actualizar funcion get_pending_legacy_notifications con comparacion case-insensitive
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
SET search_path = public
AS $$
  WITH legacy_emails AS (
    SELECT 
      LOWER(r.email) as email,
      COUNT(*) as record_count
    FROM records_3d r
    WHERE r.option_name = 'legacy'
    GROUP BY LOWER(r.email)
  ),
  notified_emails AS (
    SELECT DISTINCT LOWER(to_email) as email
    FROM outbound_emails 
    WHERE email_type = 'legacy_notification'
  ),
  pending_emails AS (
    SELECT le.email, le.record_count
    FROM legacy_emails le
    LEFT JOIN notified_emails ne ON le.email = ne.email
    WHERE ne.email IS NULL
    LIMIT batch_limit
  ),
  latest_records AS (
    SELECT DISTINCT ON (LOWER(r.email))
      LOWER(r.email) as email,
      r.dinero,
      r.desarrollo,
      r.diversion,
      r.created_at
    FROM records_3d r
    INNER JOIN pending_emails pe ON LOWER(r.email) = pe.email
    WHERE r.option_name = 'legacy'
    ORDER BY LOWER(r.email), r.created_at DESC
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

-- 4. Actualizar funcion count_pending_legacy_notifications
CREATE OR REPLACE FUNCTION count_pending_legacy_notifications()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT LOWER(r.email))
  FROM records_3d r
  LEFT JOIN outbound_emails oe 
    ON LOWER(r.email) = LOWER(oe.to_email) 
    AND oe.email_type = 'legacy_notification'
  WHERE r.option_name = 'legacy'
    AND oe.to_email IS NULL;
$$;
```

## Impacto

| Metrica | Antes | Despues |
|---------|-------|---------|
| Emails unicos en records_3d | 9,187 | 8,823 |
| Duplicados por case | 364 | 0 |
| Notificaciones pendientes | ~X con duplicados | ~X-364 sin duplicados |

## Notas

- Los 312 emails duplicados ya enviados no se pueden deshacer, pero no causaron dano real (la persona recibio 2 emails iguales)
- Esta solucion previene que siga pasando
- El codigo de `save-result` ya normaliza a minusculas (linea 378), asi que nuevos registros no tendran este problema
