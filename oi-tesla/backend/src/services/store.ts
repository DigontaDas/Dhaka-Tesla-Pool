// Oi Tesla - Data Access & State Store
// Provides unified storage with strict concurrency serialization,
// capacity checks, and state transition validation.

import {
  User,
  Vehicle,
  Area,
  RideRequest,
  Pool,
  PoolMember,
  FareRecord,
  Payment,
  RideEvent,
  Rating,
  RideStatus,
  PaymentMethod,
  FareBreakdown,
} from '../types/index.js';
import {
  DHAKA_AREAS,
  DHAKA_DISTANCES,
  STORY_IDS,
  VEHICLE_CONFIG,
  FARE_CONFIG,
} from '../config/constants.js';
import { FareCalculator } from '../utils/fareCalculator.js';

export class Store {
  private users: Map<string, User> = new Map();
  private vehicles: Map<string, Vehicle> = new Map();
  private areas: Map<string, Area> = new Map();
  private rideRequests: Map<string, RideRequest> = new Map();
  private pools: Map<string, Pool> = new Map();
  private poolMembers: Map<string, PoolMember> = new Map();
  private fares: Map<string, FareRecord> = new Map();
  private payments: Map<string, Payment> = new Map();
  private events: RideEvent[] = [];
  private ratings: Rating[] = [];

