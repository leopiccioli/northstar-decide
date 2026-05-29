## Cambios en /comentarios

### 1. Título
Reemplazar el `<h1>` del header de "Muro de los Lamentos" a **"Comentarios"**.

### 2. Quitar "Anónimo"
En la vista Feed, reemplazar el span "Anónimo" por un helper que muestre:
- Si hay `country`: nombre del país (con bandera si disponible)
- Si hay `sector`: el sector
- Si hay `ageRange`: el rango de edad
- Prioridad: país > sector > edad (o concatenar los que existan)
- Si no hay ninguno: mostrar nada o un guion corto (ej: "—")

Mantener el timestamp y el separador (·) tal como están.

### Archivo a modificar
- `src/pages/CommentsPage.tsx`