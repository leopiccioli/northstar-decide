-- Tabla para guardar mediciones del 3D
CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  
  -- Opcion evaluada (situacion actual)
  option_name text NOT NULL,
  dinero integer NOT NULL CHECK (dinero >= 1 AND dinero <= 10),
  desarrollo integer NOT NULL CHECK (desarrollo >= 1 AND desarrollo <= 10),
  diversion integer NOT NULL CHECK (diversion >= 1 AND diversion <= 10),
  comment text,
  
  -- Comparacion (opcional) - contiene la segunda opcion como JSON
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

-- Indices para busquedas frecuentes
CREATE INDEX idx_measurements_email ON public.measurements(email);
CREATE INDEX idx_measurements_ip ON public.measurements(ip_address);
CREATE INDEX idx_measurements_reminder ON public.measurements(reminder_date) 
  WHERE reminder_date IS NOT NULL;

-- Comentario de tabla
COMMENT ON TABLE public.measurements IS 'Mediciones 3D (Dinero, Desarrollo, Diversion) con tracking de marketing';