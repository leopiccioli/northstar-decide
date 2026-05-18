
## Recomendación de libro en el email de medición

Agrego un bloque **P.S.** al final del email de `save-result` (después del "Leo"), recomendando un libro según la D más baja. Solo aparece en el email de medición, no en reminders ni en reenvíos.

### Lógica

1. **Identificar la D más baja** del set de scores aplicable.
   - Medición simple: las 3 Ds de la opción actual.
   - Comparación A vs B: las 6 Ds combinadas (peor score absoluto entre ambas opciones).
   - **Empate**: prioridad `Diversión > Desarrollo > Dinero` (siempre que se pueda, gana el pitch de RAJAR).
2. **Umbral**: solo mostrar el bloque si esa D más baja es **< 9** (≥ 9 = todo bien, no vendemos nada).
3. **Mapear** la D ganadora a su copy + libro.

### Copy propuesto (tono dry/calculator, sin mayúsculas innecesarias, sin emojis, mismo registro que "Listo. Lo guarde para que puedas volver cuando quieras.")

Todos arrancan con un salto de línea + `P.S.` para que se sienta agregado, no vendido.

**Diversión más baja** (ej. valor 4):
```
P.S. Pusiste un 4 en Diversion. Para ese numero escribi un libro:
Como RAJAR a tu jefe. No es lo que te imaginas.
comorajaratujefe.com
```

**Dinero más bajo** (ej. valor 3):
```
P.S. Pusiste un 3 en Dinero. Tengo un libro para eso:
FINANZAS. Lo que no te enseñaron en la escuela.
finanzasellibro.com

Aunque si atras de ese numero hay un jefe, empeza por:
Como RAJAR a tu jefe — comorajaratujefe.com
```

**Desarrollo más bajo** (ej. valor 5):
```
P.S. Pusiste un 5 en Desarrollo. Tengo un libro para eso:
Se tu propio CEO.
setupropioceo.com

Aunque si lo que frena tu crecimiento tiene nombre y apellido,
primero leé: Como RAJAR a tu jefe — comorajaratujefe.com
```

Notas de tono:
- Sin tildes en palabras clave (igual que el resto del email: "medicion", "Diversion", "guarde").
- Sin "Hola", sin "te recomiendo", sin marketing speak.
- El número se repite literal (refuerza el principio "data-first, no interpretación" — solo apuntamos al libro).
- Solo en Dinero y Desarrollo aparece el cross-sell a RAJAR como segunda línea (matchea exactamente tu intuición de que el jefe suele estar detrás).

### URLs con tracking

Cada link se construye con UTMs para medir cuál D convierte mejor:
```
https://comorajaratujefe.com/?utm_source=3d&utm_medium=email&utm_campaign=measurement_ps&utm_content=diversion
```
- `utm_content` = D ganadora (`diversion` / `dinero` / `desarrollo`).
- Pre-fill de email si los libros tienen formularios (consistente con la regla de outbound URLs): `&email=<encoded>`.

¿Querés que centralice las URLs de los libros en `src/config/urls.ts` (`SITE_CONFIG.books`) para mantener todo en un solo lugar? **Sí, lo hago así.**

### Cambios técnicos

1. **`src/config/urls.ts`** — agregar `SITE_CONFIG.books = { rajar, ceo, finanzas }` y un helper `buildBookUrl(book, lowestD, email)`.
2. **`supabase/functions/save-result/index.ts`**:
   - Nueva función `pickLowestDimension(currentScores, comparison)` con la regla de desempate Diversión > Desarrollo > Dinero.
   - Nueva función `buildBookPS(lowestD, value, email)` que devuelve `''` si `value >= 9`, sino el bloque P.S. correspondiente.
   - En `buildEmailContent`, después del `\n\nLeo`, append `buildBookPS(...)`.
   - Como el helper de libros se hardcodea en la edge function (no comparte código con src), duplico las URLs ahí dentro con un comentario apuntando a `urls.ts`.
3. Deploy de `save-result`.

### Lo que NO cambia

- Reminders (`send-reminders`) y reenvíos manuales (`resend-measurement`): siguen igual. El P.S. solo aparece en el email post-medición.
- Visualmente en la app web: 0 cambios. Es puramente email.
- Sin nuevo edge function, sin migraciones, sin nuevos secrets.

### Riesgo / consideraciones

- El P.S. agrega ~4-6 líneas al email; sigue siendo corto y receipt-like.
- Si en el futuro querés A/B testear copys o desactivar el bloque, queda aislado en una función — fácil de togglear.
