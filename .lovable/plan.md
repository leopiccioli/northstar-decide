

# Optimizar Pantalla de Resultados para Mayor Conversión

## Objetivo
Aumentar la tasa de guardado eliminando fricción y simplificando la interfaz.

## Cambios Propuestos

### 1. Eliminar paso intermedio del formulario de guardado

**Archivo:** `src/components/decision/ResultScreen.tsx`

Actualmente el formulario está colapsado detrás de un botón "Guardar para después". El usuario tiene que hacer clic para expandirlo.

**Cambio:** Eliminar la lógica de `isExpanded` y mostrar el formulario siempre visible.

```typescript
// ANTES (líneas 137, 240-252)
const [isExpanded, setIsExpanded] = useState(!!trackingData.email);

if (!isExpanded) {
  return (
    <button onClick={() => setIsExpanded(true)}>
      Guardar para después
    </button>
  );
}

// DESPUÉS
// Eliminar estado isExpanded
// Eliminar el condicional if (!isExpanded)
// Eliminar el botón Cancelar (ya no tiene sentido)
// Mostrar el formulario directamente
```

También eliminar:
- El import de `Bookmark` (ya no se usa)
- El botón "Cancelar" del formulario

### 2. Reemplazar mensajes de opinión por "Promedio"

**Archivo:** `src/components/decision/GlobalScore.tsx`

Actualmente muestra mensajes como "Muy buen balance", "Vas por buen camino", "Hay trabajo por hacer" según el nivel.

**Cambio:** Mostrar simplemente "Promedio" sin importar el puntaje.

```typescript
// ANTES (líneas 18-22)
const levelLabels = {
  low: 'Hay trabajo por hacer',
  medium: 'Vas por buen camino',
  high: 'Muy buen balance',
};

// DESPUÉS
// Eliminar levelLabels y simplemente mostrar "Promedio"
<p className="text-sm font-medium">Promedio</p>
```

Los dots visuales (1-3 puntos) se mantienen porque son una representación visual neutra, no una opinión.

### 3. Botones de recordatorio en una sola línea

**Archivo:** `src/components/decision/ResultScreen.tsx`

Actualmente usa `flex-wrap gap-2` que puede hacer que "Sin recordatorio" salte a una segunda línea en pantallas pequeñas (como se ve en el screenshot).

**Cambio:** Usar `flex-nowrap` y reducir padding para que quepan los tres botones.

```typescript
// ANTES (línea 305)
<div className="flex flex-wrap gap-2">

// DESPUÉS
<div className="flex gap-1.5">
  <button className="px-2.5 py-1.5 text-sm whitespace-nowrap ...">
```

Ajustes:
- Cambiar `flex-wrap` a `flex` sin wrap
- Reducir `gap-2` a `gap-1.5`
- Reducir `px-3` a `px-2.5` en los botones
- Agregar `whitespace-nowrap` para evitar quiebres internos

## Flujo Visual Actualizado

```text
┌─────────────────────────────────────────────────────────────┐
│  Dinero                                              5/10   │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                                             │
│  Desarrollo                                          5/10   │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                                             │
│  Diversión                                           9/10   │
│  █████████████████████████████████████████████████░░░░░░░   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Promedio                              ●●● 6.3       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Quienes repiten el 3D suelen mejorar...             │   │
│  │                                                     │   │
│  │ Guardá tu resultado y comparalo después             │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ email@ejemplo.com                           │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │ País                                                │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ Seleccioná tu país                    ▼     │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │ Recordatorio                                        │   │
│  │ [En 1 mes] [En 3 meses] [Sin recordatorio]  ← UNA LÍNEA│
│  │                                                     │   │
│  │        [ Guardar y avisarme ]                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/decision/ResultScreen.tsx` | Eliminar lógica de expansión, ajustar botones de recordatorio |
| `src/components/decision/GlobalScore.tsx` | Reemplazar mensajes de opinión por "Promedio" |

## Impacto Esperado

- **Menos fricción**: El usuario ve el formulario inmediatamente, sin necesidad de hacer clic adicional
- **Más neutro**: Sin juicios de valor sobre el puntaje, solo datos
- **Mejor UX mobile**: Los tres botones de recordatorio siempre visibles en una línea

