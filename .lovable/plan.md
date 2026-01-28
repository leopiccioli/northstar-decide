
# Plan: Links a Beehiiv con UTM Tracking

## Resumen

Actualizar todos los links a CEO en Camiseta para que:
1. Apunten al signup de Beehiiv (magic link)
2. Incluyan email si está disponible
3. Incluyan UTMs para saber desde dónde llegó el usuario

---

## Links Actuales

| Ubicación | URL actual | Tiene email? |
|-----------|------------|--------------|
| Resultado guardado | `beehiivUrl?email=X` | Si |
| Resultado compartido | `beehiivUrl` (sin email) | No |
| Home footer | `ceoencamiseta.com` | No |

---

## Cambios Propuestos

### 1. Configuración centralizada

Actualizar `src/config/urls.ts`:
- Cambiar `communityUrl` a la URL base de Beehiiv
- Eliminar redundancia con `beehiivUrl`

### 2. Crear helper para construir URLs

Nueva función `buildBeehiivUrl(options)` que:
- Siempre agrega `utm_source=3dapp`
- Agrega `utm_medium` según el contexto (home, result, shared)
- Agrega `email` si está disponible

### 3. Actualizar cada ubicación

**ResultScreen.tsx (resultado guardado):**
```
utm_source=3dapp
utm_medium=result
email={email del formulario}
```

**ResultPage.tsx (link compartido):**
```
utm_source=3dapp
utm_medium=shared
(sin email - es una visita anónima)
```

**EntryScreen.tsx (home footer):**
```
utm_source=3dapp
utm_medium=home
email={si viene en URL params}
```

---

## Resultado Final

Todos los links seguirán este formato:
```
https://magic.beehiiv.com/v1/9ef68cad-af28-49b0-8639-5562f3e7954e
  ?email={si disponible}
  &utm_source=3dapp
  &utm_medium={home|result|shared}
```

Esto te permitirá ver en Beehiiv de dónde vienen los suscriptores.

---

## Sección Técnica

### Archivo: src/config/urls.ts

Simplificar configuración - una sola URL base de Beehiiv:

```typescript
export const SITE_CONFIG = {
  baseUrl: 'https://3d.ceoencamiseta.com',
  domain: '3d.ceoencamiseta.com',
  emailFrom: '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>',
  emailReplyTo: 'leopiccioli@gmail.com',
  mainSiteUrl: 'https://ceoencamiseta.com',
  beehiivBaseUrl: 'https://magic.beehiiv.com/v1/9ef68cad-af28-49b0-8639-5562f3e7954e',
} as const;

// Helper para construir URL con tracking
export function buildBeehiivUrl(options: {
  email?: string;
  utmMedium: 'home' | 'result' | 'shared';
}): string {
  const params = new URLSearchParams();
  
  if (options.email) {
    params.set('email', options.email);
  }
  params.set('utm_source', '3dapp');
  params.set('utm_medium', options.utmMedium);
  
  return `${SITE_CONFIG.beehiivBaseUrl}?${params.toString()}`;
}
```

### Archivo: src/components/decision/EntryScreen.tsx

Agregar import de `useTrackingData` para capturar email de URL y usar el helper:

```typescript
import { useTrackingData } from '@/hooks/useTrackingData';
import { buildBeehiivUrl } from '@/config/urls';

// En el componente:
const trackingData = useTrackingData();
const beehiivUrl = buildBeehiivUrl({ 
  email: trackingData.email || undefined, 
  utmMedium: 'home' 
});

// En el footer:
<a href={beehiivUrl} ...>
```

### Archivo: src/components/decision/ResultScreen.tsx

Actualizar SuccessWithShare para usar el helper:

```typescript
import { buildBeehiivUrl } from '@/config/urls';

// Línea 135 cambiar:
const ceoUrl = buildBeehiivUrl({ email, utmMedium: 'result' });
```

### Archivo: src/pages/ResultPage.tsx

Actualizar link para usar el helper (sin email):

```typescript
import { buildBeehiivUrl } from '@/config/urls';

// En el componente:
const beehiivUrl = buildBeehiivUrl({ utmMedium: 'shared' });

// Línea 346:
<a href={beehiivUrl} ...>
```

---

## Archivos a Modificar

1. `src/config/urls.ts` - Nueva función helper
2. `src/components/decision/EntryScreen.tsx` - Usar helper con email de URL
3. `src/components/decision/ResultScreen.tsx` - Usar helper
4. `src/pages/ResultPage.tsx` - Usar helper
