-- Habilitar RLS en measurements
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Solo el service role (edge functions) puede insertar
-- No hay politicas para usuarios anonimos - las inserciones vienen solo del backend
CREATE POLICY "Service role can insert measurements" 
ON public.measurements 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Service role puede leer para buscar historial
CREATE POLICY "Service role can read measurements" 
ON public.measurements 
FOR SELECT 
TO service_role
USING (true);