
# Plan: Mejorar Configuración de Emails

## Resumen

Actualizar el sender y agregar reply-to en los emails enviados por Resend.

---

## Cambios

**Archivo**: `supabase/functions/save-result/index.ts`

**Ubicación**: Línea 181-186 (llamada a `resend.emails.send`)

**Antes**:
```typescript
const emailResponse = await resend.emails.send({
  from: "3D <3d@3d.ceoencamiseta.com>",
  to: [email],
  subject: subject,
  text: emailContent,
});
```

**Después**:
```typescript
const emailResponse = await resend.emails.send({
  from: "3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>",
  to: [email],
  replyTo: "leopiccioli@gmail.com",
  subject: subject,
  text: emailContent,
});
```

---

## Resultado

- **Remitente**: Aparecerá como "3D, de CEO en Camiseta" en la bandeja de entrada
- **Reply-to**: Cuando el usuario responda al email, irá a leopiccioli@gmail.com

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/save-result/index.ts` | Actualizar `from` y agregar `replyTo` |
