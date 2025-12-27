-- Crear tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,

  -- Perfil
  display_name TEXT,

  -- Preferencias de visualización
  default_view TEXT DEFAULT 'list' CHECK (default_view IN ('list', 'grid')),
  default_sort TEXT DEFAULT 'created_at' CHECK (default_sort IN ('created_at', 'updated_at', 'title', 'rating')),
  default_sort_order TEXT DEFAULT 'desc' CHECK (default_sort_order IN ('asc', 'desc')),
  items_per_page INTEGER DEFAULT 20 CHECK (items_per_page IN (10, 20, 50)),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Comentarios para documentar los campos
COMMENT ON TABLE user_preferences IS 'Preferencias de configuración por usuario';
COMMENT ON COLUMN user_preferences.display_name IS 'Nombre personalizado para mostrar';
COMMENT ON COLUMN user_preferences.default_view IS 'Vista por defecto: list o grid';
COMMENT ON COLUMN user_preferences.default_sort IS 'Campo de ordenamiento por defecto';
COMMENT ON COLUMN user_preferences.default_sort_order IS 'Orden por defecto: asc o desc';
COMMENT ON COLUMN user_preferences.items_per_page IS 'Número de items por página: 10, 20 o 50';
