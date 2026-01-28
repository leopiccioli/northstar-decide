-- Fix: Set search_path for normalize_country function
CREATE OR REPLACE FUNCTION public.normalize_country(input text)
RETURNS text AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Si ya es código ISO válido (2 letras mayúsculas)
  IF LENGTH(TRIM(input)) = 2 AND UPPER(TRIM(input)) ~ '^[A-Z]{2}$' THEN
    RETURN UPPER(TRIM(input));
  END IF;
  
  -- Mapeo de nombres y variantes a códigos ISO
  RETURN CASE LOWER(TRIM(input))
    WHEN 'argentina' THEN 'AR'
    WHEN 'bolivia' THEN 'BO'
    WHEN 'brasil' THEN 'BR'
    WHEN 'brazil' THEN 'BR'
    WHEN 'chile' THEN 'CL'
    WHEN 'colombia' THEN 'CO'
    WHEN 'costa rica' THEN 'CR'
    WHEN 'alemania' THEN 'DE'
    WHEN 'germany' THEN 'DE'
    WHEN 'republica dominicana' THEN 'DO'
    WHEN 'república dominicana' THEN 'DO'
    WHEN 'rep. dom.' THEN 'DO'
    WHEN 'rep. dominicana' THEN 'DO'
    WHEN 'república dominica' THEN 'DO'
    WHEN 'ecuador' THEN 'EC'
    WHEN 'españa' THEN 'ES'
    WHEN 'espana' THEN 'ES'
    WHEN 'spain' THEN 'ES'
    WHEN 'guatemala' THEN 'GT'
    WHEN 'honduras' THEN 'HN'
    WHEN 'italia' THEN 'IT'
    WHEN 'italy' THEN 'IT'
    WHEN 'mexico' THEN 'MX'
    WHEN 'méxico' THEN 'MX'
    WHEN 'nicaragua' THEN 'NI'
    WHEN 'panama' THEN 'PA'
    WHEN 'panamá' THEN 'PA'
    WHEN 'peru' THEN 'PE'
    WHEN 'perú' THEN 'PE'
    WHEN 'puerto rico' THEN 'PR'
    WHEN 'portugal' THEN 'PT'
    WHEN 'paraguay' THEN 'PY'
    WHEN 'el salvador' THEN 'SV'
    WHEN 'el salvador, centroamérica' THEN 'SV'
    WHEN 'estados unidos' THEN 'US'
    WHEN 'usa' THEN 'US'
    WHEN 'united states' THEN 'US'
    WHEN 'uruguay' THEN 'UY'
    WHEN 'venezuela' THEN 'VE'
    WHEN 'canadá' THEN 'CA'
    WHEN 'canada' THEN 'CA'
    WHEN 'israel' THEN 'IL'
    WHEN 'japón' THEN 'JP'
    WHEN 'japon' THEN 'JP'
    WHEN 'japan' THEN 'JP'
    WHEN 'other' THEN NULL
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Fix: Set search_path for normalize_country_on_change function
CREATE OR REPLACE FUNCTION public.normalize_country_on_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.country_raw := NEW.country;
  NEW.country := public.normalize_country(NEW.country);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;