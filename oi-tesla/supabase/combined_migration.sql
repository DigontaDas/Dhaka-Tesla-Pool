-- ==========================================
-- FILE: 001_create_enums.sql
-- ==========================================
-- 001_create_enums.sql
-- Oi Tesla - Dhaka Ride Pooling MVP
-- Enum types for role, ride status, payment method, payment status

-- User roles
CREATE TYPE user_role AS ENUM ('passenger', 'driver');

-- Ride request status - follows the lifecycle:
-- REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
-- Any pre-COMPLETED state can transition to CANCELLED
CREATE TYPE ride_status AS ENUM (
  'requested',
  'matched',
  'driver_arrived',
  'started',
  'completed',
  'cancelled'
);

-- Driver availability
CREATE TYPE driver_status AS ENUM ('online', 'offline', 'on_trip');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'tesla_pay');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded');


-- ==========================================
-- FILE: 002_create_users.sql
-- ==========================================
-- 002_create_users.sql
-- Users table: both passengers and drivers in one table with role enum
-- Supabase Auth handles authentication; this stores profile data

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,                          -- Links to Supabase auth.users
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'passenger',
  avatar_url TEXT,
  driver_status driver_status DEFAULT 'offline', -- Only relevant for drivers
  tesla_pay_balance_poysha INTEGER DEFAULT 0 CHECK (tesla_pay_balance_poysha >= 0),
  rating_avg NUMERIC(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_driver_status ON users(driver_status) WHERE role = 'driver';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- FILE: 003_create_areas.sql
-- ==========================================
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


-- ==========================================
-- FILE: 004_create_vehicles.sql
-- ==========================================
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


-- ==========================================
-- FILE: 005_create_ride_requests.sql
-- ==========================================
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


-- ==========================================
-- FILE: 006_create_pools.sql
-- ==========================================
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


-- ==========================================
-- FILE: 007_create_fares_payments.sql
-- ==========================================
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


-- ==========================================
-- FILE: 008_create_events_ratings.sql
-- ==========================================
-- 008_create_events_ratings.sql
-- Audit log for every ride state transition and post-ride ratings

-- Ride events: immutable audit trail
CREATE TABLE ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID REFERENCES ride_requests(id) ON DELETE CASCADE,
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,          -- e.g., 'status_change', 'pool_joined', 'seat_claimed'
  from_status ride_status,
  to_status ride_status,
  actor_id UUID REFERENCES users(id),       -- Who triggered this event
  metadata JSONB DEFAULT '{}',              -- Additional context
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_events_ride ON ride_events(ride_request_id);
CREATE INDEX idx_events_pool ON ride_events(pool_id);
CREATE INDEX idx_events_created ON ride_events(created_at DESC);

-- Ratings: post-ride feedback
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- One rating per ride per direction
  UNIQUE(ride_request_id, from_user_id, to_user_id)
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);


-- ==========================================
-- FILE: 009_create_functions.sql
-- ==========================================
-- 009_create_functions.sql
-- Critical PostgreSQL functions for concurrency-safe operations

