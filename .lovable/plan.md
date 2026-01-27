

# Plan: QR en Home + Compartir Solo desde Mobile

## Resumen

1. **QR en EntryScreen (Home)**: Card elegante above the fold con QR dinámico que incluye UTMs
2. **Compartir solo en mobile**: En desktop, reemplazar botón de share por mensaje que invita a usar el celular

---

## 1. QR Code en Home (Desktop Only)

### Diseño Visual

```text
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   3D para decidir                       │
│                     tu trabajo                          │
│                                                         │
│     En 20 segundos vas a poder tomar una mejor          │
│                  decisión laboral.                      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  📱                                               │  │
│  │  Versión más potente en tu teléfono               │  │
│  │                                                   │  │
│  │  Compartí resultados, pedí segundas               │  │
│  │  opiniones y guardá tu historial al instante.     │  │
│  │                                                   │  │
│  │           ┌─────────────┐                         │  │
│  │           │  [QR CODE]  │                         │  │
│  │           │             │                         │  │
│  │           └─────────────┘                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                    [ Empezar ]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Comportamiento

- **Solo visible en desktop** (usando `useIsMobile()`)
- El QR incluye UTMs dinámicos para trackear conversiones
- URL del QR: `https://3d.ceoencamiseta.com?utm_source=qr&utm_medium=desktop&utm_campaign=mobile_redirect`

### Implementación

**Nueva dependencia**: `qrcode.react`

```bash
npm install qrcode.react
```

**Nuevo componente**: `src/components/decision/MobileQRCard.tsx`

```typescript
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const BASE_URL = 'https://3d.ceoencamiseta.com';

export function MobileQRCard() {
  // Build URL with UTM params
  const qrUrl = new URL(BASE_URL);
  qrUrl.searchParams.set('utm_source', 'qr');
  qrUrl.searchParams.set('utm_medium', 'desktop');
  qrUrl.searchParams.set('utm_campaign', 'mobile_redirect');
  
  return (
    <Card className="border-border bg-secondary/50">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Smartphone className="w-5 h-5" />
          <span>Versión más potente en tu teléfono</span>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Compartí resultados, pedí segundas opiniones y guardá tu historial al instante.
        </p>
        
        <div className="p-3 bg-white rounded-lg">
          <QRCodeSVG
            value={qrUrl.toString()}
            size={120}
            level="M"
            bgColor="white"
            fgColor="black"
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

**Modificación**: `src/components/decision/EntryScreen.tsx`

```typescript
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileQRCard } from './MobileQRCard';

export function EntryScreen({ onStart }: EntryScreenProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="...">
      {/* ... título y promesa ... */}
      
      {/* QR Card - only on desktop */}
      {!isMobile && <MobileQRCard />}
      
      {/* CTA */}
      <button onClick={onStart} className="btn-primary ...">
        Empezar
      </button>
    </div>
  );
}
```

---

## 2. Compartir Solo desde Mobile

### En Desktop: Mensaje en Lugar de Botón

```text
Resultados
┌────────────────────────────┐
│  [Scores + Promedio]       │
├────────────────────────────┤
│                            │
│  ┌──────────────────────┐  │
│  │ 📱 Para compartir,   │  │  ← Info card (en vez de botón)
│  │    escaneá el QR     │  │
│  │    desde tu celular  │  │
│  │                      │  │
│  │    [QR pequeño]      │  │
│  └──────────────────────┘  │
│                            │
│  [ Guardar historial ]     │  ← Solo este botón activo
│                            │
└────────────────────────────┘
```

### En Mobile: Botón de Share Normal

El flujo de share con imagen sigue funcionando igual.

### Implementación

**Modificación**: `src/components/decision/ResultScreen.tsx`

```typescript
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileQRCard } from './MobileQRCard';

export function ResultScreen({ ... }) {
  const isMobile = useIsMobile();
  
  return (
    // ...resultados...
    
    {/* Action section */}
    {saved ? (
      <SuccessSection onShare={isMobile ? handleShare : undefined} />
    ) : (
      <div className="space-y-3">
        {isMobile ? (
          // Mobile: botón de share normal
          <button onClick={handleShare} className="btn-primary w-full">
            Pedir una segunda opinión
          </button>
        ) : (
          // Desktop: card con QR
          <div className="p-4 bg-secondary rounded-sm border border-border text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Para compartir, escaneá desde tu celular</span>
            </div>
            <div className="p-2 bg-white rounded inline-block">
              <QRCodeSVG value={qrUrl} size={80} />
            </div>
          </div>
        )}
        
        {/* Guardar historial - siempre visible */}
        <button onClick={() => setShowSave(!showSave)} className="...">
          Guardar historial
        </button>
      </div>
    )}
  );
}
```

---

## 3. URL del QR con Contexto

El QR en ResultScreen puede incluir más contexto:

```typescript
// En ResultScreen, el QR puede incluir el contexto del usuario
const buildResultQRUrl = () => {
  const url = new URL('https://3d.ceoencamiseta.com');
  url.searchParams.set('utm_source', 'qr');
  url.searchParams.set('utm_medium', 'desktop_result');
  url.searchParams.set('utm_campaign', 'share_redirect');
  url.searchParams.set('context', userContext); // improve, change, burnout, etc.
  return url.toString();
};
```

---

## Archivos a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `package.json` | Agregar dependencia `qrcode.react` |
| `src/components/decision/MobileQRCard.tsx` | **NUEVO** - Componente reutilizable de QR con mensaje |
| `src/components/decision/EntryScreen.tsx` | Importar `useIsMobile`, mostrar QR card en desktop |
| `src/components/decision/ResultScreen.tsx` | Condicionar botón share vs QR según dispositivo |

---

## Flujo Completo

```text
Usuario en Desktop
       │
       ▼
 ┌──────────────┐
 │  EntryScreen │
 │  + QR Card   │──── Escanea QR ───▶ Abre en mobile
 └──────────────┘
       │
       ▼ (sigue en desktop)
 ┌──────────────┐
 │  Completa 3D │
 └──────────────┘
       │
       ▼
 ┌──────────────┐
 │ ResultScreen │
 │  + QR Card   │──── Escanea QR ───▶ Abre en mobile (con context)
 │ (no share)   │
 └──────────────┘
       │
       ▼
 Puede guardar historial normalmente
```

---

## Beneficios

- **Elegante**: Card minimalista con el mismo look & feel
- **Trackeable**: UTMs en el QR para medir conversiones desktop→mobile
- **Sin fricción**: El usuario entiende que mobile es mejor sin frustración
- **Guardar sigue funcionando**: La retención en desktop no se pierde

