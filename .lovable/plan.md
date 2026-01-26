
# Agregar Campo de País al Formulario de Guardado

## Objetivo
Agregar un selector de país obligatorio junto al campo de email en la sección de guardado de resultados. Esto permitirá segmentar usuarios por ubicación geográfica para análisis y posibles campañas futuras.

## Cambios Propuestos

### 1. Agregar columna `country` a la base de datos
**Tabla:** `records_3d`

Crear una migración para agregar:
```sql
ALTER TABLE records_3d ADD COLUMN country TEXT;
```

Nota: Por ahora será nullable para no romper registros existentes. Podemos hacerla required más adelante si queremos.

### 2. Actualizar el formulario en ResultScreen
**Archivo:** `src/components/decision/ResultScreen.tsx`

Agregar un selector de país usando el componente Select de shadcn/ui:

```typescript
const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'CL', name: 'Chile' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' },
  { code: 'CO', name: 'Colombia' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'PE', name: 'Perú' },
  { code: 'HN', name: 'Honduras' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'MX', name: 'México' },
  { code: 'IT', name: 'Italia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'EC', name: 'Ecuador' },
];

// Nuevo estado
const [country, setCountry] = useState('');

// Validación adicional en handleSave
if (!country) {
  setCountryError('Seleccioná tu país');
  return;
}
```

### 3. Actualizar el Edge Function
**Archivo:** `supabase/functions/save-result/index.ts`

Modificar la interfaz y el insert para incluir el país:

```typescript
interface SaveResultRequest {
  email: string;
  country: string;  // NUEVO
  // ... resto igual
}

// En el insert:
country: body.country || null,
```

### 4. Actualizar types de Supabase
Se actualizará automáticamente cuando se ejecute la migración.

## Flujo de Usuario Actualizado

```text
┌─────────────────────────────────────────────────────────────┐
│  Guardá tu resultado                                        │
│  ─────────────────────                                      │
│                                                             │
│  ┌─────────────────────────────────────────────┐            │
│  │ email@ejemplo.com                           │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  ┌─────────────────────────────────────────────┐            │
│  │ Selecciona tu país               ▼          │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  Recordatorio: [1 mes] [3 meses] [Sin recordatorio]         │
│                                                             │
│  [Cancelar]              [ Guardar y avisarme ]             │
└─────────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar columna `country` a `records_3d` |
| `src/components/decision/ResultScreen.tsx` | Agregar selector de país con validación |
| `supabase/functions/save-result/index.ts` | Aceptar y guardar campo `country` |

## Consideraciones

- **Orden alfabético**: Los países están en el orden que proporcionaste, pero podemos ordenarlos alfabéticamente si preferís
- **Extensibilidad**: La lista está en una constante, fácil de agregar más países después
- **Validación**: El país será requerido en el frontend pero nullable en la DB para no romper registros históricos
- **Código ISO**: Guardamos el código de 2 letras (AR, US, ES) para estandarización
