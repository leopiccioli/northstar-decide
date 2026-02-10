

## Incluir la pregunta contextual en el email y en la pantalla de resultado

### Resumen

Agregar la pregunta que origino el comentario (ej: "¿Que queres mejorar primero?") como label arriba del comentario, tanto en la web como en el email.

### Cambios

#### 1. Frontend: pasar `userContext` al payload de guardado

**Archivo**: `src/components/decision/ResultScreen.tsx`

- `SaveSection` recibe `userContext` como nueva prop (viene del componente padre que ya lo tiene)
- Agregar `context: userContext` al payload que se envia a `save-result` (linea ~257)

#### 2. Frontend: mostrar la pregunta en la pantalla de resultado

**Archivo**: `src/components/decision/ResultScreen.tsx`

- Importar `contextQuestions` desde `@/types/decision`
- En el bloque single option (linea ~538), antes del blockquote del comentario, mostrar la pregunta como label:
  ```
  ¿Que queres mejorar primero?
  "poco sueldo"
  ```
- En el bloque comparison (linea ~557), idem para cada comentario con su pregunta

#### 3. Backend: recibir `context` y usarlo en el email

**Archivo**: `supabase/functions/save-result/index.ts`

- Agregar `context?: string` al interface `SaveResultRequest`
- Definir mapeo duplicado de contexto a pregunta (edge functions no pueden importar de `src/`):
  ```typescript
  const contextQuestions: Record<string, string> = {
    improve: '¿Qué querés mejorar primero?',
    change: '¿Qué cambio buscás?',
    compare: '¿Qué te hace dudar?',
    burnout: '¿Qué te pesa hoy?',
    check: '¿Algo que te haga ruido?',
  };
  ```
- En `buildEmailContent`, recibir `context` como parametro. Cuando hay comentario, mostrar la pregunta como label:
  ```
  ¿Que queres mejorar primero?
  "poco sueldo"
  ```
- Pasar `context` desde el handler a `buildEmailContent`

#### 4. Base de datos: guardar el contexto

- Migracion SQL: agregar columna `context` (text, nullable) a `records_3d`
- En el insert del handler, incluir `context: body.context || null`
- Util para analytics y para los emails de recordatorio futuros

### Archivos a modificar

- `src/components/decision/ResultScreen.tsx` -- pasar context al payload + mostrar pregunta en UI
- `supabase/functions/save-result/index.ts` -- recibir context, incluir pregunta en email, guardar en DB
- SQL migration: agregar columna `context` a `records_3d`

