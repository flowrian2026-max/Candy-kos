import React, { useState } from 'react';
import { Flame, Gift, Lock, Play, Star, X } from 'lucide-react';
import { LEVELS, PIECE_META, SALON_AREAS } from '../data/salonData';
import { formatFaNumber, toFaDigits } from '../utils/formatFa';
import { LevelConfig, PlayerProgress } from '../types/game';
import { NailPieceGraphic } from './NailPieces';

interface SalonMapViewProps {
  progress: PlayerProgress;
  totalStars: number;
  canSpinWheel: boolean;
  onOpenWheel: () => void;
  onSelectLevel: (levelId: number, useStreakBonus: boolean) => void;
}

const NODE_OFFSETS = [0, -56, -74, -40, 22, 68, 72, 26, -38, -70, -28, 34];

export const SalonMapView: React.FC<SalonMapViewProps> = ({
  progress,
  totalStars,
  canSpinWheel,
  onOpenWheel,
  onSelectLevel,
}) => {
  const [briefingLevel, setBriefingLevel] = useState<LevelConfig | null>(null);
  const nextPlayable = Math.min(progress.highestUnlockedLevel, LEVELS.length);

  return (
    <div className="space-y-6">
      {/* Top Saga Map Action Strip */}
      <section className="rounded-3xl surface-25d border border-[#EBCAD6] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#9A2353]">
            <span>نقشه ماجراجویی سالن پرشین پتال</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {toFaDigits(Object.keys(progress.levelStars).length)} از {toFaDigits(LEVELS.length)} مرحله
            </span>
            {progress.winStreak > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[#C86414]">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  نوار برد {toFaDigits(progress.winStreak)} (هدیه شروع ویژه فعال)
                </span>
              </>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#351427] mt-1">
            مسیر جادویی سالن ناخن
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenWheel}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl btn-3d-gold text-[#351427] font-bold text-xs sm:text-sm inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Gift className="w-4 h-4" />
            <span>{canSpinWheel ? 'گردونه شانس امروز!' : 'گردونه شانس'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const target = LEVELS.find((l) => l.id === nextPlayable) ?? LEVELS[0];
              setBriefingLevel(target);
            }}
            className="min-h-[48px] px-6 py-2.5 rounded-2xl btn-3d-rose text-white font-bold text-sm inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current rotate-180" />
            <span>مرحله {toFaDigits(nextPlayable)}</span>
          </button>
        </div>
      </section>

      {/* Winding 2.5D Candy-Crush-Inspired Saga Map */}
      <div className="space-y-8">
        {SALON_AREAS.map((area) => {
          const areaLevels = LEVELS.filter((l) => l.areaId === area.id);
          const areaUnlocked =
            totalStars >= area.requiredStars ||
            areaLevels.some((l) => l.id <= progress.highestUnlockedLevel);

          return (
            <section
              key={area.id}
              className="rounded-3xl surface-25d border border-[#EBCAD6] overflow-hidden"
            >
              {/* Area Chapter Banner */}
              <div
                className="px-5 py-4 border-b border-[#F2DCE4] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                style={{
                  background: `linear-gradient(135deg, #FFFDFB 0%, ${area.accentColor}14 100%)`,
                }}
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7A4D62]">
                    <span>{area.subtitle}</span>
                    {!areaUnlocked && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#9A2353]">
                          <Lock className="w-3.5 h-3.5" />
                          نیازمند {toFaDigits(area.requiredStars)} ستاره
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#351427] mt-0.5">
                    {area.name}
                  </h2>
                </div>
                <p className="text-xs text-[#5E354A] max-w-md">{area.description}</p>
              </div>

              {/* Winding Path Canvas */}
              <div className="relative py-8 px-4 bg-gradient-to-b from-[#FFF9FB] via-[#FDF0F6] to-[#FAE4EE]">
                <div className="max-w-md mx-auto flex flex-col-reverse items-center gap-8 relative">
                  {areaLevels.map((lvl, idx) => {
                    const isUnlocked = lvl.id <= progress.highestUnlockedLevel;
                    const stars = progress.levelStars[lvl.id] ?? 0;
                    const isCurrent = lvl.id === progress.highestUnlockedLevel;
                    const offsetX = NODE_OFFSETS[(lvl.id - 1) % NODE_OFFSETS.length];

                    return (
                      <div
                        key={lvl.id}
                        className="relative flex flex-col items-center w-full"
                      >
                        {/* Connector Ribbon to previous node */}
                        {idx > 0 && (
                          <div
                            className="w-3 h-10 -mb-2 rounded-full bg-[#EBC3D4]/80 border border-white/80"
                            style={{
                              transform: `translateX(${offsetX * 0.55}px)`,
                            }}
                            aria-hidden="true"
                          />
                        )}

                        <div
                          className="relative flex items-center gap-4"
                          style={{ transform: `translateX(${offsetX}px)` }}
                        >
                          {/* 2.5D Round Medallion Node */}
                          <button
                            type="button"
                            disabled={!isUnlocked}
                            onClick={() => setBriefingLevel(lvl)}
                            aria-label={`مرحله ${toFaDigits(lvl.id)}: ${lvl.title}`}
                            className={`relative w-18 h-18 rounded-full font-display text-2xl font-bold flex flex-col items-center justify-center transition-transform ${
                              isCurrent
                                ? 'btn-3d-rose text-white ring-4 ring-[#FBCFE8] scale-110'
                                : isUnlocked
                                  ? 'btn-3d-gold text-[#351427] hover:scale-105'
                                  : 'bg-[#E9D7DE] border-2 border-[#D4BAC6] text-[#7A4D62] cursor-not-allowed'
                            }`}
                          >
                            {isUnlocked ? (
                              <span>{toFaDigits(lvl.id)}</span>
                            ) : (
                              <Lock className="w-5 h-5" />
                            )}

                            {/* Current Level Beacon */}
                            {isCurrent && (
                              <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-[#351427] text-amber-200 text-[10px] font-sans font-bold shadow whitespace-nowrap">
                                نوبت شما
                              </span>
                            )}
                          </button>

                          {/* Side Label & Stars */}
                          <div className="min-w-[130px] max-w-[175px] rounded-2xl bg-[#FFFDFB]/92 border border-[#EBCAD6] px-3 py-2 shadow-xs">
                            <div className="flex items-center gap-0.5 mb-0.5">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= stars
                                      ? 'fill-[#F5B922] text-[#B45309]'
                                      : 'text-[#E3CFD6]'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs font-bold text-[#351427] truncate">
                              {lvl.title}
                            </p>
                            <p className="text-[11px] text-[#6C3B53] truncate">
                              {toFaDigits(lvl.moves)} حرکت
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Candy-Crush-Style Pre-Level Briefing Modal */}
      {briefingLevel && (
        <div
          className="fixed inset-0 z-50 bg-[#230E18]/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`آماده‌سازی مرحله ${toFaDigits(briefingLevel.id)}`}
        >
          <div className="w-full max-w-md rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-[#351427]">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F2DCE4]">
              <div>
                <p className="text-xs font-bold text-[#9A2353]">
                  مرحله {toFaDigits(briefingLevel.id)} · {toFaDigits(briefingLevel.moves)} حرکت
                </p>
                <h2 className="font-display text-2xl font-bold mt-0.5">
                  {briefingLevel.title}
                </h2>
                <p className="text-xs text-[#6C3B53] mt-0.5">
                  {briefingLevel.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBriefingLevel(null)}
                aria-label="بستن پنجره مرحله"
                className="h-10 w-10 rounded-full hover:bg-[#FDF1F5] flex items-center justify-center text-[#5E354A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <p className="text-xs font-bold text-[#5E354A]">اهداف سفارش این مرحله:</p>
              {briefingLevel.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className="rounded-2xl bg-[#FDF1F5] border border-[#F0D4DE] p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl cell-25d border border-[#EBCAD6] p-1.5 flex items-center justify-center shrink-0">
                    {obj.kind === 'clear-frost' ? (
                      <span className="text-lg text-[#E23B78]">✿</span>
                    ) : obj.kind === 'clear-locks' ? (
                      <span className="text-base text-[#9A2353]">🎀</span>
                    ) : obj.pieceType ? (
                      <NailPieceGraphic type={obj.pieceType} />
                    ) : null}
                  </div>
                  <div className="text-sm font-bold text-[#351427]">
                    {obj.label}
                    {obj.pieceType && (
                      <span className="block text-[11px] font-medium text-[#6C3B53]">
                        {PIECE_META[obj.pieceType].name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {progress.winStreak > 0 && (
              <div className="mt-4 rounded-2xl bg-[#FFF7DF] border border-[#F3D37A] p-3 text-xs font-bold text-[#854D0E] flex items-center gap-2">
                <Flame className="w-4 h-4 fill-current shrink-0 text-[#D97706]" />
                <span>
                  پاداش نوار برد فعال: مرحله با {toFaDigits(Math.min(progress.winStreak, 2))} مهره ویژه روی تخته شروع می‌شود!
                </span>
              </div>
            )}

            {(progress.levelHighScores[briefingLevel.id] ?? 0) > 0 && (
              <p className="mt-3 text-xs text-center font-semibold text-[#6C3B53] tabular-nums">
                بهترین امتیاز قبلی: {formatFaNumber(progress.levelHighScores[briefingLevel.id])}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                const chosenId = briefingLevel.id;
                setBriefingLevel(null);
                onSelectLevel(chosenId, progress.winStreak > 0);
              }}
              className="mt-5 w-full min-h-[52px] rounded-2xl btn-3d-rose text-white font-bold text-base flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current rotate-180" />
              <span>شروع بازی!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
