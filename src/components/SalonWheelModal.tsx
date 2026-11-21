import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { salonAudio } from '../audio/salonAudio';
import { BoosterType } from '../types/game';

export interface WheelReward {
  label: string;
  coins?: number;
  booster?: BoosterType;
  boosterCount?: number;
}

const WHEEL_SEGMENTS: Array<WheelReward & { color: string; textColor: string }> = [
  { label: '۸۰ سکه', coins: 80, color: '#FCE7F3', textColor: '#831843' },
  { label: '۱ سوهان', booster: 'precision-file', boosterCount: 1, color: '#FDE68A', textColor: '#78350F' },
  { label: '۱۲۰ سکه', coins: 120, color: '#E9D5FF', textColor: '#4C1D95' },
  { label: '۱ قلم‌مو UV', booster: 'uv-brush', boosterCount: 1, color: '#D1FAE5', textColor: '#065F46' },
  { label: '۱۸۰ سکه', coins: 180, color: '#FBCFE8', textColor: '#9D174D' },
  { label: '۱ گردباد', booster: 'salon-shuffle', boosterCount: 1, color: '#FEF3C7', textColor: '#92400E' },
];

interface SalonWheelModalProps {
  canSpinToday: boolean;
  onClaimReward: (reward: WheelReward) => void;
  onClose: () => void;
}

export const SalonWheelModal: React.FC<SalonWheelModalProps> = ({
  canSpinToday,
  onClaimReward,
  onClose,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);

  const handleSpin = () => {
    if (spinning || !canSpinToday || wonReward) return;
    setSpinning(true);
    salonAudio.playBooster();

    const targetIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
    const extraTurns = 5 * 360;
    const finalAngle = extraTurns + (360 - targetCenter);

    setRotation(finalAngle);

    window.setTimeout(() => {
      const reward = WHEEL_SEGMENTS[targetIndex];
      setSpinning(false);
      setWonReward(reward);
      salonAudio.playRewardChime();
      onClaimReward(reward);
    }, 2600);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#230E18]/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="گردونه شانس روزانه سالن"
    >
      <div className="w-full max-w-md rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-center text-[#351427]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D49E2A]" />
            <span>گردونه شانس سالن</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن گردونه"
            className="h-10 w-10 rounded-full hover:bg-[#FDF1F5] flex items-center justify-center text-[#5E354A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#6C3B53]">
          هر روز گردونه پرشین پتال را بچرخانید و سکه یا ابزار کمکی هدیه بگیرید!
        </p>

        {/* 2.5D Fortune Wheel */}
        <div className="relative my-6 mx-auto w-64 h-64 flex items-center justify-center">
          {/* Top Pointer */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#E23B78] drop-shadow"
            aria-hidden="true"
          />

          {/* Outer Beveled Gold Rim */}
          <div className="w-64 h-64 rounded-full p-2 bg-gradient-to-b from-[#FFE17D] to-[#C98A14] shadow-[0_10px_24px_rgba(145,24,78,0.28)]">
            <div
              className="w-full h-full rounded-full overflow-hidden relative border-2 border-white transition-transform duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
                {WHEEL_SEGMENTS.map((seg, i) => {
                  const angle = 360 / WHEEL_SEGMENTS.length;
                  const startDeg = i * angle - 90;
                  const endDeg = startDeg + angle;
                  const startRad = (startDeg * Math.PI) / 180;
                  const endRad = (endDeg * Math.PI) / 180;
                  const x1 = 100 + 100 * Math.cos(startRad);
                  const y1 = 100 + 100 * Math.sin(startRad);
                  const x2 = 100 + 100 * Math.cos(endRad);
                  const y2 = 100 + 100 * Math.sin(endRad);
                  const midDeg = i * angle + angle / 2;

                  return (
                    <g key={seg.label}>
                      <path
                        d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                        fill={seg.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y="36"
                        fill={seg.textColor}
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        transform={`rotate(${midDeg} 100 100)`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="18" fill="#FFFDFB" stroke="#C98A14" strokeWidth="4" />
              </svg>
            </div>
          </div>
        </div>

        {wonReward ? (
          <div className="space-y-3">
            <p className="text-base font-bold text-[#9A2353]">
              تبریک! جایزه شما: {wonReward.label}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[48px] rounded-2xl btn-3d-rose text-white font-bold text-sm"
            >
              دریافت و ادامه
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={spinning || !canSpinToday}
            onClick={handleSpin}
            className="w-full min-h-[50px] rounded-2xl btn-3d-gold disabled:opacity-45 text-[#351427] font-bold text-sm"
          >
            {spinning
              ? 'در حال چرخش...'
              : canSpinToday
                ? 'چرخاندن گردونه شانس!'
                : 'جایزه امروز دریافت شده است'}
          </button>
        )}
      </div>
    </div>
  );
};
