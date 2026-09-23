'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/api';
import { TeslaLogo } from '../../components/TeslaLogo';
import { ElectricRickshawIcon } from '../../components/ElectricRickshawIcon';

export default function HistoryPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
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
          <div className="flex items-center gap-2">
            <TeslaLogo className="w-5 h-5 text-primary" />
            <h1 className="font-sora font-bold text-xl text-on-surface">
              {language === 'bn' ? 'রাইড হিস্টোরি' : 'Your Ride History'}
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {language === 'bn' ? `${user?.name}-এর সকল ইলেকট্রিক রিকশা ট্রিপ` : `All electric micro-pool trips for ${user?.name}`}
          </p>
        </div>

        <div className="bg-surface-container-high px-3 py-1.5 rounded-full border border-surface-container-highest flex items-center gap-1.5">
          <ElectricRickshawIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary font-sora">
            {rides.length} {language === 'bn' ? 'টি ট্রিপ' : (rides.length === 1 ? 'Trip' : 'Trips')}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-on-surface-variant">
            {language === 'bn' ? 'ট্রিপের তথ্য লোড হচ্ছে...' : 'Loading trip records...'}
          </span>
        </div>
      ) : rides.length === 0 ? (
        <div className="py-16 text-center bg-surface-container-low rounded-2xl border border-surface-container-high/60 p-6 flex flex-col items-center gap-2">
          <ElectricRickshawIcon className="w-12 h-12 text-outline" />
          <p className="text-sm font-semibold text-on-surface">
            {language === 'bn' ? 'কোনো ট্রিপের রেকর্ড পাওয়া যায়নি' : 'No rides found yet'}
          </p>
          <p className="text-xs text-on-surface-variant">
            {language === 'bn' ? 'বনানী বা গুলশান থেকে আপনার প্রথম টেসলা রিকশা পুল বুক করুন!' : 'Request your first pooled seat from Banani!'}
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
                      {ride.pickup_area?.name || (language === 'bn' ? 'বনানী' : 'Banani')} → {ride.destination_area?.name || (language === 'bn' ? 'মহাখালী' : 'Mohakhali')}
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
                      {ride.seats_needed} {language === 'bn' ? 'সিট' : (ride.seats_needed === 1 ? 'seat' : 'seats')}
                    </span>
                    <span>•</span>
                    <span className="capitalize flex items-center gap-1">
                      {ride.payment_method === 'tesla_pay' && <TeslaLogo className="w-2.5 h-2.5 inline text-primary" />}
                      {ride.payment_method === 'tesla_pay' ? (language === 'bn' ? 'টেসলাপেই' : 'TeslaPay') : (language === 'bn' ? 'ক্যাশ' : 'Cash')}
                    </span>
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
