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
