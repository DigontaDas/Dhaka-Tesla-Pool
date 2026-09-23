'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { role } = useAuth();

  const passengerTabs = [
    { label: 'Book', href: '/', icon: 'local_taxi' },
    { label: 'Tracking', href: '/tracking', icon: 'navigation' },
    { label: 'History', href: '/history', icon: 'history' },
    { label: 'Profile', href: '/profile', icon: 'person' },
  ];

  const driverTabs = [
    { label: 'Cockpit', href: '/driver', icon: 'electric_rickshaw' },
    { label: 'Earnings', href: '/driver/earnings', icon: 'payments' },
    { label: 'Profile', href: '/profile', icon: 'person' },
    { label: 'Rider View', href: '/', icon: 'swap_horiz' },
  ];

  const tabs = role === 'driver' ? driverTabs : passengerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-20 py-1 transition-colors ${
                isActive
                  ? role === 'driver'
                    ? 'text-secondary font-bold'
                    : 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
