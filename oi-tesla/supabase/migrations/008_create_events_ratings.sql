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
