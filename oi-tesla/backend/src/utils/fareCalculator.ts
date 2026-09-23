// Oi Tesla - Fare Calculator Utility
// Compliant with PRD Section 5:
// passengerFare = baseFare + distanceCharge - poolDiscount
// Stored as integer poysha (1 BDT = 100 poysha) to avoid floating point inaccuracies

import { FARE_CONFIG, DHAKA_DISTANCES } from '../config/constants.js';
import { FareBreakdown } from '../types/index.js';

export class FareCalculator {
  /**
   * Look up distance in km between two Dhaka areas.
   * If area pair is not directly found, checks reverse direction.
   * Falls back to a reasonable default of 5.0 km.
   */
  public static getDistanceKm(fromAreaId: string, toAreaId: string): number {
    if (fromAreaId === toAreaId) {
      return 0;
    }
    const direct = DHAKA_DISTANCES[fromAreaId]?.[toAreaId];
    if (direct !== undefined) {
      return direct;
    }
    const reverse = DHAKA_DISTANCES[toAreaId]?.[fromAreaId];
    if (reverse !== undefined) {
      return reverse;
    }
    return 5.0; // Fallback
  }

  /**
   * Pure function to calculate fare breakdown.
   * All monetary return values are in integer poysha.
   *
   * @param distanceKm Distance of trip in kilometers
   * @param isPooled Whether the passenger is participating in a pooled ride
   * @returns FareBreakdown object with all line items
   */
  public static calculateFare(distanceKm: number, isPooled: boolean): FareBreakdown {
    const baseFarePoysha = FARE_CONFIG.BASE_FARE_POYSHA;
    const distanceChargePoysha = Math.round(distanceKm * FARE_CONFIG.PER_KM_CHARGE_POYSHA);
    const subtotalPoysha = baseFarePoysha + distanceChargePoysha;

    const poolDiscountPoysha = isPooled
      ? Math.round((subtotalPoysha * FARE_CONFIG.POOL_DISCOUNT_PERCENT) / 100)
      : 0;

    const totalFarePoysha = subtotalPoysha - poolDiscountPoysha;

    return {
      base_fare_poysha: baseFarePoysha,
      distance_km: distanceKm,
      distance_charge_poysha: distanceChargePoysha,
      subtotal_poysha: subtotalPoysha,
      pool_discount_poysha: poolDiscountPoysha,
      total_fare_poysha: totalFarePoysha,
      is_pooled: isPooled,
    };
  }

  /**
   * Helper to format poysha integer into BDT string with 2 decimal places.
   * e.g. 4340 -> "৳43.40"
   */
  public static formatBDT(poysha: number): string {
    return `৳${(poysha / 100).toFixed(2)}`;
  }
}
