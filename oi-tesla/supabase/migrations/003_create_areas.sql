-- 003_create_areas.sql
-- Predefined Dhaka areas with lat/lng centroids
-- Used for pickup/destination selection and zone-based matching

CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  lat NUMERIC(10, 6) NOT NULL,
  lng NUMERIC(10, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Precomputed distances between areas (in km)
-- Used for fare calculation without requiring map APIs
CREATE TABLE area_distances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_area_id UUID NOT NULL REFERENCES areas(id),
  to_area_id UUID NOT NULL REFERENCES areas(id),
  distance_km NUMERIC(5, 2) NOT NULL CHECK (distance_km >= 0),
  UNIQUE(from_area_id, to_area_id)
);

CREATE INDEX idx_area_distances_lookup ON area_distances(from_area_id, to_area_id);
