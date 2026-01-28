
# Plan: Arreglar bug de cuartiles duplicados en la leyenda

## Problema Detectado

Cuando se cambia de período (Trimestre -> Todo), la leyenda muestra 7+ rangos de grises mezclados en lugar de solo 4 cuartiles fijos.

**Causa raíz**: En `StatsLegend.tsx`, el `key` de React usa el `label` (el rango numérico como "6.1 - 6.3") en lugar del color. Cuando los cuartiles cambian, React no identifica correctamente qué elementos reemplazar, causando que se acumulen elementos de ambos períodos.

---

## Solución

### 1. Cambiar la clave de React en StatsLegend

Usar el **color** (que es constante: `#252525`, `#555555`, `#858585`, `#b5b5b5`) como `key` en lugar del `label` (que cambia con cada período).

### 2. Centralizar la paleta de colores

Mover los 4 colores de cuartiles a una constante compartida entre `CountryMap.tsx` y `StatsLegend.tsx` para evitar duplicación y asegurar consistencia.

---

## Sección Tecnica

### Archivo: src/config/stats.ts

Agregar la paleta de colores centralizada:

```typescript
export const MIN_RESPONSES_THRESHOLD = 30;

// Paleta de colores para cuartiles (de mayor a menor)
export const QUARTILE_COLORS = {
  q4: '#252525',  // Top quartile (más oscuro)
  q3: '#555555',
  q2: '#858585',
  q1: '#b5b5b5',  // Bottom quartile (más claro)
  noData: '#fcd34d',        // Amarillo - sin datos
  insufficient: '#e5e5e5',  // Gris claro - datos insuficientes
} as const;
```

### Archivo: src/components/stats/StatsLegend.tsx

Cambiar de `key={item.label}` a `key={item.color}` e importar los colores desde config:

```typescript
import { MIN_RESPONSES_THRESHOLD, QUARTILE_COLORS } from '@/config/stats';

// Usar keys fijos basados en identificadores, no en labels dinámicos
const legendItems = [
  { id: 'q4', color: QUARTILE_COLORS.q4, label: quartileBoundaries ? `${formatValue(quartileBoundaries.q3)} - ${formatValue(quartileBoundaries.max)}` : 'Muy alto' },
  { id: 'q3', color: QUARTILE_COLORS.q3, label: quartileBoundaries ? `${formatValue(quartileBoundaries.q2)} - ${formatValue(quartileBoundaries.q3)}` : 'Alto' },
  { id: 'q2', color: QUARTILE_COLORS.q2, label: quartileBoundaries ? `${formatValue(quartileBoundaries.q1)} - ${formatValue(quartileBoundaries.q2)}` : 'Medio' },
  { id: 'q1', color: QUARTILE_COLORS.q1, label: quartileBoundaries ? `${formatValue(quartileBoundaries.min)} - ${formatValue(quartileBoundaries.q1)}` : 'Bajo' },
];

// En el render:
{legendItems.map((item) => (
  <div key={item.id} className="...">
```

### Archivo: src/components/stats/CountryMap.tsx

Importar los colores desde config en lugar de hardcodearlos:

```typescript
import { MIN_RESPONSES_THRESHOLD, QUARTILE_COLORS } from '@/config/stats';

function getCountryColor(stat: CountryFullStat | undefined, quartiles: QuartileBoundaries | null): string {
  if (!stat) return QUARTILE_COLORS.noData;
  if (stat.count < MIN_RESPONSES_THRESHOLD) return QUARTILE_COLORS.insufficient;
  
  if (!quartiles) return QUARTILE_COLORS.q2; // Fallback
  
  const avg = stat.promedio;
  if (avg >= quartiles.q3) return QUARTILE_COLORS.q4;
  if (avg >= quartiles.q2) return QUARTILE_COLORS.q3;
  if (avg >= quartiles.q1) return QUARTILE_COLORS.q2;
  return QUARTILE_COLORS.q1;
}
```

---

## Archivos a Modificar

1. `src/config/stats.ts` - Agregar constantes de colores
2. `src/components/stats/StatsLegend.tsx` - Usar keys fijos y colores centralizados
3. `src/components/stats/CountryMap.tsx` - Usar colores centralizados

---

## Resultado

- La leyenda siempre mostrara exactamente **4 cuartiles + 2 estados especiales**
- Los colores son constantes y centralizados
- Cambiar de periodo actualizara solo los labels numericos, sin duplicar elementos
