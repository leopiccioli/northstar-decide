## Objetivo

Permitir que el sitio host pase el email del usuario logueado al embed, para que llegue pre-cargado al momento de guardar el resultado.

## Cómo se usaría

```html
<script async src="https://3d.ceoencamiseta.com/embed.js"
        data-target="tres-d-embed"
        data-context="burnout"
        data-email="usuario@ejemplo.com"></script>
```

Si el host renderiza server-side, inyecta el email del usuario logueado en ese atributo. Si no lo pasa, el embed funciona igual que hoy (el usuario lo tipea al final).

## Cambios

**1. `public/embed.js`**
- Leer `script.getAttribute('data-email')`.
- Validación mínima en el cliente: que contenga `@` y `.` (evita pasar basura como `"undefined"` o `"null"` si el host renderiza mal).
- Si es válido, agregar `&email=<encoded>` a los query params del iframe.

**2. `src/pages/EmbedPage.tsx`**
- No requiere cambios. El email ya viaja en `window.location.search` dentro del iframe, y el mecanismo existente de URL Prefill (memory: [URL Prefill](mem://features/url-prefill)) lo levanta automáticamente en el formulario de guardado.

**3. `src/pages/EmbedDocsPage.tsx`**
- Documentar el atributo `data-email` con:
  - Ejemplo de uso (server-side render con el email del usuario logueado).
  - Nota: el usuario lo puede editar antes de guardar (no es lock-in).
  - Privacidad: el email solo se usa para guardar el resultado y mandar el email de medición; no se trackea como identidad en analytics si el usuario no completa el flujo.

## Privacidad / consideraciones

- El email viaja en la URL del iframe (query string). Es HTTPS, pero queda en logs del servidor de 3d.ceoencamiseta.com. Es el mismo tratamiento que cuando llega desde links de email (ya lo hacemos).
- No se valida ownership del email — el host es responsable de pasar el del usuario correcto. Documentado.
- Si el host pasa `data-email` vacío o inválido, se ignora silenciosamente (no rompe el embed).

## Fuera de alcance

- Firmar el email con un token (HMAC) para validar autenticidad. Si más adelante querés evitar que alguien manipule el DOM y mande embeds con emails ajenos, lo agregamos como `data-email` + `data-email-sig`. Hoy, dado el caso de uso (pre-fill de conveniencia, el usuario igual puede editarlo), no hace falta.
- Pasar nombre u otros datos demográficos.
