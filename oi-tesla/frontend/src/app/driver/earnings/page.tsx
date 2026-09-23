'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../lib/api';

export default function EarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    ApiClient.get('/drivers/earnings').then((res) => {
      if (res.success && res.data) {
        setEarnings(res.data);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora font-bold text-xl text-on-surface">Pilot Earnings</h1>
          <p className="text-xs text-on-surface-variant">Daily payout & TeslaPay settlement</p>
        </div>
        <div className="bg-secondary-container px-3 py-1 rounded-full text-on-secondary-container font-sora text-xs font-bold">
          Jashim Uddin
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl text-secondary animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-on-surface-variant">Loading wallet ledger...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Big Balance Card */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-surface-container-high/60 shadow-xl relative overflow-hidden flex flex-col gap-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/15 rounded-full blur-2xl pointer-events-none" />
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total TeslaPay Wallet Balance
            </span>
            <div className="font-sora text-3xl font-extrabold text-secondary">
              ৳{(earnings?.total_balance_bdt || 5000).toFixed(2)}
            </div>
            <span className="text-[11px] text-outline mt-1">
              Integer ledger: {earnings?.total_balance_poysha || 500000} poysha
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md">
              <span className="text-[11px] text-on-surface-variant">Today's Pool Fares</span>
              <div className="font-sora font-bold text-lg text-primary mt-0.5">
                ৳{(earnings?.today_earnings_bdt || 286).toFixed(2)}
              </div>
              <span className="text-[10px] text-outline">8 trips completed</span>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md">
              <span className="text-[11px] text-on-surface-variant">Driver Rating</span>
              <div className="font-sora font-bold text-lg text-secondary mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">star</span>
                <span>{earnings?.rating || 4.9}</span>
              </div>
              <span className="text-[10px] text-outline">1,420 lifetime pools</span>
            </div>
          </div>

          {/* Vehicle Battery & Efficiency */}
          <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <div>
                <p className="font-sora font-bold text-sm text-on-surface">Bullet Battery Pack</p>
                <p className="text-xs text-on-surface-variant">Super-3 Lithium Pack · 48V</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary font-sora">
                {earnings?.vehicle_battery_pct || 86}%
              </div>
              <span className="text-[10px] text-outline">~45 km range</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
