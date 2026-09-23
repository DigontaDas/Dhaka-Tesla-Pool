'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, CAST } from '../../context/AuthContext';
import { ApiClient } from '../../lib/api';
import { TeslaLogo } from '../../components/TeslaLogo';
import { ElectricRickshawIcon } from '../../components/ElectricRickshawIcon';
import { BatteryCharging, Store, Car, CheckCircle2, Radar, Shield } from 'lucide-react';

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
      alert(res.error || 'যাত্রীকে পুলে যুক্ত করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDriverArrive = async () => {
    setActionLoading(true);
    const res = await ApiClient.patch('/drivers/arrive');
    setActionLoading(false);
    if (res.success) {
      fetchDriverData();
    } else {
      alert(res.error || 'স্ট্যান্ডে পৌঁছানোর আপডেট ব্যর্থ');
    }
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    const res = await ApiClient.patch('/drivers/start');
    setActionLoading(false);
    if (res.success) {
      fetchDriverData();
    } else {
      alert(res.error || 'ট্রিপ শুরু করা যায়নি');
    }
  };

  const handleCompleteTrip = async () => {
    setActionLoading(true);
    const res = await ApiClient.patch('/drivers/complete');
    setActionLoading(false);
    if (res.success) {
      alert('ট্রিপ সফলভাবে সমাপ্ত! সকল যাত্রীর ভাড়া একাউন্টে জমা হয়েছে।');
      fetchDriverData();
    } else {
      alert(res.error || 'ট্রিপ সমাপ্ত করা যায়নি');
    }
  };

  const pool = activeData?.active_pool;
  const vehicle = activeData?.vehicle;
  const occupiedSeats = pool?.occupied_seats || 0;
  const maxCapacity = pool?.max_capacity || 3;
  const isFull = occupiedSeats >= maxCapacity;

  return (
    <div className="flex flex-col gap-4 font-sans pb-16">
      {/* Driver Cockpit Header - STRICTLY BANGLA */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/30">
              <TeslaLogo size={16} color="#feb700" />
            </div>
            <div>
              <h1 className="font-sora font-extrabold text-lg text-on-surface flex items-center gap-1.5">
                <span>পাইলট ককপিট</span>
                <span className="text-secondary text-sm font-bold">· জসিম উদ্দিন</span>
              </h1>
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1 font-mono">
                <span>বুলেট টেসলা রিকশা</span> • <span>ঢাকা মেট্রো-থ-১৪-৮৮২১</span>
              </p>
            </div>
          </div>
        </div>

        {/* Battery & Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full border border-surface-container-highest shadow-xs">
            <BatteryCharging className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary font-sora">
              চার্জ {vehicle?.battery_pct || 86}%
            </span>
          </div>
        </div>
      </div>

      {/* Bullet Fleet Pod Status Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-primary/30">
              <ElectricRickshawIcon size={24} color="#46f1c5" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-sm text-on-surface flex items-center gap-1.5">
                <span>বুলেট ৩-সিট টেসলা ই-রিকশা</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  ক্যাবিন
                </span>
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                সিট বুকিং: {occupiedSeats} / {maxCapacity} টি আসন পূর্ণ
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isFull
                ? 'bg-error-container text-error'
                : pool
                ? 'bg-primary/20 text-primary'
                : 'bg-surface-container text-outline'
            }`}
          >
            {isFull ? 'রিকশা পূর্ণ (৩/৩)' : pool ? `${occupiedSeats} টি বুকড` : 'অপেক্ষারত'}
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
                  সিট {seatNum}
                </span>
                <p className="text-xs font-semibold text-on-surface mt-0.5 truncate w-full">
                  {passenger ? passenger.name.split(' ')[0] : 'খালি আসন'}
                </p>
                <span
                  className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    member
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  {member ? 'যাত্রী উঠেছে' : 'ফাঁকা'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active Trip Progression Actions in Bengali */}
        {pool && (
          <div className="pt-2 border-t border-surface-container-high/60 flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-outline">
              ট্রিপ নিয়ন্ত্রণ প্যানেল (Trip Controls)
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDriverArrive}
                disabled={actionLoading || pool.status !== 'matched'}
                className="py-2.5 px-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface disabled:opacity-40 flex flex-col items-center gap-1 transition active:scale-95 border border-surface-container-highest"
              >
                <Store className="w-4 h-4 text-secondary" />
                <span className="text-[11px]">স্ট্যান্ডে পৌঁছেছি</span>
              </button>

              <button
                type="button"
                onClick={handleStartTrip}
                disabled={actionLoading || pool.status !== 'driver_arrived'}
                className="py-2.5 px-2 rounded-xl bg-primary-container text-on-primary-fixed text-xs font-bold disabled:opacity-40 flex flex-col items-center gap-1 shadow-sm transition active:scale-95"
              >
                <Car className="w-4 h-4" />
                <span className="text-[11px]">ট্রিপ শুরু</span>
              </button>

              <button
                type="button"
                onClick={handleCompleteTrip}
                disabled={actionLoading || pool.status !== 'started'}
                className="py-2.5 px-2 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold disabled:opacity-40 flex flex-col items-center gap-1 shadow-sm transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[11px]">ট্রিপ সমাপ্ত</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Ride Requests Queue */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-sora font-bold text-sm text-on-surface flex items-center gap-1.5">
            <Radar className="w-4 h-4 text-primary" />
            <span>আশেপাশের যাত্রীদের রিকোয়েস্ট ({incomingRequests.length})</span>
          </h3>
          <span className="text-[11px] text-on-surface-variant font-medium">বনানী রোড ১১ স্ট্যান্ড</span>
        </div>

        {incomingRequests.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/40 text-center flex flex-col items-center gap-1.5">
            <Radar className="w-6 h-6 text-outline" />
            <p className="text-xs font-semibold text-on-surface">বর্তমানে নতুন কোনো যাত্রী রিকোয়েস্ট নেই</p>
            <p className="text-[11px] text-on-surface-variant">
              উপরের স্যুইচার থেকে নুসরাত, রফিক বা শিরিন হয়ে সিট রিকোয়েস্ট পাঠান!
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
                      {req.pickup_area?.name} → {req.destination_area?.name} ({req.seats_needed} সিট)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary font-sora">
                      ৳{((req.estimated_fare_poysha || 0) / 100).toFixed(2)}
                    </div>
                    <span className="text-[9px] text-outline uppercase font-semibold">
                      {req.payment_method === 'cash' ? 'নগদ ক্যাশ' : 'টেসলাপেই'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading || isFull}
                    onClick={() => handleAcceptRide(req.id)}
                    className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-fixed text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-sm"
                  >
                    {isFull ? 'সিট নেই' : 'পুলে নিন'}
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
