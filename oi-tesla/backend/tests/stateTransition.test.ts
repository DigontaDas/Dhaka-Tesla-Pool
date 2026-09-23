import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../src/services/store.js';
import { STORY_IDS } from '../src/config/constants.js';

describe('PRD Section 3 & 12: Ride State Machine Validation', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store();
  });

  it('allows valid progressive lifecycle transitions', () => {
    // 1. REQUESTED
    const ride = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });
    expect(ride.status).toBe('requested');

    // 2. REQUESTED -> MATCHED
    const matched = store.transitionRideStatus(ride.id, 'matched', STORY_IDS.DRIVER_JASHIM);
    expect(matched.status).toBe('matched');
    expect(matched.matched_at).toBeDefined();

    // 3. MATCHED -> DRIVER_ARRIVED
    const arrived = store.transitionRideStatus(ride.id, 'driver_arrived', STORY_IDS.DRIVER_JASHIM);
    expect(arrived.status).toBe('driver_arrived');

    // 4. DRIVER_ARRIVED -> STARTED
    const started = store.transitionRideStatus(ride.id, 'started', STORY_IDS.DRIVER_JASHIM);
    expect(started.status).toBe('started');

    // 5. STARTED -> COMPLETED
    const completed = store.transitionRideStatus(ride.id, 'completed', STORY_IDS.DRIVER_JASHIM);
    expect(completed.status).toBe('completed');
    expect(completed.completed_at).toBeDefined();
  });

  it('rejects jumping from REQUESTED directly to COMPLETED', () => {
    const ride = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    expect(() => {
      store.transitionRideStatus(ride.id, 'completed', STORY_IDS.DRIVER_JASHIM);
    }).toThrow(/Invalid state transition: requested → completed/);
  });

  it('rejects jumping from REQUESTED directly to STARTED', () => {
    const ride = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    expect(() => {
      store.transitionRideStatus(ride.id, 'started', STORY_IDS.DRIVER_JASHIM);
    }).toThrow(/Invalid state transition: requested → started/);
  });

  it('prevents modifying completed rides (COMPLETED is terminal)', () => {
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
      store.transitionRideStatus(ride.id, 'started', STORY_IDS.DRIVER_JASHIM);
    }).toThrow(/Invalid state transition: completed → started/);

    expect(() => {
      store.transitionRideStatus(ride.id, 'cancelled', STORY_IDS.PASSENGER_NUSRAT);
    }).toThrow(/Invalid state transition: completed → cancelled/);
  });

  it('prevents reviving cancelled rides (CANCELLED is terminal)', () => {
    const ride = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    store.cancelRide(ride.id, STORY_IDS.PASSENGER_NUSRAT, 'Changed plans');

    expect(() => {
      store.transitionRideStatus(ride.id, 'matched', STORY_IDS.DRIVER_JASHIM);
    }).toThrow(/Invalid state transition: cancelled → matched/);
  });
});
