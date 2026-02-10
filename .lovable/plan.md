

## Cambios en Comentarios y Estadísticas

### 1. Renombrar "Pared de la Empatia" a "Muro de los Lamentos"

Cambio de titulo en `src/pages/CommentsPage.tsx`, linea 60.

### 2. Parametro URL para vista inicial en /comentarios

Leer el parametro `?vista=` de la URL para inicializar el estado de vista:
- `/comentarios?vista=mosaico` abre directamente en mosaico
- `/comentarios?vista=feed` o sin parametro abre en feed (default actual)

**Archivo**: `src/pages/CommentsPage.tsx`
- Importar `useSearchParams` de react-router-dom
- Leer `searchParams.get('vista')` para inicializar `view`:
  - `"mosaico"` -> `"mosaic"`
  - cualquier otro valor -> `"feed"`

### 3. Parametro URL para periodo en /por-pais

Leer el parametro `?periodo=` de la URL para inicializar el periodo:
- `/por-pais?periodo=trimestre` abre con "Ultimo trimestre"
- `/por-pais` sin parametro sigue abriendo en "Todo" (default actual)

**Archivo**: `src/pages/StatsPage.tsx`
- Importar `useSearchParams` de react-router-dom
- Leer `searchParams.get('periodo')` para inicializar `period`:
  - `"trimestre"` -> `"quarter"`
  - cualquier otro valor -> `"all"`

### Detalle tecnico

Ambos cambios usan `useSearchParams` solo para leer el valor inicial. El estado local sigue manejando los cambios del usuario despues de la carga. No se sincroniza la URL al cambiar el toggle/filtro (es solo para el deep link de entrada).

### Archivos a modificar
- `src/pages/CommentsPage.tsx` -- titulo + parametro `?vista=`
- `src/pages/StatsPage.tsx` -- parametro `?periodo=`

