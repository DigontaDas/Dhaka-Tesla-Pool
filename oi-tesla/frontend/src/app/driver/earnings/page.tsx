'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../lib/api';
import { TeslaLogo } from '../../../components/TeslaLogo';
import { ElectricRickshawIcon } from '../../../components/ElectricRickshawIcon';
import { Wallet, Star, BatteryCharging, ArrowDownLeft, Shield } from 'lucide-react';

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
    <div className="flex flex-col gap-4 font-sans pb-16">
      {/* Header in Bangla */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/30">
              <TeslaLogo size={16} color="#feb700" />
            </div>
            <div>
              <h1 className="font-sora font-extrabold text-lg text-on-surface">
                পাইলট আয় ও হিসাব (Earnings)
              </h1>
              <p className="text-[11px] text-on-surface-variant">দৈনিক ভাড়া আদায় ও টেসলাপেই ওয়ালেট খতিয়ান</p>
            </div>
          </div>
        </div>
        <div className="bg-secondary-container px-3 py-1 rounded-full text-on-secondary-container font-sora text-xs font-bold shadow-xs">
          জসিম উদ্দিন
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl text-secondary animate-spin">
            progress_activity
          </span>
          <span className="text-xs text-on-surface-variant">ওয়ালেট খতিয়ান লোড হচ্ছে...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Big Balance Card */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-surface-container-high/60 shadow-xl relative overflow-hidden flex flex-col gap-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-secondary" />
                মোট টেসলাপেই ওয়ালেট ব্যালেন্স
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                নগদ উত্তোলনযোগ্য
              </span>
            </div>
            <div className="font-sora text-3xl font-extrabold text-secondary mt-1">
              ৳{(earnings?.total_balance_bdt || 5000).toFixed(2)}
            </div>
            <span className="text-[11px] text-outline mt-1 font-mono">
              পূর্ণ সংখ্যা খতিয়ান: {earnings?.total_balance_poysha || 500000} পয়সা
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md">
              <span className="text-[11px] text-on-surface-variant">আজকের অর্জিত ভাড়া</span>
              <div className="font-sora font-bold text-lg text-primary mt-0.5">
                ৳{(earnings?.today_earnings_bdt || 286).toFixed(2)}
              </div>
              <span className="text-[10px] text-outline">৮ টি ট্রিপ সফলভাবে সম্পন্ন</span>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md">
              <span className="text-[11px] text-on-surface-variant">পাইলট রেটিং</span>
              <div className="font-sora font-bold text-lg text-secondary mt-0.5 flex items-center gap-1">
                <Star className="w-4 h-4 fill-secondary" />
                <span>{earnings?.rating || 4.9}</span>
              </div>
              <span className="text-[10px] text-outline">১,৪২০ টি সম্পন্ন পুল</span>
            </div>
          </div>

          {/* Vehicle Battery & Efficiency */}
          <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-primary/30">
                <ElectricRickshawIcon size={22} color="#46f1c5" />
              </div>
              <div>
                <p className="font-sora font-bold text-sm text-on-surface">বুলেট টেসলা ব্যাটারি প্যাক</p>
                <p className="text-xs text-on-surface-variant">সুপার-৩ লিথিয়াম প্যাক · ৪৮ ভোল্ট ইভি</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary font-sora flex items-center gap-1 justify-end">
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>{earnings?.vehicle_battery_pct || 86}%</span>
              </div>
              <span className="text-[10px] text-outline">~৪৫ কিমি বাকি রেঞ্জ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
