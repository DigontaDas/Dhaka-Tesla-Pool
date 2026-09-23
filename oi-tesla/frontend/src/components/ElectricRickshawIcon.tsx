'use client';

import React from 'react';

interface ElectricRickshawProps {
  className?: string;
  size?: number;
  color?: string;
}

export const ElectricRickshawIcon: React.FC<ElectricRickshawProps> = ({
  className = '',
  size = 28,
  color = '#46f1c5',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rickshaw Passenger Canopy / Hood */}
      <path
        d="M14 26 C14 15, 26 12, 38 12 C44 12, 48 15, 50 20 L50 34 L14 34 Z"
        fill={color}
        fillOpacity="0.25"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Decorative Rickshaw Canopy Hood Ribs */}
      <path
        d="M20 16 C22 22, 22 28, 22 34"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      <path
        d="M32 12 C34 19, 34 26, 34 34"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />

      {/* Front Pilot Cabin & Windshield */}
      <path
        d="M50 22 L58 30 L58 40 L50 40"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Handlebar & Headlight */}
      <path
        d="M55 28 L60 28"
        stroke="#feb700"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="28" r="2" fill="#feb700" />

      {/* Trike Chassis & Floorboard */}
      <path
        d="M10 40 L58 40"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Battery Pack / Tesla Power Box */}
      <rect
        x="24"
        y="36"
        width="16"
        height="8"
        rx="2"
        fill="#00513f"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Miniature Tesla 'T' on Battery */}
      <path
        d="M30 38 H34 M32 38 V42"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Rear Wheel (Twin Wheels in 3D profile) */}
      <circle
        cx="18"
        cy="48"
        r="8"
        stroke={color}
        strokeWidth="2.5"
        fill="#12171c"
      />
      <circle cx="18" cy="48" r="3" fill={color} />
      {/* Wheel Spokes */}
      <line x1="18" y1="40" x2="18" y2="56" stroke={color} strokeWidth="1" />
      <line x1="10" y1="48" x2="26" y2="48" stroke={color} strokeWidth="1" />

      {/* Front Steering Wheel */}
      <circle
        cx="54"
        cy="48"
        r="7"
        stroke={color}
        strokeWidth="2.5"
        fill="#12171c"
      />
      <circle cx="54" cy="48" r="2.5" fill={color} />
      <line x1="54" y1="41" x2="54" y2="55" stroke={color} strokeWidth="1" />
      <line x1="47" y1="48" x2="61" y2="48" stroke={color} strokeWidth="1" />
    </svg>
  );
};
