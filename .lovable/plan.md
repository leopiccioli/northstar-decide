
## Actualizar X Pixel con Event ID específico

### Cambio requerido

Modificar `src/lib/analytics.ts` para usar el Event ID exacto que X Ads generó para la conversión.

### Detalle técnico

**Archivo:** `src/lib/analytics.ts`

**Cambio 1 - Línea 33, actualizar el mapeo:**
```typescript
// De:
complete_3d: 'complete_3d',

// A:
complete_3d: 'tw-o1ve0-r2y9y',
```

**Cambio 2 - Línea 56, cambiar el método de tracking:**
```typescript
// De:
window.twq('track', xEvents[event], data);

// A:
window.twq('event', xEvents[event], data);
```

### Por qué estos cambios

1. X Ads usa `'event'` en lugar de `'track'` para eventos de conversión custom
2. El Event ID `tw-o1ve0-r2y9y` es el identificador único que X Ads asocia con tu conversión específica

### Resultado

Cuando un usuario complete las 3D, el código enviará exactamente:
```javascript
twq('event', 'tw-o1ve0-r2y9y', {});
```

Que es lo que X Ads espera para registrar la conversión correctamente.
