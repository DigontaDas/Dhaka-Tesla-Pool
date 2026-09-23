'use client';

import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, X, Shield, Volume2, Mic } from 'lucide-react';

interface CallPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilotName?: string;
  pilotPhone?: string;
  vehicleName?: string;
}

export const CallPilotModal: React.FC<CallPilotModalProps> = ({
  isOpen,
  onClose,
  pilotName = 'Jashim Uddin (জসিম)',
  pilotPhone = '+880 1912-345678',
  vehicleName = 'Bullet (DH-Metro-TH-14-8821)',
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  if (!isOpen) return null;

  const handleStartSimulatedCall = () => {
    setIsCalling(true);
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setCallDuration(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-surface-container-low border border-surface-container-high rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 text-center animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-bright"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pilot Avatar */}
        <div className="relative mx-auto w-24 h-24 mt-2 mb-4">
          <div className="w-full h-full rounded-full bg-secondary-container text-on-secondary-container font-sora font-extrabold flex items-center justify-center text-3xl shadow-lg ring-4 ring-primary/20">
            JU
          </div>
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-primary rounded-full border-2 border-surface-container-low flex items-center justify-center">
            <span className="w-2 h-2 bg-on-primary rounded-full animate-ping" />
          </span>
        </div>

        <h3 className="font-sora font-bold text-lg text-on-surface">{pilotName}</h3>
        <p className="text-xs text-on-surface-variant mt-0.5">{vehicleName}</p>
        <p className="text-sm font-mono text-primary font-bold mt-2">{pilotPhone}</p>

        {isCalling ? (
          <div className="mt-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-xs font-bold text-primary animate-pulse">
              <PhoneCall className="w-3.5 h-3.5" />
              Connected · 00:{callDuration < 10 ? `0${callDuration}` : callDuration}
            </div>

            <div className="flex justify-center gap-4 py-3">
              <button className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                <Mic className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleEndCall}
              className="w-full py-3.5 rounded-full bg-error hover:bg-error/90 text-on-error font-sora font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <a
              href={`tel:${pilotPhone.replace(/[\s-]/g, '')}`}
              className="w-full py-3.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-sora font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Phone className="w-4 h-4" />
              Cellular Call (Free masked)
            </a>

            <button
              onClick={handleStartSimulatedCall}
              className="w-full py-3 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-sora font-semibold text-xs flex items-center justify-center gap-2 border border-surface-container-highest transition active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 text-secondary" />
              In-App VoIP Audio Call
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant/80 pt-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Your personal number is masked & secure</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
