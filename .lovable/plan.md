
# Plan: Sharing Ultra-Minimalista

## Resumen

Simplificar `ShareSection.tsx` a un solo botón que:
- En mobile: usa Web Share API nativo
- En desktop: copia automáticamente al clipboard + muestra toast

Sin "Más opciones", sin botones secundarios, sin selector de formato.

---

## Flujo Único

```text
Usuario toca "Pedir una segunda opinión"
         │
         ▼
    ¿Soporta navigator.share?
         │
    ┌────┴────┐
    Sí        No
    │         │
    ▼         ▼
  Share     Copiar al
  nativo    clipboard
    │         │
    ▼         ▼
  (iOS/     Toast:
  Android   "Copiado.
  picker)   Pegalo donde
            quieras"
```

---

## Cambios en ShareSection.tsx

### Lo que se elimina

- Botones WhatsApp, Twitter, Copiar link
- Selector Feed/Story
- Botón "Descargar imagen"
- Toggle "Más opciones"
- Estado `showFallback`
- Microcopy "Mandáselo a alguien..."

### Lo que queda

```text
┌─────────────────────────────────────┐
│  Pedí una segunda opinión           │  ← Título
│                                     │
│  [ Estoy para cambiar ]             │
│  [ Estoy estancado    ] ●           │  ← Etiquetas (1 selección)
│  [ Estoy creciendo    ]             │
│  [ Estoy cómodo       ]             │
│  [ Estoy quemado      ]             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Pedir una segunda opinión  │    │  ← UNICO BOTON
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Lógica del Botón

```typescript
const handleShare = async () => {
  const text = getShareTextByLabel(selectedLabel, currentOption.scores);
  const url = 'https://3d.ceoencamiseta.com';
  const fullText = `${text}\n${url}`;

  // Intentar share nativo primero
  if (navigator.share) {
    try {
      await navigator.share({ text: fullText });
      return;
    } catch (err) {
      // Usuario canceló o falló - continuar a clipboard
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback: copiar al clipboard
  await navigator.clipboard.writeText(fullText);
  toast({
    title: "Copiado",
    description: "Pegalo en WhatsApp o donde quieras",
  });
};
```

---

## Textos por Etiqueta

```typescript
const shareTemplates: Record<IdentityLabel, string> = {
  'Estoy para cambiar': 
    `Estoy para cambiar.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Vos cambiarías?`,
  
  'Estoy estancado': 
    `Me siento estancado.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Qué harías en mi lugar?`,
  
  'Estoy creciendo': 
    `Creo que voy creciendo.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Te cierra o estoy flasheando?`,
  
  'Estoy cómodo': 
    `Estoy cómodo donde estoy.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Moverías algo?`,
  
  'Estoy quemado': 
    `Creo que estoy quemado.\nMi 3D: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Hora de cambiar?`,
};
```

---

## Comparación (A vs B)

Para modo comparación, template especial:

```typescript
const comparisonTemplate = 
  `Comparé "{a}" vs "{b}".\n{tradeoff}\n¿Qué harías vos?`;

// Ejemplo output:
// "Comparé "quedarme" vs "cambiar".
// +Dinero / –Diversión
// ¿Qué harías vos?
// https://3d.ceoencamiseta.com"
```

---

## Estructura Final del Componente

```typescript
// Estado mínimo
const [selectedLabel, setSelectedLabel] = useState<IdentityLabel>('Estoy estancado');

// Render ultra-simple
return (
  <div className="space-y-6">
    {/* Título */}
    <h3 className="text-lg font-semibold text-center">
      Pedí una segunda opinión
    </h3>

    {/* Etiquetas */}
    <div className="flex flex-wrap gap-2 justify-center">
      {IDENTITY_LABELS.map((label) => (
        <button
          key={label}
          onClick={() => setSelectedLabel(label)}
          className={`px-3 py-1.5 text-sm rounded-sm border transition-all
            ${selectedLabel === label 
              ? 'bg-foreground text-background border-foreground' 
              : 'bg-background border-border hover:border-foreground/50'
            }`}
        >
          {label}
        </button>
      ))}
    </div>

    {/* CTA único */}
    <button
      onClick={handleShare}
      className="btn-primary w-full"
    >
      Pedir una segunda opinión
    </button>
  </div>
);
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/decision/ShareSection.tsx` | Simplificar a un solo botón, eliminar opciones secundarias, implementar clipboard fallback |

---

## Lo que se mantiene igual

- Etiquetas de identidad (5 opciones)
- Lógica de textos conversacionales
- Integración en ResultScreen
- SaveSection colapsable (ya implementado)

---

## Beneficios

- **Cero decisiones**: 1 botón, 1 acción
- **Mismo UX en mobile y desktop**: Share nativo o clipboard
- **Toast informativo**: Usuario sabe qué pasó
- **Código más simple**: ~50% menos líneas
