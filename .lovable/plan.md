

# Plan: Agregar parámetro email al link de notificaciones legacy

## Problema Actual

El email de notificación legacy incluye el link `https://3d.ceoencamiseta.com` sin parámetros. La aplicación ya soporta `?email=xxx@xxx.com` para pre-llenar el formulario, pero no se está aprovechando.

## Beneficio

Cuando el usuario hace clic en el link del email:
- Su email ya estará pre-llenado en el formulario
- La sección de guardado se auto-expandirá
- Mejor experiencia para usuarios que regresan

## Cambio Propuesto

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/send-legacy-notification/index.ts` | Modificar `buildEmailHtml` para incluir el email como query param |

## Código Actual (línea 60)

```html
<p>Entrá a <a href="${BASE_URL}">${BASE_URL}</a> para ver tu historial completo.</p>
```

## Código Nuevo

```typescript
const emailParam = encodeURIComponent(user.email);
const linkUrl = `${BASE_URL}?email=${emailParam}`;

// En el HTML:
<p>Entrá a <a href="${linkUrl}">${BASE_URL}</a> para ver tu historial completo.</p>
```

## Consideraciones

- **URL Encoding**: Se usa `encodeURIComponent()` para manejar caracteres especiales en emails (ej: `+`, espacios)
- **Display**: El texto visible sigue siendo `https://3d.ceoencamiseta.com` (limpio), pero el href incluye el parámetro
- **Emails ya enviados**: Los ~40+ emails ya enviados no tendrán este parámetro. Los ~9,060 restantes sí lo tendrán

## Sección Técnica

La función `buildEmailHtml` se modificará agregando el encoding del email y construyendo la URL con el parámetro:

```typescript
const buildEmailHtml = (user: LegacyUser): string => {
  const formattedDate = formatDate(user.created_at);
  const recordText = user.record_count === 1 
    ? '1 medición histórica' 
    : `${user.record_count} mediciones históricas`;
  
  // URL con email pre-filled
  const emailParam = encodeURIComponent(user.email);
  const linkUrl = `${BASE_URL}?email=${emailParam}`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hola,</p>
      
      <p>Ya están tus datos anteriores en el nuevo 3D.</p>
      
      <p>Tenés <strong>${recordText}</strong>. Tu más reciente (${formattedDate}):</p>
      
      <ul style="list-style: none; padding: 0;">
        <li><strong>Dinero:</strong> ${user.dinero}</li>
        <li><strong>Desarrollo:</strong> ${user.desarrollo}</li>
        <li><strong>Diversión:</strong> ${user.diversion}</li>
      </ul>
      
      <p>Entrá a <a href="${linkUrl}">${BASE_URL}</a> para ver tu historial completo.</p>
      
      <p>Leo</p>
    </div>
  `;
};
```

