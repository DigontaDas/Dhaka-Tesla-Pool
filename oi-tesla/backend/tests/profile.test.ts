import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { store } from '../src/services/store.js';
import { STORY_IDS } from '../src/config/constants.js';

describe('User Profile & Account Mutations', () => {
  beforeEach(() => {
    store.seed();
  });

  it('allows passenger to update their name and mobile number', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('x-user-id', STORY_IDS.PASSENGER_NUSRAT)
      .send({
        name: 'Nusrat Jahan Chowdhury',
        phone: '+8801799887766',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Nusrat Jahan Chowdhury');
    expect(res.body.user.phone).toBe('+8801799887766');

    // Verify persisted in store
    const updated = store.getUserById(STORY_IDS.PASSENGER_NUSRAT);
    expect(updated?.name).toBe('Nusrat Jahan Chowdhury');
    expect(updated?.phone).toBe('+8801799887766');
  });

  it('rejects changing phone number to one already in use', async () => {
    // Nusrat tries to take Rafiq's phone number
    const rafiq = store.getUserById(STORY_IDS.PASSENGER_RAFIQ)!;

    const res = await request(app)
      .patch('/api/auth/profile')
      .set('x-user-id', STORY_IDS.PASSENGER_NUSRAT)
      .send({
        phone: rafiq.phone,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/already registered/);
  });

  it('rejects empty update payload', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('x-user-id', STORY_IDS.PASSENGER_NUSRAT)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
