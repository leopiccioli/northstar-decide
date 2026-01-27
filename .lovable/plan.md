
# Plan: Ajustes de Texto + Optimización de Guardado

## Resumen

Tres cambios solicitados:
1. Cambiar texto "Versión más potente en tu teléfono" → "Más potente en tu celular"
2. Poner la "D" de "decidir" en mayúsculas → "3D para Decidir"
3. Investigar y optimizar la demora del "Guardando..."

---

## 1. Cambio de Texto en MobileQRCard

**Archivo**: `src/components/decision/MobileQRCard.tsx`
**Línea 69**

```text
ANTES: "Versión más potente en tu teléfono"
DESPUÉS: "Más potente en tu celular"
```

---

## 2. "D" mayúscula en EntryScreen

**Archivo**: `src/components/decision/EntryScreen.tsx`
**Línea 48**

```text
ANTES: {" "}para decidir
DESPUÉS: {" "}para Decidir
```

---

## 3. Análisis de la Demora "Guardando..."

### Causa Identificada

La demora de ~4 segundos se debe a **múltiples queries secuenciales** en el edge function antes de responder:

1. **Rate limit por IP** - Query a `records_3d` (líneas 289-293)
2. **Rate limit por email** - Query a `records_3d` (líneas 303-307)
3. **Historial previo** - Query a `records_3d` (líneas 317-323)
4. **Insert del registro** - Insert a `records_3d`
5. **Envío de email (async)** - Ya está en background, no bloquea

El edge function está haciendo **4 operaciones de DB secuenciales** antes de responder. Cada query puede tomar ~500-1000ms dependiendo de la latencia.

### Solución Propuesta

Paralelizar las queries que no dependen entre sí:

```typescript
// ANTES (secuencial):
const { count: ipCount } = await checkIpRateLimit();
const { count: emailCount } = await checkEmailRateLimit();
const { data: previousMeasurements } = await getPreviousHistory();

// DESPUÉS (paralelo):
const [ipCheck, emailCheck, historyCheck] = await Promise.all([
  checkIpRateLimit(),
  checkEmailRateLimit(), 
  getPreviousHistory(),
]);
```

**Reducción estimada**: De ~3-4s a ~1-1.5s (las 3 queries corren en paralelo en lugar de secuencialmente).

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/decision/MobileQRCard.tsx` | Cambiar texto a "Más potente en tu celular" |
| `src/components/decision/EntryScreen.tsx` | Cambiar "decidir" → "Decidir" |
| `supabase/functions/save-result/index.ts` | Paralelizar queries de rate limit + historial |

---

## Detalles Técnicos (Edge Function)

La optimización en `save-result/index.ts` cambia de:

```typescript
// Secuencial (~3-4 segundos)
const { count: ipCount } = await supabase
  .from('records_3d')
  .select('*', { count: 'exact', head: true })
  .eq('ip_address', ipAddress)
  .gte('created_at', oneHourAgo);

if (ipCount && ipCount >= 3) { /* return error */ }

const { count: emailCount } = await supabase
  .from('records_3d')
  .select('*', { count: 'exact', head: true })
  .eq('email', normalizedEmail)
  .gte('created_at', fifteenMinutesAgo);

if (emailCount && emailCount >= 1) { /* return error */ }

const { data: previousMeasurements } = await supabase
  .from('records_3d')
  .select('dinero, desarrollo, diversion, created_at')
  .eq('email', body.email.toLowerCase())
  .is('comparison', null)
  .order('created_at', { ascending: false })
  .limit(1);
```

A:

```typescript
// Paralelo (~1-1.5 segundos)
const [ipResult, emailResult, historyResult] = await Promise.all([
  supabase
    .from('records_3d')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ipAddress)
    .gte('created_at', oneHourAgo),
  
  supabase
    .from('records_3d')
    .select('*', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .gte('created_at', fifteenMinutesAgo),
  
  supabase
    .from('records_3d')
    .select('dinero, desarrollo, diversion, created_at')
    .eq('email', body.email.toLowerCase())
    .is('comparison', null)
    .order('created_at', { ascending: false })
    .limit(1),
]);

// Luego validar los rate limits
if (ipResult.count && ipResult.count >= 3) { /* return error */ }
if (emailResult.count && emailResult.count >= 1) { /* return error */ }

const previousMeasurement = historyResult.data?.[0] || null;
```
