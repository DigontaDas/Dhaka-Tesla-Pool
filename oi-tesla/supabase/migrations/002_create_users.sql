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
