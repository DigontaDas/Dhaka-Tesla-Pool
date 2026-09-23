'use client';

import React, { useState } from 'react';
import { useAuth, CAST } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, Shield, Zap, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, switchUser, user } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState('+8801712892401'); // Default to Nusrat
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const success = await login(phone.trim());
    setLoading(false);

    if (success) {
      router.push('/');
    } else {
      setErrorMessage('Account not found with this mobile number. Use quick sign-in or create a new account.');
    }
  };

  const handleQuickCastLogin = async (userId: string) => {
    setLoading(true);
    setErrorMessage(null);
    await switchUser(userId);
    setLoading(false);
    if (userId === CAST.JASHIM) {
      router.push('/driver');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-surface-container-highest text-xs text-primary font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>Dhaka Electric Micro-Pool</span>
        </div>
        <h1 className="font-sora font-extrabold text-2xl text-on-surface tracking-tight">
          Welcome to <span className="text-primary">Oi Tesla</span>
        </h1>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
          Share a seat. Split the fare. Enter your mobile number to ride or drive.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-surface-container-low rounded-3xl p-6 border border-surface-container-high/60 shadow-xl space-y-5">
        <form onSubmit={handlePhoneLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Mobile Phone Number
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
            <p className="text-[11px] text-on-surface-variant">
              Enter with Bangladesh country code (+880) or 11 digits.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-sora font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Signing In...' : 'Continue with Phone'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-surface-container-high w-full" />
          <span className="bg-surface-container-low px-3 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
            Or One-Tap Demo Cast
          </span>
        </div>

        {/* Quick Demo Story Cast Sign-In */}
        <div className="space-y-2">
          <p className="text-[11px] text-on-surface-variant text-center font-medium">
            Select a PRD story character to sign in instantly:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickCastLogin(CAST.NUSRAT)}
              className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-container-high text-left transition active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="font-sora font-bold text-xs text-on-surface">Nusrat Jahan</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  ৳420
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Banani → Mohakhali</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickCastLogin(CAST.RAFIQ)}
              className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-container-high text-left transition active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="font-sora font-bold text-xs text-on-surface">Rafiq Ahmed</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-bold">
                  ৳350
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Banani → Gulshan 1</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickCastLogin(CAST.SHIRIN)}
              className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-container-high text-left transition active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="font-sora font-bold text-xs text-on-surface">Shirin Akter</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  ৳280
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">3rd Seat Contender</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickCastLogin(CAST.JASHIM)}
              className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-container-high text-left transition active:scale-95"
            >
              <div className="flex items-center justify-between">
                <span className="font-sora font-bold text-xs text-on-surface">Pilot Jashim</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-bold">
                  Bullet
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">3-Seat Tesla Trike</p>
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center pt-2 border-t border-surface-container-high/40">
          <p className="text-xs text-on-surface-variant">
            Don't have an account yet?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/80">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>End-to-end encrypted session • Dhaka micro-mobility</span>
      </div>
    </div>
  );
}
