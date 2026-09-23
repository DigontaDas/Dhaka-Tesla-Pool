import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { store } from '../../services/store.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { STORY_IDS } from '../../config/constants.js';

const router = Router();

// Login or quick-switch by phone or ID
router.post('/login', (req: Request, res: Response) => {
  const { phone, userId } = req.body;

  let user = userId ? store.getUserById(userId) : undefined;
  if (!user && phone) {
    user = store.getUserByPhone(phone);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found. Use a story cast user or sign up.',
    });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, phone: user.phone },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    token,
    user,
  });
});

// Register new user
router.post('/register', (req: Request, res: Response) => {
  const { name, phone, role } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }

  const existing = store.getUserByPhone(phone);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Phone number already registered' });
  }

  const user = store.createUser({
    name,
    phone,
    role: role || 'passenger',
    tesla_pay_balance_poysha: 10000, // ৳100 welcome credit
    rating_avg: 5.0,
    total_rides: 0,
    driver_status: role === 'driver' ? 'online' : undefined,
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role, phone: user.phone },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    success: true,
    token,
    user,
  });
});

// Current user profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// Update user profile (name, phone)
router.patch('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, phone } = req.body;

  if (phone) {
    const existing = store.getUserByPhone(phone);
    if (existing && existing.id !== userId) {
      return res.status(409).json({ success: false, error: 'Phone number already registered by another user' });
    }
  }

  const updates: { name?: string; phone?: string } = {};
  if (name && typeof name === 'string' && name.trim()) {
    updates.name = name.trim();
  }
  if (phone && typeof phone === 'string' && phone.trim()) {
    updates.phone = phone.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No valid fields provided to update' });
  }

  const updatedUser = store.updateUser(userId, updates);

  return res.json({
    success: true,
    user: updatedUser,
  });
});


// Get story cast for easy evaluator login
router.get('/cast', (req: Request, res: Response) => {
  const jashim = store.getUserById(STORY_IDS.DRIVER_JASHIM);
  const nusrat = store.getUserById(STORY_IDS.PASSENGER_NUSRAT);
  const rafiq = store.getUserById(STORY_IDS.PASSENGER_RAFIQ);
  const shirin = store.getUserById(STORY_IDS.PASSENGER_SHIRIN);
  const bullet = store.getVehicleById(STORY_IDS.VEHICLE_BULLET);

  return res.json({
    success: true,
    cast: {
      driver: { user: jashim, vehicle: bullet },
      passengers: [nusrat, rafiq, shirin],
    },
  });
});

export default router;
