

## Página de Comentarios con Toggle iOS

Nueva página `/comentarios` que muestra los últimos 20 comentarios no vacíos, con un segmented control estilo iOS para alternar entre vista Feed y Mosaico.

---

### Vista previa del diseño

```text
┌─────────────────────────────────────────────┐
│                                             │
│      ┌─────────────┬─────────────┐          │
│      │    Feed     │   Mosaico   │  ← Toggle iOS
│      └─────────────┴─────────────┘          │
│                                             │
│   ┌─────────────────────────────────┐       │
│   │  "Comentario del usuario..."    │       │
│   │  hace 2 días                    │       │
│   └─────────────────────────────────┘       │
│                                             │
│   ┌─────────────────────────────────┐       │
│   │  "Otro comentario..."           │       │
│   │  hace 5 días                    │       │
│   └─────────────────────────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Componentes

**Toggle estilo iOS (Segmented Control)**
- Fondo gris claro redondeado (`bg-secondary rounded-full`)
- Pill blanco que se mueve al seleccionar (`bg-background shadow-sm`)
- Transición suave entre opciones
- Iconos: `List` para Feed, `LayoutGrid` para Mosaico

**Vista Feed**
- Cards centradas, max-width 600px
- Borde sutil, padding generoso
- Timestamp relativo ("hace 2 días")
- Scroll vertical nativo

**Vista Mosaico**
- CSS Grid con `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Cards con altura variable según contenido
- 1 columna en mobile, 2-3 en desktop
- Variación sutil en tamaño de texto para comentarios largos

---

### Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/CommentsPage.tsx` | Crear - página principal |
| `src/App.tsx` | Modificar - agregar ruta `/comentarios` |
| `supabase/functions/get-comments/index.ts` | Crear - edge function para traer comentarios |

---

### Detalle técnico

**Edge Function `get-comments`**

```typescript
// Query: últimos 20 comentarios no vacíos
const { data } = await supabase
  .from('records_3d')
  .select('id, comment, created_at')
  .not('comment', 'is', null)
  .neq('comment', '')
  .order('created_at', { ascending: false })
  .limit(20);
```

Devuelve solo `id`, `comment`, `created_at` (sin email ni datos sensibles).

**Segmented Control CSS**

```typescript
// Estructura del toggle
<div className="bg-secondary p-1 rounded-full inline-flex">
  <button className={cn(
    "px-4 py-1.5 rounded-full text-sm transition-all",
    view === 'feed' && "bg-background shadow-sm"
  )}>
    Feed
  </button>
  <button className={cn(
    "px-4 py-1.5 rounded-full text-sm transition-all",
    view === 'mosaic' && "bg-background shadow-sm"
  )}>
    Mosaico
  </button>
</div>
```

**Timestamp relativo**

Usar `date-fns` (ya instalado) con `formatDistanceToNow`:
```typescript
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

formatDistanceToNow(new Date(comment.created_at), { 
  addSuffix: true, 
  locale: es 
});
// → "hace 2 días"
```

---

### Acceso

- Ruta: `/comentarios`
- Sin links desde otras páginas
- Acceso solo por URL directa

