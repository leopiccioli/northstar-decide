
# Plan: Sistema de Compartir Viral

## Resumen

Implementar un sistema de sharing enfocado en **dilemas y conversación**, no en datos fríos. El usuario comparte una pregunta que invite respuesta, elige una etiqueta de identidad, y puede descargar una imagen visual para redes.

---

## Estructura de Pantalla (post-resultado)

```text
┌─────────────────────────────────────┐
│  [Scores del 3D]                    │
│                                     │
├─────────────────────────────────────┤
│  Pedí una segunda opinión           │  ← Título
│  Mandáselo a alguien y preguntale       │  ← Subtítulo
│  qué haría                          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Estoy para cambiar    ○    │    │  ← Etiquetas (1 tap)
│  │  Estoy estancado       ●    │    │
│  │  Estoy creciendo       ○    │    │
│  │  Estoy cómodo          ○    │    │
│  │  Estoy quemado         ○    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [     Compartir...     ]           │  ← Web Share API (primario)
│                                     │
│  [WhatsApp] [Twitter] [Copiar]      │  ← Fallback desktop
│                                     │
│  [  Descargar imagen  ]             │  ← Canvas PNG
│                                     │
├─────────────────────────────────────┤
│  Guardar historial (colapsado)      │  ← SaveSection secundario
└─────────────────────────────────────┘
```

---

## Etiquetas de Identidad

El usuario elige 1 antes de compartir/descargar:

| Etiqueta | Uso |
|----------|-----|
| Estoy para cambiar | Decisión activa |
| Estoy estancado | Frustración pasiva |
| Estoy creciendo | Momento positivo |
| Estoy cómodo | Status quo ok |
| Estoy quemado | Burnout |

La etiqueta aparece en:
- El texto compartido
- La imagen descargable

---

## Textos de Share (Dilema, no datos)

### Single Option

**WhatsApp:**
```
Me salió esto en mi 3D (Dinero 7 | Desarrollo 5 | Diversión 7).
Estoy estancado.
¿Vos qué harías?
https://northstar-decide.lovable.app <== Poner siempre 3d.ceoencamiseta.com
```

**Twitter/X:**
```
Mi 3D hoy: Dinero 7 | Desarrollo 5 | Diversión 7
Estoy estancado.
¿Cambiarías de trabajo con esto?
https://northstar-decide.lovable.app
```

### Comparison Mode (A vs B)

**WhatsApp:**
```
Comparé "quedarme" vs "cambiar".
Gana en dinero, pierdo en diversión.
¿Qué harías vos?
https://northstar-decide.lovable.app
```

**Twitter/X:**
```
Mi dilema 3D:
Quedarme: D$6 Dev5 Div7
Cambiar: D$8 Dev6 Div4
+Dinero / –Diversión
¿Cuál elegirías?
https://northstar-decide.lovable.app
```

---

## Imagen Descargable

Generada con Canvas API. Dos formatos:

| Formato | Uso |
|---------|-----|
| 1080x1350 | Feed IG/LinkedIn |
| 1080x1920 | Stories |

### Diseño Visual

```text
┌─────────────────────────────────┐
│                                 │
│   ┌───────────────────────┐     │
│   │ Estoy para cambiar    │     │  ← Etiqueta destacada
│   └───────────────────────┘     │
│                                 │
│   Dinero                        │
│   ████████████████░░░░  8      │  ← Barras grandes
│                                 │
│   Desarrollo                    │
│   ████████████░░░░░░░░  6      │
│                                 │
│   Diversión                     │
│   ████████░░░░░░░░░░░░  4      │
│                                 │
│   ─────────────────────         │
│   northstar-decide.app          │  ← URL pequeña
│                                 │
└─────────────────────────────────┘
```

### Comparación (A vs B)

```text
┌─────────────────────────────────┐
│                                 │
│   Quedarme      vs      Cambiar │
│                                 │
│   Dinero                        │
│   ████████  6    ██████████  8  │  ← Lado a lado
│                                 │
│   Desarrollo                    │
│   ██████  5      ████████  6    │
│                                 │
│   Diversión                     │
│   ██████████  7  ██████  4      │
│                                 │
│   ─────────────────────         │
│   +Dinero / –Diversión          │  ← Trade-off destacado
│   ─────────────────────         │
│   northstar-decide.app          │
└─────────────────────────────────┘
```

---

## Lógica de Trade-off (Comparación)

Para generar el texto "Gana en X, pierde en Y":

```typescript
function getTradeoff(a: Scores, b: Scores): string {
  const dims = ['dinero', 'desarrollo', 'diversión'];
  const gains = dims.filter(d => b[d] > a[d]);
  const losses = dims.filter(d => b[d] < a[d]);
  
  if (gains.length && losses.length) {
    return `+${gains.join('/')} / –${losses.join('/')}`;
  }
  // Fallback
  return '';
}
```

---

## Web Share API (Mobile First)

```typescript
async function handleShare() {
  const shareData = {
    title: '3D para decidir',
    text: getShareText(option, label, comparison),
    url: 'https://northstar-decide.lovable.app'
  };
  
  if (navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
  } else {
    // Fallback: mostrar botones individuales
    setShowFallbackButtons(true);
  }
}
```

---

## Archivos a Crear/Modificar

| Archivo | Descripción |
|---------|-------------|
| `src/components/decision/ShareSection.tsx` | Nuevo componente con etiquetas, share, imagen |
| `src/components/decision/ResultScreen.tsx` | Integrar ShareSection, hacer SaveSection colapsable |
| `src/index.css` | Estilos para etiquetas seleccionables |

---

## Detalle Tecnico

### ShareSection.tsx

```typescript
// Props
interface ShareSectionProps {
  currentOption: Option;
  comparisonOption: Option | null;
}

// State
const [selectedLabel, setSelectedLabel] = useState<string>('Estoy estancado');
const [showFallback, setShowFallback] = useState(false);
const [imageFormat, setImageFormat] = useState<'feed' | 'story'>('feed');

// Funciones principales
function getShareText(option, label, comparison?): string
function getTradeoff(a: Scores, b: Scores): string
async function handleNativeShare(): Promise<void>
function shareWhatsApp(): void
function shareTwitter(): void
function copyLink(): void
async function generateImage(format: 'feed' | 'story'): Promise<void>
```

### Canvas Image Generation

```typescript
async function generateImage(format: 'feed' | 'story') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Dimensiones
  canvas.width = 1080;
  canvas.height = format === 'feed' ? 1350 : 1920;
  
  // Fondo (respeta dark mode)
  ctx.fillStyle = isDark ? '#0f0f0f' : '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Renderizar etiqueta, barras, URL
  // ...
  
  // Descargar
  const link = document.createElement('a');
  link.download = `mi-3d-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

### SaveSection Colapsable

```typescript
// En ResultScreen.tsx
const [showSave, setShowSave] = useState(false);

// Render
<button 
  onClick={() => setShowSave(!showSave)}
  className="text-sm text-muted-foreground underline"
>
  Guardar historial
</button>

{showSave && <SaveSection ... />}
```

---

## Orden de Implementacion

1. Crear `ShareSection.tsx` con etiquetas y share nativo
2. Agregar fallback buttons (WhatsApp, Twitter, Copiar)
3. Implementar generador de imagen Canvas
4. Integrar en `ResultScreen.tsx`
5. Hacer `SaveSection` colapsable/secundario
6. Agregar tracking param `?ref=share` al link

---

## Query Param para Tracking

Los links compartidos incluyen:
```
https://northstar-decide.lovable.app?ref=share
```

Esto permite trackear conversiones desde shares.
