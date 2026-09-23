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
