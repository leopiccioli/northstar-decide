## Diagnóstico

`CountryCombobox` hace un `import('@/lib/countries')` **dinámico** la primera vez que abrís el dropdown. Eso dispara:

1. Round-trip de red para bajar el chunk.
2. Render del estado "Cargando..." mientras llega.
3. Recién después se monta la lista.

El archivo `src/lib/countries.ts` tiene ~30 países (52 líneas, <2 KB). El lazy-load no ahorra prácticamente nada y agrega latencia visible en cada apertura.

## Cambios

**`src/components/decision/CountryCombobox.tsx`**
- Reemplazar el `import()` dinámico por `import { COUNTRIES } from '@/lib/countries'` estático.
- Eliminar `useState<Country[]>`, `isLoading`, el `useEffect` de carga y el bloque "Cargando...".
- `countries` queda como constante directa.

**`src/hooks/usePrefetch.ts`** (opcional, refuerzo)
- Dentro de `usePrefetchInputScreen`, agregar `import('@/lib/countries')` para que cuando estés en ContextScreen ya quede tibio en caché. Con el cambio anterior probablemente ni haga falta.

## Resultado

El popover abre instantáneo con la lista renderizada. Sin spinner, sin chunk extra.

## Costo

~30 entradas se suman al bundle del InputScreen (donde se usa el combobox). Trivial.
