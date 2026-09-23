'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

function TrackingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeRide, setActiveRide] = useState<any>(null);
  const [activePool, setActivePool] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchActiveRide = async () => {
    if (!user) return;
    try {
      const rideIdParam = searchParams.get('ride_id');
      if (rideIdParam) {
        const res = await ApiClient.get(`/rides/${rideIdParam}`);
        if (res.success && res.data) {
          setActiveRide(res.data);
          return;
        }
      }

      // Otherwise fetch latest ride from history
      const hist = await ApiClient.get('/rides/history');
      if (hist.success && hist.data && hist.data.length > 0) {
        const latest = hist.data[0];
        setActiveRide(latest);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRide();
    const interval = setInterval(fetchActiveRide, 3000); // Polling for real-time state updates
    return () => clearInterval(interval);
  }, [user]);

  const handleCancelRide = async () => {
    if (!activeRide) return;
    if (!confirm('Cancel this pool ride? Match fee ৳10 applies.')) return;
    setCancelling(true);
    const res = await ApiClient.patch(`/rides/${activeRide.id}/cancel`, {
      reason: 'Cancelled by passenger',
    });
    setCancelling(false);
    if (res.success) {
      alert('Ride cancelled successfully.');
      fetchActiveRide();
    } else {
      alert(res.error || 'Failed to cancel');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <span className="text-sm text-on-surface-variant font-sora">
          Connecting to Tesla Telemetry...
        </span>
      </div>
    );
  }

  if (!activeRide) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-3xl">electric_rickshaw</span>
        </div>
        <div>
          <h2 className="font-sora font-bold text-lg text-on-surface">No Active Ride</h2>
          <p className="text-xs text-on-surface-variant max-w-xs mt-1">
            You don't have an active ride request right now. Request a seat with Bullet to get started!
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-full bg-primary-container text-on-primary-fixed font-bold text-xs shadow-md"
        >
          Book a Ride Now
        </button>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'requested':
        return { text: 'Searching for Pool Pod...', badge: 'Waiting for Pilot', color: 'primary' };
      case 'matched':
        return { text: 'Matched & On the Way', badge: '3 mins away', color: 'primary' };
      case 'driver_arrived':
        return { text: 'Bullet Arrived at Stand!', badge: 'Board Now', color: 'secondary' };
      case 'started':
        return { text: 'Trip In Progress', badge: 'Cruising Dhaka', color: 'primary' };
      case 'completed':
        return { text: 'Trip Completed', badge: 'Arrived Safe', color: 'primary' };
      case 'cancelled':
        return { text: 'Ride Cancelled', badge: 'Cancelled', color: 'error' };
      default:
        return { text: status, badge: status, color: 'primary' };
    }
  };

  const statusInfo = getStatusDisplay(activeRide.status);

  return (
    <div className="flex flex-col gap-4">
      {/* Live Status & ETA Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-full border border-surface-container-highest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-primary font-sora">
              {statusInfo.text}
            </span>
          </div>

          <div className="flex items-center gap-1 text-secondary text-xs font-bold font-sora">
            <span className="material-symbols-outlined text-sm text-secondary">bolt</span>
            <span>Eco-Fast</span>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between relative z-10">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Pickup Stand
            </p>
            <h2 className="font-sora text-lg text-on-surface font-bold">
              {activeRide.pickup_area?.name || 'Banani'}
            </h2>
            <p className="text-xs text-primary font-semibold mt-0.5">
              Heading to {activeRide.destination_area?.name || 'Mohakhali'}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-surface-container rounded-lg text-xs font-bold text-on-surface border border-surface-container-high">
              {statusInfo.badge}
            </span>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Mild traffic</p>
          </div>
        </div>

        {/* Live Animated Progress Bar */}
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-4 overflow-hidden relative">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{
              width:
                activeRide.status === 'requested' ? '25%' :
                activeRide.status === 'matched' ? '50%' :
                activeRide.status === 'driver_arrived' ? '75%' :
                activeRide.status === 'started' ? '90%' :
                activeRide.status === 'completed' ? '100%' : '15%',
            }}
          />
        </div>
      </div>

      {/* Driver & Vehicle Profile Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center text-lg shadow-md">
              JU
            </div>
            <div>
              <h3 className="font-sora font-bold text-sm text-on-surface">
                Jashim Uddin <span className="text-xs text-on-surface-variant font-normal">(জসিম)</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex items-center text-xs font-bold text-secondary">
                  <span className="material-symbols-outlined text-xs mr-0.5">star</span>
                  4.9
                </span>
                <span className="text-xs text-on-surface-variant">• 1,420 pools completed</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high rounded-full text-xs font-bold text-primary border border-surface-container-highest">
              <span className="material-symbols-outlined text-xs">electric_bolt</span> 86%
            </span>
          </div>
        </div>

        {/* Vehicle Badge */}
        <div className="bg-surface-container rounded-xl p-2.5 flex items-center justify-between border border-surface-container-high/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-lg">electric_rickshaw</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                Bullet (বুলেট) · Super-3 E-Trike
              </p>
              <p className="text-[10px] text-on-surface-variant">DH-Metro-TH-14-8821</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container-highest text-primary">
            Quiet EV
          </span>
        </div>

        {/* Quick Driver Actions */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => alert('Dialing Driver Jashim Uddin (+8801912345678)...')}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-surface-container-high hover:bg-surface-bright active:scale-95 transition rounded-xl text-on-surface text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm text-primary">phone</span>
            <span>Call</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Opening encrypted chat with Pilot Jashim...')}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-surface-container-high hover:bg-surface-bright active:scale-95 transition rounded-xl text-on-surface text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm text-primary">chat</span>
            <span>Message</span>
          </button>
          <button
            type="button"
            disabled={cancelling || activeRide.status === 'completed' || activeRide.status === 'cancelled'}
            onClick={handleCancelRide}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-surface-container-high hover:bg-error-container hover:text-on-error-container active:scale-95 transition rounded-xl text-error text-xs font-semibold disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Interactive 3-Seat Pool Matrix Cockpit (PRD Section 3 & 12) */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-sora font-bold text-sm text-on-surface">Pool Pod Visualization</h4>
            <p className="text-xs text-on-surface-variant">Real-time cabin layout & co-rider stops</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
            Bullet (3 Seats Max)
          </span>
        </div>

        {/* Pod Interior Schematic */}
        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-high/40 relative">
          {/* Driver Cockpit Header */}
          <div className="flex items-center justify-center pb-2 mb-2 border-b border-surface-container-high/40">
            <div className="px-3 py-1 bg-surface-container-high rounded-full flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">airline_seat_recline_extra</span>
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Cockpit: Pilot Jashim
              </span>
            </div>
          </div>

          {/* 3 Passenger Seats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Seat 1: Current Passenger (Nusrat) */}
            <div className="bg-surface-container rounded-xl p-2.5 flex flex-col items-center text-center border border-primary/40 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center font-bold text-xs mb-1 shadow-sm">
                You
              </div>
              <span className="text-[10px] font-bold text-primary">Seat 1</span>
              <p className="text-xs font-semibold text-on-surface mt-0.5 truncate w-full">
                {user?.name?.split(' ')[0] || 'You'}
              </p>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold">
                {activeRide.status}
              </span>
            </div>

            {/* Seat 2: Co-rider (Rafiq Ahmed) */}
            <div className="bg-surface-container rounded-xl p-2.5 flex flex-col items-center text-center border border-surface-container-high">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs mb-1">
                R
              </div>
              <span className="text-[10px] font-bold text-secondary">Seat 2</span>
              <p className="text-xs font-semibold text-on-surface mt-0.5 truncate w-full">Rafiq A.</p>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-secondary/20 text-secondary text-[9px] font-bold">
                Gulshan 1
              </span>
            </div>

            {/* Seat 3: Third Seat (Shirin / Available) */}
            <div className="bg-surface-container rounded-xl p-2.5 flex flex-col items-center text-center border border-dashed border-surface-container-highest">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-outline flex items-center justify-center font-bold text-xs mb-1">
                S
              </div>
              <span className="text-[10px] font-bold text-outline">Seat 3</span>
              <p className="text-xs font-semibold text-on-surface-variant mt-0.5 truncate w-full">
                Shirin A.
              </p>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[9px] font-bold">
                Boarded
              </span>
            </div>
          </div>
        </div>

        {/* Fare Summary Breakdown */}
        <div className="bg-surface-container p-3 rounded-xl flex items-center justify-between text-xs border border-surface-container-high/40">
          <div>
            <span className="text-on-surface-variant">Your Share (Pooled 30% Off):</span>
            <div className="font-bold text-primary font-sora text-sm">
              ৳{((activeRide.final_fare_poysha || activeRide.estimated_fare_poysha) / 100).toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-outline">Payment</span>
            <div className="font-semibold text-on-surface uppercase text-xs">
              {activeRide.payment_method === 'tesla_pay' ? '⚡ TeslaPay' : '💵 Cash'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-on-surface-variant">Loading tracking...</span>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}

