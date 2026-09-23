import { describe, it, expect } from 'vitest';
import { FareCalculator } from '../src/utils/fareCalculator.js';
import { FARE_CONFIG, STORY_IDS } from '../src/config/constants.js';

describe('PRD Section 5: Fare Model & Currency Integrity', () => {
  it('should store all monetary values as integer poysha to prevent float imprecision', () => {
    const breakdown = FareCalculator.calculateFare(3.2, true);
    expect(Number.isInteger(breakdown.base_fare_poysha)).toBe(true);
    expect(Number.isInteger(breakdown.distance_charge_poysha)).toBe(true);
    expect(Number.isInteger(breakdown.subtotal_poysha)).toBe(true);
    expect(Number.isInteger(breakdown.pool_discount_poysha)).toBe(true);
    expect(Number.isInteger(breakdown.total_fare_poysha)).toBe(true);
  });

  it('calculates Nusrat pooled fare from Banani to Mohakhali (3.2 km) exactly as 4340 poysha (৳43.40)', () => {
    // Nusrat's trip:
    // Distance = 3.2 km
    // Base fare = 3000 poysha (৳30.00)
    // Distance charge = round(3.2 * 1000) = 3200 poysha (৳32.00)
    // Subtotal = 3000 + 3200 = 6200 poysha
    // Pool discount = 30% of 6200 = 1860 poysha
    // Final fare = 6200 - 1860 = 4340 poysha (৳43.40)
    const distanceKm = FareCalculator.getDistanceKm(STORY_IDS.AREA_BANANI, STORY_IDS.AREA_MOHAKHALI);
    expect(distanceKm).toBe(3.2);

    const fare = FareCalculator.calculateFare(distanceKm, true);
    expect(fare.base_fare_poysha).toBe(3000);
    expect(fare.distance_charge_poysha).toBe(3200);
    expect(fare.subtotal_poysha).toBe(6200);
    expect(fare.pool_discount_poysha).toBe(1860);
    expect(fare.total_fare_poysha).toBe(4340);
    expect(FareCalculator.formatBDT(fare.total_fare_poysha)).toBe('৳43.40');
  });

  it('calculates Rafiq pooled fare from Banani to Gulshan 1 (2.0 km) exactly as 3500 poysha (৳35.00)', () => {
    // Rafiq's trip:
    // Distance = 2.0 km
    // Base fare = 3000 poysha (৳30.00)
    // Distance charge = round(2.0 * 1000) = 2000 poysha (৳20.00)
    // Subtotal = 3000 + 2000 = 5000 poysha
    // Pool discount = 30% of 5000 = 1500 poysha
    // Final fare = 5000 - 1500 = 3500 poysha (৳35.00)
    const distanceKm = FareCalculator.getDistanceKm(STORY_IDS.AREA_BANANI, STORY_IDS.AREA_GULSHAN_1);
    expect(distanceKm).toBe(2.0);

    const fare = FareCalculator.calculateFare(distanceKm, true);
    expect(fare.base_fare_poysha).toBe(3000);
    expect(fare.distance_charge_poysha).toBe(2000);
    expect(fare.subtotal_poysha).toBe(5000);
    expect(fare.pool_discount_poysha).toBe(1500);
    expect(fare.total_fare_poysha).toBe(3500);
    expect(FareCalculator.formatBDT(fare.total_fare_poysha)).toBe('৳35.00');
  });

  it('calculates solo fare without pool discount correctly', () => {
    // Nusrat solo: 3000 + 3200 = 6200 poysha, 0 discount
    const fare = FareCalculator.calculateFare(3.2, false);
    expect(fare.pool_discount_poysha).toBe(0);
    expect(fare.total_fare_poysha).toBe(6200);
    expect(FareCalculator.formatBDT(fare.total_fare_poysha)).toBe('৳62.00');
  });
});
