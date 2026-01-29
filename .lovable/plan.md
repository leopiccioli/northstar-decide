
# Plan: Preservar UTMs Originales en el QR

## Problema

Cuando un usuario llega con `?utm_source=newsletter`, el QR genera:
```
utm_source=qr
utm_medium=desktop  
utm_campaign=mobile_redirect
```

Perdiendo la atribución original.

## Solución

Pasar los UTMs originales al QR. Si el usuario llegó con `?utm_source=newsletter&utm_campaign=enero`, el QR tendrá exactamente esos mismos parámetros.

## Cambios

### 1. MobileQRCard.tsx

Agregar prop `originalTracking` y usarla para construir la URL:

```tsx
interface MobileQRCardProps {
  originalTracking?: TrackingData;
  // ... resto de props existentes
}

// Al construir la URL:
if (originalTracking) {
  // Usar los UTMs originales
  if (originalTracking.utm_source) urlObj.searchParams.set('utm_source', originalTracking.utm_source);
  if (originalTracking.utm_medium) urlObj.searchParams.set('utm_medium', originalTracking.utm_medium);
  // ... etc
} else {
  // Sin tracking original = URL limpia (solo baseUrl)
}
```

### 2. EntryScreen.tsx

Pasar el `trackingData` al componente:

```tsx
<MobileQRCard originalTracking={trackingData} />
```

## Flujo Resultante

```text
┌────────────────────────────────────────────────────────┐
│  DESKTOP: ?utm_source=newsletter&utm_campaign=enero   │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  QR genera: ?utm_source=newsletter&utm_campaign=enero │
│  (mismos parámetros, sin agregar nada)                │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  MOBILE: Llega con los UTMs originales intactos       │
│  Atribución correcta al guardar                       │
└────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/decision/MobileQRCard.tsx` | Agregar prop `originalTracking`, usar UTMs originales en la URL |
| `src/components/decision/EntryScreen.tsx` | Pasar `trackingData` a `MobileQRCard` |

## Notas

- Si el usuario llegó sin UTMs, el QR apunta a la URL base limpia
- No se necesitan cambios en `useTrackingData.ts`
- Eliminamos los UTMs hardcodeados del QR (`qr`, `desktop`, `mobile_redirect`)
