

## Ajuste: Feed Twitter sin @decisor + fondo oscuro

Modificaciones al plan anterior basadas en tu feedback.

---

### Cambios en Feed (Twitter style)

| Antes | Después |
|-------|---------|
| "Anónimo @decisor · hace 2h" | "Anónimo · hace 2h" |
| Fondo claro (bg-background) | Fondo oscuro (bg-secondary o similar) |

---

### Estructura actualizada del tweet

```text
┌────────────────────────────────────────────────────┐
│  ┌──┐  Anónimo · hace 2 horas                      │
│  │  │                                              │
│  └──┘  El texto del comentario va acá              │
├────────────────────────────────────────────────────┤
│  ┌──┐  Anónimo · hace 5 horas                      │
│  │  │                                              │
│  └──┘  Otro comentario                             │
└────────────────────────────────────────────────────┘
```

---

### Código del FeedView

```typescript
const FeedView = ({ comments, formatDate }: ViewProps) => (
  <div className="max-w-[600px] mx-auto bg-zinc-900 rounded-xl overflow-hidden">
    <div className="divide-y divide-zinc-800">
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="flex gap-3 p-4 hover:bg-zinc-800/50 transition-colors"
        >
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold text-zinc-100">Anónimo</span>
              <span className="text-zinc-500">·</span>
              <time className="text-zinc-500">{formatDate(comment.created_at)}</time>
            </div>
            <p className="mt-1 text-zinc-100">{comment.comment}</p>
          </div>
        </article>
      ))}
    </div>
  </div>
);
```

---

### Archivos a modificar

1. `supabase/functions/get-comments/index.ts` - Cambiar limit a 21
2. `src/pages/CommentsPage.tsx` - Feed con fondo oscuro sin @decisor + Mosaico Pinterest

---

### Resumen de cambios

- Sin "@decisor" - solo "Anónimo · tiempo"
- Fondo `bg-zinc-900` para el contenedor del feed
- Divisores `divide-zinc-800` (línea oscura sutil)
- Texto `text-zinc-100` para buen contraste
- Avatar `bg-zinc-700` (gris medio)
- Hover `bg-zinc-800/50` para interactividad

