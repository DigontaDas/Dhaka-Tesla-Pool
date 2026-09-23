'use client';

import React from 'react';

interface TeslaLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const TeslaLogo: React.FC<TeslaLogoProps> = ({
  className = '',
  size = 20,
  color = 'currentColor',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 342 342"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M171 78.5C189.5 78.5 220 83 243.5 94.5L257 60C229.5 47.5 195.5 42 171 42C146.5 42 112.5 47.5 85 60L98.5 94.5C122 83 152.5 78.5 171 78.5Z"
        fill={color}
      />
      <path
        d="M171 106.5C158 106.5 137.5 109.5 119 116.5L103 147C125.5 138 152 133 171 133C190 133 216.5 138 239 147L223 116.5C204.5 109.5 184 106.5 171 106.5Z"
        fill={color}
      />
      <path
        d="M171 154C161.5 154 153.5 155.5 147 157.5L154.5 300H187.5L195 157.5C188.5 155.5 180.5 154 171 154Z"
        fill={color}
      />
      <path
        d="M48 69.5L62 104C74.5 96.5 88 91 102 87L90 54.5C74 58.5 59.5 63.5 48 69.5Z"
        fill={color}
      />
      <path
        d="M294 69.5C282.5 63.5 268 58.5 252 54.5L240 87C254 91 267.5 96.5 280 104L294 69.5Z"
        fill={color}
      />
    </svg>
  );
};
