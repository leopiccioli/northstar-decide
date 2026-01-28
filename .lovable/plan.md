

# Plan: Importar CSV via Storage Bucket

## Estrategia

1. Crear un bucket privado `legacy-import`
2. Vos subís el CSV desde Cloud View → Files
3. Edge Function lee el archivo del bucket, parsea y carga a `staging_legacy_3d`
4. La función devuelve un resumen con conteo de éxitos/errores

---

## Por qué es mejor

| Aspecto | Bucket + Edge Function |
|---------|------------------------|
| Tamaño | Sin límite práctico (hasta 50MB) |
| Confiabilidad | El archivo persiste, se puede reintentar |
| Visibilidad | Logs en Cloud View → Functions |
| Progreso | La función retorna estadísticas al terminar |

---

## Flujo Visual

```text
Cloud View → Files
      │
      ▼
┌─────────────────────┐
│ Bucket: legacy-     │
│ import              │
│ └── data.csv        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Edge Function:      │
│ import-legacy-csv   │
│                     │
│ 1. Lee archivo      │
│ 2. Parsea CSV       │
│ 3. Inserta en       │
│    staging_legacy   │
│ 4. Retorna stats    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Response:           │
│ {                   │
│   total: 13000,     │
│   inserted: 12950,  │
│   errors: 50        │
│ }                   │
└─────────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| Migration SQL | Crear | Bucket `legacy-import` con policy para service role |
| `supabase/functions/import-legacy-csv/index.ts` | Crear | Edge function que lee y procesa |
| `supabase/functions/import-legacy-csv/deno.json` | Crear | Config Deno |
| `supabase/config.toml` | Modificar | Agregar función |

---

## Edge Function: `import-legacy-csv`

```typescript
// Lógica principal:
// 1. Recibe POST con { filename: "data.csv" }
// 2. Lee el archivo desde storage con service role
// 3. Parsea CSV línea por línea
// 4. Inserta en batches de 100 registros
// 5. Cuenta éxitos y errores
// 6. Retorna resumen JSON

// Características:
// - Procesa en memoria con streaming
// - Maneja valores vacíos y comillas
// - Loguea errores específicos por línea
// - Timeout de 120 segundos (suficiente para 13K registros)
```

---

## Bucket Storage

```sql
-- Crear bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('legacy-import', 'legacy-import', false);

-- Policy: solo service role puede leer/escribir
-- (el bucket privado ya restringe acceso público)
```

---

## Pasos de Ejecución

1. **Crear bucket** via migración SQL
2. **Crear Edge Function** `import-legacy-csv`
3. **Vos subís el CSV** en Cloud View → Files → legacy-import
4. **Llamás a la función** (te doy el comando curl o un botón)
5. **Ves el resultado** con conteo de registros insertados
6. **Continuamos** con la migración a `records_3d`

---

## Manejo de Errores

- Si la función falla, el archivo sigue en el bucket - se puede reintentar
- Cada error de parseo se loguea con número de línea
- El response final incluye array de errores específicos
- Logs disponibles en Cloud View → Functions → import-legacy-csv

---

## Sección Técnica

### Estructura del CSV esperada

```text
um,Email,Fecha,Dinero,Desarrollo,Diversión,Comentario,País de Residencia
12075,email@example.com,2026-01-27 19:53,5,7,9,"comentario",Perú
```

### Mapeo de columnas

| CSV Header | DB Column |
|------------|-----------|
| um | legacy_id |
| Email | email |
| Fecha | fecha |
| Dinero | dinero |
| Desarrollo | desarrollo |
| Diversión | diversion |
| Comentario | comentario |
| País de Residencia | pais |

### Validaciones

- Email no vacío (requerido)
- Scores 1-10 (convertidos a integer)
- Fecha parseada como string (se convierte después)

