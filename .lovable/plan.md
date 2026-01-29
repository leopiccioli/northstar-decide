

# Plan: Crear Favicon con las 3 Barras

## Concepto

Crear un favicon minimalista que represente las 3D con 3 barras horizontales, similar al estilo del share image pero adaptado para tamaños pequeños (16x16, 32x32, 48x48).

## Diseño Propuesto

```text
┌──────────────────┐
│                  │
│  ████████████    │  ← Barra 1 (100%)
│                  │
│  ████████        │  ← Barra 2 (70%)
│                  │
│  ██████████████  │  ← Barra 3 (90%)
│                  │
└──────────────────┘
```

- **Fondo**: Negro (`#0f0f0f`)
- **Barras**: Blanco (`#fafafa`)
- **Espaciado**: Uniforme entre barras
- **Longitudes diferentes**: Para dar dinamismo visual (representando valores distintos de las 3D)

## Implementacion

### Opcion A: SVG (Recomendada)

Crear `public/favicon.svg` - escala perfectamente a cualquier tamano:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0f0f0f"/>
  <rect x="4" y="6" width="24" height="4" rx="1" fill="#fafafa"/>
  <rect x="4" y="14" width="18" height="4" rx="1" fill="#fafafa"/>
  <rect x="4" y="22" width="21" height="4" rx="1" fill="#fafafa"/>
</svg>
```

### Opcion B: PNG generado

Usar Canvas API para generar un PNG de 512x512 (para todos los tamanos).

## Archivos a Modificar

1. **Crear** `public/favicon.svg` - El nuevo favicon con las 3 barras
2. **Editar** `index.html` - Actualizar el link al favicon SVG

## Ventajas del SVG

- Escala perfectamente a cualquier tamano
- Archivo muy pequeno (~300 bytes)
- Se ve nitido en pantallas retina
- Consistente con el branding del share image

## Resultado Esperado

Cuando alguien vea la pestana del navegador, vera un icono negro con 3 barras blancas que representa visualmente las 3D del framework.

