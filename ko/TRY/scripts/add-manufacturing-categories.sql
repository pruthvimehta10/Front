-- Add manufacturing categories
INSERT INTO categories (name, description) VALUES
  ('Additive', 'Additive manufacturing courses including 3D printing and related technologies'),
  ('Electronic', 'Electronic manufacturing courses covering circuit design, PCB assembly, and electronics'),
  ('Subtractive', 'Subtractive manufacturing courses including CNC machining, milling, and cutting')
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
SELECT id, name, description, created_at FROM categories ORDER BY name;
