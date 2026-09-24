'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, CAST } from '../context/AuthContext';
import { ApiClient } from '../lib/api';
import { useRouter } from 'next/navigation';
import { UberLiveMap } from '../components/UberLiveMap';
import { useLanguage } from '../context/LanguageContext';
import { TeslaLogo } from '../components/TeslaLogo';
import { ElectricRickshawIcon } from '../components/ElectricRickshawIcon';
import { Zap, Radio, Shield, Star, Users } from 'lucide-react';

export default function BookRidePage() {
  const { user, role, switchUser } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [areas, setAreas] = useState<any[]>([]);
  const [pickupId, setPickupId] = useState<string>('a1000000-0000-0000-0000-000000000001'); // Banani
  const [destinationId, setDestinationId] = useState<string>('a1000000-0000-0000-0000-000000000003'); // Mohakhali
  const [seatsNeeded, setSeatsNeeded] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'tesla_pay'>('cash');
  const [autoAssign, setAutoAssign] = useState<boolean>(true); // Uber instant auto-match by default
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Seamlessly switch to Passenger Nusrat if currently a driver on booking page
  useEffect(() => {
    if (user && user.role === 'driver') {
      switchUser(CAST.NUSRAT);
    }
  }, [user]);

  // Fetch areas on load
  useEffect(() => {
    ApiClient.get('/areas').then((res) => {
      if (res.success && res.data) {
        setAreas(res.data);
      }
    });
  }, []);

  // Fetch available Tesla drivers in real-time
  const fetchAvailableDrivers = () => {
    ApiClient.get('/rides/available-drivers').then((res) => {
      if (res.success && res.data) {
        setAvailableDrivers(res.data);
      }
    });
  };

  useEffect(() => {
    fetchAvailableDrivers();
    const timer = setInterval(fetchAvailableDrivers, 2500);
    return () => clearInterval(timer);
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
      auto_assign: autoAssign,
    });

    setLoading(false);
    if (res.success && res.data) {
      setBookingSuccess(res.data.id);
      setTimeout(() => {
        router.push(`/tracking?ride_id=${res.data.id}`);
      }, 900);
    } else {
      setErrorMessage(res.error || 'Failed to request ride');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <TeslaLogo size={16} color="#46f1c5" />
            </div>
            <div>
              <h1 className="font-sora font-extrabold text-lg text-on-surface">
                {language === 'bn'
                  ? `স্বাগতম, ${user?.name?.split(' ')[0] || 'যাত্রী'}`
                  : `Hey, ${user?.name?.split(' ')[0] || 'Traveler'}`}
              </h1>
              <p className="text-[11px] text-on-surface-variant">
                {language === 'bn'
                  ? 'আজ ঢাকায় কোন রুটে শেয়ারিং রিকশায় যাবেন?'
                  : 'Where are you heading in Dhaka today?'}
              </p>
            </div>
          </div>
        </div>

        {/* Green Commute Badge */}
        <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1.5 rounded-full border border-surface-container-highest">
          <ElectricRickshawIcon size={18} color="#46f1c5" />
          <span className="text-[11px] font-bold text-primary font-sora">
            {language === 'bn' ? '১০০% ইভি' : '100% EV'}
          </span>
        </div>
      </div>

      {/* Interactive Uber Live Dhaka Transit Map */}
      <UberLiveMap
        pickupId={pickupId}
        destinationId={destinationId}
        heightClass="h-48"
        showVehicleAnimation={true}
      />

      {/* Route & Booking Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-xl flex flex-col gap-3">
        {/* Pickup Field */}
        <div className="flex items-center gap-3 bg-surface-container p-3 rounded-xl border border-surface-container-high/40">
          <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,170,0.8)] shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
              {language === 'bn' ? 'উঠার স্থান (পিকআপ)' : 'Pickup Point'}
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
              {language === 'bn' ? 'নামার স্থান (গন্তব্য)' : 'Destination'}
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
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">
              {language === 'bn' ? 'সিট সংখ্যা' : 'Seats'}
            </span>
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
                  {num} {language === 'bn' ? 'টি' : num === 1 ? 'seat' : 'seats'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-1 bg-surface-container p-2.5 rounded-xl border border-surface-container-high/40">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">
              {language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment'}
            </span>
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
                💵 {language === 'bn' ? 'নগদ ক্যাশ' : 'Cash'}
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
                ⚡ {language === 'bn' ? 'টেসলাপেই' : 'TeslaPay'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Fare Estimation Breakdown (PRD Section 5) */}
        {estimate && (
          <div className="bg-surface-container-lowest/80 rounded-xl p-3 border border-primary/20 flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TeslaLogo size={14} color="#46f1c5" />
                <span className="text-xs font-bold text-primary uppercase font-sora">
                  {language === 'bn' ? 'শেয়ারিং ভাড়া (৩০% সাশ্রয়ী)' : 'Pooled Fare (30% Off)'}
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
              <span>{language === 'bn' ? `দূরত্ব: ${estimate.distance_km} কিমি` : `Distance: ${estimate.distance_km} km`}</span>
              <span className="text-secondary font-semibold">
                {language === 'bn'
                  ? `বুলেট রিকশায় সাশ্রয় ৳${estimate.savings_bdt.toFixed(2)}`
                  : `Save ৳${estimate.savings_bdt.toFixed(2)} with Bullet!`}
              </span>
            </div>
          </div>
        )}

        {/* Available Tesla Pilots Nearby (Live Stand Fleet) */}
        <div className="bg-surface-container rounded-2xl p-3 border border-surface-container-high/60 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-bold text-on-surface font-sora">
                {language === 'bn' ? 'নিকটস্থ উপলব্ধ টেসলা পাইলট' : 'Available Tesla Pilots Nearby'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {availableDrivers.length > 0 ? `${availableDrivers.length} Online` : '1 Online'}
            </span>
          </div>

          {availableDrivers.length > 0 ? (
            availableDrivers.map((d: any) => (
              <div
                key={d.id}
                className="bg-surface-container-low rounded-xl p-2.5 border border-surface-container-high/40 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs flex items-center justify-center shrink-0 border border-primary/30">
                    JU
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-on-surface truncate">{d.name}</p>
                      <span className="text-[10px] text-secondary font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-secondary" />
                        {d.rating_avg}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {d.vehicle?.name || 'Bullet'} · {language === 'bn' ? d.stand_name_bn : d.stand_name}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold text-primary flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-secondary" />
                    <span>{d.vehicle?.battery_pct || 86}%</span>
                  </div>
                  <span className="text-[9px] text-on-surface-variant">
                    {d.available_seats || 3} {language === 'bn' ? 'আসন ফাঁকা' : 'seats open'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-surface-container-low rounded-xl p-2.5 border border-surface-container-high/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ElectricRickshawIcon className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs font-bold text-on-surface">জসিম উদ্দিন (Jashim Uddin)</p>
                  <p className="text-[10px] text-on-surface-variant">বুলেট ৩-সিট টেসলা ই-রিকশা · বনানী স্ট্যান্ড</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">★ ৪.৯</span>
            </div>
          )}

          {/* Dispatch Mode Selector (Uber Auto-Assign vs Stand Broadcast) */}
          <div className="mt-1 pt-2 border-t border-surface-container-high/50 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-outline">
              {language === 'bn' ? 'বরাদ্দ মোড (Dispatch Mode)' : 'Dispatch Mode'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAutoAssign(true)}
                className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                  autoAssign
                    ? 'bg-primary-container/20 border-primary text-primary shadow-xs'
                    : 'bg-surface-container-low border-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs font-sora">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'উবার অটো-অ্যাসাইন' : 'Uber Auto-Assign'}</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5 leading-tight">
                  {language === 'bn' ? 'মুহূর্তেই চালক বরাদ্দ' : 'Instant 1-click match'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAutoAssign(false)}
                className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                  !autoAssign
                    ? 'bg-secondary-container/20 border-secondary text-secondary shadow-xs'
                    : 'bg-surface-container-low border-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs font-sora">
                  <Radio className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'স্ট্যান্ড ব্রডকাস্ট' : 'Stand Broadcast'}</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5 leading-tight">
                  {language === 'bn' ? 'চালক ককপিটে গ্রহণ করবেন' : 'Driver accepts in cockpit'}
                </p>
              </button>
            </div>
          </div>
        </div>

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
            <span>
              {language === 'bn'
                ? 'রিকশা রিকোয়েস্ট সফল! পাইলট জসিমের সাথে যুক্ত হচ্ছে...'
                : 'Ride requested! Connecting with Bullet & Jashim...'}
            </span>
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
              <span>{language === 'bn' ? 'টেসলা রিকশা খোঁজা হচ্ছে...' : 'Matching Tesla Pod...'}</span>
            </>
          ) : (
            <>
              <span>
                {language === 'bn'
                  ? 'টেসলা রিকশা পুল নিশ্চিত করুন'
                  : 'Confirm & Request Tesla Micro-Pool'}
              </span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
