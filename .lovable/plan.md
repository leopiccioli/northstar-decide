
# Plan: Fix del "Guardando..." Colgado + Favicon

## Problema Identificado

El botón se quedó en "Guardando..." porque:
1. **Rate limiting**: El edge function rechazó la solicitud con 429 (solo 1 envío cada 15 minutos por email)
2. **El error se manejó**, pero el toast de error probablemente no fue visible o el mensaje genérico no fue claro

El código actual SÍ tiene `finally { setIsSaving(false) }`, así que debería resetear. Sin embargo, hay mejoras que hacer.

## Cambios Propuestos

### 1. Mejorar manejo de errores en ResultScreen.tsx

Importar `FunctionsHttpError` de Supabase y extraer el mensaje real del error 429:

```typescript
import { FunctionsHttpError } from '@supabase/supabase-js';

// En el catch:
} catch (error) {
  console.error('Save error:', error);
  
  let errorMessage = "No pudimos guardar tu resultado. Intentá de nuevo.";
  
  // Extract actual error message from edge function
  if (error instanceof FunctionsHttpError) {
    try {
      const errorData = await error.context.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {}
  }
  
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
}
```

Así el usuario verá el mensaje real: **"Ya guardaste una medición recientemente. Espera 15 minutos."**

### 2. Agregar el favicon

Copiar el archivo subido `favicon3d.png` a `public/favicon.png` y actualizar `index.html` para referenciarlo.

```html
<link rel="icon" href="/favicon.png" type="image/png">
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/decision/ResultScreen.tsx` | Mejorar error handling para mostrar mensaje real del edge function |
| `public/favicon.png` | Copiar el archivo subido |
| `index.html` | Actualizar referencia al favicon |

## Resultado Esperado

- El usuario verá mensajes de error claros cuando hay rate limiting u otros errores
- El botón siempre volverá a su estado normal después de un intento
- Nuevo favicon 3D visible en la pestaña del navegador
