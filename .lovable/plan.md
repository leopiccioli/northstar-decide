

# Plan: Share con Contexto + Botones Paralelos

## Resumen

1. **Usar el contexto inicial** del usuario para generar el texto de share automáticamente
2. **Mobile: compartir imagen** / **Web: copiar texto**
3. **Botones paralelos**: "Pedir una segunda opinión" y "Guardar historial" al mismo nivel

---

## Layout Final

```text
┌─────────────────────────────────────┐
│  [Resultado con scores]             │
│  [Promedio: X.X]                    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Pedir una segunda opinión  │    │  ← Primario (negro)
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Guardar historial       │    │  ← Secundario (outline)
│  └─────────────────────────────┘    │
│                                     │
│  [SaveSection expandido si click]   │
└─────────────────────────────────────┘
```

Ambos botones visibles, sin jerarquía oculta.

---

## Cambios Principales

### 1. Pasar userContext desde DecisionFlow

```typescript
// DecisionFlow.tsx
<ResultScreen
  currentOption={state.currentOption}
  comparisonOption={state.comparisonOption}
  userContext={state.context}  // NUEVO
/>
```

### 2. Textos Basados en Contexto Inicial

En vez de etiquetas manuales, usar el contexto que el usuario ya eligió:

| Contexto | Texto de Share |
|----------|---------------|
| `improve` | "Quiero mejorar mi trabajo. Mi 3D: {d}/{dev}/{div}. ¿Qué mejorarías primero?" |
| `change` | "Estoy pensando en cambiar. Mi 3D: {d}/{dev}/{div}. ¿Vos cambiarías?" |
| `burnout` | "Me siento estancado. Mi 3D: {d}/{dev}/{div}. ¿Qué harías en mi lugar?" |
| `check` | "Mi 3D hoy: {d}/{dev}/{div}. ¿Cómo lo ves?" |
| `compare` | "Comparé \"{a}\" vs \"{b}\". {tradeoff}. ¿Qué harías vos?" |

### 3. Mobile: Imagen / Web: Texto

```typescript
const handleShare = async () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const shareText = getShareTextByContext(userContext, scores);

  if (isMobile && navigator.share) {
    // Generar imagen PNG y compartirla
    const imageBlob = await generateShareImage();
    const file = new File([imageBlob], 'mi-3d.png', { type: 'image/png' });
    
    try {
      await navigator.share({
        files: [file],
        text: shareText,
        url: SHARE_URL,
      });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }
  }

  // Web: copiar texto
  await navigator.clipboard.writeText(`${shareText}\n${SHARE_URL}`);
  toast({ title: "Copiado", description: "Pegalo en WhatsApp o donde quieras" });
};
```

### 4. Botones Paralelos en ResultScreen

```typescript
// ResultScreen.tsx - Sección de acciones
<div className="space-y-3">
  {/* Share - Primario */}
  <button
    onClick={handleShare}
    className="btn-primary w-full"
  >
    Pedir una segunda opinión
  </button>

  {/* Guardar - Secundario (outline) */}
  <button
    onClick={() => setShowSave(!showSave)}
    className="w-full py-3 text-sm border border-border rounded-sm
               hover:border-foreground/50 transition-colors"
  >
    Guardar historial
  </button>
</div>

{showSave && <SaveSection ... />}
```

---

## Imagen para Mobile (Canvas)

Diseño simple:
- Fondo blanco/negro (dark mode)
- Barras visuales por dimensión
- URL: 3d.ceoencamiseta.com

```typescript
const generateShareImage = async (): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350; // Feed format
  const ctx = canvas.getContext('2d')!;

  // Fondo
  ctx.fillStyle = isDark ? '#0f0f0f' : '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Barras + scores + URL
  // ... renderizado

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/png');
  });
};
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/decision/DecisionFlow.tsx` | Pasar `userContext` a ResultScreen |
| `src/components/decision/ResultScreen.tsx` | Recibir `userContext`, mover lógica de share, botones paralelos |
| `src/components/decision/ShareSection.tsx` | Eliminar (lógica se mueve a ResultScreen) o simplificar a solo el handler |

---

## Lo que se Elimina

- Título "Pedí una segunda opinión" (redundante con el botón)
- Etiquetas de identidad seleccionables
- Toggle colapsado "Guardar historial" (ahora es botón visible)

---

## Beneficios

- **Cero decisiones extra**: El contexto ya está, no hay que elegir etiqueta
- **Mismo nivel visual**: Share y Guardar tienen igual importancia
- **Mobile optimizado**: Imagen lista para compartir
- **Web simple**: Texto copiado automáticamente

