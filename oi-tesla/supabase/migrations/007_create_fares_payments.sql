-- 007_create_fares_payments.sql
-- Fare breakdown per passenger and payment records
-- All monetary values stored as INTEGER in poysha (1 BDT = 100 poysha)

CREATE TABLE fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE UNIQUE,
  base_fare_poysha INTEGER NOT NULL CHECK (base_fare_poysha >= 0),
  distance_charge_poysha INTEGER NOT NULL CHECK (distance_charge_poysha >= 0),
  pool_discount_poysha INTEGER NOT NULL DEFAULT 0 CHECK (pool_discount_poysha >= 0),
  total_fare_poysha INTEGER NOT NULL CHECK (total_fare_poysha >= 0),
  distance_km NUMERIC(5, 2) NOT NULL,
  is_pooled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_fares_ride ON fares(ride_request_id);

-- Payments: records cash or TeslaPay wallet transactions
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  amount_poysha INTEGER NOT NULL CHECK (amount_poysha > 0),
  method payment_method NOT NULL DEFAULT 'cash',
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_payments_ride ON payments(ride_request_id);
CREATE INDEX idx_payments_passenger ON payments(passenger_id);
CREATE INDEX idx_payments_driver ON payments(driver_id);
