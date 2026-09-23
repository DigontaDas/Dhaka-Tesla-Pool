import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { store } from '../src/services/store.js';
import { STORY_IDS } from '../src/config/constants.js';

describe('PRD Section 12: Authorization & Privacy Isolation', () => {
  beforeEach(() => {
    store.seed();
  });

  it("prevents Rafiq from viewing Nusrat's private ride details", async () => {
    // Nusrat creates a ride
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    // Rafiq attempts to view Nusrat's ride via API using x-user-id header
    const res = await request(app)
      .get(`/api/rides/${nusratRide.id}`)
      .set('x-user-id', STORY_IDS.PASSENGER_RAFIQ);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Forbidden/);
  });

  it("allows Nusrat to view her own ride details", async () => {
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    const res = await request(app)
      .get(`/api/rides/${nusratRide.id}`)
      .set('x-user-id', STORY_IDS.PASSENGER_NUSRAT);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(nusratRide.id);
  });

  it("prevents Rafiq from cancelling Nusrat's ride", async () => {
    const nusratRide = store.createRideRequest({
      passenger_id: STORY_IDS.PASSENGER_NUSRAT,
      pickup_area_id: STORY_IDS.AREA_BANANI,
      destination_area_id: STORY_IDS.AREA_MOHAKHALI,
    });

    const res = await request(app)
      .patch(`/api/rides/${nusratRide.id}/cancel`)
      .set('x-user-id', STORY_IDS.PASSENGER_RAFIQ)
      .send({ reason: 'Malicious cancellation attempt' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Unauthorized/);

    // Verify ride is still in requested state
    const rideAfter = store.getRideById(nusratRide.id);
    expect(rideAfter!.status).toBe('requested');
  });

  it("prevents passengers from accessing driver-only endpoints", async () => {
    const res = await request(app)
      .get('/api/drivers/requests')
      .set('x-user-id', STORY_IDS.PASSENGER_NUSRAT);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/requires 'driver' role/);
  });
});
