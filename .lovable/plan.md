

## Fix: CORS Headers en get-comments

El problema NO es RLS ni velocidad del query. El edge function `get-comments` tiene CORS headers incompletos que bloquean el request POST del browser.

---

### Diagnóstico

| Evidencia | Observación |
|-----------|-------------|
| Edge logs | Solo `OPTIONS` llega (200 OK), nunca POST |
| Network requests | Browser envía `x-supabase-client-platform: macOS` |
| get-comments headers | No incluye `x-supabase-client-platform` |
| save-result / get-country-stats | SI incluyen todos los headers (y funcionan) |

El preflight CORS pasa, pero el POST real falla porque el browser envía headers que el servidor no acepta.

---

### Solución

Actualizar CORS headers en `get-comments` para que coincidan con los otros edge functions que funcionan:

**Archivo**: `supabase/functions/get-comments/index.ts`

**Cambio**:
```typescript
// ANTES (incompleto)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// DESPUES (completo)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

### Por que esto arregla el problema

1. El cliente Supabase JS envía `x-supabase-client-platform` y otros headers de telemetria
2. Si el servidor no los acepta en `Access-Control-Allow-Headers`, el browser bloquea el POST
3. Los otros edge functions (`save-result`, `get-country-stats`) ya tienen estos headers y funcionan
4. `get-comments` fue creado con los headers minimos que ya no son suficientes

---

### Sobre paginacion

Segun lo que indicaste, no hay navegacion - siempre muestra los ultimos 20 y si queres ver nuevos, haces refresh. Esto ya esta implementado correctamente.

---

### Verificacion

Una vez deployado el cambio:
- El POST a `get-comments` deberia completarse exitosamente
- Los comentarios deberian aparecer en el feed
- No se necesita cambio en el frontend

