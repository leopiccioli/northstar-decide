

## Análisis de Performance - Página Inicial

### Problemas Identificados

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| FCP | 2.4s | < 1.8s |
| LCP | 4.9s | < 2.5s |
| Performance Score | 79 | 90+ |

### Problema Principal: LCP incorrecto

Lighthouse detecta que el **LCP es el footer** ("Hecho con ❤️...") en vez del título principal. Esto indica que:
1. El título H1 no se está pintando correctamente al inicio
2. La fuente "Space Grotesk" está bloqueando el render del texto principal

### Causas Raíz

1. **Scripts de terceros bloquean el render**:
   - Facebook Pixel: 137 KiB
   - Google Tag Manager: 144 KiB
   - Twitter Pixel: 17 KiB
   - Total: ~300 KiB de JS ejecutándose antes del contenido

2. **Fuentes sin fallback visual**:
   - La fuente web tarda en cargar
   - Mientras tanto el H1 es invisible (FOIT - Flash of Invisible Text)

3. **CSS bundle completo bloqueando** (12 KiB):
   - Se carga todo el CSS antes de pintar

---

### Plan de Optimización

#### 1. Diferir scripts de analytics (Mayor impacto)
Mover FB Pixel, Twitter Pixel y GA4 para cargar **después** del primer paint.

**Archivo**: `index.html`

Cambiar de scripts inline bloqueantes a carga diferida:
```html
<!-- Mover analytics al final del body con defer -->
<script>
  // Cargar analytics después de que la página sea interactiva
  window.addEventListener('load', function() {
    setTimeout(function() {
      // Cargar FB, Twitter, GA4 aquí
    }, 1000);
  });
</script>
```

#### 2. Agregar font-display: swap
Asegurar que el texto sea visible mientras carga la fuente.

**Archivo**: `index.html`

Agregar `&display=swap` a la URL de Google Fonts (ya está pero verificar que funciona).

**Archivo**: `src/index.css`

Agregar fallback font explícito:
```css
body {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
```

#### 3. Preload de fuente crítica
Solo precargar el peso usado en la primera pantalla (700 bold para el H1).

**Archivo**: `index.html`

```html
<link rel="preload" as="font" type="font/woff2" crossorigin
      href="https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPb54C_k3HqUtEw.woff2" />
```

#### 4. Agregar CSS crítico para el H1
Asegurar que el título sea visible inmediatamente.

**Archivo**: `index.html` (en el style inline)

```css
.heading-display{font-size:2.25rem;font-weight:700;line-height:1}
@media(min-width:640px){.heading-display{font-size:3rem}}
```

---

### Archivos a Modificar
- `index.html` - Diferir analytics, preload fuente, CSS crítico

---

### Resultado Esperado
- LCP: 4.9s → ~2.5s (el H1 será visible inmediatamente)
- FCP: 2.4s → ~1.5s (menos JS bloqueante)
- Performance Score: 79 → 90+

---

### Trade-offs
| Cambio | Beneficio | Riesgo |
|--------|-----------|--------|
| Diferir analytics | Render más rápido | Puede perder 1-2% de eventos (usuarios que se van en <1s) |
| Preload font | H1 visible antes | Un request extra inicial |

