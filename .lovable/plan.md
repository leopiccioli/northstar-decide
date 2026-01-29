

## Cambiar evento de X Pixel a custom `complete_3d`

### Cambio requerido

Modificar el mapeo de eventos de X Pixel en `src/lib/analytics.ts` para que el evento `complete_3d` envíe un evento custom en lugar del estándar `Lead`.

### Detalle técnico

**Archivo:** `src/lib/analytics.ts`

**Línea 33 - Cambiar de:**
```typescript
complete_3d: 'Lead',
```

**A:**
```typescript
complete_3d: 'complete_3d',
```

### Resultado

- Meta Pixel seguirá enviando `Lead` (evento estándar)
- X Pixel enviará `complete_3d` (evento custom único para esta app)
- GA4 seguirá enviando `generate_lead`

### Configuración en X Ads

Después del cambio:
1. Ir a X Ads Manager → Event Manager
2. El evento `complete_3d` aparecerá como nuevo evento custom
3. Marcarlo como conversión para optimizar campañas

Esto te permite filtrar fácilmente las conversiones de esta app vs otros sitios que usan el mismo pixel.

