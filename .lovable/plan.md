

## Cambiar orden del Mosaico a lectura horizontal

### Problema actual
El layout usa CSS `columns` que ordena verticalmente:
```
1  3  5
2  4  6
```

### Solución
Cambiar a CSS Grid para orden horizontal (lectura natural):
```
1  2  3
4  5  6
```

---

### Cambios

**Archivo**: `src/pages/CommentsPage.tsx`

#### 1. MosaicView - Cambiar de columns a grid
```css
/* Antes */
columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4

/* Después */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
```

#### 2. Cards - Remover `break-inside-avoid` y `mb-4`
Estas clases eran para el layout de columns. Con grid ya no son necesarias.

#### 3. MosaicSkeleton - Actualizar consistentemente
Aplicar los mismos cambios al skeleton para mantener coherencia visual.

---

### Trade-off

| CSS Columns (actual) | CSS Grid (propuesto) |
|---------------------|---------------------|
| Efecto masonry (alturas variables se acomodan) | Filas uniformes |
| Orden vertical ❌ | Orden horizontal ✅ |

El orden horizontal es más importante para contenido cronológico que el efecto masonry.

---

### Archivos a modificar
- `src/pages/CommentsPage.tsx` - MosaicView y MosaicSkeleton

