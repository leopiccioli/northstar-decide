

## Aumentar a 100 comentarios con Skeleton Loaders

### Resumen
Subir el límite de comentarios de 21 a 100 y agregar skeleton loaders para mejorar la percepción de velocidad durante la carga.

---

### Cambios

#### 1. Backend: Aumentar límite
**Archivo**: `supabase/functions/get-comments/index.ts`

Cambiar `.limit(21)` a `.limit(100)`

#### 2. Frontend: Agregar Skeleton Loaders
**Archivo**: `src/pages/CommentsPage.tsx`

Crear componentes de skeleton que imiten la estructura de las cards:

```text
Feed Skeleton:
┌─────────────────────────────────────────┐
│  ○ ████████ · ██████                    │
│  ████████████████████████               │
│  ██████████████████                     │
└─────────────────────────────────────────┘

Mosaic Skeleton:
┌─────────────────────────────┐
│  ████████████████████       │
│  ██████████████             │
│  ██████                     │
└─────────────────────────────┘
```

Reemplazar el spinner actual por 6-8 skeletons que aparecen inmediatamente.

---

### Detalles técnicos

**SkeletonCard component:**
- Usar el componente `Skeleton` existente de `@/components/ui/skeleton`
- Variar alturas para simular comentarios de diferentes longitudes
- Mantener los mismos colores pastel del mosaico para consistencia

**Implementación:**
```typescript
const FeedSkeleton = () => (
  <div className="max-w-[600px] mx-auto bg-zinc-900 rounded-xl">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex gap-3 p-4 border-b border-zinc-800">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const MosaicSkeleton = () => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
    {[...Array(8)].map((_, i) => (
      <div 
        key={i} 
        className={cn("break-inside-avoid rounded-xl p-4 mb-4", cardColors[i % cardColors.length])}
      >
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-2" />
        <Skeleton className="h-3 w-20 mt-3" />
      </div>
    ))}
  </div>
);
```

---

### Archivos a modificar

1. `supabase/functions/get-comments/index.ts` - Cambiar limit de 21 a 100
2. `src/pages/CommentsPage.tsx` - Agregar FeedSkeleton y MosaicSkeleton, reemplazar spinner

---

### Beneficio UX

- El usuario ve contenido placeholder inmediatamente (0ms)
- La transición a contenido real se siente más suave
- Mejor percepción de velocidad que un spinner genérico

