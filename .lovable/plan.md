

# Plan: Ajustar Edge Function para bucket correcto

## Situación Actual

- **Bucket existente:** `csv`
- **Archivo:** `legacy-import.csv`
- **Edge Function actual:** Configurada para leer de bucket `legacy-import`

## Cambio Necesario

Modificar una línea en `supabase/functions/import-legacy-csv/index.ts`:

```typescript
// Línea 54 actual:
const { data: fileData, error: downloadError } = await supabase.storage
  .from("legacy-import")  // ← cambiar esto
  .download(filename);

// Cambiar a:
const { data: fileData, error: downloadError } = await supabase.storage
  .from("csv")  // ← bucket correcto
  .download(filename);
```

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/import-legacy-csv/index.ts` | Cambiar bucket de `legacy-import` a `csv` |

## Después del Cambio

1. La función se despliega automáticamente
2. Ejecuto la función con `{ "filename": "legacy-import.csv" }`
3. Vemos el resultado con conteo de registros importados

## Sección Técnica

El cambio es mínimo - solo actualizar el nombre del bucket en la llamada a `supabase.storage.from()`. El resto de la lógica (parseo CSV, mapeo de columnas, inserción en batches) permanece igual.

