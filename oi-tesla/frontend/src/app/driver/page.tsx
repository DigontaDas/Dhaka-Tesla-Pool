'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, CAST } from '../../context/AuthContext';
import { ApiClient } from '../../lib/api';

export default function DriverCockpitPage() {
  const { user, switchUser } = useAuth();

  const [activeData, setActiveData] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Auto-switch to Driver Jashim if currently a passenger on driver cockpit page
  useEffect(() => {
    if (user && user.role !== 'driver') {
      switchUser(CAST.JASHIM);
    }
  }, [user]);

  const fetchDriverData = async () => {
    try {
      const [activeRes, reqsRes] = await Promise.all([
        ApiClient.get('/drivers/active'),
        ApiClient.get('/drivers/requests'),
      ]);

      if (activeRes.success && activeRes.data) {
        setActiveData(activeRes.data);
      }
      if (reqsRes.success && reqsRes.data) {
        setIncomingRequests(reqsRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
    const timer = setInterval(fetchDriverData, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleAcceptRide = async (rideId: string) => {
    setActionLoading(true);
    const res = await ApiClient.post('/drivers/accept', { ride_request_id: rideId });
    setActionLoading(false);
    if (res.success) {
      fetchDriverData();
    } else {
      alert(res.error || 'Failed to accept passenger into pool');
    }
  };

  const handleDriverArrive = async () => {
    setActionLoading(true);
    const res = await ApiClient.patch('/drivers/arrive');
    setActionLoading(false);
    if (res.success) {
      fetchDriverData();
    } else {
      alert(res.error || 'Failed to mark arrival');
    }
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    const res = await ApiClient.patch('/drivers/start');
    setActionLoading(false);
    if (res.success) {
      fetchDriverData();
    } else {
      alert(res.error || 'Failed to start trip');
    }
  };

  const handleCompleteTrip = async () => {
    setActionLoading(true);
    const res = await ApiClient.patch('/drivers/complete');
    setActionLoading(false);
    if (res.success) {
      alert('Trip completed! All passenger fares collected.');
      fetchDriverData();
    } else {
      alert(res.error || 'Failed to complete trip');
    }
  };

  const pool = activeData?.active_pool;
  const vehicle = activeData?.vehicle;
  const occupiedSeats = pool?.occupied_seats || 0;
  const maxCapacity = pool?.max_capacity || 3;
  const isFull = occupiedSeats >= maxCapacity;

  return (
    <div className="flex flex-col gap-4">
      {/* Driver Cockpit Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-sora font-bold text-xl text-on-surface">Pilot Cockpit</h1>
            <span className="text-secondary font-bold text-sm">⚡ Jashim Uddin</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Vehicle: Bullet · Plate DH-Metro-TH-14-8821
          </p>
        </div>

        {/* Battery & Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-container-high px-2.5 py-1 rounded-full border border-surface-container-highest">
            <span className="material-symbols-outlined text-xs text-primary">battery_charging_full</span>
            <span className="text-xs font-bold text-primary font-sora">
              {vehicle?.battery_pct || 86}%
            </span>
          </div>
        </div>
      </div>

      {/* Bullet Fleet Pod Status Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">electric_rickshaw</span>
            </div>
            <div>
              <h2 className="font-sora font-bold text-sm text-on-surface">
                Bullet (৩ আসনবিশিষ্ট ই-ট্যাক্সি)
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Occupancy: {occupiedSeats} / {maxCapacity} Seats Booked
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isFull
                ? 'bg-error-container text-error'
                : pool
                ? 'bg-primary/20 text-primary'
                : 'bg-surface-container text-outline'
            }`}
          >
            {isFull ? 'Pod Full (3/3)' : pool ? `${occupiedSeats} Booked` : 'Waiting'}
          </span>
        </div>

        {/* 3 Seats Visual Grid inside Driver Cockpit */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1, 2, 3].map((seatNum) => {
            const member = pool?.members?.find((m: any) => m.seat_number === seatNum);
            const passenger = member?.ride_request?.passenger;
            return (
              <div
                key={seatNum}
                className={`rounded-xl p-2.5 flex flex-col items-center text-center border transition-all ${
                  member
                    ? 'bg-surface-container border-primary/40 shadow-sm'
                    : 'bg-surface-container-lowest border-dashed border-surface-container-highest'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                    member
                      ? 'bg-primary-container text-on-primary-fixed'
                      : 'bg-surface-container-high text-outline'
                  }`}
                >
                  {seatNum}
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">
                  Seat {seatNum}
                </span>
                <p className="text-xs font-semibold text-on-surface mt-0.5 truncate w-full">
                  {passenger ? passenger.name.split(' ')[0] : 'Available'}
                </p>
                <span
                  className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    member
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {member ? member.status : 'Empty'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active Trip Progression Actions */}
        {pool && (
          <div className="pt-2 border-t border-surface-container-high/60 flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-outline">
              Trip Lifecycle Controls
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDriverArrive}
                disabled={actionLoading || pool.status !== 'matched'}
                className="py-2.5 px-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface disabled:opacity-40 flex flex-col items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-base text-secondary">
                  storefront
                </span>
                <span>Mark Arrived</span>
              </button>

              <button
                type="button"
                onClick={handleStartTrip}
                disabled={actionLoading || pool.status !== 'driver_arrived'}
                className="py-2.5 px-2 rounded-xl bg-primary-container text-on-primary-fixed text-xs font-bold disabled:opacity-40 flex flex-col items-center gap-0.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">directions_car</span>
                <span>Start Trip</span>
              </button>

              <button
                type="button"
                onClick={handleCompleteTrip}
                disabled={actionLoading || pool.status !== 'started'}
                className="py-2.5 px-2 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold disabled:opacity-40 flex flex-col items-center gap-0.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Complete Trip</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Ride Requests Queue */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sora font-bold text-sm text-on-surface">
            Nearby Passenger Requests ({incomingRequests.length})
          </h3>
          <span className="text-[11px] text-on-surface-variant font-medium">Banani Stand</span>
        </div>

        {incomingRequests.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/40 text-center flex flex-col items-center gap-1.5">
            <span className="material-symbols-outlined text-2xl text-outline">radar</span>
            <p className="text-xs font-semibold text-on-surface">No pending requests</p>
            <p className="text-[11px] text-on-surface-variant">
              Switch to Nusrat, Rafiq, or Shirin above to request a ride!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-surface-container-low rounded-2xl p-3.5 border border-surface-container-high/60 shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {req.passenger?.name?.charAt(0) || 'P'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sora font-bold text-xs text-on-surface truncate">
                      {req.passenger?.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {req.pickup_area?.name} → {req.destination_area?.name} ({req.seats_needed} seat)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary font-sora">
                      ৳{((req.estimated_fare_poysha || 0) / 100).toFixed(2)}
                    </div>
                    <span className="text-[9px] text-outline uppercase">{req.payment_method}</span>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading || isFull}
                    onClick={() => handleAcceptRide(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-fixed text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                  >
                    {isFull ? 'Full' : 'Accept'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
