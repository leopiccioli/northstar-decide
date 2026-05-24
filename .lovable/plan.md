## Corrección al documento `3d-core-summary.md`

La sección "Recomendación de libros" tiene datos incorrectos. Reemplazarla por la versión verificada contra el código (`supabase/functions/save-result/index.ts` y `resend-measurement/index.ts`).

### Cambios

1. **Corregir los títulos de libros** según la dimensión más baja:
   - Diversión bajo → *Cómo RAJAR a tu jefe* ("Para ese número escribí un libro")
   - Dinero bajo → *FINANZAS. Lo que no te enseñaron en la escuela* + fallback a *Cómo RAJAR a tu jefe* si "atrás de ese número hay un jefe"
   - Desarrollo bajo → *Sé tu propio CEO* + fallback a *Cómo RAJAR a tu jefe* si "lo que frena tu crecimiento tiene nombre y apellido"

2. **Corregir dónde aparecen**: los libros se ofrecen **solo en el P.S. del email de resultado** (y en el email de re-envío `resend-measurement`). **No** aparecen en la pantalla de cierre — ahí el único CTA es "Unirme a CEO en Camiseta" (Beehiiv).

3. **Agregar regla de desempate**: cuando hay empate entre dimensiones, la prioridad es **Diversión > Desarrollo > Dinero** (privilegia el pitch del libro estrella, según comentario en el código).

4. **Agregar URLs canónicas** (de `src/config/urls.ts`):
   - `comorajaratujefe.com`
   - `setupropioceo.com` (libro "Sé tu propio CEO")
   - `finanzasellibro.com`
   - Todas se enriquecen con `?email=...` y UTMs (`utm_source=3d`, `utm_medium=email`, `utm_campaign=measurement_ps`, `utm_content=dinero|desarrollo|diversion`).

### Archivo afectado

- `/mnt/documents/3d-core-summary.md` — reemplazar la sección "Recomendación de libros" por la versión corregida arriba. Sin cambios en código de la app.
