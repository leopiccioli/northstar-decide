## Fix de 2 emails + regla anti-typo TLD

### Registros encontrados
1. **`pauherrero08@gmail.comp`** → `records_3d.id = 3c4f62a5-9332-4003-8c6c-353aaf54bf56` ✅
2. **`Legaspiallende@gmail.coml`** → ❌ no existe en `records_3d` ni en `outbound_emails`. Encontré uno parecido: **`luis.ingrisani@gmail.coml`** (id `ed0afe31-4728-4bd8-8502-9ac9017b6bf0`) que tiene mismo patrón `.coml`.

**Pregunta antes de seguir:** ¿De dónde sacaste `Legaspiallende@gmail.coml`? No aparece en la base. Opciones:
- (a) Te equivocaste y era `luis.ingrisani@gmail.coml` → lo corrijo y reenvío.
- (b) Es otra fuente (mail directo, captura) → pasame el id o confirmá que no está cargado, y solo agregamos la regla.
- (c) Buscar con otra variante (decime cómo escribirlo).

### Plan de ejecución (asumiendo confirmación)

**1. Corregir datos**
- `UPDATE records_3d SET email = 'pauherrero08@gmail.com' WHERE id = '3c4f62a5-…'`
- `UPDATE outbound_emails SET to_email = 'pauherrero08@gmail.com' WHERE record_id = '3c4f62a5-…'`
- (Si confirmás opción a) idem con `luis.ingrisani` → `luis.ingrisani@gmail.com` en records_3d + outbound_emails.

**2. Reenviar feedback**
Invocar `resend-measurement` con los `record_ids` correspondientes.

**3. Regla nueva en `src/lib/emailTypo.ts`**
Hoy faltaba el caso de **letra extra al final del TLD** (`.comp`, `.coml`, `.como`, `.comm`, `.neto`, `.orgs`). Agrego, después de las reglas `.co/.cmo/.cm`:

```ts
// Letra extra al final del TLD (.comp, .coml, .como, .comm, .neto, .orgs)
const TRAILING_TLD_TYPOS: Record<string, string> = {
  comp: 'com', coml: 'com', como: 'com', comm: 'com', comn: 'com', comz: 'com',
  neto: 'net', nett: 'net',
  orgs: 'org', orgo: 'org',
};
const lastDot = domain.lastIndexOf('.');
if (lastDot > 0) {
  const tld = domain.slice(lastDot + 1);
  if (TRAILING_TLD_TYPOS[tld]) {
    return `${localPart}@${domain.slice(0, lastDot + 1)}${TRAILING_TLD_TYPOS[tld]}`;
  }
}
```

Cubre cualquier dominio (gmail, hotmail, corporativos). No afecta `.com.ar` porque el TLD final ahí es `ar`.

### Validación
- `detectEmailTypo('pauherrero08@gmail.comp')` → `pauherrero08@gmail.com`
- `detectEmailTypo('Legaspiallende@gmail.coml')` → `legaspiallende@gmail.com`
- `resend-measurement` responde `status: 'sent'` para cada record.

Confirmá (a/b/c) y avanzo.
