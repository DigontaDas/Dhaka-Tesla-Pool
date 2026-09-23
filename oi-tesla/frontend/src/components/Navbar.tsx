'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TeslaLogo } from './TeslaLogo';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, role } = useAuth();
  const { language, setLanguage, isDriverAlwaysBangla } = useLanguage();

  return (
    <header className="w-full bg-surface-container-lowest/80 backdrop-blur-xl border-b border-surface-container-high/40 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-3">
        {/* Logo & Branding */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-fixed shadow-md shadow-primary-container/20 shrink-0">
            <TeslaLogo size={18} color="#00513f" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-sora font-extrabold text-base tracking-tight text-primary leading-none">
                {language === 'bn' ? 'ওই টেসলা' : 'Oi Tesla'}
              </span>
              <span className="text-[10px] font-mono px-1 rounded bg-primary/10 text-primary border border-primary/20">
                EV
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {language === 'bn' ? 'ঢাকা মাইক্রো-পুল' : 'Dhaka Micro-Pool'}
            </span>
          </div>
        </Link>

        {/* Controls: Language Switcher, Location & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher */}
          {isDriverAlwaysBangla ? (
            <span className="px-2 py-1 rounded-full bg-secondary-container/60 border border-secondary/40 text-[10px] font-bold text-secondary">
              বাংলা (পাইলট)
            </span>
          ) : (
            <div className="flex items-center bg-surface-container-high rounded-full p-0.5 border border-surface-container-highest text-[10px] font-bold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-full transition ${
                  language === 'en'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-2 py-0.5 rounded-full transition ${
                  language === 'bn'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                বাং
              </button>
            </div>
          )}

          <Link
            href="/profile"
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition hover:scale-105 active:scale-95 shadow ${
              role === 'driver'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-primary text-on-primary'
            }`}
            title="View Profile"
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </Link>
        </div>
      </div>
    </header>
  );
};
