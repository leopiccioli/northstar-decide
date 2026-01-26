
# Plan: Sistema de guardado con emails tipo recibo

## Resumen

Implementar el sistema completo de guardado de mediciones con:
- Base de datos con tracking completo (UTMs, gclid, fbclid, IP)
- Campo JSON para comparaciones (1 registro = 1 medicion completa)
- Edge function que envia emails tipo "recibo del banco"
- Scores de 1 a 10 (sin cero)

---

## 1. Habilitar Lovable Cloud

Necesitamos Cloud activo para la base de datos y edge functions.

---

## 2. Base de datos

### Tabla: `measurements`

```sql
CREATE TABLE measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  
  -- Opcion evaluada (situacion actual)
  option_name text NOT NULL,
  dinero integer NOT NULL CHECK (dinero >= 1 AND dinero <= 10),
  desarrollo integer NOT NULL CHECK (desarrollo >= 1 AND desarrollo <= 10),
  diversion integer NOT NULL CHECK (diversion >= 1 AND diversion <= 10),
  comment text,
  
  -- Comparacion (opcional) - contiene la segunda opcion
  comparison jsonb,
  
  -- Recordatorio
  reminder_period text CHECK (reminder_period IN ('1m', '3m')),
  reminder_date timestamptz,
  
  -- UTMs
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  
  -- Click IDs
  gclid text,
  fbclid text,
  
  -- Tracking adicional
  referrer text,
  ip_address text,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX idx_measurements_email ON measurements(email);
CREATE INDEX idx_measurements_ip ON measurements(ip_address);
CREATE INDEX idx_measurements_reminder ON measurements(reminder_date) 
  WHERE reminder_date IS NOT NULL;
```

### Estructura del campo `comparison`

Cuando es una comparacion, el campo contiene:
```json
{
  "name": "Startup",
  "dinero": 8,
  "desarrollo": 7,
  "diversion": 9,
  "comment": "Mas autonomia"
}
```

Cuando es evaluacion simple: `comparison = null`

---

## 3. Edge Function: `save-result`

### Request body esperado

```typescript
interface SaveResultRequest {
  email: string;
  optionName: string;
  scores: { dinero: number; desarrollo: number; diversion: number };
  comment?: string;
  comparison?: {
    name: string;
    dinero: number;
    desarrollo: number;
    diversion: number;
    comment?: string;
  };
  reminderPeriod?: '1m' | '3m';
  tracking: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    gclid?: string;
    fbclid?: string;
    referrer?: string;
  };
}
```

### Logica

1. Validar email y scores (1-10)
2. Capturar IP y user-agent del request
3. Rate limiting: max 10 guardados/hora por IP
4. Calcular `reminder_date` si hay `reminderPeriod`
5. Buscar medicion anterior del mismo email
6. Insertar en DB
7. Enviar email via Resend segun caso

### Emails

**Asunto:** `Tu medicion 3D`

**Caso A - Primera vez (sin historial):**
```
Tu medicion de hoy:

Dinero: 8
Desarrollo: 2
Diversion: 8

Listo. Lo guarde para que puedas volver cuando quieras.

Leo
```

**Caso A con comparacion:**
```
Tu medicion de hoy:

Mi trabajo actual:
Dinero: 6
Desarrollo: 4
Diversion: 5

Startup:
Dinero: 5
Desarrollo: 8
Diversion: 7

Listo. Lo guarde para que puedas volver cuando quieras.

Leo
```

**Caso B - Con historial:**
```
Tu medicion de hoy:

Dinero: 8
Desarrollo: 2
Diversion: 8

Anterior:
Dinero: 7
Desarrollo: 3
Diversion: 6

Cambios:
Dinero +1
Desarrollo -1
Diversion +2

Listo. Sigo guardando tu historial para que puedas compararte mas adelante.

Leo
```

---

## 4. Frontend

### Hook: `useTrackingData.ts`

Captura UTMs, gclid, fbclid y referrer al cargar la app:

```typescript
export function useTrackingData() {
  const params = new URLSearchParams(window.location.search);
  
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    gclid: params.get('gclid'),
    fbclid: params.get('fbclid'),
    referrer: document.referrer || null,
  };
}
```

### Actualizar `ResultScreen.tsx`

- Importar hook de tracking
- Validar formato de email con regex
- Llamar a edge function en `handleSave`
- Manejar estados: guardando, exito, error

### Actualizar `DimensionSlider.tsx`

- Cambiar rango de 0-10 a 1-10
- Valor inicial: 5

---

## 5. Configuracion Resend

Necesitas:
1. API Key de https://resend.com/api-keys
2. Dominio verificado en https://resend.com/domains

El API key se guardara como secret `RESEND_API_KEY`.

---

## Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear tabla measurements |
| `supabase/functions/save-result/index.ts` | Crear edge function |
| `supabase/config.toml` | Configurar verify_jwt = false |
| `src/hooks/useTrackingData.ts` | Nuevo hook |
| `src/components/decision/ResultScreen.tsx` | Conectar con edge function |
| `src/components/decision/DimensionSlider.tsx` | Cambiar min a 1 |

---

## Secuencia de implementacion

1. Habilitar Lovable Cloud
2. Crear migracion SQL
3. Pedir API key de Resend
4. Crear edge function
5. Crear hook de tracking
6. Actualizar frontend
7. Probar flujo completo

---

## Proximos pasos inmediatos

1. Habilita Lovable Cloud (boton en el chat)
2. Comparti tu API key de Resend
3. Decime que dominio vas a usar para el "from" del email (ej: `noreply@tudominio.com`)
