'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Zap, ArrowRight, Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+880');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || phone === '+880') {
      setErrorMessage('Please provide your full name and valid Bangladesh mobile number.');
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
      setErrorMessage(res.error || 'Failed to create account. Please try another mobile number.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-surface-container-highest text-xs text-primary font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Account Registration</span>
        </div>
        <h1 className="font-sora font-extrabold text-2xl text-on-surface tracking-tight">
          Join <span className="text-primary">Oi Tesla</span>
        </h1>
        <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
          Start pooling rides or drive a 3-seater EV along Banani, Gulshan, and Mohakhali.
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
              Full Name
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
          </div>

          {/* Account Role Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              I Want To Join As
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
                  <span className="font-sora text-xs">Passenger</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1 font-normal">
                  Pool seats & split fares
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
                  <Zap className="w-4 h-4" />
                  <span className="font-sora text-xs">Tesla Pilot</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1 font-normal">
                  Operate 3-seat EV trike
                </p>
              </button>
            </div>
          </div>

          {/* Welcome Promo Tag */}
          <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-secondary font-semibold">
              <Zap className="w-4 h-4" />
              Welcome Bonus
            </span>
            <span className="font-sora font-bold text-secondary">৳100 TeslaPay Credit</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-sora font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Sign Up'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-surface-container-high/40">
          <p className="text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in with mobile
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/80">
        <Shield className="w-3.5 h-3.5 text-primary" />
        <span>Secure registration • No credit card required</span>
      </div>
    </div>
  );
}
