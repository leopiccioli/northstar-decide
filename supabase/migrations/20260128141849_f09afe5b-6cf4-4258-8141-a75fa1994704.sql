-- Crear bucket privado para importar legacy data
INSERT INTO storage.buckets (id, name, public)
VALUES ('legacy-import', 'legacy-import', false)
ON CONFLICT (id) DO NOTHING;