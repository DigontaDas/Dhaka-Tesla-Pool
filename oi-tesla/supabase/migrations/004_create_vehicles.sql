-- 004_create_vehicles.sql
-- Tesla vehicles with fixed capacity
-- Each vehicle belongs to one driver

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,                    -- "Bullet"
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL DEFAULT 3 CHECK (capacity > 0 AND capacity <= 6),
  battery_pct INTEGER DEFAULT 100 CHECK (battery_pct >= 0 AND battery_pct <= 100),
  plate_number VARCHAR(20),
  vehicle_type VARCHAR(30) DEFAULT 'e-trike',   -- Battery Tesla / e-trike
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = true;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
