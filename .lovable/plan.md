

## Fix: CommentsPage - Retry automático y resilencia

El problema NO es velocidad del query (responde en <1s). El problema es que errores de red transitorios dejan el componente en loading infinito porque `useQuery` no tiene configuración de retry adecuada.

---

### Diagnóstico

| Test | Resultado |
|------|-----------|
| curl get-comments | 200 OK, <1 segundo, 20 comentarios |
| Preview iframe | "Failed to fetch" repetido |
| Session replay | Spinner infinito, nunca muestra contenido |

Los "Failed to fetch" son errores de red del preview, no del backend.

---

### Solución

No es "mostrar error" - es **reintentar hasta que funcione** y **no quedarse colgado**.

**Archivo**: `src/pages/CommentsPage.tsx`

**Cambios en useQuery:**

```typescript
const { data: comments, isLoading, isError, refetch } = useQuery({
  queryKey: ["comments"],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke("get-comments");
    if (error) throw error;
    return data.comments as Comment[];
  },
  retry: 3,                    // Reintentar 3 veces antes de fallar
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000), // Backoff exponencial
  staleTime: 60000,            // Cache por 1 minuto
  refetchOnWindowFocus: false, // No refetch al volver a la ventana
});
```

**Manejo de estado cuando falla después de reintentos:**

```typescript
// En el render - solo si falló TODOS los reintentos
{isLoading ? (
  <LoadingSpinner />
) : isError ? (
  <div className="flex flex-col items-center py-12 gap-4">
    <p className="text-muted-foreground">No se pudieron cargar los comentarios</p>
    <button 
      onClick={() => refetch()}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm"
    >
      Reintentar
    </button>
  </div>
) : view === "feed" ? (
  <FeedView ... />
) : (
  <MosaicView ... />
)}
```

---

### Por que esto arregla el problema

1. **retry: 3** - Si el primer request falla por error de red transitorio, reintenta automáticamente hasta 3 veces
2. **retryDelay con backoff** - Espera 1s, 2s, 4s entre reintentos, dándole tiempo a la red
3. **staleTime** - Una vez cargado, no vuelve a pedir por 1 minuto
4. **Botón reintentar** - Solo aparece si FALLAN los 3 reintentos automáticos

En la práctica: si el edge function funciona (y funciona), el retry automático debería cargar en el primer o segundo intento, sin que el usuario vea nada.

---

### Resultado esperado

```text
Intento 1: Failed → retry automático
Intento 2: Success → muestra comentarios

Usuario nunca ve el error, solo un loading ligeramente más largo.
```

