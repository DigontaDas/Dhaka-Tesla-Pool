import { Router, Response } from 'express';
import { store } from '../../services/store.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';
import { FareCalculator } from '../../utils/fareCalculator.js';

const router = Router();

// Get available Tesla drivers nearby (for passenger booking preview)
router.get('/available-drivers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const drivers = store.getAvailableDriversSummary();
  return res.json({
    success: true,
    data: drivers,
  });
});

// Passenger requests a ride
router.post('/request', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pickup_area_id, destination_area_id, seats_needed, payment_method, auto_assign = true } = req.body;
    const passengerId = req.user!.id;

    if (req.user!.role === 'driver') {
      return res.status(400).json({
        success: false,
        error: 'Drivers cannot request rides as passengers. Please switch to a passenger account (e.g. Nusrat or Rafiq).',
      });
    }

    if (!pickup_area_id || !destination_area_id) {
      return res.status(400).json({
        success: false,
        error: 'pickup_area_id and destination_area_id are required',
      });
    }

    const ride = store.createRideRequest({
      passenger_id: passengerId,
      pickup_area_id,
      destination_area_id,
      seats_needed: seats_needed ? parseInt(seats_needed, 10) : 1,
      payment_method: payment_method || 'cash',
    });

    // If auto_assign is enabled (Uber-style instant dispatch):
    if (auto_assign) {
      const availableDrivers = store.getOnlineDriversWithCapacity(ride.seats_needed);
      if (availableDrivers.length > 0) {
        const assignedDriver = availableDrivers[0];
        const vehicle = store.getVehicleByOwnerId(assignedDriver.id);
        let pool = store.getActivePoolForDriver(assignedDriver.id);
        if (!pool && vehicle) {
          pool = store.createPool(assignedDriver.id, vehicle.id);
        }
        if (pool) {
          await store.claimPoolSeat(pool.id, ride.id, ride.seats_needed);
        }
      }
    }

    const updatedRide = store.getRideById(ride.id);

    return res.status(201).json({
      success: true,
      data: updatedRide || ride,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get passenger ride history
router.get('/history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const rides = store.getRidesByPassengerId(req.user!.id);
  return res.json({
    success: true,
    data: rides,
  });
});

// Get ride by ID with authorization check (PRD Section 12 test: users cannot view/modify other users' rides)
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const ride = store.getRideById(rideId);
  if (!ride) {
    return res.status(404).json({ success: false, error: 'Ride request not found' });
  }

  // Check authorization: must be the passenger or the driver
  const isPassenger = ride.passenger_id === req.user!.id;
  const isDriver = req.user!.role === 'driver';

  if (!isPassenger && !isDriver) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: you are not authorized to view this ride',
    });
  }

  const fareRecord = store.getFareRecord(ride.id);

  return res.json({
    success: true,
    data: {
      ...ride,
      fare_record: fareRecord,
    },
  });
});

// Cancel a ride request
router.patch('/:id/cancel', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const rideId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const cancelled = store.cancelRide(rideId, req.user!.id, reason);
    return res.json({
      success: true,
      data: cancelled,
    });
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
