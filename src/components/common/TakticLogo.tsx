import React from 'react';

interface TakticLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const SIZE_MAP = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-9 w-9 sm:h-10 sm:w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
  xl: 'h-16 w-16 rounded-3xl',
};

export const TakticLogo: React.FC<TakticLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const sizeClass = SIZE_MAP[size] || size;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Crisp Vector Logo Container */}
      <div
        className={`relative flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-[#C06C4C]/25 transition-transform group-hover:scale-105 ${sizeClass}`}
        style={{
          background: 'linear-gradient(145deg, #EFA895 0%, #C96E4F 48%, #93462B 100%)',
        }}
      >
        {/* Soft inner ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/20 pointer-events-none" />

        {/* Vector Focus Glyph */}
        <svg
          viewBox="0 0 100 100"
          className="w-[68%] h-[68%] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top T-Bar */}
          <path
            d="M 23 27 L 77 27"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Upper Vertical Stem */}
          <path
            d="M 50 27 L 50 41"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Center Focal Dot */}
          <circle cx="50" cy="50" r="4.2" fill="currentColor" />

          {/* Lower Vertical Stem */}
          <path
            d="M 50 59 L 50 73"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Inner Left Arc */}
          <path
            d="M 40 37.5 A 15.5 15.5 0 0 0 40 62.5"
            stroke="currentColor"
            strokeWidth="6.5"
            strokeLinecap="round"
          />

          {/* Inner Right Arc */}
          <path
            d="M 60 37.5 A 15.5 15.5 0 0 1 60 62.5"
            stroke="currentColor"
            strokeWidth="6.5"
            strokeLinecap="round"
          />

          {/* Outer Left Arc */}
          <path
            d="M 31 33.5 A 25 25 0 0 0 31 66.5"
            stroke="currentColor"
            strokeWidth="6.5"
            strokeLinecap="round"
          />

          {/* Outer Right Arc */}
          <path
            d="M 69 33.5 A 25 25 0 0 1 69 66.5"
            stroke="currentColor"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none transition-colors group-hover:text-[#C06C4C]">
          Taktic
        </span>
      )}
    </div>
  );
};
