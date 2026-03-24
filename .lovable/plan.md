

## Reducir costos de Lovable Cloud

### Diagnóstico actual

| Recurso | Detalle |
|---------|---------|
| **DB** | ~9.5 MB (`records_3d`: 12,558 rows), ~3 MB (`outbound_emails`: 10,345 rows) — chico |
| **Storage** | 2 buckets privados (`csv`, `legacy-import`) — probablemente mínimo |
| **Edge Functions** | 8 funciones desplegadas |

Los costos principales vienen de **invocaciones de Edge Functions**. Tenés 3 funciones que son puro SELECT y se pueden eliminar reemplazándolas con queries directos desde el cliente.

### Plan de ahorro

#### 1. Eliminar `get-country-stats` (Edge Function → query directo)

`country_stats_cache` ya tiene RLS pública. Cambiar `StatsPage.tsx` de `supabase.functions.invoke('get-country-stats')` a `supabase.from('country_stats_cache').select(...)` y hacer el agrupamiento por país en el frontend. Borrar la Edge Function.

#### 2. Eliminar `get-comments` (Edge Function → database function)

Crear una database function `get_public_comments()` con `SECURITY DEFINER` que retorne solo `id, comment, created_at, dinero, desarrollo, diversion` sin exponer email/IP. Cambiar `CommentsPage.tsx` a `supabase.rpc('get_public_comments')`. Borrar la Edge Function.

#### 3. Eliminar `get-result` (Edge Function → database function)

Crear una database function `get_public_result(result_id uuid)` con `SECURITY DEFINER` que retorne solo `option_name, dinero, desarrollo, diversion, comment, comparison`. Cambiar `ResultPage.tsx` a `supabase.rpc('get_public_result', { result_id: id })`. Borrar la Edge Function.

#### 4. Funciones que SE MANTIENEN (necesitan Resend API / lógica server-side)

- `save-result` — inserta + envía email
- `send-reminders` — envía emails programados
- `resend-measurement` — reenvía email
- `send-legacy-notification` — envía emails legacy
- `import-legacy-csv` — acceso a storage

### Impacto estimado

- **~60-80% menos invocaciones** de Edge Functions (las lecturas son el tráfico más frecuente: cada visita a stats, comments o result/share page)
- **Sin cambio en UX** — misma funcionalidad, misma velocidad (posiblemente más rápido por ser directo)
- **Mejor seguridad** — database functions exponen solo columnas específicas, sin abrir la tabla a anon

### Detalle técnico

**Migración SQL:**
```sql
-- Function para comments
CREATE OR REPLACE FUNCTION public.get_public_comments()
RETURNS TABLE(id uuid, comment text, created_at timestamptz, 
              dinero int, desarrollo int, diversion int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT id, comment, created_at, dinero, desarrollo, diversion
  FROM records_3d
  WHERE comment IS NOT NULL AND comment != ''
  ORDER BY created_at DESC
  LIMIT 100;
$$;

-- Function para result por ID
CREATE OR REPLACE FUNCTION public.get_public_result(result_id uuid)
RETURNS TABLE(option_name text, dinero int, desarrollo int, 
              diversion int, comment text, comparison jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT option_name, dinero, desarrollo, diversion, comment, comparison
  FROM records_3d
  WHERE id = result_id;
$$;
```

**Cambios frontend:**
- `StatsPage.tsx`: `supabase.from('country_stats_cache').select('country, dimension, avg_value, count, updated_at').eq('period', period)`
- `CommentsPage.tsx`: `supabase.rpc('get_public_comments')`
- `ResultPage.tsx`: `supabase.rpc('get_public_result', { result_id: id })`

**Archivos a eliminar:**
- `supabase/functions/get-country-stats/` (directorio completo)
- `supabase/functions/get-comments/` (directorio completo)
- `supabase/functions/get-result/` (directorio completo)
- Entradas correspondientes en `supabase/config.toml`