  // Lock queue for concurrency serialization on pools (simulates SELECT FOR UPDATE)
  private poolLocks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.seed();
  }

  /**
   * Populate story cast and Dhaka areas
   */
  public seed(): void {
    this.users.clear();
    this.vehicles.clear();
    this.areas.clear();
    this.rideRequests.clear();
    this.pools.clear();
    this.poolMembers.clear();
    this.fares.clear();
    this.payments.clear();
    this.events = [];
    this.ratings = [];

    // Seed Areas
    for (const a of DHAKA_AREAS) {
      this.areas.set(a.id, { ...a });
    }

    // Seed Driver Jashim
    const jashim: User = {
      id: STORY_IDS.DRIVER_JASHIM,
      name: 'Jashim Uddin',
      phone: '+8801912345678',
      role: 'driver',
      driver_status: 'online',
      tesla_pay_balance_poysha: 500000, // ৳5000.00
      rating_avg: 4.9,
      total_rides: 1420,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(jashim.id, jashim);

    // Seed Vehicle: Bullet (3 seats, 86% battery)
    const bullet: Vehicle = {
      id: STORY_IDS.VEHICLE_BULLET,
      name: 'Bullet',
      owner_id: jashim.id,
      capacity: VEHICLE_CONFIG.DEFAULT_CAPACITY, // 3 seats
      battery_pct: 86,
      plate_number: 'DH-Metro-TH-14-8821',
      vehicle_type: 'e-trike',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.vehicles.set(bullet.id, bullet);

    // Seed Passengers
    const nusrat: User = {
      id: STORY_IDS.PASSENGER_NUSRAT,
      name: 'Nusrat Jahan',
      phone: '+8801712892401',
      role: 'passenger',
      tesla_pay_balance_poysha: 42000, // ৳420.00
      rating_avg: 4.8,
      total_rides: 38,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(nusrat.id, nusrat);

    const rafiq: User = {
      id: STORY_IDS.PASSENGER_RAFIQ,
      name: 'Rafiq Ahmed',
      phone: '+8801812345678',
      role: 'passenger',
      tesla_pay_balance_poysha: 35000, // ৳350.00
      rating_avg: 4.7,
      total_rides: 24,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(rafiq.id, rafiq);

    const shirin: User = {
      id: STORY_IDS.PASSENGER_SHIRIN,
      name: 'Shirin Akter',
      phone: '+8801612345678',
      role: 'passenger',
      tesla_pay_balance_poysha: 28000, // ৳280.00
      rating_avg: 4.6,
      total_rides: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.users.set(shirin.id, shirin);

    // Seed 2 realistic pending requests from passengers at Banani Stand
    this.createRideRequest({
      passenger_id: nusrat.id,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
      seats_needed: 1,
      payment_method: 'cash',
    });

    this.createRideRequest({
      passenger_id: rafiq.id,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_GULSHAN_1,
      seats_needed: 1,
      payment_method: 'tesla_pay',
    });
  }

  // --- Users ---
  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByPhone(phone: string): User | undefined {
    // Normalize phone search (e.g. handle +880 or without)
    for (const u of this.users.values()) {
      if (u.phone === phone || u.phone.endsWith(phone.replace(/\D/g, ''))) {
        return u;
      }
    }
    return undefined;
  }

  public createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const id = `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id,
      created_at: now,
      updated_at: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updated = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // --- Areas ---
  public getAreas(): Area[] {
    return Array.from(this.areas.values());
  }

  public getAreaById(id: string): Area | undefined {
    return this.areas.get(id);
  }

  // --- Vehicles ---
  public getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  public getVehicleByOwnerId(ownerId: string): Vehicle | undefined {
    for (const v of this.vehicles.values()) {
      if (v.owner_id === ownerId && v.is_active) {
        return v;
      }
    }
    return undefined;
  }

  // --- Ride Requests ---
  public createRideRequest(input: {
    passenger_id: string;
    pickup_area_id: string;
    destination_area_id: string;
    seats_needed?: number;
    payment_method?: PaymentMethod;
  }): RideRequest {
    if (input.pickup_area_id === input.destination_area_id) {
      throw new Error('Pickup and destination areas cannot be the same');
    }

    const passenger = this.getUserById(input.passenger_id);
    if (!passenger) throw new Error('Passenger not found');

    const seatsNeeded = input.seats_needed || 1;
    if (seatsNeeded < 1 || seatsNeeded > VEHICLE_CONFIG.DEFAULT_CAPACITY) {
      throw new Error(`Seats needed must be between 1 and ${VEHICLE_CONFIG.DEFAULT_CAPACITY}`);
    }

    const distanceKm = FareCalculator.getDistanceKm(input.pickup_area_id, input.destination_area_id);
    // Initial estimated fare calculated with pooling discount assumed
    const estimatedFare = FareCalculator.calculateFare(distanceKm, true);

    const id = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const ride: RideRequest = {
      id,
      passenger_id: input.passenger_id,
      pickup_area_id: input.pickup_area_id,
      destination_area_id: input.destination_area_id,
      seats_needed: seatsNeeded,
      status: 'requested',
      payment_method: input.payment_method || 'cash',
      estimated_fare_poysha: estimatedFare.total_fare_poysha,
      is_pooled: false,
      requested_at: now,
      created_at: now,
      updated_at: now,
    };

    this.rideRequests.set(id, ride);
    this.logEvent(id, undefined, 'ride_requested', undefined, 'requested', input.passenger_id);

    return this.enrichRideRequest(ride);
  }

  public getRideById(id: string): RideRequest | undefined {
    const ride = this.rideRequests.get(id);
    return ride ? this.enrichRideRequest(ride) : undefined;
  }

  public getRidesByPassengerId(passengerId: string): RideRequest[] {
    const rides: RideRequest[] = [];
    for (const r of this.rideRequests.values()) {
      if (r.passenger_id === passengerId) {
        rides.push(this.enrichRideRequest(r));
      }
    }
    return rides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPendingRideRequests(excludeUserId?: string): RideRequest[] {
    const rides: RideRequest[] = [];
    for (const r of this.rideRequests.values()) {
      if (r.status === 'requested') {
        if (!excludeUserId || r.passenger_id !== excludeUserId) {
          rides.push(this.enrichRideRequest(r));
        }
      }
    }
    return rides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOnlineDriversWithCapacity(seatsNeeded: number = 1): User[] {
    const availableDrivers: User[] = [];
    for (const user of this.users.values()) {
      if (user.role === 'driver' && (user.driver_status === 'online' || !user.driver_status)) {
        const vehicle = this.getVehicleByOwnerId(user.id);
        if (!vehicle || !vehicle.is_active) continue;

        const activePool = this.getActivePoolForDriver(user.id);
        if (!activePool) {
          if (vehicle.capacity >= seatsNeeded) {
            availableDrivers.push(user);
          }
        } else if (activePool.status === 'matched' || activePool.status === 'driver_arrived') {
          if (activePool.max_capacity - activePool.occupied_seats >= seatsNeeded) {
            availableDrivers.push(user);
          }
        }
      }
    }
    return availableDrivers;
  }

  public getAvailableDriversSummary() {
    const list: any[] = [];
    for (const user of this.users.values()) {
      if (user.role === 'driver' && (user.driver_status === 'online' || !user.driver_status)) {
        const vehicle = this.getVehicleByOwnerId(user.id);
        const pool = this.getActivePoolForDriver(user.id);
        const occupied = pool?.occupied_seats || 0;
        const totalSeats = vehicle?.capacity || 3;
        list.push({
          id: user.id,
          name: user.name,
          phone: user.phone,
          rating_avg: user.rating_avg,
          total_rides: user.total_rides,
          driver_status: user.driver_status || 'online',
          vehicle: vehicle
            ? {
                id: vehicle.id,
                name: vehicle.name,
                plate_number: vehicle.plate_number,
                battery_pct: vehicle.battery_pct,
                capacity: vehicle.capacity,
              }
            : null,
          available_seats: totalSeats - occupied,
          stand_name: 'Banani Road 11 Stand',
          stand_name_bn: 'বনানী ১১ নং রোড স্ট্যান্ড',
        });
      }
    }
    return list;
  }

  /**
   * State Machine validation for Ride Requests:
   * REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
   * Any active state can transition to CANCELLED.
   * COMPLETED and CANCELLED are terminal states.
   */
  public transitionRideStatus(rideId: string, newStatus: RideStatus, actorId: string): RideRequest {
    const ride = this.rideRequests.get(rideId);
    if (!ride) throw new Error('Ride request not found');

    const currentStatus = ride.status;
    let isValid = false;

    switch (currentStatus) {
      case 'requested':
        isValid = newStatus === 'matched' || newStatus === 'cancelled';
        break;
      case 'matched':
        isValid = newStatus === 'driver_arrived' || newStatus === 'cancelled';
        break;
      case 'driver_arrived':
        isValid = newStatus === 'started' || newStatus === 'cancelled';
        break;
      case 'started':
        isValid = newStatus === 'completed' || newStatus === 'cancelled';
        break;
      case 'completed':
      case 'cancelled':
        isValid = false; // Terminal states
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      throw new Error(`Invalid state transition: ${currentStatus} → ${newStatus}`);
    }

    const now = new Date().toISOString();
    const updated: RideRequest = {
      ...ride,
      status: newStatus,
      matched_at: newStatus === 'matched' ? now : ride.matched_at,
      completed_at: newStatus === 'completed' ? now : ride.completed_at,
      cancelled_at: newStatus === 'cancelled' ? now : ride.cancelled_at,
      updated_at: now,
    };

    this.rideRequests.set(rideId, updated);
    this.logEvent(rideId, undefined, 'status_change', currentStatus, newStatus, actorId);

    return this.enrichRideRequest(updated);
  }

  public cancelRide(rideId: string, userId: string, reason?: string): RideRequest {
    const ride = this.rideRequests.get(rideId);
    if (!ride) throw new Error('Ride request not found');

    // Authorization check: only passenger or driver can cancel
    if (ride.passenger_id !== userId) {
      // Check if user is the driver of the pool
      const poolMember = Array.from(this.poolMembers.values()).find(m => m.ride_request_id === rideId);
      if (poolMember) {
        const pool = this.pools.get(poolMember.pool_id);
        if (!pool || pool.driver_id !== userId) {
          throw new Error('Unauthorized to cancel this ride');
        }
      } else {
        throw new Error('Unauthorized to cancel this ride');
      }
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      throw new Error(`Cannot cancel ride in ${ride.status} state`);
    }

    const updated = this.transitionRideStatus(rideId, 'cancelled', userId);
    updated.cancellation_reason = reason || 'Cancelled by user';
    this.rideRequests.set(rideId, updated);

    // If ride was in a pool, free up occupied seats
    const poolMember = Array.from(this.poolMembers.values()).find(m => m.ride_request_id === rideId);
    if (poolMember) {
      const pool = this.pools.get(poolMember.pool_id);
      if (pool && pool.occupied_seats > 0) {
        pool.occupied_seats = Math.max(0, pool.occupied_seats - ride.seats_needed);
        pool.updated_at = new Date().toISOString();
        this.pools.set(pool.id, pool);
        poolMember.status = 'cancelled';
        this.poolMembers.set(poolMember.id, poolMember);
      }
    }

    return this.enrichRideRequest(updated);
  }

  // --- Pools & Concurrency Management ---

  public createPool(driverId: string, vehicleId: string): Pool {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const id = `pool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const pool: Pool = {
      id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      status: 'matched',
      occupied_seats: 0,
      max_capacity: vehicle.capacity,
      created_at: now,
      updated_at: now,
    };

    this.pools.set(id, pool);
    return pool;
  }

  public getPoolById(id: string): Pool | undefined {
    const pool = this.pools.get(id);
    return pool ? this.enrichPool(pool) : undefined;
  }

  public getActivePoolForDriver(driverId: string): Pool | undefined {
    for (const p of this.pools.values()) {
      if (p.driver_id === driverId && p.status !== 'completed' && p.status !== 'cancelled') {
        return this.enrichPool(p);
      }
    }
    return undefined;
  }

  /**
   * Concurrency-safe seat claiming with mutex queue serialization.
   * Simulates PostgreSQL SELECT ... FOR UPDATE row-level locking.
   * Prevents two concurrent requests from exceeding vehicle capacity.
   */
  public async claimPoolSeat(
    poolId: string,
    rideRequestId: string,
    seatsNeeded: number = 1
  ): Promise<{ success: boolean; pool: Pool; seatNumber: number }> {
    // Acquire pool-specific lock
    const prevLock = this.poolLocks.get(poolId) || Promise.resolve();
    let releaseLock: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.poolLocks.set(poolId, nextLock);

    await prevLock; // Wait for any existing transaction on this pool to finish

    try {
      const pool = this.pools.get(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      if (pool.status !== 'matched' && pool.status !== 'driver_arrived') {
        throw new Error('Pool is no longer accepting passengers');
      }

      // Strict capacity check: Bullet's seats cannot be exceeded
      if (pool.occupied_seats + seatsNeeded > pool.max_capacity) {
        throw new Error(
          `Capacity exceeded! Requested: ${seatsNeeded}, Available: ${
            pool.max_capacity - pool.occupied_seats
          }`
        );
      }

      const ride = this.rideRequests.get(rideRequestId);
      if (!ride) {
        throw new Error('Ride request not found');
      }

      const nextSeatNumber = pool.occupied_seats + 1;
      const now = new Date().toISOString();

      // Create Pool Member
      const memberId = `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const member: PoolMember = {
        id: memberId,
        pool_id: poolId,
        ride_request_id: rideRequestId,
        seat_number: nextSeatNumber,
        status: 'matched',
        created_at: now,
        updated_at: now,
      };
      this.poolMembers.set(memberId, member);

      // Increment occupied seats
      pool.occupied_seats += seatsNeeded;
      pool.updated_at = now;
      this.pools.set(poolId, pool);

      // Mark ride request as matched
      const isPooled = pool.occupied_seats > 1;
      ride.status = 'matched';
      ride.is_pooled = isPooled;
      ride.matched_at = now;
      ride.updated_at = now;

      // Re-calculate final fare based on pooled status
      const distanceKm = FareCalculator.getDistanceKm(ride.pickup_area_id, ride.destination_area_id);
      const fareBreakdown = FareCalculator.calculateFare(distanceKm, isPooled);
      ride.final_fare_poysha = fareBreakdown.total_fare_poysha;
      this.rideRequests.set(rideRequestId, ride);

      // Save Fare Record
      const fareId = `fare-${rideRequestId}`;
      const fareRecord: FareRecord = {
        id: fareId,
        ride_request_id: rideRequestId,
        ...fareBreakdown,
        created_at: now,
      };
      this.fares.set(fareId, fareRecord);

      // If pool now has multiple members, also update existing members' fares to pooled discount!
      if (isPooled) {
        for (const m of this.poolMembers.values()) {
          if (m.pool_id === poolId && m.ride_request_id !== rideRequestId) {
            const existingRide = this.rideRequests.get(m.ride_request_id);
            if (existingRide && !existingRide.is_pooled) {
              existingRide.is_pooled = true;
              const dist = FareCalculator.getDistanceKm(
                existingRide.pickup_area_id,
                existingRide.destination_area_id
              );
              const recalculated = FareCalculator.calculateFare(dist, true);
              existingRide.final_fare_poysha = recalculated.total_fare_poysha;
              existingRide.updated_at = now;
              this.rideRequests.set(existingRide.id, existingRide);

              const existingFare = this.fares.get(`fare-${existingRide.id}`);
              if (existingFare) {
                this.fares.set(`fare-${existingRide.id}`, {
                  ...existingFare,
                  ...recalculated,
                });
              }
            }
          }
        }
      }

      this.logEvent(
        rideRequestId,
        poolId,
        'seat_claimed',
        'requested',
        'matched',
        ride.passenger_id,
        { seat_number: nextSeatNumber, occupied_seats: pool.occupied_seats }
      );

      return {
        success: true,
        pool: this.enrichPool(pool),
        seatNumber: nextSeatNumber,
      };
    } finally {
      releaseLock();
    }
  }

  // --- Driver Actions ---
  public markDriverArrived(poolId: string, driverId: string): Pool {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    if (pool.driver_id !== driverId) throw new Error('Unauthorized');

    pool.status = 'driver_arrived';
    pool.updated_at = new Date().toISOString();
    this.pools.set(poolId, pool);

    // Update all members and ride requests
    for (const m of this.poolMembers.values()) {
      if (m.pool_id === poolId && m.status === 'matched') {
        m.status = 'driver_arrived';
        this.poolMembers.set(m.id, m);
        const r = this.rideRequests.get(m.ride_request_id);
        if (r && r.status === 'matched') {
          this.transitionRideStatus(r.id, 'driver_arrived', driverId);
        }
      }
    }

    return this.enrichPool(pool);
  }

  public startTrip(poolId: string, driverId: string): Pool {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    if (pool.driver_id !== driverId) throw new Error('Unauthorized');

    const now = new Date().toISOString();
    pool.status = 'started';
    pool.started_at = now;
    pool.updated_at = now;
    this.pools.set(poolId, pool);

    for (const m of this.poolMembers.values()) {
      if (m.pool_id === poolId && (m.status === 'driver_arrived' || m.status === 'matched')) {
        m.status = 'started';
        m.picked_up_at = now;
        this.poolMembers.set(m.id, m);
        const r = this.rideRequests.get(m.ride_request_id);
        if (r && (r.status === 'driver_arrived' || r.status === 'matched')) {
          this.transitionRideStatus(r.id, 'started', driverId);
        }
      }
    }

    return this.enrichPool(pool);
  }

  public completeTrip(poolId: string, driverId: string): Pool {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    if (pool.driver_id !== driverId) throw new Error('Unauthorized');

    const now = new Date().toISOString();
    pool.status = 'completed';
    pool.completed_at = now;
    pool.updated_at = now;
    this.pools.set(poolId, pool);

    for (const m of this.poolMembers.values()) {
      if (m.pool_id === poolId && m.status !== 'cancelled' && m.status !== 'completed') {
        m.status = 'completed';
        m.dropped_off_at = now;
        this.poolMembers.set(m.id, m);
        const r = this.rideRequests.get(m.ride_request_id);
        if (r && r.status !== 'completed' && r.status !== 'cancelled') {
          this.transitionRideStatus(r.id, 'completed', driverId);
        }
      }
    }

    return this.enrichPool(pool);
  }

  // --- Ratings ---
  public addRating(rating: Omit<Rating, 'id' | 'created_at'>): Rating {
    const ride = this.rideRequests.get(rating.ride_request_id);
    if (!ride) throw new Error('Ride request not found');
    if (ride.status !== 'completed') throw new Error('Cannot rate incomplete ride');

    const id = `rate-${Date.now()}`;
    const newRating: Rating = {
      ...rating,
      id,
      created_at: new Date().toISOString(),
    };
    this.ratings.push(newRating);

    // Update target user average rating
    const toUser = this.users.get(rating.to_user_id);
    if (toUser) {
      const userRatings = this.ratings.filter(r => r.to_user_id === rating.to_user_id);
      const avg = userRatings.reduce((sum, r) => sum + r.score, 0) / userRatings.length;
      toUser.rating_avg = Math.round(avg * 10) / 10;
      this.users.set(toUser.id, toUser);
    }

    return newRating;
  }

  // --- Helpers & Audit ---
  private logEvent(
    rideRequestId?: string,
    poolId?: string,
    eventType: string = 'info',
    fromStatus?: RideStatus,
    toStatus?: RideStatus,
    actorId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.events.push({
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ride_request_id: rideRequestId,
      pool_id: poolId,
      event_type: eventType,
      from_status: fromStatus,
      to_status: toStatus,
      actor_id: actorId,
      metadata,
      created_at: new Date().toISOString(),
    });
  }

  public getEvents(rideRequestId?: string): RideEvent[] {
    if (!rideRequestId) return [...this.events];
    return this.events.filter(e => e.ride_request_id === rideRequestId);
  }

  public getFareRecord(rideRequestId: string): FareRecord | undefined {
    return this.fares.get(`fare-${rideRequestId}`);
  }

  private enrichRideRequest(ride: RideRequest): RideRequest {
    const passenger = this.users.get(ride.passenger_id);
    const pickup_area = this.areas.get(ride.pickup_area_id);
    const destination_area = this.areas.get(ride.destination_area_id);

    // Find pool info if any
    let pool_id: string | undefined;
    let seat_number: number | undefined;

    for (const m of this.poolMembers.values()) {
      if (m.ride_request_id === ride.id) {
        pool_id = m.pool_id;
        seat_number = m.seat_number;
        break;
      }
    }

    let driver: User | undefined;
    let vehicle: Vehicle | undefined;

    if (pool_id) {
      const pool = this.pools.get(pool_id);
      if (pool) {
        driver = this.users.get(pool.driver_id);
        vehicle = this.vehicles.get(pool.vehicle_id);
      }
    }

    return {
      ...ride,
      passenger,
      pickup_area,
      destination_area,
      pool_id,
      seat_number,
      driver,
      vehicle,
    };
  }

  private enrichPool(pool: Pool): Pool {
    const vehicle = this.vehicles.get(pool.vehicle_id);
    const driver = this.users.get(pool.driver_id);
    const members: PoolMember[] = [];

    for (const m of this.poolMembers.values()) {
      if (m.pool_id === pool.id) {
        const ride = this.rideRequests.get(m.ride_request_id);
        members.push({
          ...m,
          ride_request: ride ? this.enrichRideRequest(ride) : undefined,
        });
      }
    }

    return {
      ...pool,
      vehicle,
      driver,
      members,
    };
  }
}

// Global Singleton Store Instance
export const store = new Store();
