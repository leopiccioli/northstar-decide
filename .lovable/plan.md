
## Diagnóstico

Confirmado en DB y logs:
- A las **19:50:10** se guardó tu medición correctamente (record `dfddb79e…`, contexto `improve`).
- A las **19:56:36** llegó un **segundo POST** a `save-result` que devolvió **429** porque el rate limit por email es de 15 min y solo habían pasado 6.

Como la UI es optimista (muestra éxito apenas hacés click), después del primer click ya no se ve el botón "Guardar" — así que el segundo POST vino de un **doble click** procesado en el mismo render (antes de que React swap-ee a `SuccessWithShare`). El `catch` del save en background disparó el toast "Aviso" con el mensaje genérico. **No tuvo nada que ver con WhatsApp**: el click de WhatsApp solo abre `wa.me` en otra pestaña, no toca el flujo de save.

## ¿Hay algo que arreglar? Sí, dos cosas chicas

### 1. Guardia anti doble-click en `SaveSection.handleSave`
Agregar un `useRef(false)` (`isSavingRef`) que se setea a `true` en cuanto pasa la validación y antes de llamar `onOptimisticSave`. Si `isSavingRef.current === true`, `handleSave` returnea sin hacer nada. Más robusto que `useState` porque no depende del próximo render.

Resultado: aunque el usuario toque "Guardar" dos veces rápido, se dispara un solo POST.

### 2. Silenciar el toast de error cuando la UI ya está en éxito
En el `.catch()` del `supabase.functions.invoke('save-result', ...)`:
- Si el error es un **429** (rate limit), no mostrar ningún toast — la primera medición ya quedó guardada, el segundo intento solo es ruido para el usuario.
- Para otros errores, mantener el toast actual ("No pudimos guardar tu resultado…") porque sí queremos saber si algo falló de verdad.

Para detectar 429: dentro del `if (error instanceof FunctionsHttpError)`, leer `error.context.status` (o el body parseado) y si es 429, hacer `return` antes del `toast(...)`.

### Lo que NO toco
- WhatsApp share, emails, edge functions: están funcionando bien, no hay nada para arreglar ahí.
- `SuccessWithShare`, navegación, analytics: sin cambios.

## Archivos a tocar
- `src/components/decision/ResultScreen.tsx` (solo el componente `SaveSection`, ~20 líneas)

## Verificación
- Doble-click rápido en "Guardar" → un solo registro en DB, sin toast de error.
- Caso real con error 5xx (simulado) → sigue mostrando el toast de aviso para no perder señal.
