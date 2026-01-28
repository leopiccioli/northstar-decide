

# Plan: Optimizar Performance de Lighthouse (83 -> 90+)

## Problema Identificado

El reporte de Lighthouse muestra:
- **Speed Index: 6.3s** (rojo - muy lento)
- **First Contentful Paint: 2.7s** (naranja)
- **Largest Contentful Paint: 3.0s** (naranja)

### Causa Raiz

El archivo `DecisionFlow.tsx` importa de forma estatica **todos los componentes** del flujo:

```typescript
import { EntryScreen } from './EntryScreen';
import { ContextScreen } from './ContextScreen';
import { InputScreen } from './InputScreen';
import { ResultScreen } from './ResultScreen';  // 635 lineas + dependencias pesadas
import { CloseScreen } from './CloseScreen';
```

Esto significa que cuando el usuario carga la pagina inicial (`EntryScreen`), el browser descarga TODO el codigo de:
- `ResultScreen` (componentes QR, Command/Popover de Radix, ShareImageGenerator con Canvas)
- `InputScreen` (sliders de Radix, tooltips)
- Todos los componentes UI pesados

El usuario solo ve una pantalla simple con un boton "Empezar", pero carga ~200KB+ de JavaScript innecesario.

---

## Solucion: Code Splitting dentro de DecisionFlow

Aplicar `React.lazy()` a los componentes que no se muestran inicialmente, manteniendo los prefetch hooks que ya existen.

### Arquitectura Propuesta

```
Usuario carga pagina
    |
    v
[EntryScreen] <-- Solo esto se carga inicialmente (liviano)
    |
    | (click "Empezar" + prefetch ya activo)
    v
[ContextScreen] <-- Lazy loaded, pero pre-cargado
    |
    v
[InputScreen] <-- Lazy loaded, pero pre-cargado
    |
    v
[ResultScreen] <-- Lazy loaded, carga cuando llega
```

---

## Seccion Tecnica

### Archivo: src/components/decision/DecisionFlow.tsx

Convertir imports estaticos a lazy:

```typescript
import { useState, lazy, Suspense } from 'react';
import { DecisionState, UserContext, Scores } from '@/types/decision';
import { EntryScreen } from './EntryScreen';  // Mantener estatico - es la primera pantalla
import { ProgressIndicator } from './ProgressIndicator';

// Lazy load screens que no se muestran inicialmente
const ContextScreen = lazy(() => import('./ContextScreen'));
const InputScreen = lazy(() => import('./InputScreen'));
const ResultScreen = lazy(() => import('./ResultScreen'));
const CloseScreen = lazy(() => import('./CloseScreen'));

// Spinner minimalista reutilizable
const ScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);
```

Envolver cada pantalla lazy en Suspense:

```typescript
{state.step === 'context' && (
  <Suspense fallback={<ScreenLoader />}>
    <ContextScreen onSelect={handleContextSelect} />
  </Suspense>
)}

{state.step === 'input' && state.context && (
  <Suspense fallback={<ScreenLoader />}>
    <InputScreen ... />
  </Suspense>
)}
// etc.
```

### Archivos a Convertir a Default Export

Los componentes lazy requieren `export default`. Cambiar:

**ContextScreen.tsx:**
```typescript
// Antes
export function ContextScreen(...) { ... }

// Despues
export default function ContextScreen(...) { ... }
```

**InputScreen.tsx:**
```typescript
export default function InputScreen(...) { ... }
```

**ResultScreen.tsx:**
```typescript
export default function ResultScreen(...) { ... }
```

**CloseScreen.tsx:**
```typescript
export default function CloseScreen(...) { ... }
```

### Archivo: src/hooks/usePrefetch.ts

Actualizar los prefetch para que funcionen con los nuevos chunks:

```typescript
// Ya funcionan correctamente porque usan dynamic import
// Solo asegurar que los paths coincidan

export function usePrefetchContextScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import('@/components/decision/ContextScreen');
    }, 500);
    return () => clearTimeout(timer);
  }, []);
}
```

---

## Beneficios Esperados

| Metrica | Antes | Esperado |
|---------|-------|----------|
| Speed Index | 6.3s | ~3.5s |
| FCP | 2.7s | ~1.8s |
| LCP | 3.0s | ~2.2s |
| Bundle inicial | ~200KB+ | ~80KB |

### Por Que Funciona

1. **EntryScreen** es muy liviano (solo texto + un boton + QR opcional)
2. **ContextScreen** empieza a cargarse mientras el usuario lee la pantalla inicial
3. **InputScreen** carga mientras el usuario elige contexto
4. **ResultScreen** (el mas pesado) carga mientras el usuario mueve sliders

Los hooks de prefetch que ya existen hacen que la transicion sea instantanea para el usuario.

---

## Archivos a Modificar

1. `src/components/decision/DecisionFlow.tsx` - Implementar lazy loading
2. `src/components/decision/ContextScreen.tsx` - Cambiar a default export
3. `src/components/decision/InputScreen.tsx` - Cambiar a default export
4. `src/components/decision/ResultScreen.tsx` - Cambiar a default export
5. `src/components/decision/CloseScreen.tsx` - Cambiar a default export

---

## Optimizacion Adicional Opcional

Si despues de esto el score sigue bajo, podemos:

1. **Diferir carga de QR code**: El componente `qrcode.react` solo se usa en desktop. Lazy loadear solo cuando `!isMobile`
2. **Preconnect a Supabase**: Agregar `<link rel="preconnect">` al host de Supabase
3. **Optimizar fuentes**: Ya estan preloaded, pero podemos usar `font-display: swap` explicito

