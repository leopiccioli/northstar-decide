## QA del paquete "in-app browser conversion"

Revisé los 9 archivos tocados. La mayoría está sólido. Hay **1 problema crítico de arquitectura** que rompe la promesa principal del feature, y 2 limpiezas chicas.

---

### 🔴 Crítico: `pendingResult` en `localStorage` NO se comparte entre WKWebView y Safari

**Qué pasa hoy:**
1. Usuario llega por ad de Twitter → WKWebView in-app.
2. Mueve sliders → en `ResultScreen` guardamos los scores en `localStorage` (clave `3d:pending_result`).
3. Toca el banner "Abrir en Safari" → se abre `x-safari-https://3d.ceoencamiseta.com/?from=inapp`.
4. Safari hidrata desde `loadPendingResult()`.

**El problema:** WKWebView de Twitter/IG/FB usa un **storage partition propio de la app**. Su `localStorage` NO es el mismo que el de Safari nativo, aunque sea el mismo dominio. Resultado: en Safari, `localStorage.getItem('3d:pending_result')` devuelve `null`, no se hidrata, y el usuario **arranca el flujo desde cero** después del salto. Cae justamente en el escenario que el banner promete evitar.

Lo mismo aplica a Android Chrome vs WebView de in-app.

**Fix propuesto (Opción A — recomendada):** Pasar los scores por URL en vez de localStorage.

En `InAppBrowserBanner.handleClick`, leer los scores actuales (vía prop nueva o vía un hook compartido) y serializar en query params:

```
?from=inapp
&ctx=improve
&d=7&de=4&di=8                       // current
&dc=5&dec=6&dic=3                    // comparison (si existe)
&n=Seguir%20asi&nc=Cambiar           // option names
&email=usuario%40gmail.com
```

Luego en `DecisionFlow.getInitialState`, si está `?from=inapp` con scores válidos, reconstruir el state desde la URL (no desde localStorage). El payload total queda < 200 chars, sin problema de límite. localStorage queda como fallback secundario.

**Cambios necesarios:**
- `InAppBrowserBanner` recibe `currentOption`, `comparisonOption`, `userContext` como props (ResultScreen ya los tiene).
- Nueva función `encodeStateToURL` / `decodeStateFromURL` en `src/lib/pendingResult.ts` (renombrarlo a algo como `crossBrowserState.ts`).
- `DecisionFlow.getInitialState` chequea URL antes que localStorage.
- `ResultScreen` pasa props al banner en vez de solo `email`.

**Opción B (más simple, peor UX):** Aceptar la limitación y reescribir el copy del banner para que diga claramente "vas a tener que repetir los 3 sliders en Safari para que funcione el autofill". Conserva el código actual pero pierde el 80% del valor del feature.

---

### 🟡 Menor 1: `clearPendingResult` se importa pero nunca se llama

`ResultScreen.tsx` importa `clearPendingResult` (línea 16) pero nunca lo invoca. Consecuencias: después de guardar exitosamente, el `localStorage` queda con los scores 10 min. Si el usuario refresca con `?from=inapp` por cualquier motivo, lo manda otra vez al form de email (que ya completó).

**Fix:** llamar `clearPendingResult()` dentro de `onSaveSuccess` (cuando el save-result devuelve el ID real) y también al desmontar `ResultScreen`.

---

### 🟡 Menor 2: `<form onSubmit>` en el save form puede dispararse al elegir país

El save form en `ResultScreen.tsx` (línea 424) envuelve `CountryCombobox` y `SectorCombobox` (que son Popover + Command de shadcn). En algunos casos, presionar Enter dentro del combobox para seleccionar un país **puede burbujear y disparar `handleSave()`** prematuramente — antes de tocar el botón "Guardar y avisarme".

**Fix corto:** agregar `onKeyDown` al `<form>` que detecte si el target NO es el botón submit ni el input de email y, en ese caso, prevenga el Enter:

```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'BUTTON' && target.id !== 'result-email') {
      e.preventDefault();
    }
  }
}}
```

Vale la pena testear en mobile real antes de publicar — si no se reproduce, lo dejamos como está.

---

### ✅ Lo que sí está bien

- Atributos de autofill (`autoComplete="email"`, `inputMode`, `enterKeyHint="go"`, `autoCapitalize="off"`) en los 3 inputs de email. Correcto y completo.
- `scrollMarginBottom: 120px` previene que el teclado iOS tape el input. ✓
- Detección de in-app browsers cubre los 9 más relevantes (Twitter, IG, FB, TikTok, LinkedIn, Line, Snap, Pinterest, WeChat). ✓
- PostHog `register` de `is_inapp_browser` + `inapp_browser_name` + `device_os` como super-properties. Vas a poder segmentar el funnel en PostHog. ✓
- Eventos `inapp_banner_shown` + `inapp_banner_click` mapeados a `ViewContent` en Meta/X (no consume Event ID de X). ✓
- Banner aparece SOLO en in-app browsers (Chrome iOS y Safari ven cero cambios). ✓
- Banner aparece DENTRO del save form (después de `complete_3d`), no antes — no agrega fricción al primer paso. ✓
- CloseScreen tiene `<form>` y autofill attrs. ✓

---

### Recomendación

Aplicar los 3 fixes (crítico + 2 menores) en una sola pasada antes de publicar. El crítico es chico — ~40 líneas — y desbloquea el valor real del banner. Después del deploy, mirar en PostHog en 24-48h:

- `inapp_banner_click` count
- Tasa de `complete_3d_signup` segmentada por `is_inapp_browser=true` (antes vs después)

¿Procedo con los 3 fixes (Opción A para el crítico)?
