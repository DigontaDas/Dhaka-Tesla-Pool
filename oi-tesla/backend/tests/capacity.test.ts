import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../src/services/store.js';
import { STORY_IDS } from '../src/config/constants.js';

describe('PRD Section 3 & 12: Vehicle Capacity Enforcement', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  it("enforces that Bullet's capacity (3 seats) can never be exceeded", async () => {
    const bullet = store.getVehicleById(STORY_IDS.VEHICLE_BULLET);
    expect(bullet).toBeDefined();
    expect(bullet!.capacity).toBe(3);

    // Create pool for driver Jashim
    const pool = store.createPool(STORY_IDS.DRIVER_JASHIM, bullet!.id);
    expect(pool.occupied_seats).toBe(0);
    expect(pool.max_capacity).toBe(3);

    // Nusrat requests 1 seat
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
      seats_needed: 1,
    });

    // Rafiq requests 1 seat
    const rafiqRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_RAFIQ,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_GULSHAN_1,
      seats_needed: 1,
    });

    // Shirin requests 1 seat
    const shirinRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_SHIRIN,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
      seats_needed: 1,
    });

    // Claim 1: Nusrat claims seat 1
    const claim1 = await store.claimPoolSeat(pool.id, nusratRide.id, 1);
    expect(claim1.seatNumber).toBe(1);
    expect(claim1.pool.occupied_seats).toBe(1);

    // Claim 2: Rafiq claims seat 2
    const claim2 = await store.claimPoolSeat(pool.id, rafiqRide.id, 1);
    expect(claim2.seatNumber).toBe(2);
    expect(claim2.pool.occupied_seats).toBe(2);

    // Claim 3: Shirin claims seat 3
    const claim3 = await store.claimPoolSeat(pool.id, shirinRide.id, 1);
    expect(claim3.seatNumber).toBe(3);
    expect(claim3.pool.occupied_seats).toBe(3);

    // 4th passenger tries to request and claim a seat in Bullet
    const fourthPassenger = store.createUser({
      name: 'Tanvir Hossain',
      phone: '+8801512345678',
      role: 'passenger',
      tesla_pay_balance_poysha: 50000,
      rating_avg: 5.0,
      total_rides: 0,
    });

    const fourthRide = store.createRideRequest({
      passenger_id: fourthPassenger.id,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_DHANMONDI,
      seats_needed: 1,
    });

    // Expect claim to reject because Bullet is completely full (3/3)
    await expect(
      store.claimPoolSeat(pool.id, fourthRide.id, 1)
    ).rejects.toThrow(/Capacity exceeded/);

    // Verify occupied seats remains exactly 3
    const currentPool = store.getPoolById(pool.id);
    expect(currentPool!.occupied_seats).toBe(3);
    expect(currentPool!.occupied_seats).toBeLessThanOrEqual(currentPool!.max_capacity);
  });

  it('rejects a booking if requested seats exceed remaining capacity', async () => {
    const bullet = store.getVehicleById(STORY_IDS.VEHICLE_BULLET)!;
    const pool = store.createPool(STORY_IDS.DRIVER_JASHIM, bullet.id);

    // Nusrat claims 2 seats
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
      seats_needed: 2,
    });
    await store.claimPoolSeat(pool.id, nusratRide.id, 2);

    // Rafiq tries to claim 2 seats when only 1 is left
    const rafiqRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_RAFIQ,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_GULSHAN_1,
      seats_needed: 2,
    });

    await expect(
      store.claimPoolSeat(pool.id, rafiqRide.id, 2)
    ).rejects.toThrow(/Capacity exceeded/);

    const poolAfter = store.getPoolById(pool.id);
    expect(poolAfter!.occupied_seats).toBe(2);
  });
});
