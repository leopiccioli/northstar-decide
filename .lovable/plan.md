

## Agregar preguntas para todos los contextos

### Cambio

Actualizar el mapeo de preguntas en `src/types/decision.ts` para que todos los contextos tengan una pregunta opcional:

```
improve: '¿Qué querés mejorar primero?'     (sin cambio)
change:  '¿Qué cambio buscás?'              (sin cambio)
compare: '¿Qué te hace dudar?'              (NUEVO)
burnout: '¿Qué te pesa hoy?'               (sin cambio)
check:   '¿Algo que te haga ruido?'         (NUEVO)
```

### Impacto

- **InputScreen** ya usa `contextQuestions[context]` y muestra el campo cuando el valor no es `null`. No necesita cambios: al dejar de ser `null`, el campo aparece automaticamente.
- **save-result** ya recibe y guarda el `comment`. No necesita cambios.
- **Emails**: cuando se implemente el plan pendiente (incluir la pregunta en el email), estas dos nuevas preguntas se incluiran automaticamente.

### Archivo a modificar

- `src/types/decision.ts` -- cambiar `null` a los textos nuevos en `compare` y `check`

