

# Plan: Edge Function para Notificaciones Legacy (Corregido)

## Correcciones Aplicadas

| Corrección | Antes | Después |
|------------|-------|---------|
| URL | Hardcodeada | Usar `SITE_CONFIG.baseUrl` (https://3d.ceoencamiseta.com) |
| From email | - | Usar `SITE_CONFIG.emailFrom` |
| Reply-to | - | Usar `SITE_CONFIG.emailReplyTo` |
| Velocidad | 1 segundo entre emails | 3 segundos entre emails |
| Contenido | Solo última medición | Incluir cantidad de registros del usuario |

## Contenido del Email Actualizado

```text
Subject: 3D Reloaded: parece una peli pero es mejor

Hola,

Ya están tus datos anteriores en el nuevo 3D.

Tenés 4 mediciones históricas. Tu más reciente (27/01/2026):
Dinero: 7
Desarrollo: 8
Diversión: 6

Entrá a https://3d.ceoencamiseta.com para ver tu historial completo.

Leo
```

## Archivo a Crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/functions/send-legacy-notification/index.ts` | Edge Function con config centralizada |

## Rate Limiting Conservador

- **3 segundos** de delay entre cada email
- Batch size: 50 emails por invocación
- ~150 segundos por batch completo
- Para 9,112 usuarios: ~183 invocaciones

## Query para Datos del Usuario

```sql
SELECT 
  email,
  COUNT(*) as record_count,
  MAX(created_at) as latest_date,
  -- scores del registro más reciente via window function
FROM records_3d 
WHERE option_name = 'legacy'
GROUP BY email
```

## Parámetros de Invocación

```json
{
  "batchSize": 50,      // emails por ejecución
  "delayMs": 3000,      // 3 segundos entre emails
  "dryRun": false       // true para simular
}
```

## Respuesta de la Función

```json
{
  "sent": 50,
  "failed": 0,
  "remaining": 9062,
  "totalRecordsProcessed": 50,
  "errors": []
}
```

---

## Sección Técnica

La Edge Function:

1. Define constantes de configuración inline (no puede importar de src/):
   - `BASE_URL = 'https://3d.ceoencamiseta.com'`
   - `EMAIL_FROM = '3D, de CEO en Camiseta <3d@3d.ceoencamiseta.com>'`
   - `EMAIL_REPLY_TO = 'leopiccioli@gmail.com'`

2. Consulta usuarios legacy con conteo de registros:
```sql
WITH user_records AS (
  SELECT 
    email,
    COUNT(*) as record_count,
    dinero, desarrollo, diversion, created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM records_3d 
  WHERE option_name = 'legacy'
)
SELECT email, record_count, dinero, desarrollo, diversion, created_at
FROM user_records WHERE rn = 1
```

3. Filtra usuarios ya notificados (LEFT JOIN con outbound_emails WHERE email_type = 'legacy_notification')

4. Envía emails con delay de 3 segundos usando:
```typescript
await new Promise(resolve => setTimeout(resolve, delayMs));
```

5. Registra cada envío en `outbound_emails` con `email_type: 'legacy_notification'`

6. Retorna estadísticas de envío

