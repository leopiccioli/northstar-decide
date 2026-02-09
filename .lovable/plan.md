
## Detección de typos en email (flujo)

### Qué se hace

Agregar lógica en `ResultScreen.tsx` para detectar typos comunes en el email al hacer blur, y mostrar una sugerencia "Quisiste decir X?" que el usuario puede aceptar con un click.

### Cómo funciona

1. Al hacer `onBlur` en el campo de email, se ejecuta la detección de typos
2. Si se detecta un typo conocido, se muestra un chip debajo del input con la sugerencia
3. El usuario clickea la sugerencia y el email se corrige automáticamente
4. Si el usuario ignora la sugerencia y escribe otra cosa, la sugerencia desaparece

### Cambios

**`src/components/decision/ResultScreen.tsx`**

1. Agregar estado `emailSuggestion` para la sugerencia activa
2. Agregar función `detectEmailTypo(email)` con el diccionario completo de typos
3. Modificar `handleEmailBlur` para llamar a `detectEmailTypo` antes de validar
4. Agregar UI de sugerencia debajo del input (chip clickeable)

#### Diccionario de typos

Dos niveles de detección:
- **Dominio completo**: `gmial.com` -> `gmail.com`, `hotmial.com` -> `hotmail.com`, etc.
- **TLD**: `.con` -> `.com`, `.co` -> `.com` (solo para dominios conocidos)
- **Formato**: `gmail,com` -> `gmail.com`, `gmail..com` -> `gmail.com`, `gmailcom` -> `gmail.com`

Se incluyen los 38 mappings proporcionados más variantes de formato (coma por punto, punto doble, falta de punto).

#### UI de sugerencia

```
[email input field]
Quisiste decir nicolassaporiti12@gmail.com? [Sí, corregir]
```

- Aparece como texto pequeño debajo del input con un link clickeable
- Se oculta automáticamente al cambiar el email
- Si el usuario acepta, se actualiza el email y se limpia la sugerencia

### Detalle técnico

La función `detectEmailTypo` extrae el dominio del email y lo busca en el diccionario. Para los casos de formato (`gmail,com`, `gmail..com`, `gmailcom`), se aplican reglas de normalización antes de buscar en el diccionario.

```text
Input: "user@gmial.com"
         ↓
Extract domain: "gmial.com"
         ↓
Lookup in DOMAIN_TYPOS: "gmail.com"
         ↓
Suggestion: "user@gmail.com"
```

Para `mail,ru` se maneja como caso especial ya que el punto es un punto legítimo, no `.com`.

### Archivos a modificar
- `src/components/decision/ResultScreen.tsx` - Agregar detección y UI de sugerencia
