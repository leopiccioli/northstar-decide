
# Plan: Corregir flujo de comparacion y mostrar comentarios

## Resumen

Este plan corrige dos problemas identificados en la herramienta 3D:

1. **Flujo de comparacion**: Actualmente la primera opcion se guarda como "Opcion A" hardcodeado. Vamos a pedir el nombre de ambas opciones.

2. **Comentarios en resultados**: Los comentarios opcionales se guardan pero no se muestran. Vamos a mostrarlos en la pantalla de resultados.

---

## Cambios propuestos

### 1. Corregir el flujo de comparacion

**Problema actual:**
- Cuando el usuario elige "Comparar dos opciones", la primera pantalla de input no pide el nombre de la opcion
- En `DecisionFlow.tsx` linea 32, se hardcodea `name: 'Opcion A'`
- Esto hace que en la tabla de resultados aparezca "Opcion A" en lugar del nombre real

**Solucion:**

En `InputScreen.tsx`:
- Mostrar el campo de nombre tambien para la **primera opcion** del flujo de comparacion
- Cambiar la logica: si es comparacion (primera o segunda), siempre pedir nombre
- Agregar una nueva prop `isFirstComparison` para diferenciar primera vs segunda opcion
- Ajustar el placeholder y texto segun corresponda

En `DecisionFlow.tsx`:
- Usar el nombre real que viene del `InputScreen` en lugar de hardcodear "Opcion A"
- Pasar la prop `isFirstComparison={true}` a la primera pantalla de comparacion

### 2. Mostrar comentarios en resultados

**Problema actual:**
- Los comentarios se guardan en `currentOption.comment` y `comparisonOption.comment`
- Pero `ResultScreen.tsx` no los muestra en ningun lugar

**Solucion:**

En `ResultScreen.tsx`:
- Para evaluacion simple: mostrar el comentario debajo de las barras de score (si existe)
- Para comparacion: mostrar los comentarios de ambas opciones debajo de la tabla (si existen)
- Usar un estilo sutil (texto gris, italica) para que no compita con los insights

---

## Detalles tecnicos

### Archivo: `src/components/decision/InputScreen.tsx`

```text
Cambios:
1. Agregar prop `isFirstComparison?: boolean`
2. Modificar la condicion del header para mostrar input de nombre:
   - Antes: solo si `isComparison`
   - Ahora: si `isComparison` O si `isFirstComparison`
3. Cambiar textos segun el caso:
   - Primera opcion: "Carga la primera opcion"
   - Segunda opcion: "Ahora carga la otra opcion"
4. Ajustar el valor inicial de `name`: string vacio para ambos casos de comparacion
```

### Archivo: `src/components/decision/DecisionFlow.tsx`

```text
Cambios:
1. Linea 32: cambiar `name: 'Opcion A'` por `name` (el valor real del input)
2. Linea 79-84: agregar prop `isFirstComparison={state.context === 'compare'}` 
   al InputScreen del step 'input'
```

### Archivo: `src/components/decision/ResultScreen.tsx`

```text
Cambios:
1. En la seccion de resultado simple (lineas 151-171):
   - Agregar debajo de las barras un bloque condicional
   - Si `currentOption.comment` existe, mostrar el comentario

2. En la seccion de comparacion (lineas 173-178):
   - Agregar debajo de la tabla un bloque para comentarios
   - Mostrar comentario de opcion A si existe
   - Mostrar comentario de opcion B si existe

Estructura del comentario:
<blockquote className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
  "{comment}"
</blockquote>
```

---

## Flujo corregido

```text
COMPARACION (nuevo flujo):
1. Usuario elige "Comparar dos opciones"
2. Pantalla input con:
   - Texto: "Carga la primera opcion"
   - Campo nombre (obligatorio)
   - Sliders 3D
   - Comentario opcional
3. Pantalla input con:
   - Texto: "Ahora carga la otra opcion"  
   - Campo nombre (obligatorio)
   - Sliders 3D
   - Comentario opcional
4. Resultado con:
   - Tabla mostrando nombres reales
   - Comentarios de ambas opciones (si existen)
   - Insights de comparacion
```

---

## Archivos a modificar

| Archivo | Tipo de cambio |
|---------|----------------|
| `src/components/decision/InputScreen.tsx` | Agregar prop, ajustar logica de UI |
| `src/components/decision/DecisionFlow.tsx` | Usar nombre real, pasar nueva prop |
| `src/components/decision/ResultScreen.tsx` | Agregar seccion de comentarios |