-- ============================================================
-- FUNCTION: claim_pool_seat
-- Purpose: Atomically claim a seat in a pool with row-level locking
-- Prevents two concurrent requests from overbooking capacity
-- Uses SELECT FOR UPDATE to serialize access to the pool row
-- ============================================================
CREATE OR REPLACE FUNCTION claim_pool_seat(
  p_pool_id UUID,
  p_ride_request_id UUID,
  p_seats_needed INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_pool RECORD;
  v_next_seat INTEGER;
  v_member_id UUID;
BEGIN
  -- Lock the pool row to prevent concurrent modifications
  SELECT id, occupied_seats, max_capacity, status
  INTO v_pool
  FROM pools
  WHERE id = p_pool_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pool not found');
  END IF;

  -- Check pool is still accepting riders
  IF v_pool.status NOT IN ('matched', 'driver_arrived') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pool is no longer accepting riders');
  END IF;

  -- Check capacity
  IF (v_pool.occupied_seats + p_seats_needed) > v_pool.max_capacity THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Not enough seats available',
      'available', v_pool.max_capacity - v_pool.occupied_seats,
      'requested', p_seats_needed
    );
  END IF;

  -- Calculate next seat number
  v_next_seat := v_pool.occupied_seats + 1;

  -- Insert pool member
  INSERT INTO pool_members (pool_id, ride_request_id, seat_number, status)
  VALUES (p_pool_id, p_ride_request_id, v_next_seat, 'matched')
  RETURNING id INTO v_member_id;

  -- Increment occupied seats
  UPDATE pools
  SET occupied_seats = occupied_seats + p_seats_needed,
      updated_at = now()
  WHERE id = p_pool_id;

  -- Update ride request status to matched
  UPDATE ride_requests
  SET status = 'matched',
      is_pooled = (v_pool.occupied_seats > 0),  -- pooled if someone else is already there
      matched_at = now(),
      updated_at = now()
  WHERE id = p_ride_request_id;

  -- Log the event
  INSERT INTO ride_events (ride_request_id, pool_id, event_type, to_status, metadata)
  VALUES (
    p_ride_request_id, p_pool_id, 'seat_claimed', 'matched',
    jsonb_build_object('seat_number', v_next_seat, 'seats_after', v_pool.occupied_seats + p_seats_needed)
  );

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'seat_number', v_next_seat,
    'occupied_seats', v_pool.occupied_seats + p_seats_needed,
    'max_capacity', v_pool.max_capacity
  );
END;
$$;

-- ============================================================
-- FUNCTION: transition_ride_status
-- Purpose: Enforce valid state transitions for ride requests
-- Returns error if transition is not allowed
-- ============================================================
CREATE OR REPLACE FUNCTION transition_ride_status(
  p_ride_id UUID,
  p_new_status ride_status,
  p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_ride RECORD;
  v_valid BOOLEAN := false;
BEGIN
  SELECT id, status INTO v_ride
  FROM ride_requests
  WHERE id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;

  -- Valid transition lookup
  -- requested -> matched, cancelled
  -- matched -> driver_arrived, cancelled
  -- driver_arrived -> started, cancelled
  -- started -> completed, cancelled
  -- completed -> (terminal)
  -- cancelled -> (terminal)
  v_valid := CASE v_ride.status
    WHEN 'requested' THEN p_new_status IN ('matched', 'cancelled')
    WHEN 'matched' THEN p_new_status IN ('driver_arrived', 'cancelled')
    WHEN 'driver_arrived' THEN p_new_status IN ('started', 'cancelled')
    WHEN 'started' THEN p_new_status IN ('completed', 'cancelled')
    ELSE false  -- completed and cancelled are terminal
  END;

  IF NOT v_valid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid transition: %s → %s', v_ride.status, p_new_status),
      'current_status', v_ride.status,
      'requested_status', p_new_status
    );
  END IF;

  -- Apply transition
  UPDATE ride_requests
  SET status = p_new_status,
      completed_at = CASE WHEN p_new_status = 'completed' THEN now() ELSE completed_at END,
      cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
      updated_at = now()
  WHERE id = p_ride_id;

  -- Log event
  INSERT INTO ride_events (ride_request_id, event_type, from_status, to_status, actor_id)
  VALUES (p_ride_id, 'status_change', v_ride.status, p_new_status, p_actor_id);

  RETURN jsonb_build_object(
    'success', true,
    'from_status', v_ride.status,
    'to_status', p_new_status
  );
END;
$$;

