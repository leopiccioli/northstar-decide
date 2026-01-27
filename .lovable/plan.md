

# Plan: Guardar Primero + Compartir Después (Mobile y Desktop)

## Resumen

Unificar el flujo: **guardar es obligatorio antes de compartir**, independiente del dispositivo. El botón de compartir solo aparece después de guardar exitosamente.

---

## Flujo Actual vs Nuevo

```text
ACTUAL:
┌─────────────────────────────────────────────────────────┐
│ Mobile:  Resultados → [Compartir] ← directo            │
│                     → [Guardar historial] ← opcional   │
├─────────────────────────────────────────────────────────┤
│ Desktop: Resultados → [QR para compartir]              │
│                     → [Guardar historial] ← opcional   │
└─────────────────────────────────────────────────────────┘

NUEVO (ambos):
┌─────────────────────────────────────────────────────────┐
│ Resultados                                              │
│     ↓                                                   │
│ [Guardar para compartir] ← CTA principal               │
│     ↓                                                   │
│ (form email/país/recordatorio)                         │
│     ↓                                                   │
│ Success + [Compartir]  ← ahora sí, con ID guardado     │
└─────────────────────────────────────────────────────────┘
```

---

## Cambios Técnicos

### 1. Edge Function: Devolver ID en respuesta

**Archivo**: `supabase/functions/save-result/index.ts`

```typescript
// Línea ~300 - agregar id en el response
return new Response(
  JSON.stringify({ 
    success: true, 
    id: insertedRecord.id,  // ← AGREGAR
    hasHistory: !!previousMeasurement,
    emailPending: true
  }),
  { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

### 2. Nuevo Edge Function: `get-result`

**Archivo nuevo**: `supabase/functions/get-result/index.ts`

Para cargar resultados desde la ruta `/r/:id` (necesario por RLS).

```typescript
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { id } = await req.json();
  
  // Validar UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    return new Response(
      JSON.stringify({ error: "ID inválido" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .from('records_3d')
    .select('option_name, dinero, desarrollo, diversion, comment, comparison')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: "Resultado no encontrado" }),
      { status: 404, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      result: {
        optionName: data.option_name,
        scores: {
          dinero: data.dinero,
          desarrollo: data.desarrollo,
          diversion: data.diversion,
        },
        comment: data.comment,
        comparison: data.comparison,
      }
    }),
    { status: 200, headers: corsHeaders }
  );
});
```

### 3. Nueva Ruta `/r/:id`

**Archivo**: `src/App.tsx`

```typescript
import ResultPage from "./pages/ResultPage";

<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/r/:id" element={<ResultPage />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 4. Nueva Página de Resultado Compartido

**Archivo nuevo**: `src/pages/ResultPage.tsx`

Esta página:
- Carga el resultado desde la DB usando el ID
- Muestra scores en modo lectura
- Tiene botón de compartir (mobile) o QR (desktop)

```typescript
export default function ResultPage() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    const { data, error } = await supabase.functions.invoke('get-result', {
      body: { id }
    });
    if (data?.result) setResult(data.result);
    else setError('No encontrado');
    setLoading(false);
  };

  // ... render scores + share button
}
```

### 5. Modificar ResultScreen - Flujo Unificado

**Archivo**: `src/components/decision/ResultScreen.tsx`

**Cambios principales:**

1. **Eliminar botón de share antes de guardar** (tanto mobile como desktop)
2. **SaveSection visible por defecto** (no colapsable)
3. **Capturar recordId** al guardar exitosamente
4. **SuccessSection con botón de share** que funciona con el resultado guardado
5. **En desktop, mostrar QR** que apunta a `/r/{id}` para compartir desde mobile

```typescript
export function ResultScreen({ ... }) {
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // ...

  return (
    <div>
      {/* Resultados (scores, tabla, etc) */}
      
      {savedRecordId ? (
        // Post-guardado: mostrar success con opción de compartir
        <SuccessWithShare 
          recordId={savedRecordId}
          isMobile={isMobile}
          onShare={handleShare}
          userContext={userContext}
        />
      ) : (
        // Pre-guardado: mostrar form de guardado como CTA principal
        <SaveSection 
          currentOption={currentOption}
          comparisonOption={comparisonOption}
          onSaveSuccess={(id) => setSavedRecordId(id)}
        />
      )}
    </div>
  );
}
```

### 6. Actualizar SaveSection para devolver ID

```typescript
function SaveSection({ 
  currentOption, 
  comparisonOption,
  onSaveSuccess,  // Ahora recibe (id: string) => void
}: { 
  currentOption: Option; 
  comparisonOption: Option | null;
  onSaveSuccess: (recordId: string) => void;
}) {
  // ...
  
  const handleSave = async () => {
    // ... validaciones ...
    
    const { data, error } = await supabase.functions.invoke('save-result', {
      body: payload,
    });

    if (error) throw new Error(error.message);
    
    // Pasar el ID al padre
    if (data?.id) {
      onSaveSuccess(data.id);
    }
  };
}
```

