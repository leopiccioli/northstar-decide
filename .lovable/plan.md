
# Plan: Mejoras de Share Text + Correcciones UX

## Resumen

1. **Corregir textos de share**: Usar "Mis 3D laborales" (plural + contexto de trabajo)
2. **Validación email on-blur**: Feedback inmediato al dejar el campo
3. **Selector de país con búsqueda**: Reemplazar Select por Combobox con filtrado
4. **Pantalla de éxito post-guardado**: Redirección a cierre con CTA de comunidad

---

## 1. Corrección de Textos de Share

### Problema
Los textos actuales dicen "Mi 3D" (singular) y no aclaran que es laboral. La persona que recibe el mensaje no entiende el contexto.

### Solución

**Archivo**: `src/components/decision/ShareImageGenerator.ts`

Cambios en templates (líneas 166-172):

| Contexto | Antes | Después |
|----------|-------|---------|
| improve | "Mi 3D: Dinero {d}..." | "Mis 3D laborales: Dinero {d}..." |
| change | "Mi 3D: Dinero {d}..." | "Mis 3D laborales: Dinero {d}..." |
| burnout | "Mi 3D: Dinero {d}..." | "Mis 3D laborales: Dinero {d}..." |
| check | "Mi 3D hoy: Dinero..." | "Mis 3D laborales hoy: Dinero..." |

Cambios en imagen canvas (línea 128):

| Antes | Después |
|-------|---------|
| "Mi 3D" | "Mis 3D laborales" |

---

## 2. Validación de Email On-Blur

### Problema
El reporte es parcialmente correcto: la validación solo ocurre al hacer click en Guardar, no al dejar el campo.

### Solución

**Archivo**: `src/components/decision/ResultScreen.tsx`

Agregar handler `onBlur` al input de email:

```typescript
<input
  type="email"
  value={email}
  onChange={...}
  onBlur={() => {
    const trimmed = email.trim();
    if (trimmed && !validateEmail(trimmed)) {
      setEmailError('Email inválido');
    }
  }}
  ...
/>
```

---

## 3. Selector de País con Búsqueda

### Problema
17 países en lista sin filtrado = fricción en mobile.

### Solución

**Archivo**: `src/components/decision/ResultScreen.tsx`

Reemplazar `<Select>` por un componente Combobox que permita type-to-filter:

```text
┌─────────────────────────────────────┐
│  🔍 Buscar país...                  │
├─────────────────────────────────────┤
│  Argentina                          │
│  Bolivia                            │
│  Chile                              │
│  ...                                │
└─────────────────────────────────────┘
```

Usando el componente `Command` (cmdk) que ya está instalado:

```typescript
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
```

---

## 4. Pantalla de Éxito Post-Guardado

### Problema
Después de guardar solo aparece un toast. El usuario no tiene siguiente paso claro.

### Solución

Después de guardar exitosamente, mostrar una sección de "Éxito" inline (no toast) con:
- Confirmación visual
- CTA a la comunidad CEO en Camiseta
- Opción de compartir resultado

**Archivo**: `src/components/decision/ResultScreen.tsx`

Agregar estado `saved: boolean` y mostrar sección de éxito:

```typescript
const [saved, setSaved] = useState(false);

// En handleSave, después del éxito:
setSaved(true);
```

```text
┌─────────────────────────────────────┐
│  ✓ Resultado guardado               │
│                                     │
│  Te mandamos un email con tu 3D.    │
│  Revisá tu bandeja de entrada.      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Unirme a CEO en Camiseta   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Pedir una segunda opinión  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Puntos del Reporte Descartados

Estos puntos del reporte ya están implementados correctamente:

| Punto | Por qué se descarta |
|-------|---------------------|
| B-01 (Falta confirmación) | Toast "Resultado guardado" ya existe |
| B-02 (Campos no se limpian) | `setEmail('')`, `setCountry('')` ya ejecutan en éxito |
| UX Sliders (sin valor) | Ya muestra `{value}/10` junto al label |
| UX Tooltips (requiere click) | Ya usa hover con `delayDuration={100}` |

---

## Sobre Placeholders Dinámicos (Comparación)

Este punto es válido pero de menor prioridad. Los placeholders podrían adaptarse según el contexto, pero el impacto es menor que los otros cambios. Lo dejo como opcional.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/decision/ShareImageGenerator.ts` | Cambiar "Mi 3D" por "Mis 3D laborales" en templates e imagen |
| `src/components/decision/ResultScreen.tsx` | 1) Validación email on-blur 2) Combobox para países 3) Sección de éxito post-guardado |

---

## Orden de Implementación

1. **Textos de share** (fix rápido, alto impacto en claridad)
2. **Validación email on-blur** (mejora UX inmediata)
3. **Selector país con búsqueda** (mejora UX mobile)
4. **Pantalla de éxito** (cierre de flujo + viralidad)
