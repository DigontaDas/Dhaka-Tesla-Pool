import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../src/services/store.js';
import { STORY_IDS } from '../src/config/constants.js';

describe('PRD Section 12: Concurrency Race Condition Control', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  it('handles race condition when Bullet has 1 seat left and two passengers claim it simultaneously', async () => {
    // SCENARIO:
    // Bullet has 3 seats max.
    // Rafiq already holds 2 seats.
    // Exactly 1 seat remains available.
    // Nusrat and Shirin BOTH send concurrent seat claim requests at the exact same millisecond.
    const bullet = store.getVehicleById(STORY_IDS.VEHICLE_BULLET)!;
    const pool = store.createPool(STORY_IDS.DRIVER_JASHIM, bullet.id);

    // Rafiq claims 2 seats first
    const rafiqRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_RAFIQ,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_GULSHAN_1,
      seats_needed: 2,
    });
    await store.claimPoolSeat(pool.id, rafiqRide.id, 2);

    expect(store.getPoolById(pool.id)!.occupied_seats).toBe(2);

    // Nusrat and Shirin both prepare requests for the 1 remaining seat
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
      seats_needed: 1,
    });

    const shirinRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_SHIRIN,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
      seats_needed: 1,
    });

    // Execute both claims simultaneously in Promise.all
    const results = await Promise.allSettled([
      store.claimPoolSeat(pool.id, nusratRide.id, 1),
      store.claimPoolSeat(pool.id, shirinRide.id, 1),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed, exactly one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // The failing promise must have failed due to capacity exhaustion
    const failureReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(failureReason.message).toMatch(/Capacity exceeded/);

    // Crucially: Pool occupied seats must be exactly 3, NEVER 4!
    const finalPool = store.getPoolById(pool.id)!;
    expect(finalPool.occupied_seats).toBe(3);
    expect(finalPool.occupied_seats).toBeLessThanOrEqual(finalPool.max_capacity);
  });

  it('handles burst of 10 concurrent claim attempts on an empty 3-seat Tesla', async () => {
    const bullet = store.getVehicleById(STORY_IDS.VEHICLE_BULLET)!;
    const pool = store.createPool(STORY_IDS.DRIVER_JASHIM, bullet.id);

    // Create 10 dummy passengers requesting 1 seat each
    const passengers = Array.from({ length: 10 }, (_, i) =>
      store.createUser({
        name: `Passenger ${i + 1}`,
        phone: `+880170000000${i}`,
        role: 'passenger',
        tesla_pay_balance_poysha: 10000,
        rating_avg: 5.0,
        total_rides: 0,
      })
    );

    const rides = passengers.map((p) =>
      store.createRideRequest({
        passenger_id: p.id,
        pickup_area_id: STORY_IDS.AREA_BANANI,
        destination_area_id: STORY_IDS.AREA_MOHAKHALI,
        seats_needed: 1,
      })
    );

    // Fire all 10 claims simultaneously
    const claimPromises = rides.map((ride) => store.claimPoolSeat(pool.id, ride.id, 1));
    const results = await Promise.allSettled(claimPromises);

    const successfulClaims = results.filter((r) => r.status === 'fulfilled');
    const failedClaims = results.filter((r) => r.status === 'rejected');

    // Exactly 3 must succeed, 7 must be rejected
    expect(successfulClaims.length).toBe(3);
    expect(failedClaims.length).toBe(7);

    // Final occupied count must be exactly 3
    const finalPool = store.getPoolById(pool.id)!;
    expect(finalPool.occupied_seats).toBe(3);
  });
});
