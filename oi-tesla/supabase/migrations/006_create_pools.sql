-- 006_create_pools.sql
-- Pools: groups ride_requests sharing one vehicle for a trip
-- pool_members: junction table tracking which rides are in which pool

CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  status ride_status NOT NULL DEFAULT 'matched',
  occupied_seats INTEGER NOT NULL DEFAULT 0 CHECK (occupied_seats >= 0),
  
  -- Denormalized from vehicle for quick checks (avoids join during concurrent claims)
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  
  -- Enforce: occupied can never exceed capacity
  CONSTRAINT seats_within_capacity CHECK (occupied_seats <= max_capacity),
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_pools_vehicle_status ON pools(vehicle_id, status);
CREATE INDEX idx_pools_driver_status ON pools(driver_id, status);
CREATE INDEX idx_pools_status ON pools(status);

CREATE TRIGGER update_pools_updated_at
  BEFORE UPDATE ON pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pool members: links ride_requests to pools
CREATE TABLE pool_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number > 0),
  
  -- Individual member status within the pool
  status ride_status NOT NULL DEFAULT 'matched',
  picked_up_at TIMESTAMPTZ,
  dropped_off_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(pool_id, ride_request_id),
  UNIQUE(pool_id, seat_number)
);

CREATE INDEX idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX idx_pool_members_ride ON pool_members(ride_request_id);

CREATE TRIGGER update_pool_members_updated_at
  BEFORE UPDATE ON pool_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
