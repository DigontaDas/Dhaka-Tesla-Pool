'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient } from '../lib/api';
import { useRouter } from 'next/navigation';

export default function BookRidePage() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [areas, setAreas] = useState<any[]>([]);
  const [pickupId, setPickupId] = useState<string>('a1000000-0000-0000-0000-000000000001'); // Banani
  const [destinationId, setDestinationId] = useState<string>('a1000000-0000-0000-0000-000000000003'); // Mohakhali
  const [seatsNeeded, setSeatsNeeded] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'tesla_pay'>('cash');
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch areas on load
  useEffect(() => {
    ApiClient.get('/areas').then((res) => {
      if (res.success && res.data) {
        setAreas(res.data);
      }
    });
  }, []);

  // Fetch fare estimate whenever pickup or destination changes
  useEffect(() => {
    if (pickupId && destinationId && pickupId !== destinationId) {
      ApiClient.get(`/areas/estimate?pickup_id=${pickupId}&destination_id=${destinationId}`).then(
        (res) => {
          if (res.success && res.data) {
            setEstimate(res.data);
          }
        }
      );
    } else {
      setEstimate(null);
    }
  }, [pickupId, destinationId]);

  const handleSwap = () => {
    const temp = pickupId;
    setPickupId(destinationId);
    setDestinationId(temp);
  };

  const handleBookRide = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);

    const res = await ApiClient.post('/rides/request', {
      pickup_area_id: pickupId,
      destination_area_id: destinationId,
      seats_needed: seatsNeeded,
      payment_method: paymentMethod,
    });

    setLoading(false);
    if (res.success && res.data) {
      setBookingSuccess(res.data.id);
      setTimeout(() => {
        router.push(`/tracking?ride_id=${res.data.id}`);
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Failed to request ride');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-sora font-bold text-xl text-on-surface">
              Hey, {user?.name?.split(' ')[0] || 'Traveler'}
            </h1>
            <span className="text-xl animate-bounce">👋</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Where are you heading in Dhaka today?
          </p>
        </div>

        {/* Green Commute Badge */}
        <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full border border-surface-container-highest">
          <span className="material-symbols-outlined text-sm text-primary">eco</span>
          <span className="text-xs font-semibold text-primary">2.4 kg CO₂ saved</span>
        </div>
      </div>

      {/* Interactive Dhaka Transit Radar Map Card (SVG Artwork) */}
      <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-surface-container-lowest border border-surface-container-high/60 shadow-lg">
        <svg
          className="absolute inset-0 w-full h-full object-cover"
          fill="none"
          viewBox="0 0 400 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient cx="50%" cy="50%" id="tealPulseGlow" r="50%">
              <stop offset="0%" stopColor="#46f1c5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#46f1c5" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="roadTeal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#1b2025" />
              <stop offset="50%" stopColor="#00513f" />
              <stop offset="100%" stopColor="#1b2025" />
            </linearGradient>
          </defs>

          {/* Dhaka Arteries Mesh */}
          <path d="M-20 40 Q 120 70 200 30 T 420 80" stroke="#252a30" strokeLinecap="round" strokeWidth="8" />
          <path d="M40 210 Q 110 110 180 120 T 360 -10" stroke="#252a30" strokeLinecap="round" strokeWidth="12" />

          {/* Electric Route (Banani to Mohakhali) */}
          <path d="M70 50 Q 150 90 220 140 T 350 170" id="transitRoute1" stroke="url(#roadTeal)" strokeDasharray="4 4" strokeWidth="5" />
          <path d="M190 30 L 220 140 L 120 180" stroke="#30353b" strokeWidth="4" />

          {/* Nodes */}
          <circle cx="80" cy="55" fill="#46f1c5" r="5" />
          <text fill="#bacac2" fontFamily="Sora" fontSize="9" fontWeight="600" x="75" y="44">Banani</text>

          <circle cx="280" cy="85" fill="#feb700" r="4" />
          <text fill="#bacac2" fontFamily="Sora" fontSize="9" fontWeight="600" x="270" y="78">Gulshan 1</text>

          <circle cx="220" cy="140" fill="#46f1c5" r="5" />
          <text fill="#bacac2" fontFamily="Sora" fontSize="9" fontWeight="600" x="215" y="158">Mohakhali</text>

          {/* Moving Bullet e-trike simulation */}
          <circle fill="#46f1c5" r="4">
            <animateMotion dur="6s" path="M70 50 Q 150 90 220 140 T 350 170" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Live Radar Tag */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/90 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-semibold text-on-surface">Bullet active • 3 mins away</span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-primary">bolt</span>
          <span className="text-[11px] font-bold text-primary">Stand: Chairman Bari</span>
        </div>
      </div>

      {/* Route & Booking Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-xl flex flex-col gap-3">
        {/* Pickup Field */}
        <div className="flex items-center gap-3 bg-surface-container p-3 rounded-xl border border-surface-container-high/40">
          <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,170,0.8)] shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              Pickup Point
            </span>
            <select
              value={pickupId}
              onChange={(e) => setPickupId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id} className="bg-surface-container-high text-on-surface">
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button Connector */}
        <div className="relative h-2 flex items-center justify-end px-4">
          <button
            onClick={handleSwap}
            className="w-7 h-7 rounded-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary-fixed text-on-surface flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Swap locations"
          >
            <span className="material-symbols-outlined text-sm">swap_vert</span>
          </button>
        </div>

        {/* Destination Field */}
        <div className="flex items-center gap-3 bg-surface-container p-3 rounded-xl border border-surface-container-high/40">
          <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(255,219,157,0.8)] shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">
              Destination
            </span>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id} className="bg-surface-container-high text-on-surface">
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seats Needed & Payment Method */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Seats Selector */}
          <div className="flex flex-col gap-1 bg-surface-container p-2.5 rounded-xl border border-surface-container-high/40">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Seats</span>
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeatsNeeded(num)}
                  className={`w-9 h-8 rounded-lg text-xs font-bold transition-all ${
                    seatsNeeded === num
                      ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {num} {num === 1 ? 'seat' : 'seats'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-1 bg-surface-container p-2.5 rounded-xl border border-surface-container-high/40">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Payment</span>
            <div className="flex items-center gap-1.5 h-8">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'bg-surface-container-highest text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('tesla_pay')}
                className={`flex-1 h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  paymentMethod === 'tesla_pay'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                ⚡ TeslaPay
              </button>
            </div>
          </div>
        </div>

        {/* Live Fare Estimation Breakdown (PRD Section 5) */}
        {estimate && (
          <div className="bg-surface-container-lowest/80 rounded-xl p-3 border border-primary/20 flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">group</span>
                <span className="text-xs font-bold text-primary uppercase font-sora">
                  Pooled Fare (30% Off)
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs line-through text-outline">
                  {estimate.solo_fare.formatted}
                </span>
                <span className="text-lg font-extrabold text-primary font-sora">
                  {estimate.pooled_fare.formatted}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant border-t border-surface-container-high/50 pt-2">
              <span>Distance: {estimate.distance_km} km</span>
              <span className="text-secondary font-semibold">
                You save ৳{estimate.savings_bdt.toFixed(2)} sharing with Bullet!
              </span>
            </div>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs">
            {errorMessage}
          </div>
        )}

        {/* Success Banner */}
        {bookingSuccess && (
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary text-primary text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Ride requested! Connecting with Bullet & Jashim...</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleBookRide}
          disabled={loading || pickupId === destinationId}
          className="w-full h-14 mt-1 rounded-2xl bg-primary-container text-on-primary-fixed font-sora font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
              <span>Matching Tesla Pod...</span>
            </>
          ) : (
            <>
              <span>Confirm & Request Pool • বুক করুন</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
