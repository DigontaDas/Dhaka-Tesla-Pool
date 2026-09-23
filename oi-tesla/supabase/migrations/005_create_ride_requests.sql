-- 005_create_ride_requests.sql
-- Individual passenger ride requests
-- Each request tracks one passenger's journey from pickup to destination

CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_area_id UUID NOT NULL REFERENCES areas(id),
  destination_area_id UUID NOT NULL REFERENCES areas(id),
  seats_needed INTEGER NOT NULL DEFAULT 1 CHECK (seats_needed > 0 AND seats_needed <= 3),
  status ride_status NOT NULL DEFAULT 'requested',
  payment_method payment_method NOT NULL DEFAULT 'cash',
  
  -- Fare (calculated when matched, stored in poysha - integer to avoid float errors)
  estimated_fare_poysha INTEGER CHECK (estimated_fare_poysha >= 0),
  final_fare_poysha INTEGER CHECK (final_fare_poysha >= 0),
  is_pooled BOOLEAN DEFAULT false,
  
  -- Timestamps for lifecycle tracking
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  matched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Prevent booking pickup = destination
  CONSTRAINT different_areas CHECK (pickup_area_id != destination_area_id)
);

-- Performance indexes
CREATE INDEX idx_rides_passenger ON ride_requests(passenger_id);
CREATE INDEX idx_rides_status ON ride_requests(status);
CREATE INDEX idx_rides_passenger_status ON ride_requests(passenger_id, status);
CREATE INDEX idx_rides_pickup_status ON ride_requests(pickup_area_id, status);
CREATE INDEX idx_rides_requested_at ON ride_requests(requested_at DESC);

CREATE TRIGGER update_ride_requests_updated_at
  BEFORE UPDATE ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
