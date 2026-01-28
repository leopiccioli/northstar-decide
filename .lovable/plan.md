

# Plan: Pagina de Estadisticas por Pais (/por-pais)

## Resumen

Mapa mundial interactivo que muestra promedios de las 3D por pais, con filtros de periodo y dimension.

---

## Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/lib/countries.ts` | Lista maestra de paises (ISO, espanol, ingles) + helpers |
| `src/pages/StatsPage.tsx` | Pagina principal con layout y filtros |
| `src/components/stats/CountryMap.tsx` | Mapa interactivo con react-simple-maps |
| `src/components/stats/StatsLegend.tsx` | Leyenda de colores (quintiles) |
| `supabase/functions/get-country-stats/index.ts` | Edge function para agregacion |
| `public/maps/countries-110m.json` | TopoJSON del mundo (Natural Earth) |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/decision/ResultScreen.tsx` | Importar COUNTRIES desde lib/countries |
| `src/App.tsx` | Agregar ruta lazy /por-pais |
| `src/components/decision/EntryScreen.tsx` | Link discreto a /por-pais |

---

## Dependencia nueva

```
react-simple-maps
```

---

## Flujo de usuario

```text
EntryScreen
    |
    +-- Link discreto: "Ver estadisticas por pais" --> /por-pais
                                                          |
                                                          v
                                                    StatsPage
                                                          |
                                                    +-----+-----+
                                                    |           |
                                              Filtros      CountryMap
                                              (periodo,    (hover = tooltip,
                                              dimension)   click = detalle)
```

---

## Componentes

### 1. src/lib/countries.ts

Lista centralizada de paises con:
- `code`: ISO alpha-2 (AR, MX, ES)
- `name`: Nombre en espanol (para UI)
- `nameEn`: Nombre en ingles (para mapear TopoJSON)

Funciones helper:
- `getCountryByCode(code)` - buscar por ISO
- `getCountryByEnglishName(name)` - buscar por nombre TopoJSON
- `getCountryName(code)` - obtener nombre espanol

### 2. StatsPage.tsx

Layout:
- Header con titulo
- Filtros inline (periodo + dimension)
- Mapa ocupando el espacio principal
- Leyenda debajo del mapa

Filtros:
- **Periodo**: Ultimo mes | Ultimos 3 meses | Todo el tiempo
- **Dimension**: Dinero | Desarrollo | Diversion | Promedio

### 3. CountryMap.tsx

Usa `react-simple-maps` con TopoJSON:
- Render de todos los paises
- Color segun quintil del promedio
- Tooltip al hover con: nombre, promedio, cantidad de respuestas
- Paises con menos de 10 respuestas en amarillo

### 4. StatsLegend.tsx

Escala visual:
- 5 niveles de gris (Q1 a Q5)
- Indicador de "sin datos"
- Indicador de "menos de 10 respuestas"

### 5. Edge Function: get-country-stats

Request:
```typescript
{
  period: 'month' | '3months' | 'all',
  dimension: 'dinero' | 'desarrollo' | 'diversion' | 'promedio'
}
```

Response:
```typescript
{
  stats: [
    { country: 'AR', avg: 7.2, count: 1500 },
    { country: 'MX', avg: 6.8, count: 850 },
    ...
  ]
}
```

Query SQL (conceptual):
- Agrupa por country
- Filtra por created_at segun periodo
- Calcula AVG de la dimension (o promedio de las 3)
- Cuenta registros por pais

---

## Escala de colores

| Valor | Color | Significado |
|-------|-------|-------------|
| Sin datos | `#f5f5f5` | Pais sin registros |
| < 10 respuestas | `#fcd34d` | Datos insuficientes |
| Q1 (bajo) | `#e5e5e5` | Promedio mas bajo |
| Q2 | `#b5b5b5` | - |
| Q3 | `#858585` | - |
| Q4 | `#555555` | - |
| Q5 (alto) | `#252525` | Promedio mas alto |

---

## Seccion Tecnica

### Estructura de countries.ts

