'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, ArrowRight, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { TeslaLogo } from '../../components/TeslaLogo';
import { ElectricRickshawIcon } from '../../components/ElectricRickshawIcon';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+880');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { t, language } = useLanguage();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone === '+880') {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে পুরো নাম ও সঠিক মোবাইল নম্বর দিন।' : 'Please provide your full name and valid Bangladesh mobile number.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await register({
      name: name.trim(),
      phone: phone.trim(),
      role,
    });

    setLoading(false);

    if (res.success) {
      if (role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/');
      }
    } else {
      setErrorMessage(res.error || (language === 'bn' ? 'অ্যাকাউন্ট তৈরি করা যায়নি। অনুগ্রহ করে অন্য মোবাইল নম্বর দিয়ে চেষ্টা করুন।' : 'Failed to create account. Please try another mobile number.'));
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-surface-container-highest text-xs text-primary font-bold">
          <TeslaLogo className="w-3.5 h-3.5 text-primary" />
          <span>{language === 'bn' ? 'নতুন অ্যাকাউন্ট নিবন্ধন' : 'New Account Registration'}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <TeslaLogo className="w-7 h-7 text-primary" />
          <h1 className="font-sora font-extrabold text-2xl text-on-surface tracking-tight">
            {t('join_title')}
          </h1>
        </div>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
          {t('join_subtitle')}
        </p>
      </div>

      {/* Register Card */}
      <div className="bg-surface-container-low rounded-3xl p-6 border border-surface-container-high/60 shadow-xl space-y-5">
        <form onSubmit={handleRegister} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t('full_name')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <User className="w-4 h-4 text-primary" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanvir Hossain"
                className="w-full bg-surface-container-high border border-surface-container-highest rounded-2xl pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t('phone_number')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="w-full bg-surface-container-high border border-surface-container-highest rounded-2xl pl-10 pr-4 py-3 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                required
              />
            </div>
          </div>

          {/* Account Role Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {language === 'bn' ? 'অ্যাকাউন্টের ধরণ' : 'I Want To Join As'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('passenger')}
                className={`p-3 rounded-2xl border text-left transition active:scale-95 ${
                  role === 'passenger'
                    ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                    : 'bg-surface-container border-surface-container-high text-on-surface hover:bg-surface-bright'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="font-sora text-xs">{t('role_passenger')}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1 font-normal">
                  {language === 'bn' ? 'সিট পুল ও ভাড়া ভাগ' : 'Pool seats & split fares'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`p-3 rounded-2xl border text-left transition active:scale-95 ${
                  role === 'driver'
                    ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                    : 'bg-surface-container border-surface-container-high text-on-surface hover:bg-surface-bright'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TeslaLogo className="w-4 h-4 text-primary" />
                  <span className="font-sora text-xs">{t('role_driver')}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1 font-normal flex items-center gap-1">
                  <ElectricRickshawIcon className="w-3 h-3 text-primary inline" />
                  <span>{language === 'bn' ? '৩-সিট টেসলা রিকশা চালান' : 'Operate 3-seat EV trike'}</span>
                </p>
              </button>
            </div>
          </div>

          {/* Welcome Promo Tag */}
          <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-secondary font-semibold">
              <TeslaLogo className="w-4 h-4 text-secondary" />
              {t('welcome_bonus')}
            </span>
            <span className="font-sora font-bold text-secondary">{t('welcome_credit')}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-sora font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? (language === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...') : t('register_submit')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-surface-container-high/40">
          <p className="text-xs text-on-surface-variant">
            {t('already_account')}{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              {language === 'bn' ? 'মোবাইল দিয়ে লগইন করুন' : 'Sign in with mobile'}
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/80">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>{language === 'bn' ? 'সুরক্ষিত রেজিস্ট্রেশন • কোনো ক্রেডিট কার্ড প্রয়োজন নেই' : 'Secure registration • No credit card required'}</span>
      </div>
    </div>
  );
}
