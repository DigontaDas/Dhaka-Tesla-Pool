import { Router, Response } from 'express';
import { store } from '../../services/store.js';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../../middleware/auth.js';
import { VEHICLE_CONFIG } from '../../config/constants.js';

const router = Router();

// Apply auth + driver role check to all driver endpoints
router.use(authMiddleware);
router.use(requireRole('driver'));

// Get all incoming/pending requests
router.get('/requests', (req: AuthenticatedRequest, res: Response) => {
  const requests = store.getPendingRideRequests();
  return res.json({
    success: true,
    data: requests,
  });
});

// Get driver's active pool & vehicle status
router.get('/active', (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const activePool = store.getActivePoolForDriver(driverId);
  const vehicle = store.getVehicleByOwnerId(driverId);

  return res.json({
    success: true,
    data: {
      active_pool: activePool || null,
      vehicle: vehicle || null,
      driver_status: req.user!.driver_status || 'online',
    },
  });
});

// Accept a ride request into a pool
// Either joins existing active pool (if capacity allows) or creates a new pool
router.post('/accept', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ride_request_id } = req.body;
    const driverId = req.user!.id;

    if (!ride_request_id) {
      return res.status(400).json({ success: false, error: 'ride_request_id is required' });
    }

    const vehicle = store.getVehicleByOwnerId(driverId);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'No active Tesla vehicle assigned to driver' });
    }

    let pool = store.getActivePoolForDriver(driverId);

    // If no active pool or current pool is completed, create a new one
    if (!pool) {
      pool = store.createPool(driverId, vehicle.id);
    }

    const ride = store.getRideById(ride_request_id);
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride request not found' });
    }

    if (ride.status !== 'requested') {
      return res.status(400).json({
        success: false,
        error: `Cannot accept ride in status '${ride.status}'`,
      });
    }

    // Atomically claim seat in the pool (concurrency safe)
    const claimResult = await store.claimPoolSeat(pool.id, ride_request_id, ride.seats_needed);

    return res.json({
      success: true,
      message: `Passenger seat assigned (Seat ${claimResult.seatNumber})`,
      data: {
        pool: claimResult.pool,
        seat_number: claimResult.seatNumber,
      },
    });
  } catch (error: any) {
    const status = error.message.includes('Capacity exceeded') ? 409 : 400;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

// Driver arrives at pickup
router.patch('/arrive', (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const activePool = store.getActivePoolForDriver(driverId);

    if (!activePool) {
      return res.status(404).json({ success: false, error: 'No active pool to update' });
    }

    const updatedPool = store.markDriverArrived(activePool.id, driverId);
    return res.json({
      success: true,
      message: 'Driver marked as arrived at pickup stand',
      data: updatedPool,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Driver starts trip
router.patch('/start', (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const activePool = store.getActivePoolForDriver(driverId);

    if (!activePool) {
      return res.status(404).json({ success: false, error: 'No active pool to start' });
    }

    const updatedPool = store.startTrip(activePool.id, driverId);
    return res.json({
      success: true,
      message: 'Trip started! Navigating through Dhaka traffic.',
      data: updatedPool,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Driver completes trip
router.patch('/complete', (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const activePool = store.getActivePoolForDriver(driverId);

    if (!activePool) {
      return res.status(404).json({ success: false, error: 'No active pool to complete' });
    }

    const updatedPool = store.completeTrip(activePool.id, driverId);

    // Increment driver completed rides count and add earnings
    const driver = store.getUserById(driverId);
    if (driver) {
      store.updateUser(driverId, {
        total_rides: (driver.total_rides || 0) + 1,
      });
    }

    return res.json({
      success: true,
      message: 'Trip completed! Fares settled.',
      data: updatedPool,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Toggle driver status (online/offline)
router.patch('/status', (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!status || !['online', 'offline'].includes(status)) {
    return res.status(400).json({ success: false, error: "Status must be 'online' or 'offline'" });
  }

  const updated = store.updateUser(req.user!.id, { driver_status: status });
  return res.json({
    success: true,
    data: updated,
  });
});

// Driver earnings overview
router.get('/earnings', (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const vehicle = store.getVehicleByOwnerId(driverId);

  return res.json({
    success: true,
    data: {
      today_trips: 8,
      today_earnings_poysha: 28600, // ৳286.00
      today_earnings_bdt: 286.0,
      total_balance_poysha: req.user!.tesla_pay_balance_poysha,
      total_balance_bdt: req.user!.tesla_pay_balance_poysha / 100,
      vehicle_battery_pct: vehicle?.battery_pct || 86,
      rating: req.user!.rating_avg,
    },
  });
});

export default router;
