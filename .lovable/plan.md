

## Mover `complete_3d` para incluir email

### Cambio requerido

Mover el disparo del evento `complete_3d` desde `InputScreen.tsx` (donde no hay email) a `ResultScreen.tsx` (donde el usuario ingresa su email al guardar).

### Detalle técnico

**Archivo 1:** `src/components/decision/InputScreen.tsx`

**Líneas 33-37 - Eliminar el tracking de complete_3d:**
```typescript
// Eliminar estas líneas del handleSubmit:
trackFlowEvent('complete_3d', { 
  dinero: scores.dinero, 
  desarrollo: scores.desarrollo, 
  diversion: scores.diversion 
});
```

**Archivo 2:** `src/components/decision/ResultScreen.tsx`

**Línea 397 - Agregar complete_3d con email y scores:**
```typescript
const handleOptimisticSave = (email: string) => {
  // Disparar complete_3d con email y scores
  trackFlowEvent('complete_3d', { 
    email,
    dinero: currentOption.scores.dinero, 
    desarrollo: currentOption.scores.desarrollo, 
    diversion: currentOption.scores.diversion 
  });
  trackFlowEvent('save_result', { email });
  // resto del código...
};
```

### Implicación

- **Antes:** `complete_3d` = usuario terminó los sliders (sin email)
- **Después:** `complete_3d` = usuario guardó con email (con email + scores)

Esto cambia la semántica: ya no mide "quién llegó a ver resultado" sino "quién guardó su resultado". Pero ganas el email para atribución en X Ads.

### Resultado en X Ads

```javascript
twq('event', 'tw-o1ve0-r2y9y', {
  email_address: 'usuario@email.com'
});
```

