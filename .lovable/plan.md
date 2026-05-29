# Plan: Mejorar la sección de recordatorio en ResultScreen

## Contexto
El usuario quiere que la sección de recordatorio (SaveSection dentro de ResultScreen) sea más clara sobre que es GRATIS, y que el recordatorio sirve para seguir mejorando. También quiere que el default sea 3 meses en lugar de 1 mes.

## Archivo a modificar
- `src/components/decision/ResultScreen.tsx`

## Cambios específicos

1. **Cambiar default de recordatorio a 3 meses**
   - Línea 297: `useState<ReminderPeriod>('1m')` → `useState<ReminderPeriod>('3m')`

2. **Agregar copy destacando que es GRATIS y el beneficio de mejorar**
   - Sustituir o complementar la microcopy actual ("Esto queda guardado para cuando quieras volver a mirarlo.") con algo que enfatice:
     - Es gratis (no hay costo)
     - Sirve para seguir mejorando / medir progreso
   - Opciones de copy a evaluar:
     - "Guardá tu resultado gratis y volvé a medir en 3 meses para ver si mejoraste."
     - "Es gratis. Te avisamos para que vuelvas a medir y veas si mejoraste."
   - Agregar un tag/badge visual opcional ("Gratis") cerca del título del recordatorio.

3. **Reordenar o resaltar visualmente el beneficio**
   - Considerar si la etiqueta "Recordatorio" debe decir algo más alentador como "¿Cuándo querés volver a medir?"
   - Mantener el estilo monocrómático actual (sin colores de éxito/positivo).

## No tocar
- Comparación branch (línea 738+) — se mantiene igual.
- El resto del flujo y el safe-area padding (pb-32 sm:pb-12).
