'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, CAST } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { TeslaLogo } from '../../components/TeslaLogo';
import { ElectricRickshawIcon } from '../../components/ElectricRickshawIcon';
import { 
  User as UserIcon, 
  Phone, 
  Wallet, 
  Star, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Save, 
  LogOut, 
  Sparkles,
  Zap,
  MapPin,
  AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { user, switchUser, logout, updateProfile, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await ApiClient.get('/rides/history');
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMessage(language === 'bn' ? 'নাম এবং মোবাইল নম্বর খালি রাখা যাবে না।' : 'Name and mobile number cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    const res = await updateProfile({ name: name.trim(), phone: phone.trim() });
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setIsEditing(false);
      await refreshUser();
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMessage(res.error || (language === 'bn' ? 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।' : 'Failed to update profile.'));
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
          <UserIcon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-sora font-bold text-lg text-on-surface">
            {language === 'bn' ? 'লগইন করা নেই' : 'Not Signed In'}
          </h2>
          <p className="text-xs text-on-surface-variant max-w-xs mt-1">
            {language === 'bn' 
              ? 'আপনার প্রোফাইল দেখতে এবং রাইড হিস্টোরি চেক করতে লগইন করুন।'
              : 'Sign in to view your profile, manage your mobile number, and check ride history.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-sora font-bold text-xs shadow-md transition"
        >
          {language === 'bn' ? 'লগইন পৃষ্ঠায় যান' : 'Go to Sign In'}
        </button>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4 pb-20">
      {/* Header Profile Card */}
      <div className="bg-surface-container-low rounded-2xl p-5 border border-surface-container-high/60 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container font-sora font-bold flex items-center justify-center text-xl shadow-md border-2 border-primary/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sora font-bold text-base text-on-surface">{user.name}</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                  <TeslaLogo className="w-2.5 h-2.5" />
                  {user.role === 'driver' ? (language === 'bn' ? 'টেসলা পাইলট' : 'Tesla Pilot') : (language === 'bn' ? 'যাত্রী' : 'Passenger')}
                </span>
              </div>
              <p className="text-xs font-mono text-on-surface-variant mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-primary" />
                {user.phone}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-xs font-semibold text-on-surface border border-surface-container-highest transition active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>{isEditing ? (language === 'bn' ? 'বাতিল' : 'Cancel') : (language === 'bn' ? 'পরিবর্তন' : 'Edit')}</span>
          </button>
        </div>

        {/* Quick Stats Grid with Rickshaw & Tesla Icons */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-surface-container-high/50">
          <div className="bg-surface-container rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-secondary text-xs font-bold font-sora">
              <Star className="w-3.5 h-3.5 fill-secondary" />
              <span>{user.rating_avg.toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">{t('rating')}</p>
          </div>

          <div className="bg-surface-container rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-primary text-xs font-bold font-sora">
              <ElectricRickshawIcon className="w-4 h-4" />
              <span>{user.total_rides}</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">{t('pools_taken')}</p>
          </div>

          <div className="bg-surface-container rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-on-surface text-xs font-bold font-sora">
              <TeslaLogo className="w-3.5 h-3.5 text-primary" />
              <span>৳{(user.tesla_pay_balance_poysha / 100).toFixed(0)}</span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">TeslaPay</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Card */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-surface-container-low rounded-2xl p-5 border border-primary/40 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sora font-bold text-sm text-on-surface flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              {language === 'bn' ? 'ব্যক্তিগত তথ্য পরিবর্তন' : 'Edit Personal Info'}
            </h3>
            <span className="text-[10px] text-on-surface-variant">
              {language === 'bn' ? 'তাৎক্ষণিক আপডেট' : 'Instant update'}
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {t('full_name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nusrat Jahan"
              className="w-full bg-surface-container-high border border-surface-container-highest rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              {t('mobile_number')} {language === 'bn' ? '(ঢাকা / বাংলাদেশ)' : '(Dhaka / Bangladesh)'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +8801712892401"
              className="w-full bg-surface-container-high border border-surface-container-highest rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              required
            />
            <p className="text-[10px] text-on-surface-variant">
              {language === 'bn' 
                ? 'এই মোবাইল নম্বরটি চালকের সাথে যোগাযোগ ও লগইনের জন্য ব্যবহৃত হবে।'
                : 'This mobile number is used for rider contact & login OTP.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-sora font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : t('save_changes')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setName(user.name);
                setPhone(user.phone);
                setErrorMessage(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-semibold text-xs border border-surface-container-highest transition"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {language === 'bn' 
              ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে! নাম ও মোবাইল নম্বর সংরক্ষিত।' 
              : 'Profile updated successfully! Name and mobile number are persisted.'}
          </span>
        </div>
      )}

      {/* TeslaPay Wallet Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/30">
            <TeslaLogo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant font-medium">{t('wallet_balance')}</p>
            <h4 className="font-sora font-bold text-sm text-on-surface">
              ৳{(user.tesla_pay_balance_poysha / 100).toFixed(2)}{' '}
              <span className="text-[11px] text-on-surface-variant font-normal">
                ({user.tesla_pay_balance_poysha} {language === 'bn' ? 'পয়সা' : 'poysha'})
              </span>
            </h4>
          </div>
        </div>

        <button
          onClick={() => alert(language === 'bn' ? 'টেসলাপেই অটো-রিচার্জ: +৳৫০০ ওয়ালেটে যোগ হয়েছে!' : 'TeslaPay auto-reload simulated: +৳500 added to wallet!')}
          className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-xs font-semibold text-primary border border-surface-container-highest transition active:scale-95"
        >
          {t('top_up')}
        </button>
      </div>

      {/* Story Cast Quick-Switch Card */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-sora font-bold text-xs text-on-surface flex items-center gap-1.5">
            <ElectricRickshawIcon className="w-3.5 h-3.5 text-primary" />
            <span>{language === 'bn' ? 'টেস্ট কাস্ট সুইচার' : 'Story Cast Switcher'}</span>
          </h4>
          <span className="text-[10px] text-on-surface-variant">PRD Section 1</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => switchUser(CAST.NUSRAT)}
            className={`p-2 rounded-xl text-left border text-xs transition ${
              user.id === CAST.NUSRAT
                ? 'bg-primary/15 border-primary text-primary font-bold'
                : 'bg-surface-container border-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
          >
            <p className="font-semibold truncate">{language === 'bn' ? 'নুসরাত জাহান' : 'Nusrat Jahan'}</p>
            <p className="text-[10px] text-on-surface-variant">{language === 'bn' ? 'বনানী → মহাখালী' : 'Banani → Mohakhali'}</p>
          </button>

          <button
            onClick={() => switchUser(CAST.RAFIQ)}
            className={`p-2 rounded-xl text-left border text-xs transition ${
              user.id === CAST.RAFIQ
                ? 'bg-primary/15 border-primary text-primary font-bold'
                : 'bg-surface-container border-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
          >
            <p className="font-semibold truncate">{language === 'bn' ? 'রফিক আহমেদ' : 'Rafiq Ahmed'}</p>
            <p className="text-[10px] text-on-surface-variant">{language === 'bn' ? 'বনানী → গুলশান ১' : 'Banani → Gulshan 1'}</p>
          </button>

          <button
            onClick={() => switchUser(CAST.SHIRIN)}
            className={`p-2 rounded-xl text-left border text-xs transition ${
              user.id === CAST.SHIRIN
                ? 'bg-primary/15 border-primary text-primary font-bold'
                : 'bg-surface-container border-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
          >
            <p className="font-semibold truncate">{language === 'bn' ? 'শিরিন আক্তার' : 'Shirin Akter'}</p>
            <p className="text-[10px] text-on-surface-variant">{language === 'bn' ? '৩য় সিট যাত্রী' : '3rd Seat Contender'}</p>
          </button>

          <button
            onClick={() => switchUser(CAST.JASHIM)}
            className={`p-2 rounded-xl text-left border text-xs transition ${
              user.id === CAST.JASHIM
                ? 'bg-primary/15 border-primary text-primary font-bold'
                : 'bg-surface-container border-surface-container-high text-on-surface hover:bg-surface-bright'
            }`}
          >
            <p className="font-semibold truncate flex items-center gap-1">
              <TeslaLogo className="w-2.5 h-2.5" />
              <span>{language === 'bn' ? 'পাইলট জসিম' : 'Pilot Jashim'}</span>
            </p>
            <p className="text-[10px] text-on-surface-variant">{language === 'bn' ? 'বুলেট ৩-সিট টেসলা' : 'Bullet (3-seat EV)'}</p>
          </button>
        </div>
      </div>

      {/* Ride History Section */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-sora font-bold text-sm text-on-surface flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            {t('my_history')}
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {history.length} {language === 'bn' ? 'টি ট্রিপ' : 'Trips'}
          </span>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6 text-xs text-on-surface-variant">
            {language === 'bn' ? 'রাইড হিস্টোরি লোড হচ্ছে...' : 'Loading your ride history...'}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6 space-y-1.5">
            <p className="text-xs text-on-surface-variant">
              {language === 'bn' 
                ? `${user.name}-এর কোনো পূর্ববর্তী ট্রিপ নেই।`
                : `No trips recorded for ${user.name} yet.`}
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-primary font-bold hover:underline"
            >
              {language === 'bn' ? 'প্রথম টেসলা রিকশা পুল বুক করুন →' : 'Book your first micro-pool trip →'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((ride) => (
              <div
                key={ride.id}
                className="bg-surface-container rounded-xl p-3 border border-surface-container-high/50 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{ride.pickup_area?.name || (language === 'bn' ? 'বনানী' : 'Banani')}</span>
                    <span className="text-on-surface-variant">→</span>
                    <span>{ride.destination_area?.name || (language === 'bn' ? 'মহাখালী' : 'Mohakhali')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                    <span>{new Date(ride.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{ride.seats_needed} {language === 'bn' ? 'সিট' : (ride.seats_needed > 1 ? 'seats' : 'seat')}</span>
                    <span>•</span>
                    <span className="uppercase text-primary font-bold">{ride.status}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-sora font-bold text-sm text-primary">
                    ৳{((ride.final_fare_poysha || ride.estimated_fare_poysha) / 100).toFixed(2)}
                  </div>
                  <span className="text-[9px] uppercase font-semibold text-on-surface-variant">
                    {ride.is_pooled ? (language === 'bn' ? 'শেয়ার্ড (৩০% ছাড়)' : 'Pooled (30% off)') : (language === 'bn' ? 'একক' : 'Solo')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout / Switch View Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="flex-1 py-3 rounded-xl bg-surface-container-high hover:bg-error/20 hover:text-error text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 border border-surface-container-highest"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </div>
  );
}