```typescript
export interface Country {
  code: string;      // ISO 3166-1 alpha-2
  name: string;      // Espanol
  nameEn: string;    // Ingles (TopoJSON)
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina' },
  { code: 'BO', name: 'Bolivia', nameEn: 'Bolivia' },
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil' },
  { code: 'CA', name: 'Canada', nameEn: 'Canada' },
  { code: 'CL', name: 'Chile', nameEn: 'Chile' },
  { code: 'CO', name: 'Colombia', nameEn: 'Colombia' },
  { code: 'CR', name: 'Costa Rica', nameEn: 'Costa Rica' },
  { code: 'DE', name: 'Alemania', nameEn: 'Germany' },
  { code: 'DO', name: 'Republica Dominicana', nameEn: 'Dominican Rep.' },
  { code: 'EC', name: 'Ecuador', nameEn: 'Ecuador' },
  { code: 'ES', name: 'Espana', nameEn: 'Spain' },
  { code: 'GT', name: 'Guatemala', nameEn: 'Guatemala' },
  { code: 'HN', name: 'Honduras', nameEn: 'Honduras' },
  { code: 'IL', name: 'Israel', nameEn: 'Israel' },
  { code: 'IT', name: 'Italia', nameEn: 'Italy' },
  { code: 'JP', name: 'Japon', nameEn: 'Japan' },
  { code: 'MX', name: 'Mexico', nameEn: 'Mexico' },
  { code: 'NI', name: 'Nicaragua', nameEn: 'Nicaragua' },
  { code: 'PA', name: 'Panama', nameEn: 'Panama' },
  { code: 'PE', name: 'Peru', nameEn: 'Peru' },
  { code: 'PR', name: 'Puerto Rico', nameEn: 'Puerto Rico' },
  { code: 'PT', name: 'Portugal', nameEn: 'Portugal' },
  { code: 'PY', name: 'Paraguay', nameEn: 'Paraguay' },
  { code: 'SV', name: 'El Salvador', nameEn: 'El Salvador' },
  { code: 'US', name: 'Estados Unidos', nameEn: 'United States of America' },
  { code: 'UY', name: 'Uruguay', nameEn: 'Uruguay' },
  { code: 'VE', name: 'Venezuela', nameEn: 'Venezuela' },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCountryByEnglishName(nameEn: string): Country | undefined {
  return COUNTRIES.find(c => c.nameEn === nameEn);
}

export function getCountryName(code: string): string {
  return getCountryByCode(code)?.name ?? code;
}
```

### Edge Function: get-country-stats

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { period, dimension } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Build date filter
  let dateFilter = null;
  if (period === 'month') {
    dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 1);
  } else if (period === '3months') {
    dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 3);
  }

  // Fetch all records with country
  let query = supabase
    .from('records_3d')
    .select('country, dinero, desarrollo, diversion')
    .not('country', 'is', null);
  
  if (dateFilter) {
    query = query.gte('created_at', dateFilter.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aggregate by country
  const byCountry = {};
  for (const row of data) {
    if (!byCountry[row.country]) {
      byCountry[row.country] = { sum: 0, count: 0 };
    }
    
    let value;
    if (dimension === 'promedio') {
      value = (row.dinero + row.desarrollo + row.diversion) / 3;
    } else {
      value = row[dimension];
    }
    
    byCountry[row.country].sum += value;
    byCountry[row.country].count++;
  }

  const stats = Object.entries(byCountry).map(([country, data]) => ({
    country,
    avg: Math.round((data.sum / data.count) * 10) / 10,
    count: data.count,
  }));

  return new Response(
    JSON.stringify({ stats }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

### Mapeo TopoJSON

El archivo `countries-110m.json` de Natural Earth usa nombres en ingles. El mapeo:

```typescript
// En CountryMap.tsx
const getCountryData = (geo) => {
  const englishName = geo.properties.name;
  const country = getCountryByEnglishName(englishName);
  
  if (!country) return null;
  
  return stats.find(s => s.country === country.code);
};
```

### Calculo de quintiles

```typescript
function getQuintileColor(value: number, allValues: number[]): string {
  const sorted = [...allValues].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.2)];
  const q2 = sorted[Math.floor(sorted.length * 0.4)];
  const q3 = sorted[Math.floor(sorted.length * 0.6)];
  const q4 = sorted[Math.floor(sorted.length * 0.8)];
  
  if (value <= q1) return '#e5e5e5';
  if (value <= q2) return '#b5b5b5';
  if (value <= q3) return '#858585';
  if (value <= q4) return '#555555';
  return '#252525';
}
```

---

## Orden de implementacion

1. Crear `src/lib/countries.ts`
2. Actualizar `ResultScreen.tsx` para importar desde lib
3. Crear edge function `get-country-stats`
4. Descargar TopoJSON a `public/maps/`
5. Crear componentes de stats (page, map, legend)
6. Agregar ruta en `App.tsx`
7. Agregar link en `EntryScreen.tsx`

