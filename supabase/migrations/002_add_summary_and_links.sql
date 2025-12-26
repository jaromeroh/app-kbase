-- Añadir campo summary (resumen) a la tabla content
ALTER TABLE content ADD COLUMN IF NOT EXISTS summary TEXT;

-- Añadir campo related_links (links relevantes) como JSONB
-- Estructura: [{"title": "Título", "url": "https://..."}, ...]
ALTER TABLE content ADD COLUMN IF NOT EXISTS related_links JSONB DEFAULT '[]'::jsonb;

-- Comentarios para documentar los campos
COMMENT ON COLUMN content.summary IS 'Resumen del contenido';
COMMENT ON COLUMN content.related_links IS 'Links relevantes al contenido. Array de objetos con title y url';
