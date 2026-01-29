
# Plan: Implementar Tracking de Ads (Meta Pixel, X Pixel, GA4)

## Resumen Ejecutivo

Tu app actualmente captura UTM parameters y fbclid/gclid en la URL, pero **no tiene ningún pixel de tracking instalado**. Esto significa que:
- No podés crear audiencias de retargeting
- No podés trackear conversiones para optimizar campanas
- No tenés datos de comportamiento en GA4

## Eventos Clave para Trackear

Basado en el flujo de tu app, estos son los eventos que deberías trackear:

| Evento | Punto del Flujo | Meta Pixel | X Pixel | GA4 |
|--------|-----------------|------------|---------|-----|
| **PageView** | Carga inicial | PageView | PageView | page_view |
| **Start Flow** | Click "Empezar" | InitiateCheckout | tw-xxxxx-xxxxx (custom) | begin_checkout |
| **Select Context** | Elige situacion | ViewContent | ViewContent | select_content |
| **Complete 3D** | Termina de puntuar | Lead | Lead | generate_lead |
| **Save Result** | Guarda con email | CompleteRegistration | CompleteRegistration | sign_up |
| **Share** | Comparte resultado | Share | Share | share |

## Arquitectura Propuesta

```text
index.html
    |
    +-- Scripts de pixels (Meta, X, GA4)
    |
src/lib/analytics.ts (NUEVO)
    |
    +-- Funciones wrapper type-safe
    |   - trackEvent()
    |   - trackPageView()
    |   - trackConversion()
    |
    +-- Inicializacion condicional
```

## Implementacion

### 1. Agregar Scripts Base en index.html

Insertar los snippets de cada plataforma en el `<head>`, usando IDs que se configuren como env variables publicas:

```html
<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s){...}
  fbq('init', 'TU_PIXEL_ID');
  fbq('track', 'PageView');
</script>

<!-- X (Twitter) Pixel -->
<script>
  !function(e,t,n,s,u,a){...}
  twq('config','TU_PIXEL_ID');
</script>

<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXX');
</script>
```

### 2. Crear Modulo de Analytics (src/lib/analytics.ts)

Un wrapper centralizado que:
- Abstrae las diferencias entre plataformas
- Evita errores si un pixel no esta cargado
- Permite activar/desactivar cada uno

```typescript
// src/lib/analytics.ts

// Type declarations para los pixels
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    twq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Configuracion de IDs (desde env o hardcoded)
const CONFIG = {
  META_PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID,
  X_PIXEL_ID: import.meta.env.VITE_X_PIXEL_ID,
  GA4_ID: import.meta.env.VITE_GA4_ID,
};

// Eventos del flujo 3D
type FlowEvent = 
  | 'start_flow'      // Empezar
  | 'select_context'  // Elige situacion
  | 'complete_3d'     // Termina sliders
  | 'save_result'     // Guarda con email
  | 'share_result';   // Comparte

export function trackFlowEvent(event: FlowEvent, data?: Record<string, unknown>) {
  // Meta Pixel
  if (window.fbq) {
    const metaEvents: Record<FlowEvent, string> = {
      start_flow: 'InitiateCheckout',
      select_context: 'ViewContent',
      complete_3d: 'Lead',
      save_result: 'CompleteRegistration',
      share_result: 'Share',
    };
    window.fbq('track', metaEvents[event], data);
  }

  // X Pixel
  if (window.twq) {
    const xEvents: Record<FlowEvent, string> = {
      start_flow: 'StartTrial',
      select_context: 'ViewContent',
      complete_3d: 'Lead',
      save_result: 'Signup',
      share_result: 'Share',
    };
    window.twq('track', xEvents[event], data);
  }

  // GA4
  if (window.gtag) {
    const ga4Events: Record<FlowEvent, string> = {
      start_flow: 'begin_checkout',
      select_context: 'select_content',
      complete_3d: 'generate_lead',
      save_result: 'sign_up',
      share_result: 'share',
    };
    window.gtag('event', ga4Events[event], data);
  }
}
```

### 3. Integrar en Componentes

Agregar llamadas en los puntos clave:

| Archivo | Evento | Donde |
|---------|--------|-------|
| `EntryScreen.tsx` | start_flow | onClick de "Empezar" |
| `ContextScreen.tsx` | select_context | onSelect |
| `InputScreen.tsx` | complete_3d | onComplete |
| `ResultScreen.tsx` | save_result | handleOptimisticSave |
| `ResultScreen.tsx` | share_result | handleShare |

Ejemplo de integracion:

```typescript
// EntryScreen.tsx
import { trackFlowEvent } from '@/lib/analytics';

const handleStart = () => {
  trackFlowEvent('start_flow');
  onStart();
};
```

### 4. Configurar IDs de Pixels

Hay dos opciones:

**Opcion A: Variables de entorno publicas (recomendado)**
```
VITE_META_PIXEL_ID=123456789
VITE_X_PIXEL_ID=xxxxx
VITE_GA4_ID=G-XXXXXXXXXX
```

**Opcion B: Hardcoded en el codigo**
Como son IDs publicos (no secretos), pueden ir directo en el codigo.

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `index.html` | Agregar scripts de Meta, X, GA4 |
| `src/lib/analytics.ts` | Crear modulo centralizado |
| `src/components/decision/EntryScreen.tsx` | Agregar track start_flow |
| `src/components/decision/ContextScreen.tsx` | Agregar track select_context |
| `src/components/decision/InputScreen.tsx` | Agregar track complete_3d |
| `src/components/decision/ResultScreen.tsx` | Agregar track save_result y share_result |
| `src/vite-env.d.ts` | Agregar tipos para env variables |

## Proximos Pasos para Activar

1. Crear Meta Pixel en Meta Business Suite
2. Crear X Pixel en X Ads
3. Crear propiedad GA4 en Google Analytics
4. Proporcionar los IDs para configurar

## Consideraciones Adicionales

### GDPR/Cookies
Para Argentina/LATAM no es obligatorio, pero si queres expandir a Europa, necesitarias un banner de cookies.

### Verificacion
- Meta: Usar "Facebook Pixel Helper" extension
- X: Revisar en X Ads "Event Manager"
- GA4: Usar "DebugView" en Google Analytics

### Server-Side Tracking (opcional futuro)
Para mejor precision, se pueden enviar eventos desde el edge function `save-result` usando Conversion API de Meta. Esto mejora el tracking cuando hay adblockers.
