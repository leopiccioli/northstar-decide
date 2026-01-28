-- 1. Agregar columna para guardar el valor original
ALTER TABLE records_3d ADD COLUMN IF NOT EXISTS country_raw text;

-- 2. Crear función de normalización
CREATE OR REPLACE FUNCTION normalize_country(input text)
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
    ELSE NULL  -- No reconocido: NULL en country, pero se preserva en country_raw
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Crear función del trigger (guarda original + normalizado)
CREATE OR REPLACE FUNCTION normalize_country_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Siempre guardar el valor original en country_raw
  NEW.country_raw := NEW.country;
  -- Normalizar para country
  NEW.country := normalize_country(NEW.country);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger
DROP TRIGGER IF EXISTS normalize_country_trigger ON records_3d;
CREATE TRIGGER normalize_country_trigger
  BEFORE INSERT OR UPDATE OF country ON records_3d
  FOR EACH ROW
  EXECUTE FUNCTION normalize_country_on_change();

-- 5. Migrar datos existentes: copiar valores actuales a country_raw
UPDATE records_3d 
SET country_raw = country
WHERE country IS NOT NULL AND country_raw IS NULL;

-- 6. Normalizar los valores existentes en country
UPDATE records_3d 
SET country = normalize_country(country_raw)
WHERE country_raw IS NOT NULL;