-- Create vibe_collections mapping table
-- This maps vibes to collections with display order

CREATE TABLE IF NOT EXISTS vibe_collections (
  id SERIAL PRIMARY KEY,
  vibe VARCHAR(20) NOT NULL,
  collection_id VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vibe_collections_vibe ON vibe_collections(vibe);
CREATE INDEX IF NOT EXISTS idx_vibe_collections_collection ON vibe_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_vibe_collections_order ON vibe_collections(vibe, display_order);

-- Insert the exact vibe-collection mappings you specified
INSERT INTO vibe_collections (vibe, collection_id, display_order) VALUES
  ('Refuel', 'hawker-heaven', 1),
  ('Refuel', 'local-eats-sin', 2),
  ('Refuel', 'quick-bites', 3),
  ('Explore', 'jewel-wonders', 1),
  ('Explore', 'changi-exclusives', 2),
  ('Explore', 'garden-city-gems', 3),
  ('Chill', 'coffee-chill', 1),
  ('Chill', 'lounge-life', 2),
  ('Quick', '24-7-heroes', 1),
  ('Quick', 'quick-bites', 2),
  ('Comfort', 'lounge-life', 1),
  ('Comfort', '24-7-heroes', 2),
  ('Work', 'lounge-life', 1),
  ('Work', '24-7-heroes', 2),
  ('Shop', 'changi-exclusives', 1),
  ('Shop', 'jewel-wonders', 2)
ON CONFLICT (vibe, collection_id) 
DO UPDATE SET 
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Create a view for easy querying
CREATE OR REPLACE VIEW vibe_collections_view AS
SELECT 
  vc.vibe,
  vc.collection_id,
  vc.display_order,
  c.collection_name,
  c.description,
  c.icon,
  c.gradient
FROM vibe_collections vc
LEFT JOIN collections c ON vc.collection_id = c.collection_slug
ORDER BY vc.vibe, vc.display_order;

-- Function to get collections for a specific vibe
CREATE OR REPLACE FUNCTION get_collections_for_vibe(p_vibe VARCHAR(20))
RETURNS TABLE (
  collection_id VARCHAR(100),
  display_order INTEGER,
  collection_name VARCHAR(255),
  description TEXT,
  icon VARCHAR(50),
  gradient VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vc.collection_id,
    vc.display_order,
    c.collection_name,
    c.description,
    c.icon,
    c.gradient
  FROM vibe_collections vc
  LEFT JOIN collections c ON vc.collection_id = c.collection_slug
  WHERE vc.vibe = p_vibe
  ORDER BY vc.display_order;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
GRANT SELECT ON vibe_collections TO anon;
GRANT SELECT ON vibe_collections_view TO anon;
GRANT EXECUTE ON FUNCTION get_collections_for_vibe(VARCHAR) TO anon;

-- Verify the data
SELECT 
  vibe, 
  collection_id, 
  display_order,
  '✅' as status
FROM vibe_collections 
ORDER BY vibe, display_order;
