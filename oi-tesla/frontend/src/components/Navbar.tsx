'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <header className="w-full bg-surface-container-lowest/80 backdrop-blur-xl border-b border-surface-container-high/40 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-3">
        {/* Logo & Branding */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-fixed shadow-md shadow-primary-container/20">
            <span className="material-symbols-outlined text-xl font-bold">bolt</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sora font-bold text-base tracking-tight text-primary leading-none">
              Oi Tesla
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              Dhaka Micro-Pool
            </span>
          </div>
        </Link>

        {/* Live Zone Radar Badge & User Info */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/90 border border-surface-container-highest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-on-surface uppercase font-sora">
              Banani
            </span>
          </div>

          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              role === 'driver'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-primary text-on-primary'
            }`}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
