

# Plan: Mejoras al Mapa de Estadísticas

## Resumen de Cambios

1. **Tooltip clickeable** - Usar Radix Popover en lugar de tooltip manual
2. **Colores corregidos** - Amarillo = sin datos, gris = menos de 10 respuestas
3. **Leyenda mejorada** - Sin quintiles, usar rangos de valores reales
4. **Tabla con las 4 dimensiones** - Dinero, Desarrollo, Diversión, Promedio + Respuestas
5. **Filtrar tabla igual que mapa** - Solo mostrar países con 10+ respuestas
6. **Mejor zoom y contornos** - Configurar ZoomableGroup correctamente

---

## Cambios por Archivo

### 1. CountryMap.tsx

| Cambio | Descripcion |
|--------|-------------|
| Tooltip a Popover | Usar Radix Popover que se abre al hacer click y permanece abierto |
| Colores invertidos | Amarillo (#fcd34d) para sin datos, gris (#e5e5e5) para menos de 10 |
| Mejor zoom | Agregar zoom controls y limites razonables al ZoomableGroup |
| Bordes mas visibles | Aumentar strokeWidth a 0.75 y usar color mas oscuro |

**Antes (colores):**
```text
Sin datos -> gris claro
< 10 respuestas -> amarillo
```

**Despues (colores):**
```text
Sin datos -> amarillo (llama la atencion para pedir datos)
< 10 respuestas -> gris claro (se ve pero no cuenta)
```

**Popover en lugar de tooltip:**
```typescript
// Click para abrir popover que permanece abierto
// El usuario puede clickear el link de Twitter
// Click afuera o en otro pais para cerrar
```

---

### 2. StatsLegend.tsx

Cambiar de quintiles confusos a rangos de valores claros:

**Antes:**
```text
Q5 (mas alto)
Q4
Q3
Q2
Q1 (mas bajo)
```

**Despues:**
```text
8-10 (muy alto)
6-8 (alto)
4-6 (medio)
2-4 (bajo)
0-2 (muy bajo)
Sin datos
< 10 respuestas
```

---

### 3. Edge Function get-country-stats

Modificar para devolver las 4 dimensiones por pais en una sola llamada:

**Nueva respuesta:**
```typescript
interface CountryFullStat {
  country: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  promedio: number;
  count: number;
}

// GET /get-country-stats?period=all
// Devuelve todas las dimensiones por pais
```

---

### 4. StatsPage.tsx

**Cambios en la tabla:**
- Mostrar columnas: Pais, Dinero, Desarrollo, Diversion, Promedio, Respuestas
- Filtrar: solo paises con 10+ respuestas
- Ordenar: por promedio descendente
- Agregar bandera emoji al nombre del pais

**Nueva estructura de tabla:**
```text
| Pais          | Dinero | Desarrollo | Diversion | Promedio | Resp. |
|---------------|--------|------------|-----------|----------|-------|
| Bolivia       | 7.7    | 7.5        | 6.1       | 7.1      | 11    |
| Mexico        | 5.8    | 6.8        | 6.3       | 6.3      | 1,093 |
```

---

## Seccion Tecnica

### Edge Function Actualizada

```typescript
interface StatsRequest {
  period: 'month' | 'all';
}

interface CountryFullStat {
  country: string;
  dinero: number;
  desarrollo: number;
  diversion: number;
  promedio: number;
  count: number;
}

serve(async (req) => {
  const { period }: StatsRequest = await req.json();

  // Obtener todas las dimensiones para el periodo
  const { data, error } = await supabase
    .from('country_stats_cache')
    .select('country, dimension, avg_value, count')
    .eq('period', period);

  // Agrupar por pais
  const byCountry = new Map<string, CountryFullStat>();
  
  for (const row of data) {
    if (!byCountry.has(row.country)) {
      byCountry.set(row.country, {
        country: row.country,
        dinero: 0,
        desarrollo: 0,
        diversion: 0,
        promedio: 0,
        count: row.count,
      });
    }
    const stat = byCountry.get(row.country)!;
    stat[row.dimension] = row.avg_value;
  }

  return Response.json({ 
    stats: Array.from(byCountry.values()) 
  });
});
```

### CountryMap: Popover clickeable

```typescript
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Estado para pais seleccionado
const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

// Click en pais abre popover
const handleClick = (geoName: string) => {
  const country = getCountryByEnglishName(geoName);
  setSelectedCountry(country?.code || null);
};

// Popover con contenido
<PopoverContent>
  <div>
    {flag} {name}
    {count >= 10 ? (
      <div>Promedio: {avg}</div>
    ) : (
      <a href={twitterUrl}>Pedi ayuda en Twitter</a>
    )}
  </div>
</PopoverContent>
```

### Funcion de color actualizada

```typescript
function getCountryColor(stat: CountryFullStat | undefined): string {
  if (!stat) return '#fcd34d'; // Sin datos -> AMARILLO
  if (stat.count < 10) return '#e5e5e5'; // Pocos datos -> GRIS
  
  // Rangos fijos de valores (no quintiles)
  const avg = stat.promedio;
  if (avg >= 8) return '#252525';  // 8-10
  if (avg >= 6) return '#555555';  // 6-8
  if (avg >= 4) return '#858585';  // 4-6
  if (avg >= 2) return '#b5b5b5';  // 2-4
  return '#e5e5e5';                // 0-2
}
```

### ZoomableGroup mejorado

```typescript
<ZoomableGroup
  zoom={1}
  minZoom={0.8}
  maxZoom={5}
  center={[0, 20]}
>
  <Geographies geography={GEO_URL}>
    {/* ... */}
  </Geographies>
</ZoomableGroup>
```

---

## Orden de Implementacion

1. Actualizar edge function para devolver las 4 dimensiones
2. Actualizar CountryMap: colores, popover, zoom
3. Actualizar StatsLegend: rangos en lugar de quintiles
4. Actualizar StatsPage: tabla con 4 columnas, filtro y orden

---

## Resultado Esperado

- Tooltip que se puede clickear (popover)
- Colores: amarillo = sin datos, gris = pocos datos
- Leyenda con rangos claros (8-10, 6-8, etc.)
- Tabla muestra Dinero, Desarrollo, Diversion, Promedio, Respuestas
- Tabla solo muestra paises con 10+ respuestas
- Zoom funcional con scroll del mouse
- Bordes de paises mas visibles

