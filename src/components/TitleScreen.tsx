import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { formatFaNumber, toFaDigits } from '../utils/formatFa';

interface TitleScreenProps {
  highestLevel: number;
  totalStars: number;
  coins: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  onEnterSalon: () => void;
  onQuickPlay: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highestLevel,
  totalStars,
  coins,
  soundMuted,
  onToggleSound,
  onEnterSalon,
  onQuickPlay,
}) => {
  const [bgError, setBgError] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onQuickPlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onQuickPlay]);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#FCECF3] flex items-center">
      {/* Salon key-art backdrop */}
      {!bgError ? (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/assets/aistudio/1795220744113_a7a668ef.jpg"
            alt="فضای داخلی سالن ناخن پرشین پتال"
            referrerPolicy="no-referrer"
            onError={() => setBgError(true)}
            className="w-full h-full object-cover object-[38%_22%] scale-[1.16] select-none"
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 28% 35%, #FAD4E4 0%, #F7E8F6 45%, #FFF9FA 100%)',
          }}
        />
      )}

      {/* RTL Contrast Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FFF6FA] via-[#FFF6FA]/86 to-[#FFF6FA]/35 md:bg-gradient-to-l md:from-[#FFF6FA]/96 md:via-[#FFF6FA]/84 md:to-transparent" />

      {/* Top left mute toggle in RTL */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundMuted ? 'وصل صدای سالن' : 'قطع صدای سالن'}
          className="h-11 w-11 rounded-full btn-3d-pearl border border-[#EBCAD6] text-[#351427] flex items-center justify-center transition-transform focus-visible:outline-2 focus-visible:outline-[#E23B78]"
        >
          {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Title Lockup */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 md:px-12">
        <div className="max-w-lg">
          {/* Bespoke 2.5D Persian Petal Emblem */}
          <div className="mb-5 inline-flex items-center gap-3">
            <svg viewBox="0 0 48 48" className="w-13 h-13 shrink-0 drop-shadow-md" aria-hidden="true">
              <defs>
                <linearGradient id="emblemRose25" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF89B8" />
                  <stop offset="100%" stopColor="#C81E5A" />
                </linearGradient>
              </defs>
              <circle cx="24" cy="25" r="21" fill="#C98A14" />
              <circle cx="24" cy="23.5" r="21" fill="#FFFDFB" stroke="#EAB331" strokeWidth="2.4" />
              <path
                d="M24 10 C28 16, 28 22, 24 26 C20 22, 20 16, 24 10 Z M37 21 C31 25, 26 25, 23 22 C27 18, 32 18, 37 21 Z M32 36 C27 32, 25 27, 25 23 C29 25, 32 30, 32 36 Z M16 36 C16 30, 19 25, 23 23 C23 27, 21 32, 16 36 Z M11 21 C16 18, 21 18, 25 22 C22 25, 17 25, 11 21 Z"
                fill="url(#emblemRose25)"
              />
              <circle cx="24" cy="23" r="4.2" fill="#FEF08A" stroke="#B45309" strokeWidth="1.2" />
            </svg>
            <span className="text-sm font-bold tracking-wide text-[#9A2353]">
              سالن زیبایی و طراحی ناخن پرشین پتال
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#351427] leading-[1.18] [text-wrap:balance]">
            جورچین جادویی پرشین پتال
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#5E354A] leading-relaxed max-w-md">
            لاک‌های براق، نگین‌های درخشان و شکوفه‌های مرواریدی را کنار هم بچینید، سفارش‌های سالن را تکمیل کنید و کلکسیون کارت‌های ناخن را بسازید.
          </p>

          {/* Unboxed tabular progress summary */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-[#6C3B53] tabular-nums">
            <span>مرحله {toFaDigits(highestLevel)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatFaNumber(totalStars)} ستاره</span>
            <span aria-hidden="true">·</span>
            <span>{formatFaNumber(coins)} سکه سالن</span>
          </div>

          {/* 2.5D Candy-Gloss Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={onQuickPlay}
              className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-7 py-3 rounded-2xl btn-3d-rose text-white font-bold text-base transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E23B78]"
            >
              <Play className="w-4 h-4 fill-current rotate-180" />
              <span>شروع مرحله {toFaDigits(highestLevel)}</span>
            </button>

            <button
              type="button"
              onClick={onEnterSalon}
              className="inline-flex items-center justify-center min-h-[52px] px-6 py-3 rounded-2xl btn-3d-pearl border border-[#E6B8CA] text-[#351427] font-bold text-base transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E23B78]"
            >
              نقشه سالن و کارت‌ها
            </button>
          </div>

          <p className="mt-6 text-xs sm:text-sm text-[#7A4D62]">
            مهره‌های همجوار را جابه‌جا کنید · ۳ مهره مشابه بچینید · کلید Esc برای توقف
          </p>
        </div>
      </div>
    </div>
  );
};
