
# Plan: Agregar redirect_to a magic links de Beehiiv

## Resumen

Agregar el parámetro `redirect_to` a todos los magic links de Beehiiv para que después de suscribirse, el usuario sea redirigido a la página de 3D en CEO en Camiseta.

---

## Cambio

Actualizar la función `buildBeehiivUrl` en `src/config/urls.ts` para incluir:

```
&redirect_to=https://www.ceoencamiseta.com/3d-dinero-desarrollo-diversion
```

---

## Resultado Final

Todos los links de Beehiiv ahora seguirán este formato:

```
https://magic.beehiiv.com/v1/9ef68cad-af28-49b0-8639-5562f3e7954e
  ?email={si disponible}
  &utm_source=3dapp
  &utm_medium={home|result|shared}
  &redirect_to=https://www.ceoencamiseta.com/3d-dinero-desarrollo-diversion
```

---

## Seccion Tecnica

### Archivo: src/config/urls.ts

Agregar la URL de redirección a la configuración y actualizar el helper:

```typescript
export const SITE_CONFIG = {
  // ... existing config
  mainSiteUrl: 'https://ceoencamiseta.com',
  beehiivBaseUrl: 'https://magic.beehiiv.com/v1/9ef68cad-af28-49b0-8639-5562f3e7954e',
  beehiivRedirectUrl: 'https://www.ceoencamiseta.com/3d-dinero-desarrollo-diversion',
} as const;

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
  params.set('redirect_to', SITE_CONFIG.beehiivRedirectUrl);
  
  return `${SITE_CONFIG.beehiivBaseUrl}?${params.toString()}`;
}
```

---

## Archivos a Modificar

1. `src/config/urls.ts` - Agregar redirect_to al helper

---

## Nota sobre records_3d

El ordenamiento por defecto en Cloud View no se puede configurar desde codigo. Es una preferencia del dashboard que se guarda por sesion. Cuando entres a la tabla, hace clic en el header "created_at" para ordenar descendente.