### 7. Nuevo componente SuccessWithShare

```typescript
function SuccessWithShare({ 
  recordId,
  isMobile,
  onShare,
  userContext,
}: { 
  recordId: string;
  isMobile: boolean;
  onShare: () => void;
  userContext: string;
}) {
  const shareUrl = `https://3d.ceoencamiseta.com/r/${recordId}`;
  
  return (
    <div className="space-y-6 p-6 bg-secondary rounded-sm">
      {/* Confirmación */}
      <div className="text-center">
        <Check className="w-12 h-12 mx-auto" />
        <h3>Resultado guardado</h3>
        <p>Te mandamos un email con tus 3D.</p>
      </div>

      {/* Share */}
      {isMobile ? (
        <button onClick={onShare} className="btn-primary w-full">
          Pedir una segunda opinión
        </button>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm">
            📱 Escaneá para compartir desde tu celular
          </p>
          <QRCodeSVG value={shareUrl} size={100} />
        </div>
      )}

      {/* CTA comunidad */}
      <a href={CEO_COMMUNITY_URL} className="btn-secondary w-full">
        Unirme a CEO en Camiseta
      </a>
    </div>
  );
}
```

### 8. Actualizar MobileQRCard para URL custom

**Archivo**: `src/components/decision/MobileQRCard.tsx`

```typescript
interface MobileQRCardProps {
  url?: string;  // URL directa (overrides default)
  // ... props existentes
}

export function MobileQRCard({ url, context, source, medium, compact }: MobileQRCardProps) {
  // Si hay URL custom, usarla directamente
  const qrUrl = url 
    ? (url.startsWith('http') ? url : `https://3d.ceoencamiseta.com${url}`)
    : buildDefaultUrl();
  
  // ... resto igual
}
```

---

## Nueva UI - Vista Previa

### Antes de Guardar (igual en mobile y desktop)

```text
┌─────────────────────────────────────┐
│       [Nombre de la opción]         │
│                                     │
│  Dinero      ████████░░  8/10       │
│  Desarrollo  ██████░░░░  6/10       │
│  Diversión   ███████░░░  7/10       │
│                                     │
│       Promedio: 7.0                 │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Quienes repiten el 3D suelen       │
│  mejorar sus puntajes con el tiempo │
│                                     │
│  Guardá tu resultado y seguí        │
│  creciendo                          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ email@ejemplo.com           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Seleccioná tu país ▼        │    │
│  └─────────────────────────────┘    │
│                                     │
│  Recordatorio:                      │
│  [En 1 mes] [En 3 meses] [Sin]      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Guardar y avisarme        │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Después de Guardar - Mobile

```text
┌─────────────────────────────────────┐
│                                     │
│            ✓ (checkmark)            │
│                                     │
│       Resultado guardado            │
│                                     │
│  Te mandamos un email con tus 3D.   │
│  Revisá tu bandeja de entrada.      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Pedir una segunda opinión   │    │  ← Share directo
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Unirme a CEO en Camiseta →  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Después de Guardar - Desktop

```text
┌─────────────────────────────────────┐
│                                     │
│            ✓ (checkmark)            │
│                                     │
│       Resultado guardado            │
│                                     │
│  Te mandamos un email con tus 3D.   │
│  Revisá tu bandeja de entrada.      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📱 Compartí desde tu cel    │    │
│  │                             │    │
│  │    ┌──────────────┐         │    │
│  │    │   [QR CODE]  │         │    │  ← QR a /r/{id}
│  │    │  → /r/{id}   │         │    │
│  │    └──────────────┘         │    │
│  │                             │    │
│  │  Escaneá para compartir     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Unirme a CEO en Camiseta →  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/save-result/index.ts` | Incluir `id` en response JSON |
| `supabase/functions/get-result/index.ts` | **NUEVO** - Leer resultado por ID |
| `supabase/functions/get-result/deno.json` | **NUEVO** - Config del function |
| `supabase/config.toml` | Agregar config para `get-result` |
| `src/App.tsx` | Agregar ruta `/r/:id` |
| `src/pages/ResultPage.tsx` | **NUEVO** - Página de resultado compartido |
| `src/components/decision/ResultScreen.tsx` | Flujo unificado: guardar primero, luego share |
| `src/components/decision/MobileQRCard.tsx` | Soportar URL custom |

---

## Beneficios

- **Consistencia**: Mismo flujo en mobile y desktop
- **Datos garantizados**: Siempre se guarda antes de compartir
- **Links únicos**: Cada resultado tiene su URL persistente (`/r/{id}`)
- **Sin fricción en mobile**: El destinatario abre el link y ve el resultado directo
- **Trackeable**: Podemos medir quién abrió cada link compartido

