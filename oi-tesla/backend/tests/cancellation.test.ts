import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../src/services/store.js';
import { STORY_IDS } from '../src/config/constants.js';

describe('PRD Section 12: Cancellation Rules & Capacity Release', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  it('allows passenger to cancel a requested ride before matching', () => {
    const ride = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    const cancelled = store.cancelRide(ride.id, STORY_IDS.PASSENGER_NUSRAT, 'Changed plans');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellation_reason).toBe('Changed plans');
    expect(cancelled.cancelled_at).toBeDefined();
  });

  it('releases pool seats when a pooled passenger cancels', async () => {
    const bullet = store.getVehicleById(STORY_IDS.VEHICLE_BULLET)!;
    const pool = store.createPool(STORY_IDS.DRIVER_JASHIM, bullet.id);

    // Nusrat books 1 seat
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });
    await store.claimPoolSeat(pool.id, nusratRide.id, 1);

    // Rafiq books 2 seats -> Pool is now full (3/3)
    const rafiqRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_RAFIQ,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_GULSHAN_1,
      seats_needed: 2,
    });
    await store.claimPoolSeat(pool.id, rafiqRide.id, 2);

    expect(store.getPoolById(pool.id)!.occupied_seats).toBe(3);

    // Shirin tries to book, should be rejected (capacity full)
    const shirinRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_SHIRIN,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });
    await expect(
      store.claimPoolSeat(pool.id, shirinRide.id, 1)
    ).rejects.toThrow(/Capacity exceeded/);

    // Nusrat cancels her ride
    store.cancelRide(nusratRide.id, STORY_IDS.PASSENGER_NUSRAT, 'Emergency meeting');

    // Verify occupied seats decreased to 2
    expect(store.getPoolById(pool.id)!.occupied_seats).toBe(2);

    // Now Shirin can successfully claim the freed seat!
    const shirinClaim = await store.claimPoolSeat(pool.id, shirinRide.id, 1);
    expect(shirinClaim.success).toBe(true);
    expect(store.getPoolById(pool.id)!.occupied_seats).toBe(3);
  });

  it('rejects cancellation on already completed rides', () => {
    const ride = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    store.transitionRideStatus(ride.id, 'matched', STORY_IDS.DRIVER_JASHIM);
    store.transitionRideStatus(ride.id, 'driver_arrived', STORY_IDS.DRIVER_JASHIM);
    store.transitionRideStatus(ride.id, 'started', STORY_IDS.DRIVER_JASHIM);
    store.transitionRideStatus(ride.id, 'completed', STORY_IDS.DRIVER_JASHIM);

    expect(() => {
      store.cancelRide(ride.id, STORY_IDS.PASSENGER_NUSRAT, 'Attempt after trip finished');
    }).toThrow(/Cannot cancel ride in completed state/);
  });
});
