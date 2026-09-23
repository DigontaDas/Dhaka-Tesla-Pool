'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../lib/api';

export default function HistoryPage() {
  const { user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    ApiClient.get('/rides/history').then((res) => {
      if (res.success && res.data) {
        setRides(res.data);
      }
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Stats Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora font-bold text-xl text-on-surface">Your Ride History</h1>
          <p className="text-xs text-on-surface-variant">
            All electric micro-pool trips for {user?.name}
          </p>
        </div>

        <div className="bg-surface-container-high px-3 py-1.5 rounded-full border border-surface-container-highest">
          <span className="text-xs font-bold text-primary font-sora">
            {rides.length} {rides.length === 1 ? 'Trip' : 'Trips'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-on-surface-variant">Loading trip records...</span>
        </div>
      ) : rides.length === 0 ? (
        <div className="py-16 text-center bg-surface-container-low rounded-2xl border border-surface-container-high/60 p-6 flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-outline">history</span>
          <p className="text-sm font-semibold text-on-surface">No rides found yet</p>
          <p className="text-xs text-on-surface-variant">
            Request your first pooled seat from Banani!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rides.map((ride) => {
            const fareBDT = ((ride.final_fare_poysha || ride.estimated_fare_poysha) / 100).toFixed(2);
            return (
              <div
                key={ride.id}
                className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="font-sora font-bold text-sm text-on-surface">
                      {ride.pickup_area?.name || 'Banani'} → {ride.destination_area?.name || 'Mohakhali'}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ride.status === 'completed'
                        ? 'bg-primary/20 text-primary'
                        : ride.status === 'cancelled'
                        ? 'bg-error-container text-error'
                        : 'bg-secondary/20 text-secondary'
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container-high/40">
                  <div className="flex items-center gap-3">
                    <span>
                      {ride.seats_needed} {ride.seats_needed === 1 ? 'seat' : 'seats'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{ride.payment_method}</span>
                    <span>•</span>
                    <span>{new Date(ride.requested_at).toLocaleDateString()}</span>
                  </div>

                  <div className="font-sora font-bold text-sm text-primary">
                    ৳{fareBDT}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
