# Theming opcional del widget embebible

## Comportamiento por defecto (no cambia nada)
Sin atributos extra, el embed se ve exactamente como hoy: paleta y tipografía propias del 3D. Cero riesgo de regresión para quien ya lo pegó.

## Nuevo: `data-theme="auto"` (opt-in)
El host activa la auto-detección añadiendo un atributo al `<script>`:

```html
<script async src="https://3d.ceoencamiseta.com/embed.js"
        data-target="tres-d-embed"
        data-context="burnout"
        data-theme="auto"></script>
```

Valores soportados:
- *(omitido)* → tema 3D original (default).
- `auto` → hereda colores y fuente del sitio host.
- *(reservado para futuro)* `minimal-light`, `minimal-dark`, presets nombrados.

## Cómo funciona `auto`

### En `embed.js` (host side)
1. Detecta del `document.body` (con fallback a `documentElement`) usando `getComputedStyle`:
   - `background-color` → si es transparente, sube por los ancestros hasta encontrar uno opaco; si nada, default `#ffffff`.
   - `color` → texto principal.
   - `font-family` → familia de fuentes.
2. Detecta un accent razonable: toma el `color` del primer `<a>` visible dentro del viewport; si no hay, usa el `color` del body.
3. Calcula contraste: si `bg` y `fg` tienen ratio < 4.5, descarta `fg` y usa negro o blanco según luminancia del `bg` (evita el caso "todo gris ilegible").
4. Pasa todo al iframe como query params: `&theme=auto&bg=...&fg=...&accent=...&font=...` (valores URL-encoded). La fuente va como string crudo (ej. `"Inter, sans-serif"`); no carga Google Fonts — confía en que esa familia exista en el host y, si no, el navegador hace fallback.

### En `EmbedPage.tsx` (iframe side)
1. Si `theme=auto` está presente, lee `bg`, `fg`, `accent`, `font` del query.
2. Convierte cada color hex/rgb → HSL y los inyecta como CSS vars en `:root` vía `<style>`:
   ```
   --background: <hsl>;
   --foreground: <hsl>;
   --primary: <hsl fg>;
   --primary-foreground: <hsl bg>;
   --accent: <hsl accent>;
   --border: <hsl fg con 12% alpha aproximado>;
   --secondary: <hsl fg con 6% alpha>;
   --muted-foreground: <hsl fg desaturado>;
   ```
   Las vars `--dinero / --desarrollo / --diversion` NO se tocan: son identidad del producto.
3. Aplica `font-family` al `body` con un `<style>` adicional, solo si `font` viene en el query.
4. Si falla el parseo de cualquier color, ignora ese token y mantiene el del 3D (degradación segura).

### Helper nuevo
- `src/lib/embedTheme.ts` con `parseColor(input): {h,s,l} | null` y `applyEmbedTheme(params: URLSearchParams)`. Mantiene el componente liviano y testeable.

## Archivos

- **Editados:**
  - `public/embed.js` — detección host-side + paso de params (solo cuando `data-theme="auto"`).
  - `src/pages/EmbedPage.tsx` — leer params, inyectar CSS vars.
  - `src/pages/EmbedDocsPage.tsx` — documentar `data-theme="auto"`, advertir que la auto-detección es best-effort y que para resultados garantizados conviene dejar el default.
- **Nuevos:**
  - `src/lib/embedTheme.ts` — parseo de color → HSL + cálculo de contraste.

## Notas / límites (se documentan)
- Si el host usa fondos con imagen, gradiente o transparencia total, la detección puede caer al default del navegador (blanco). Documentamos que en ese caso conviene no usar `auto`.
- No se cargan fuentes externas: si el host usa una fuente custom no instalada globalmente, el iframe hará fallback a la familia genérica.
- Los colores de las 3D (Dinero/Desarrollo/Diversión) siempre se preservan: son parte de la identidad del producto.

## Out of scope (por ahora)
- Presets nombrados (`minimal-light`, etc.) — fácil de agregar después reusando el mismo pipeline de CSS vars.
- Overrides finos (`data-bg`, `data-fg`, `data-accent`, `data-font`) — se pueden sumar si la auto-detección no alcanza.
- Theming de los colores de dimensión.
