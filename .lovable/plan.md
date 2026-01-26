

## Resumen del Problema

La función `save-result` **funciona correctamente** - los datos se están guardando en la base de datos. El error "Failed to fetch" que ves en el navegador probablemente se debe a:
1. **Timeout del navegador** mientras espera que Resend envíe el email (operación secuencial)
2. La función tarda más de lo esperado porque hace todo en serie: validar -> insertar -> enviar email -> responder

## Plan de Cambios

### 1. Renombrar tabla `measurements` a `records_3d`

Migración SQL para renombrar la tabla y actualizar las políticas RLS existentes.

### 2. Crear nueva tabla `outbound_emails` para auditoría

Nueva tabla con estas columnas:
- `id` (uuid, primary key)
- `record_id` (uuid, referencia a records_3d)
- `to_email` (text)
- `subject` (text)
- `email_type` (text): 'measurement' o 'reminder'
- `status` (text): 'pending', 'sent', 'failed'
- `provider_id` (text): ID de Resend para tracking
- `error_message` (text): si falló, por qué
- `scheduled_for` (timestamptz): para recordatorios programados
- `sent_at` (timestamptz)
- `created_at` (timestamptz)

Esta tabla permite:
- Auditar todos los emails enviados
- Programar recordatorios (1m/3m) como registros pendientes
- Reintentar envíos fallidos
- Controlar rate limits de Resend

### 3. Agregar columna `email_sent` a `records_3d`

Columna booleana para saber rápidamente si el email de confirmación fue enviado sin consultar la tabla de auditoría.

### 4. Refactorizar Edge Function `save-result`

Cambios clave:
- **Envío asíncrono "fire-and-forget"**: Guardar el registro primero, responder inmediatamente al usuario, y luego intentar enviar el email
- **Registrar en `outbound_emails`**: Cada intento de email queda registrado
- **Actualizar `email_sent`**: Marcar en `records_3d` si el email fue exitoso
- **UX "Éxito con aviso"**: Si el guardado funciona pero el email falla, el frontend muestra un mensaje de éxito con nota sobre el email

### 5. Actualizar frontend `ResultScreen.tsx`

- Manejar la nueva respuesta que incluye `emailSent: boolean`
- Mostrar mensaje diferenciado según el resultado:
  - "Resultado guardado. Revisá tu email." (si email enviado)
  - "Resultado guardado. No pudimos enviarte el email, pero tus datos quedaron guardados." (si email falló)

### 6. Actualizar referencias en código

- `save-result/index.ts`: usar nueva tabla `records_3d`
- `src/integrations/supabase/types.ts`: se actualizará automáticamente

---

## Detalles Técnicos

### Estructura de `outbound_emails`

```text
+------------------+-------------+----------------------------------+
| Columna          | Tipo        | Descripción                      |
+------------------+-------------+----------------------------------+
| id               | uuid        | Primary key                      |
| record_id        | uuid        | FK a records_3d                  |
| to_email         | text        | Destinatario                     |
| subject          | text        | Asunto del email                 |
| email_type       | text        | 'measurement' | 'reminder'       |
| status           | text        | 'pending' | 'sent' | 'failed'   |
| provider_id      | text        | ID de Resend (para tracking)     |
| error_message    | text        | Mensaje de error si falló        |
| scheduled_for    | timestamptz | Fecha programada (recordatorios) |
| sent_at          | timestamptz | Fecha de envío efectivo          |
| created_at       | timestamptz | Fecha de creación del registro   |
+------------------+-------------+----------------------------------+
```

### Flujo mejorado de `save-result`

```text
1. Recibir request
2. Validar datos
3. Insertar en records_3d (email_sent = false)
4. Responder al cliente inmediatamente con success = true
5. Crear registro en outbound_emails (status = 'pending')
6. Si hay reminderPeriod, crear registro adicional con scheduled_for
7. Intentar enviar email con Resend
8. Actualizar outbound_emails con resultado (sent/failed + provider_id)
9. Actualizar records_3d.email_sent = true si exitoso
```

### Migraciones SQL necesarias

1. Renombrar tabla:
   - `ALTER TABLE measurements RENAME TO records_3d`
   - Actualizar índices y políticas

2. Agregar columna:
   - `ALTER TABLE records_3d ADD COLUMN email_sent boolean DEFAULT false`

3. Crear tabla outbound_emails con RLS (solo service_role)

