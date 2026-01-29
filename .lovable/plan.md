
# Plan: Unificar Favicon con el Estilo de OG Image

## Analisis Visual

**OG Image actual:**
- Fondo blanco/gris claro
- Barras en 3 colores: Rojo (#C41E3A), Azul navy (#1e3a5f), Gris (#9CA3AF)
- Disposicion escalonada en 2 filas

**Favicon actual:**
- Fondo negro con barras blancas monocromaticas
- No coincide visualmente con el OG image

## Solucion Propuesta

Crear un nuevo `favicon.svg` que use los mismos colores del OG image, manteniendo el formato SVG para maxima velocidad (~400 bytes).

### Nuevo Diseno

```text
┌──────────────────┐
│  ████  ██████    │  ← Rojo + Azul navy
│     ██████ ████  │  ← Azul navy + Gris  
└──────────────────┘
```

Colores extraidos del OG image:
- Rojo: #C41E3A (Dinero)
- Azul navy: #1e3a5f (Desarrollo)  
- Gris: #9CA3AF (Diversion)
- Fondo: #fafafa (blanco)

## Implementacion

### Archivo: public/favicon.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#fafafa"/>
  <!-- Fila 1: Rojo + Azul -->
  <rect x="4" y="8" width="10" height="4" rx="1" fill="#C41E3A"/>
  <rect x="16" y="8" width="12" height="4" rx="1" fill="#1e3a5f"/>
  <!-- Fila 2: Azul + Gris -->
  <rect x="8" y="20" width="12" height="4" rx="1" fill="#1e3a5f"/>
  <rect x="22" y="20" width="6" height="4" rx="1" fill="#9CA3AF"/>
</svg>
```

### Archivo: index.html

Sin cambios necesarios - ya apunta a `/favicon.svg`.

## Ventajas

1. **Velocidad**: SVG de ~400 bytes, carga instantanea
2. **Consistencia visual**: Mismos colores que el OG image
3. **Escalabilidad**: Se ve nitido en cualquier tamano
4. **Reconocimiento de marca**: Usuario ve el mismo estilo en Twitter preview y en la pestana

## Resultado Esperado

El favicon y la imagen de Twitter se veran como parte de la misma aplicacion, usando la paleta rojo/azul/gris sobre fondo claro.