-- ============================================================
-- FUNCTION: get_area_distance
-- Purpose: Look up precomputed distance between two areas
-- ============================================================
CREATE OR REPLACE FUNCTION get_area_distance(
  p_from_area_id UUID,
  p_to_area_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_distance NUMERIC;
BEGIN
  SELECT distance_km INTO v_distance
  FROM area_distances
  WHERE from_area_id = p_from_area_id AND to_area_id = p_to_area_id;

  IF NOT FOUND THEN
    -- Try reverse direction
    SELECT distance_km INTO v_distance
    FROM area_distances
    WHERE from_area_id = p_to_area_id AND to_area_id = p_from_area_id;
  END IF;

  RETURN COALESCE(v_distance, 5.0);  -- Default 5km if not found
END;
$$;


-- ==========================================
-- FILE: 010_seed_data.sql
-- ==========================================
-- 010_seed_data.sql
-- Story cast seed data: Jashim, Nusrat, Rafiq, Shirin + Dhaka areas
-- These are the characters from the PRD used throughout demo, tests, and README

-- ============================================================
-- AREAS: Predefined Dhaka zones
-- ============================================================
INSERT INTO areas (id, name, lat, lng) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Banani', 23.7937, 90.4066),
  ('a1000000-0000-0000-0000-000000000002', 'Gulshan 1', 23.7808, 90.4169),
  ('a1000000-0000-0000-0000-000000000003', 'Mohakhali', 23.7781, 90.4040),
  ('a1000000-0000-0000-0000-000000000004', 'Dhanmondi', 23.7461, 90.3742),
  ('a1000000-0000-0000-0000-000000000005', 'Mirpur', 23.8041, 90.3663),
  ('a1000000-0000-0000-0000-000000000006', 'Uttara', 23.8759, 90.3795),
  ('a1000000-0000-0000-0000-000000000007', 'Farmgate', 23.7573, 90.3870),
  ('a1000000-0000-0000-0000-000000000008', 'Bashundhara', 23.8133, 90.4255);

-- ============================================================
-- AREA DISTANCES: Precomputed distances in km
-- Based on approximate road distances in Dhaka
-- ============================================================
INSERT INTO area_distances (from_area_id, to_area_id, distance_km) VALUES
  -- From Banani
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 2.0),   -- Banani → Gulshan 1
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 3.2),   -- Banani → Mohakhali
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 8.5),   -- Banani → Dhanmondi
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 7.0),   -- Banani → Mirpur
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 10.5),  -- Banani → Uttara
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 5.0),   -- Banani → Farmgate
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000008', 4.5),   -- Banani → Bashundhara
  -- From Gulshan 1
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 2.5),   -- Gulshan 1 → Mohakhali
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 9.0),   -- Gulshan 1 → Dhanmondi
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 8.5),   -- Gulshan 1 → Mirpur
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', 11.0),  -- Gulshan 1 → Uttara
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', 6.0),   -- Gulshan 1 → Farmgate
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000008', 5.0),   -- Gulshan 1 → Bashundhara
  -- From Mohakhali
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 7.0),   -- Mohakhali → Dhanmondi
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 6.5),   -- Mohakhali → Mirpur
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', 9.5),   -- Mohakhali → Uttara
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', 3.5),   -- Mohakhali → Farmgate
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000008', 6.0),   -- Mohakhali → Bashundhara
  -- From Dhanmondi
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005', 5.5),   -- Dhanmondi → Mirpur
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 14.0),  -- Dhanmondi → Uttara
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', 3.0),   -- Dhanmondi → Farmgate
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000008', 11.0),  -- Dhanmondi → Bashundhara
  -- From Mirpur
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006', 6.0),   -- Mirpur → Uttara
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 5.0),   -- Mirpur → Farmgate
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000008', 8.0),   -- Mirpur → Bashundhara
  -- From Uttara
  ('a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000007', 12.0),  -- Uttara → Farmgate
  ('a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 8.5),   -- Uttara → Bashundhara
  -- From Farmgate
  ('a1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000008', 7.5);   -- Farmgate → Bashundhara

-- ============================================================
-- USERS: Story cast
-- ============================================================

-- Driver: Jashim Uddin
INSERT INTO users (id, name, phone, role, driver_status, tesla_pay_balance_poysha, rating_avg) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Jashim Uddin', '+8801912345678', 'driver', 'online', 500000, 4.90);

-- Passengers
INSERT INTO users (id, name, phone, role, tesla_pay_balance_poysha, rating_avg) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Nusrat Jahan', '+8801712892401', 'passenger', 42000, 4.80),
  ('p1000000-0000-0000-0000-000000000002', 'Rafiq Ahmed', '+8801812345678', 'passenger', 35000, 4.70),
  ('p1000000-0000-0000-0000-000000000003', 'Shirin Akter', '+8801612345678', 'passenger', 28000, 4.60);

-- ============================================================
-- VEHICLE: Bullet - Jashim's 3-seat battery Tesla
-- ============================================================
INSERT INTO vehicles (id, name, owner_id, capacity, battery_pct, plate_number, vehicle_type) VALUES
  ('v1000000-0000-0000-0000-000000000001', 'Bullet', 'd1000000-0000-0000-0000-000000000001', 3, 86, 'DH-Metro-TH-14-8821', 'e-trike');


