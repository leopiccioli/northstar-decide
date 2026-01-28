
# Plan: Centralizar URL del Dominio en Variable de Configuración

## Problema Actual

Las URLs están hardcodeadas en múltiples archivos:

| Archivo | URL Actual |
|---------|------------|
| `ResultScreen.tsx` | `https://3d.ceoencamiseta.com` |
| `ResultPage.tsx` | `https://3d.ceoencamiseta.com` |
| `MobileQRCard.tsx` | `https://3d.ceoencamiseta.com` |
| `ShareImageGenerator.ts` | `3d.ceoencamiseta.com` (sin https) |
| `save-result/index.ts` | `3d@3d.ceoencamiseta.com` (email) |
| `index.html` | `https://lovable.dev/opengraph-image-p98pqg.png` (OG images) |

---

## Solución: Archivo de Configuración Centralizado

Crear un archivo `src/config/urls.ts` que exporte todas las URLs del proyecto:

```typescript
// src/config/urls.ts

export const SITE_CONFIG = {
  // Dominio principal de la app
  baseUrl: 'https://3d.ceoencamiseta.com',
  domain: '3d.ceoencamiseta.com',
  
  // Email para notificaciones
  emailFrom: '3d@3d.ceoencamiseta.com',
  emailReplyTo: 'leopiccioli@gmail.com',
  
  // Links externos
  communityUrl: 'https://ceoencamiseta.com/comunidad',
  mainSiteUrl: 'https://ceoencamiseta.com',
  beehiivUrl: 'https://magic.beehiiv.com/v1/9ef68cad-af28-49b0-8639-5562f3e7954e',
} as const;
```

---

## Archivos a Modificar

### Frontend (4 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/config/urls.ts` | **CREAR** - Archivo de configuración centralizado |
| `src/components/decision/ResultScreen.tsx` | Importar `SITE_CONFIG.baseUrl` en lugar de constante local |
| `src/components/decision/MobileQRCard.tsx` | Importar `SITE_CONFIG.baseUrl` en lugar de `BASE_URL` |
| `src/components/decision/ShareImageGenerator.ts` | Importar `SITE_CONFIG.domain` en lugar de constante local |
| `src/pages/ResultPage.tsx` | Importar `SITE_CONFIG.baseUrl` y `SITE_CONFIG.beehiivUrl` |

### Edge Function (1 archivo)

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/save-result/index.ts` | Crear constantes al inicio del archivo (no puede importar de `src/`) |

### HTML (1 archivo)

| Archivo | Cambio |
|---------|--------|
| `index.html` | Actualizar las meta tags de Open Graph con imagen propia |

---

## Detalle Técnico

### Nota sobre Edge Functions

Las Edge Functions corren en Deno y no pueden importar de `src/`. Por eso, para el backend crearemos las constantes directamente en el archivo. Una alternativa sería usar variables de entorno, pero para URLs estáticas no es necesario.

### Open Graph Images

Actualmente apuntan a `lovable.dev`. Idealmente deberías subir una imagen de preview a tu dominio (por ejemplo `https://3d.ceoencamiseta.com/og-image.png`) y actualizar el HTML.

---

## Beneficios

1. **Un solo lugar para cambiar** - Si cambia el dominio, se modifica en un archivo
2. **Consistencia** - Todas las URLs usan la misma fuente de verdad
3. **TypeScript** - Autocompletado y errores si hay typos
4. **Documentación implícita** - Queda claro qué URLs usa el proyecto
