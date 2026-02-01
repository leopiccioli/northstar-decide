

## Feature: Cards en 2 columnas + Título "Pared de la Empatía"

Layout actualizado para las tarjetas del mosaico con gráfico lateral y título general.

---

### Estructura de la Card

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│  "Mi comentario        │   ████████████████    │
│   sobre el trabajo     │     ██████████        │
│   que puede ser        │       ████            │
│   largo o corto"       │                       │
│                        │   (hover = tooltip)   │
│  hace 2 horas          │                       │
│                                                 │
└─────────────────────────────────────────────────┘
     ~65%                      ~35%
```

- Columna izquierda: Texto del comentario + fecha
- Columna derecha: Mini gráfico 3D (sin números, tooltip al hover)

---

### Título de la página

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│            Pared de la Empatía                  │
│                                                 │
│         [Feed]  [Mosaico]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Cambios necesarios

#### 1. Backend: Traer datos de las 3D

**Archivo**: `supabase/functions/get-comments/index.ts`

Actualizar el select para incluir los valores:

```typescript
.select("id, comment, created_at, dinero, desarrollo, diversion")
```

#### 2. Frontend: Actualizar interface

**Archivo**: `src/pages/CommentsPage.tsx`

```typescript
interface Comment {
  id: string;
  comment: string;
  created_at: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
}
```

#### 3. Frontend: Componente Mini3DChart con Tooltip

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Mini3DChart = ({ dinero, desarrollo, diversion }: { 
  dinero: number; 
  desarrollo: number; 
  diversion: number 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center gap-1 cursor-help">
          <div 
            className="h-2 rounded-sm" 
            style={{ width: `${dinero * 10}%`, backgroundColor: '#C41E3A', minWidth: '20%' }} 
          />
          <div 
            className="h-2 rounded-sm" 
            style={{ width: `${desarrollo * 10}%`, backgroundColor: '#1e3a5f', minWidth: '20%' }} 
          />
          <div 
            className="h-2 rounded-sm" 
            style={{ width: `${diversion * 10}%`, backgroundColor: '#9CA3AF', minWidth: '20%' }} 
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p><span className="text-[#C41E3A]">●</span> Dinero: {dinero}/10</p>
          <p><span className="text-[#1e3a5f]">●</span> Desarrollo: {desarrollo}/10</p>
          <p><span className="text-[#9CA3AF]">●</span> Diversión: {diversion}/10</p>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
```

#### 4. Frontend: MosaicView con layout de 2 columnas

```typescript
const MosaicView = ({ comments, formatDate }: ViewProps) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
    {comments.map((comment, index) => {
      const isShort = comment.comment.length < 80;
      const isLong = comment.comment.length > 200;
      const colorClass = cardColors[index % cardColors.length];

      return (
        <article
          key={comment.id}
          className={cn(
            "break-inside-avoid rounded-xl shadow-sm mb-4 flex gap-3",
            colorClass,
            isShort ? "p-5" : isLong ? "p-3" : "p-4"
          )}
        >
          {/* Columna texto ~65% */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-foreground leading-relaxed",
              isShort ? "text-lg font-medium" : isLong ? "text-sm" : "text-base"
            )}>
              {comment.comment}
            </p>
            <time className="block mt-2 text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </time>
          </div>
          
          {/* Columna gráfico ~35% */}
          <div className="w-[35%] flex-shrink-0 flex items-center">
            <Mini3DChart 
              dinero={comment.dinero} 
              desarrollo={comment.desarrollo} 
              diversion={comment.diversion} 
            />
          </div>
        </article>
      );
    })}
  </div>
);
```

#### 5. Frontend: Agregar título en el header

```typescript
<header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
  <div className="flex flex-col items-center py-4 gap-3">
    {/* Nuevo título */}
    <h1 className="text-2xl font-bold text-foreground">
      Pared de la Empatía
    </h1>
    
    {/* Toggle existente */}
    <div className="bg-secondary p-1 rounded-full inline-flex">
      ...
    </div>
  </div>
</header>
```

---

### Archivos a modificar

1. `supabase/functions/get-comments/index.ts` - Agregar campos 3D al select
2. `src/pages/CommentsPage.tsx` - Título, interface actualizada, Mini3DChart con tooltip, MosaicView con 2 columnas

---

### Tooltip en mobile

En dispositivos táctiles el tooltip aparecerá al tocar el gráfico (comportamiento nativo de Radix Tooltip).

