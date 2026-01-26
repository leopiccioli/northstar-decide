
# Pre-llenado de Email desde URL

## Objetivo
Cuando un usuario llegue con `?email=xx@xx.com` en la URL, el campo de email en la sección de guardado se pre-llenará automáticamente. Esto mejora la experiencia para usuarios que vienen desde emails de recordatorio o campañas.

## Cambios Propuestos

### 1. Extender el hook `useTrackingData`
**Archivo:** `src/hooks/useTrackingData.ts`

Agregar `email` al interface y al return del hook:

```typescript
export interface TrackingData {
  // ... campos existentes ...
  email: string | null;  // NUEVO
}

export function useTrackingData(): TrackingData {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    
    return {
      // ... campos existentes ...
      email: params.get('email'),  // NUEVO
    };
  }, []);
}
```

### 2. Usar el email pre-llenado en `SaveSection`
**Archivo:** `src/components/decision/ResultScreen.tsx`

Modificar el componente `SaveSection` para:
- Inicializar el estado `email` con el valor de la URL si existe
- Auto-expandir el formulario si viene email en la URL (opcional, pero mejora UX)

```typescript
function SaveSection({ currentOption, comparisonOption }: {...}) {
  const trackingData = useTrackingData();
  
  // Pre-llenar email si viene en URL
  const [email, setEmail] = useState(trackingData.email || '');
  
  // Auto-expandir si viene con email
  const [isExpanded, setIsExpanded] = useState(!!trackingData.email);
  
  // ... resto igual ...
}
```

## Flujo de Usuario

```text
┌─────────────────────────────────────────────────────────────┐
│  Email de recordatorio                                      │
│  ────────────────────                                       │
│  "Hace 1 mes evaluaste tu trabajo..."                       │
│                                                             │
│  [Volver a evaluar] ──────────────────────────────────────► │
│   Link: app.com/?email=usuario@email.com                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Pantalla de Resultados                                     │
│  ─────────────────────                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Guardá tu resultado                                │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ usuario@email.com              (pre-llenado)│    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │  [ Guardar y avisarme ]                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Consideraciones de Seguridad

- El email solo se usa para pre-llenar el input, no se envía automáticamente
- La validación de email existente sigue aplicando antes de guardar
- No hay exposición de datos sensibles (el email viene del propio usuario vía URL)

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useTrackingData.ts` | Agregar campo `email` al interface y hook |
| `src/components/decision/ResultScreen.tsx` | Usar email de URL como valor inicial + auto-expandir |
