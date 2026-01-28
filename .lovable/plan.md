

# Plan: Backfill de Países + Mejora de Threshold en Tooltip

## Resumen

1. Backfill de países para registros sin país (1,195 registros recuperables)
2. Mejorar tooltip para NO mostrar promedio cuando hay menos de 10 respuestas
3. Agregar opción de "Pedir ayuda en Twitter" para países con datos insuficientes

---

## Datos Actuales

| Métrica | Valor |
|---------|-------|
| Total respuestas | 12,112 |
| Con país | 6,568 (54%) |
| Sin país | 5,544 (46%) |
| Backfilleables | 1,195 (de 719 emails) |
| Irrecuperables | ~4,349 |

---

## Cambios en la Base de Datos

### 1. Script de backfill (one-time)

Actualizar registros sin país usando el país más reciente del mismo email:

```sql
UPDATE records_3d r1
SET country = (
  SELECT r2.country 
  FROM records_3d r2 
  WHERE r2.email = r1.email 
  AND r2.country IS NOT NULL 
  ORDER BY r2.created_at DESC 
  LIMIT 1
)
WHERE r1.country IS NULL
AND EXISTS (
  SELECT 1 FROM records_3d r2 
  WHERE r2.email = r1.email 
  AND r2.country IS NOT NULL
);
```

### 2. Refrescar cache después del backfill

```sql
SELECT public.refresh_country_stats();
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/stats/CountryMap.tsx` | Tooltip no muestra promedio si count < 10, agregar link Twitter |
| `src/lib/countries.ts` | Agregar campo `flag` (emoji) a cada país |

---

## Sección Técnica

### CountryMap: Tooltip mejorado

```typescript
// Tooltip content
{tooltipContent && (
  <div className="...">
    <div className="font-medium">
      {tooltipContent.name} {tooltipContent.flag}
    </div>
    
    {tooltipContent.count >= 10 ? (
      // Datos suficientes: mostrar promedio
      <>
        <div>Promedio: {tooltipContent.avg}</div>
        <div>{tooltipContent.count} respuestas</div>
      </>
    ) : tooltipContent.count > 0 ? (
      // Datos insuficientes: NO mostrar promedio
      <div className="text-amber-600">
        Datos insuficientes ({tooltipContent.count} respuestas)
      </div>
    ) : (
      // Sin datos
      <div>Sin datos</div>
    )}
    
    {/* Link Twitter para países con pocos datos */}
    {tooltipContent.count < 10 && (
      <a href={getTwitterUrl(tooltipContent.name, tooltipContent.flag)}>
        Pedí ayuda en Twitter
      </a>
    )}
  </div>
)}
```

### Función getTwitterUrl

```typescript
function getTwitterUrl(countryName: string, flag: string): string {
  const text = `Estoy armando el mapa de satisfacción laboral por país.

Necesito más datos de ${countryName} ${flag}

Solo toma 2 minutos: 3d.ceoencamiseta.com

#3Dlaborales`;

  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
```

### countries.ts: Agregar banderas

```typescript
export interface Country {
  code: string;
  name: string;
  nameEn: string;
  flag: string;  // Emoji de bandera
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', nameEn: 'Argentina', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', nameEn: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', nameEn: 'Brazil', flag: '🇧🇷' },
  // ... resto de países con sus banderas
];
```

---

## Orden de Implementación

1. Ejecutar script SQL de backfill (one-time via Run SQL)
2. Refrescar cache con `SELECT public.refresh_country_stats()`
3. Agregar banderas a `countries.ts`
4. Actualizar tooltip en `CountryMap.tsx`

---

## Resultado Esperado

Después del backfill:
- ~7,763 registros con país (vs 6,568 actuales)
- Tooltip que NO muestra promedio para países con < 10 respuestas
- Link de Twitter para pedir ayuda en países con pocos datos

