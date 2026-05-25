
## Objetivo

Convertir los emails actuales (texto plano con URLs visibles) a HTML ultra-minimal con links como anchors underline, manteniendo la estética calculadora. Activar click tracking de Resend y recibir webhooks para guardar cada click en la DB.

## Cambios

### 1. HTML ultra-minimal en los 2 emails

Estilo: fondo blanco, texto negro `#000`, font-family system (`-apple-system, Segoe UI, sans-serif` — Google Fonts no carga confiable en Gmail), `font-size: 15px`, `line-height: 1.5`, ancho máx 480px. Cada URL pelada se convierte en `<a href="..." style="color:#000;text-decoration:underline">texto descriptivo</a>`. Saltos de línea preservados con `<br>` o `<p>`. Sin imágenes, sin tablas decorativas, sin botones de color.

**Mapeo de links:**
- URL completa de "volver a medir" → `Entrá para ver cómo cambió` (anchor)
- WhatsApp share → `Recomendar por WhatsApp` (anchor)
- Libros P.S. → `Cómo RAJAR a tu jefe`, `Sé tu propio CEO`, `FINANZAS` (anchors con el título del libro)

Se mantiene `text` plain como fallback (mejora deliverability, lo lee Gmail si HTML falla). El plain mantiene URLs visibles como hoy.

**Archivos:**
- `supabase/functions/resend-measurement/index.ts` — agregar función `buildEmailHTML()` paralela a la existente `buildEmailContent()`, pasar ambas a `resend.emails.send({ html, text })`.
- `supabase/functions/send-reminders/index.ts` — idem con `buildReminderHTMLContent()`.

### 2. Click tracking de Resend

Activar `click_tracking: true` y `open_tracking: true` por email enviado (Resend lo soporta vía parámetro). También se puede activar globalmente en el dashboard del dominio — preferible hacerlo por código para tener control explícito.

Resend reescribe los `href` a `https://...resend-links.com/CLICK_ID` y al hacer click hace 302 al original (UTMs se mantienen intactos en la URL final). Open tracking inserta un pixel 1x1.

### 3. Nueva tabla `email_events` + webhook

**Migración:**
```sql
CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id text NOT NULL,         -- correlaciona con outbound_emails.provider_id
  event_type text NOT NULL,              -- 'sent','delivered','opened','clicked','bounced','complained','delivery_delayed'
  to_email text,
  link_url text,                         -- solo para 'clicked'
  user_agent text,
  ip_address text,
  raw_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_events_resend_id ON public.email_events(resend_email_id);
CREATE INDEX idx_email_events_type_created ON public.email_events(event_type, created_at DESC);
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
-- bloqueo público + service role full access (mismo patrón que outbound_emails)
```

**Nueva edge function `resend-webhook`** (`verify_jwt = false` en `supabase/config.toml` porque la llama Resend, no usuarios):
- Recibe POST de Resend con eventos `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`.
- Verifica firma con `Svix-Signature` header usando secret `RESEND_WEBHOOK_SECRET`.
- Inserta una fila por evento en `email_events`.
- Devuelve 200 rápido (idempotente si llega 2 veces, no es crítico).

**Setup manual del usuario (te lo digo cuando termine):**
1. Ir al dashboard de Resend → Webhooks → crear endpoint apuntando a `https://bcokciysbyuaeodnsxas.supabase.co/functions/v1/resend-webhook`.
2. Suscribirse a los eventos listados.
3. Copiar el signing secret y pegarlo cuando te pida `RESEND_WEBHOOK_SECRET` con `add_secret`.
4. (Opcional) Activar click/open tracking a nivel dominio en Resend, aunque el código ya lo manda explícito.

### 4. Cómo se ven las queries de tracking después

Para saber CTR de un email puntual:
```sql
SELECT oe.to_email, oe.email_type, oe.sent_at,
       EXISTS(SELECT 1 FROM email_events WHERE resend_email_id = oe.provider_id AND event_type = 'opened') AS opened,
       EXISTS(SELECT 1 FROM email_events WHERE resend_email_id = oe.provider_id AND event_type = 'clicked') AS clicked
FROM outbound_emails oe
WHERE oe.email_type = 'reminder' AND oe.status = 'sent';
```

## Lo que NO cambia

- Lógica de queue/reminders/retry intacta.
- Plain text fallback se mantiene idéntico a hoy.
- UTMs intactos (Resend hace 302 preservando query string).
- `outbound_emails` no se modifica (sigue siendo el registro de envío; `email_events` es el log de qué pasó después).
- Estética: monocromático, sobrio, sin colores. Sigue siendo "calculadora fría".

## Orden de ejecución

1. Migración: tabla `email_events`.
2. Edge function nueva `resend-webhook` + entrada en `config.toml` con `verify_jwt = false`.
3. Pedir secret `RESEND_WEBHOOK_SECRET` (te bloqueo hasta que lo configures en Resend y me lo des).
4. Modificar `resend-measurement` y `send-reminders` para mandar HTML + activar tracking.
5. Deploy las 3 funciones.
6. Test: mando un measurement de prueba y verifico que el evento `delivered` y `opened` lleguen a `email_events`.

## Memorias a actualizar al terminar

- `mem://features/email-system-logic` — agregar que se manda HTML+text, con click/open tracking guardado en `email_events`.
- `mem://technical/email-infrastructure` — sumar `email_events` + webhook al stack.
