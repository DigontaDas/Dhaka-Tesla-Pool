'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { PilotChatModal } from '../../components/PilotChatModal';
import { CallPilotModal } from '../../components/CallPilotModal';
import { UberLiveMap } from '../../components/UberLiveMap';
import { TeslaLogo } from '../../components/TeslaLogo';
import { ElectricRickshawIcon } from '../../components/ElectricRickshawIcon';

function TrackingContent() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeRide, setActiveRide] = useState<any>(null);
  const [activePool, setActivePool] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isCallOpen, setIsCallOpen] = useState<boolean>(false);

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
    const confirmMsg = language === 'bn' 
      ? 'এই পুল রাইড বাতিল করবেন? ম্যাচিং ফি ৳১০ প্রযোজ্য হবে।' 
      : 'Cancel this pool ride? Match fee ৳10 applies.';
    if (!confirm(confirmMsg)) return;
    setCancelling(true);
    const res = await ApiClient.patch(`/rides/${activeRide.id}/cancel`, {
      reason: 'Cancelled by passenger',
    });
    setCancelling(false);
    if (res.success) {
      alert(language === 'bn' ? 'রাইড সফলভাবে বাতিল করা হয়েছে।' : 'Ride cancelled successfully.');
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
          {t('connecting_telemetry')}
        </span>
      </div>
    );
  }

  if (!activeRide) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
          <ElectricRickshawIcon className="w-12 h-12" />
        </div>
        <div>
          <h2 className="font-sora font-bold text-lg text-on-surface">{t('no_active_ride')}</h2>
          <p className="text-xs text-on-surface-variant max-w-xs mt-1">
            {t('no_active_ride_desc')}
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-full bg-primary-container text-on-primary-fixed font-bold text-xs shadow-md hover:bg-primary transition"
        >
          {t('book_ride_now')}
        </button>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'requested':
        return { 
          text: language === 'bn' ? 'কাছের টেসলা রিকশা খোঁজা হচ্ছে...' : 'Searching for Pool Pod...', 
          badge: language === 'bn' ? 'পাইলটের অপেক্ষা' : 'Waiting for Pilot', 
          color: 'primary' 
        };
      case 'matched':
        return { 
          text: language === 'bn' ? 'রিকশা ম্যাচ হয়েছে এবং আসছে' : 'Matched & On the Way', 
          badge: language === 'bn' ? '৩ মিনিট বাকি' : '3 mins away', 
          color: 'primary' 
        };
      case 'driver_arrived':
        return { 
          text: language === 'bn' ? 'বুলেট রিকশা স্ট্যান্ডে পৌঁছেছে!' : 'Bullet Arrived at Stand!', 
          badge: language === 'bn' ? 'এখনই উঠুন' : 'Board Now', 
          color: 'secondary' 
        };
      case 'started':
        return { 
          text: language === 'bn' ? 'যাত্রা চলছে' : 'Trip In Progress', 
          badge: language === 'bn' ? 'ঢাকা এক্সপ্রেসওয়ে' : 'Cruising Dhaka', 
          color: 'primary' 
        };
      case 'completed':
        return { 
          text: language === 'bn' ? 'যাত্রা সফলভাবে সম্পন্ন হয়েছে' : 'Trip Completed', 
          badge: language === 'bn' ? 'নিরাপদে পৌঁছেছেন' : 'Arrived Safe', 
          color: 'primary' 
        };
      case 'cancelled':
        return { 
          text: language === 'bn' ? 'রাইড বাতিল করা হয়েছে' : 'Ride Cancelled', 
          badge: language === 'bn' ? 'বাতিল' : 'Cancelled', 
          color: 'error' 
        };
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

          <div className="flex items-center gap-1.5 text-secondary text-xs font-bold font-sora">
            <TeslaLogo className="w-3.5 h-3.5 text-secondary" />
            <span>{language === 'bn' ? 'ইকো-ফাস্ট টেসলা' : 'Tesla Eco-Fast'}</span>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between relative z-10">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              {t('pickup_stand')}
            </p>
            <h2 className="font-sora text-lg text-on-surface font-bold">
              {activeRide.pickup_area?.name || (language === 'bn' ? 'বনানী' : 'Banani')}
            </h2>
            <p className="text-xs text-primary font-semibold mt-0.5">
              {t('heading_to')} {activeRide.destination_area?.name || (language === 'bn' ? 'মহাখালী' : 'Mohakhali')}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-surface-container rounded-lg text-xs font-bold text-on-surface border border-surface-container-high">
              {statusInfo.badge}
            </span>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {language === 'bn' ? 'হালকা জ্যাম' : 'Mild traffic'}
            </p>
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

      {/* Interactive Uber Live Map Radar */}
      <UberLiveMap
        pickupId={activeRide.pickup_area_id}
        destinationId={activeRide.destination_area_id}
        heightClass="h-52"
        showVehicleAnimation={activeRide.status !== 'cancelled' && activeRide.status !== 'completed'}
      />

      {/* Driver & Vehicle Profile Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center text-lg shadow-md border-2 border-primary/30">
              JU
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-sora font-bold text-sm text-on-surface">
                  {language === 'bn' ? 'জসিম উদ্দিন (পাইলট)' : 'Jashim Uddin'}
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold flex items-center gap-0.5">
                  <TeslaLogo className="w-2.5 h-2.5" />
                  Pilot
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex items-center text-xs font-bold text-secondary">
                  <span className="material-symbols-outlined text-xs mr-0.5">star</span>
                  4.9
                </span>
                <span className="text-xs text-on-surface-variant">
                  • {language === 'bn' ? '১,৪২০টি পুল সফল' : '1,420 pools completed'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high rounded-full text-xs font-bold text-primary border border-surface-container-highest">
              <span className="material-symbols-outlined text-xs">electric_bolt</span> 86%
            </span>
          </div>
        </div>

        {/* Vehicle Badge - Authentic Electric Rickshaw with Tesla T Badge */}
        <div className="bg-surface-container rounded-xl p-2.5 flex items-center justify-between border border-surface-container-high/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 border border-primary/30 shadow-sm">
              <ElectricRickshawIcon className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-on-surface truncate">
                  {language === 'bn' ? 'বুলেট (Bullet) · টেসলা সুপার-৩ রিকশা' : 'Bullet · Super-3 Tesla E-Rickshaw'}
                </p>
                <TeslaLogo className="w-3 h-3 text-primary shrink-0" />
              </div>
              <p className="text-[10px] text-on-surface-variant font-mono">ঢাকা মেট্রো-থ-১৪-৮৮২১ (DH-Metro-TH-14-8821)</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container-highest text-primary shrink-0">
            {language === 'bn' ? 'নীরব ইভি' : 'Quiet EV'}
          </span>
        </div>

        {/* Quick Driver Actions */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsCallOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-surface-container-high hover:bg-surface-bright active:scale-95 transition rounded-xl text-on-surface text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm text-primary">phone</span>
            <span>{t('call_pilot')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-surface-container-high hover:bg-surface-bright active:scale-95 transition rounded-xl text-on-surface text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm text-primary">chat</span>
            <span>{t('message_pilot')}</span>
          </button>
          <button
            type="button"
            disabled={cancelling || activeRide.status === 'completed' || activeRide.status === 'cancelled'}
            onClick={handleCancelRide}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-surface-container-high hover:bg-error-container hover:text-on-error-container active:scale-95 transition rounded-xl text-error text-xs font-semibold disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            <span>{t('cancel_ride')}</span>
          </button>
        </div>
      </div>

      {/* Interactive 3-Seat Pool Matrix Cockpit (PRD Section 3 & 12) */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ElectricRickshawIcon className="w-5 h-5 text-primary" />
            <div>
              <h4 className="font-sora font-bold text-sm text-on-surface">{t('pool_visualization')}</h4>
              <p className="text-xs text-on-surface-variant">
                {language === 'bn' ? 'রিয়েল-টাইম ৩-সিট কেবিন লেআউট ও সহযাত্রী' : 'Real-time cabin layout & co-rider stops'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center gap-1">
            <TeslaLogo className="w-2.5 h-2.5" />
            {t('seat_occupancy')}
          </span>
        </div>

        {/* Pod Interior Schematic */}
        <div className="bg-surface-container-lowest rounded-xl p-3 border border-surface-container-high/40 relative">
          {/* Driver Cockpit Header */}
          <div className="flex items-center justify-center pb-2 mb-2 border-b border-surface-container-high/40">
            <div className="px-3 py-1 bg-surface-container-high rounded-full flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-xs text-primary">airline_seat_recline_extra</span>
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {t('cockpit_header')}
              </span>
            </div>
          </div>

          {/* 3 Passenger Seats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Seat 1: Current Passenger (Nusrat) */}
            <div className="bg-surface-container rounded-xl p-2.5 flex flex-col items-center text-center border border-primary/40 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center font-bold text-xs mb-1 shadow-sm">
                {t('you')}
              </div>
              <span className="text-[10px] font-bold text-primary">{t('seat')} ১</span>
              <p className="text-xs font-semibold text-on-surface mt-0.5 truncate w-full">
                {user?.name?.split(' ')[0] || (language === 'bn' ? 'নুসরাত' : 'You')}
              </p>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold">
                {activeRide.status}
              </span>
            </div>

            {/* Seat 2: Co-rider (Rafiq Ahmed) */}
            <div className="bg-surface-container rounded-xl p-2.5 flex flex-col items-center text-center border border-surface-container-high">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs mb-1">
                র
              </div>
              <span className="text-[10px] font-bold text-secondary">{t('seat')} ২</span>
              <p className="text-xs font-semibold text-on-surface mt-0.5 truncate w-full">
                {language === 'bn' ? 'রফিক আহমেদ' : 'Rafiq A.'}
              </p>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-secondary/20 text-secondary text-[9px] font-bold">
                {language === 'bn' ? 'গুলশান ১' : 'Gulshan 1'}
              </span>
            </div>

            {/* Seat 3: Third Seat (Shirin / Available) */}
            <div className="bg-surface-container rounded-xl p-2.5 flex flex-col items-center text-center border border-dashed border-surface-container-highest">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-outline flex items-center justify-center font-bold text-xs mb-1">
                শ
              </div>
              <span className="text-[10px] font-bold text-outline">{t('seat')} ৩</span>
              <p className="text-xs font-semibold text-on-surface-variant mt-0.5 truncate w-full">
                {language === 'bn' ? 'শিরিন আক্তার' : 'Shirin A.'}
              </p>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[9px] font-bold">
                {t('boarded')}
              </span>
            </div>
          </div>
        </div>

        {/* Fare Summary Breakdown */}
        <div className="bg-surface-container p-3 rounded-xl flex items-center justify-between text-xs border border-surface-container-high/40">
          <div>
            <span className="text-on-surface-variant">{t('your_share')}</span>
            <div className="font-bold text-primary font-sora text-sm">
              ৳{((activeRide.final_fare_poysha || activeRide.estimated_fare_poysha) / 100).toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-outline">{t('payment')}</span>
            <div className="font-semibold text-on-surface uppercase text-xs flex items-center gap-1 justify-end">
              <TeslaLogo className="w-3 h-3 text-primary" />
              <span>{activeRide.payment_method === 'tesla_pay' ? (language === 'bn' ? 'টেসলাপেই' : 'TeslaPay') : (language === 'bn' ? 'ক্যাশ (নগদ)' : 'Cash')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pilot Modals */}
      <PilotChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pilotName="Jashim Uddin (জসিম)"
        vehicleName="Bullet (বুলেট)"
        plateNumber="DH-Metro-TH-14-8821"
        onCallPilot={() => {
          setIsChatOpen(false);
          setIsCallOpen(true);
        }}
      />

      <CallPilotModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        pilotName="Jashim Uddin (জসিম)"
        pilotPhone="+880 1912-345678"
        vehicleName="Bullet (DH-Metro-TH-14-8821)"
      />
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

