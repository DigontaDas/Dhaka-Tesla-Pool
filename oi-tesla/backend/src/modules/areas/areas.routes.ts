import { Router, Request, Response } from 'express';
import { store } from '../../services/store.js';
import { FareCalculator } from '../../utils/fareCalculator.js';

const router = Router();

// List all predefined Dhaka areas
router.get('/', (req: Request, res: Response) => {
  const areas = store.getAreas();
  return res.json({
    success: true,
    data: areas,
  });
});

// Fare estimate endpoint
router.get('/estimate', (req: Request, res: Response) => {
  const pickupId = req.query.pickup_id as string;
  const destinationId = req.query.destination_id as string;

  if (!pickupId || !destinationId) {
    return res.status(400).json({
      success: false,
      error: 'pickup_id and destination_id query parameters are required',
    });
  }

  const pickupArea = store.getAreaById(pickupId);
  const destinationArea = store.getAreaById(destinationId);

  if (!pickupArea || !destinationArea) {
    return res.status(404).json({
      success: false,
      error: 'One or both specified areas do not exist',
    });
  }

  const distanceKm = FareCalculator.getDistanceKm(pickupId, destinationId);
  const soloFare = FareCalculator.calculateFare(distanceKm, false);
  const pooledFare = FareCalculator.calculateFare(distanceKm, true);

  const savingsPoysha = soloFare.total_fare_poysha - pooledFare.total_fare_poysha;

  return res.json({
    success: true,
    data: {
      pickup_area: pickupArea,
      destination_area: destinationArea,
      distance_km: distanceKm,
      solo_fare: {
        ...soloFare,
        formatted: FareCalculator.formatBDT(soloFare.total_fare_poysha),
      },
      pooled_fare: {
        ...pooledFare,
        formatted: FareCalculator.formatBDT(pooledFare.total_fare_poysha),
      },
      savings_poysha: savingsPoysha,
      savings_bdt: savingsPoysha / 100,
    },
  });
});

export default router;
