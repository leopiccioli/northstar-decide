
# Plan: Actualizar microcopy en ResultScreen, Tooltips y Share Templates

## Resumen de Cambios

4 cambios de texto puntuales solicitados por el usuario.

---

## Cambios a Implementar

### 1. ResultScreen - Microcopy de guardado (línea 392)

**Antes:**
```
Quienes repiten el 3D suelen mejorar sus puntajes con el tiempo.
```

**Después:**
```
Esto queda guardado para cuando quieras volver a mirarlo.
```

---

### 2. Tooltips - Diversión (línea 115 en InputScreen)

**Antes:**
```
¿Podrías hacerlo gratis por un tiempo?
```

**Después:**
```
¿Te da energía o te la saca?
```

---

### 3. ResultScreen - Label del email (línea 396)

**Antes:**
```
Guardá tu resultado y seguí creciendo
```

**Después:**
```
Guardá este resultado para más adelante
```

---

### 4. Share templates - Wording (línea 166 en ShareImageGenerator)

**Antes:**
```
¿Qué mejorarías primero?
```

**Después:**
```
¿Qué mirarías primero?
```

(Solo afecta al template `improve`, el resto queda igual)

---

## Seccion Tecnica

### Archivo: src/components/decision/ResultScreen.tsx

Línea 391-392:
```typescript
<p className="text-subtle text-center">
  Esto queda guardado para cuando quieras volver a mirarlo.
</p>
```

Línea 396:
```typescript
<label className="text-sm font-medium">Guardá este resultado para más adelante</label>
```

### Archivo: src/components/decision/InputScreen.tsx

Línea 115:
```typescript
"¿Te da energía o te la saca?"
```

### Archivo: src/components/decision/ShareImageGenerator.ts

Línea 166:
```typescript
improve: 'Quiero mejorar mi trabajo.\nMis 3D laborales: Dinero {d} | Desarrollo {dev} | Diversión {div}\n¿Qué mirarías primero?',
```

---

## Archivos a Modificar

1. `src/components/decision/ResultScreen.tsx` - 2 cambios de texto
2. `src/components/decision/InputScreen.tsx` - 1 cambio en tooltip
3. `src/components/decision/ShareImageGenerator.ts` - 1 cambio en template

---

## Resultado

Textos actualizados con el tono más neutro y directo solicitado.
