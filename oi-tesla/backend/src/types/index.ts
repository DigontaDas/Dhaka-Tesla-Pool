// Oi Tesla - Core Domain Types & Interfaces
// Compliant with PRD Section 3 (Actors & Lifecycle), Section 5 (Fare Model), Section 12 (Concurrency)

export type UserRole = 'passenger' | 'driver';

export type RideStatus =
  | 'requested'
  | 'matched'
  | 'driver_arrived'
  | 'started'
  | 'completed'
  | 'cancelled';

export type DriverStatus = 'online' | 'offline' | 'on_trip';

export type PaymentMethod = 'cash' | 'tesla_pay';

export type PaymentStatus = 'pending' | 'completed' | 'refunded';

export interface User {
  id: string;
  auth_id?: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  driver_status?: DriverStatus;
  tesla_pay_balance_poysha: number; // Integer (1 BDT = 100 poysha)
  rating_avg: number;
  total_rides: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  name: string; // e.g. "Bullet"
  owner_id: string;
  capacity: number; // 3 for Bullet
  battery_pct: number;
  plate_number: string;
  vehicle_type: string; // "e-trike"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  name: string; // "Banani", "Mohakhali", "Gulshan 1", etc.
  lat: number;
  lng: number;
  created_at: string;
}

export interface AreaDistance {
  id: string;
  from_area_id: string;
  to_area_id: string;
  distance_km: number;
}

export interface RideRequest {
  id: string;
  passenger_id: string;
  pickup_area_id: string;
  destination_area_id: string;
  seats_needed: number;
  status: RideStatus;
  payment_method: PaymentMethod;
  estimated_fare_poysha: number;
  final_fare_poysha?: number;
  is_pooled: boolean;
  requested_at: string;
  matched_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  passenger?: User;
  pickup_area?: Area;
  destination_area?: Area;
  pool_id?: string;
  seat_number?: number;
  driver?: User;
  vehicle?: Vehicle;
}

export interface Pool {
  id: string;
  vehicle_id: string;
  driver_id: string;
  status: RideStatus;
  occupied_seats: number;
  max_capacity: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  vehicle?: Vehicle;
  driver?: User;
  members?: PoolMember[];
}

export interface PoolMember {
  id: string;
  pool_id: string;
  ride_request_id: string;
  seat_number: number;
  status: RideStatus;
  picked_up_at?: string;
  dropped_off_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  ride_request?: RideRequest;
}

export interface FareBreakdown {
  base_fare_poysha: number;       // e.g. 3000 (৳30)
  distance_km: number;            // e.g. 3.2
  distance_charge_poysha: number; // e.g. 3200 (৳10/km)
  subtotal_poysha: number;        // e.g. 6200
  pool_discount_poysha: number;   // e.g. 1860 (30% discount)
  total_fare_poysha: number;      // e.g. 4340 (৳43.40)
  is_pooled: boolean;
}

export interface FareRecord extends FareBreakdown {
  id: string;
  ride_request_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  ride_request_id: string;
  passenger_id: string;
  driver_id: string;
  amount_poysha: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at?: string;
  created_at: string;
}

export interface RideEvent {
  id: string;
  ride_request_id?: string;
  pool_id?: string;
  event_type: string;
  from_status?: RideStatus;
  to_status?: RideStatus;
  actor_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Rating {
  id: string;
  ride_request_id: string;
  from_user_id: string;
  to_user_id: string;
  score: number; // 1-5
  comment?: string;
  created_at: string;
}

// DTOs & API Contracts
export interface FareEstimateRequest {
  pickup_area_id: string;
  destination_area_id: string;
  seats_needed?: number;
}

export interface FareEstimateResponse {
  pickup_area: Area;
  destination_area: Area;
  distance_km: number;
  solo_fare: FareBreakdown;
  pooled_fare: FareBreakdown;
  savings_poysha: number;
  savings_bdt: number;
}

export interface CreateRideRequestInput {
  passenger_id: string;
  pickup_area_id: string;
  destination_area_id: string;
  seats_needed?: number;
  payment_method?: PaymentMethod;
}
