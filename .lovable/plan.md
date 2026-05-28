Actualizar eventos de GA4 para cubrir los cambios recientes del flujo de backfill de datos demográficos.

## Cambios

### 1. CompletarPage — evento de conversión
Agregar `trackCustomEvent('complete_demographics', { has_sector, has_age })` cuando el usuario guarda sector y/o edad exitosamente en `/completar`. Esto permite medir la tasa de respuesta del backfill en GA4.

### 2. CompletarPage — links a stats
Los links "Por edad" y "Por sector" en la pantalla de éxito de `/completar` deben usar `trackFlowEvent('open_stats')` igual que el bloque `CompareWithOthers` en resultados.

### 3. Analytics.ts — nuevo evento
Extender `FlowEvent` o usar `trackCustomEvent` para registrar `complete_demographics` en GA4, Meta Pixel y X Pixel.

## Detalles técnicos

- Archivos a tocar: `src/pages/CompletarPage.tsx`, `src/lib/analytics.ts`
- No requiere cambios de backend ni migraciones.
- Estimado: 10 minutos.