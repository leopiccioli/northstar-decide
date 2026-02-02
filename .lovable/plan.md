
## CTA con posición aleatoria y UTMs

### Resumen
1. Hacer que el CTA "¿Y vos, cómo estás?" aparezca en una posición aleatoria (entre 3 y 15)
2. Agregar UTM params a todos los links hacia `/`

---

### Cambios

**Archivo**: `src/pages/CommentsPage.tsx`

#### 1. Generar posición aleatoria para el CTA
Usar `useMemo` para calcular una posición random entre 3 y 15 que se mantenga estable durante la sesión:

```typescript
const ctaPosition = useMemo(() => Math.floor(Math.random() * 13) + 3, []);
```

#### 2. Agregar UTMs a los links
Cambiar los 3 links de `to="/"` a incluir UTM params:

| Link | utm_source | utm_medium |
|------|------------|------------|
| Header "Responder las 3D" | comentarios | header |
| CTA Feed | comentarios | cta_feed |
| CTA Mosaico | comentarios | cta_mosaic |

```typescript
// Header
to="/?utm_source=comentarios&utm_medium=header"

// CTACard feed
to="/?utm_source=comentarios&utm_medium=cta_feed"

// CTACard mosaic  
to="/?utm_source=comentarios&utm_medium=cta_mosaic"
```

#### 3. Pasar ctaPosition a los componentes
Actualizar `FeedView` y `MosaicView` para recibir la posición como prop:

```typescript
<FeedView comments={comments || []} formatDate={formatDate} ctaPosition={ctaPosition} />
<MosaicView comments={comments || []} formatDate={formatDate} ctaPosition={ctaPosition} />
```

---

### Archivos a modificar
- `src/pages/CommentsPage.tsx`

---

### Resultado
- El CTA aparecerá en diferentes posiciones cada vez que se carga la página
- Los UTMs permitirán trackear de dónde vienen los usuarios en analytics
