# Acelerar 3d.ceoencamiseta.com con Cloudflare (gratis)

## Estado actual

El sitio ya está pasando por Cloudflare (se ve `server: cloudflare` y `cf-ray` en los headers). El objetivo es afinar la configuración de Cloudflare para reducir latencia y aprovechar el edge caching, sin cambiar código ni diseño del sitio.

## Cambios propuestos

### 1. Verificar que el proxy naranja esté activo

- En el dashboard de Cloudflare, ir a **DNS > Records**.
- Confirmar que el registro de `3d.ceoencamiseta.com` (o el CNAME/A correspondiente) tiene la nube en color **naranja** (Proxied).
- Si está gris (DNS only), cambiarlo a naranja. Esto es lo que activa CDN, compresión, HTTP/3 y edge cache.

### 2. Activar protocolos y compresión gratuitos

En **Speed > Optimization**:

- **Brotli**: ON.
- **HTTP/2**: ON.
- **HTTP/3 (with QUIC)**: ON.
- **Early Hints**: ON.
- **Auto Minify** (si está disponible): activar HTML, CSS y JS. Pero primero validar que no rompa el contenido prerenderizado.

### 3. Configurar reglas de caché para estáticos

Cloudflare gratuito permite **Cache Rules** (recomendado) o **Page Rules** (limitado a 1 en plan gratuito). Usar Cache Rules para cubrir todo en una sola regla:

Crear una regla con condición OR:

```text
URI Path contains /assets/
URI Path contains /fonts/
URI Path ends with .js
URI Path ends with .css
URI Path ends with .woff2
URI Path ends with .png
URI Path ends with .svg
URI Path ends with .ico
URI Path ends with .txt
URI Path ends with .xml
```

Acciones:

- **Cache eligibility**: Eligible for cache
- **Cache key**: Use origin cache headers
- **Edge TTL**: 1 year (o Override origin: 1 year)
- **Browser TTL**: 1 year

Esto cachea en el edge de Cloudflare todos los assets con hash, fuentes, imágenes y archivos estáticos. No afecta el HTML dinámico ni las llamadas a Supabase.

### 4. Cachear HTML estático con TTL corto

Crear una segunda Cache Rule para rutas estáticas prerenderizadas:

```text
URI Path is one of:
/, /origen, /metodologia, /como-citar, /datos-llm, /por-pais, /por-sector, /por-edad, /embed-docs, /test-burnout, /cambiar-de-trabajo, /cambiar-de-trabajo-a-los-40, /cambiar-de-trabajo-a-los-50, /aburrido-en-mi-trabajo-pero-pagan-bien, /burnout-o-cansancio, /cuando-renunciar-sin-otro-trabajo, /pais/*, /edad/*, /sector/*, /hallazgos/*
```

Acciones:

- **Cache eligibility**: Eligible for cache
- **Edge TTL**: 1 hour (o 4 hours)
- **Browser TTL**: 1 hour

Objetivo: acelerar el TTFB de las landings y páginas de contenido sin riesgo de que un despliegue nuevo quede stale por días.

### 5. Revisar modo SSL/TLS

En **SSL/TLS > Overview**:

- Verificar que el modo esté en **Full (strict)** si Lovable presenta un certificado válido para el origen.
- Si hay errores de certificado, bajar a **Full**.
- El sitio ya envía HSTS (`strict-transport-security`), así que no es necesario activar HSTS en Cloudflare a menos que se quiera forzar includeSubDomains.

### 6. Analytics y validación

- Usar **Cloudflare Analytics** (gratis) para ver Cache Hit Ratio y tráfico por país.
- Después de aplicar, verificar con `curl -I` que los assets devuelven `CF-Cache-Status: HIT` (tras el primer miss) y que el sitio sigue funcionando en el preview.

### 7. Opcional: Zaraz para scripts de terceros

Si luego se quiere más velocidad en la carga de GA4/Meta Pixel/X Pixel, se puede evaluar **Cloudflare Zaraz** (gratis básico) para cargar esos scripts desde el edge de Cloudflare en lugar de múltiples dominios externos. No se propone ahora para no agregar complejidad.

## Qué NO se incluye

- No se modifica código del proyecto.
- No se migra el hosting a Cloudflare Pages (innecesario, ya que Lovable maneja el build y prerender).
- No se usan Workers, R2 ni Images (opciones de pago o con límites muy bajos para este caso).
- No se cachean las llamadas a la base de datos de Supabase (van directo a `bcokciysbyuaeodnsxas.supabase.co`, fuera de este dominio).

## Resultado esperado

- Menor TTFB para usuarios lejos del origen de Lovable.
- Assets estáticos servidos desde el edge de Cloudflare con compresión Brotli.
- Reducción de carga en el origen de Lovable.
- Mejora en Core Web Vitals (especialmente LCP y TTFB) sin tocar el diseño.
