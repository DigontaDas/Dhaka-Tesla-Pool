'use client';

import React from 'react';
import { useAuth, CAST } from '../context/AuthContext';

export const StoryCastSwitcher: React.FC = () => {
  const { user, switchUser } = useAuth();

  const characters = [
    { id: CAST.NUSRAT, name: 'Nusrat', role: 'Passenger', tag: '3.2km to Mohakhali', icon: 'person', badge: '৳420' },
    { id: CAST.RAFIQ, name: 'Rafiq', role: 'Passenger', tag: '2.0km to Gulshan 1', icon: 'person', badge: '৳350' },
    { id: CAST.SHIRIN, name: 'Shirin', role: 'Passenger', tag: 'Grabs 3rd seat', icon: 'person', badge: '৳280' },
    { id: CAST.JASHIM, name: 'Jashim', role: 'Driver', tag: 'Bullet (3-seat EV)', icon: 'electric_rickshaw', badge: '★4.9' },
  ];

  return (
    <div className="w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high/60 px-3 py-2 z-40 sticky top-0">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-outline tracking-wider shrink-0 mr-1">
          Demo Cast:
        </span>
        <div className="flex items-center gap-1.5 flex-1 justify-between">
          {characters.map((c) => {
            const isActive = user?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => switchUser(c.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                  isActive
                    ? c.role === 'Driver'
                      ? 'bg-secondary-container text-on-secondary-container shadow-sm font-bold scale-105'
                      : 'bg-primary-container text-on-primary-fixed shadow-sm font-bold scale-105'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[9px] opacity-75">{c.role === 'Driver' ? '⚡' : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
