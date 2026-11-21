import React, { useState } from 'react';
import { Check, Coins, Lock } from 'lucide-react';
import { SALON_UPGRADES } from '../data/salonData';
import { formatFaNumber, toFaDigits } from '../utils/formatFa';
import { PlayerProgress, SalonUpgrade } from '../types/game';

interface SalonStudioViewProps {
  progress: PlayerProgress;
  onUnlockUpgrade: (upgrade: SalonUpgrade) => void;
  onEquipPolish: (polishId: string) => void;
}

const CATEGORY_LABEL_FA: Record<SalonUpgrade['category'], string> = {
  Equipment: 'تجهیزات سالن',
  'Polish Shade': 'رنگ لاک سینی',
  Decor: 'دکوراسیون',
};

export const SalonStudioView: React.FC<SalonStudioViewProps> = ({
  progress,
  onUnlockUpgrade,
  onEquipPolish,
}) => {
  const [imgError, setImgError] = useState(false);

  const unlockedCount = progress.unlockedUpgradeIds.length;
  const activePolish = SALON_UPGRADES.find((u) => u.id === progress.equippedPolishId);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl surface-25d border border-[#EBCAD6] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 relative min-h-[220px] overflow-hidden bg-[#FCE4EE]">
          {!imgError ? (
            <img
              src="/assets/aistudio/1795220744113_a7a668ef.jpg"
              alt="آتلیه سالن ناخن پرشین پتال"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-[50%_20%] scale-[1.16]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-sm text-[#6C3B53]">
              آتلیه سالن پرشین پتال
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#9A2353] tabular-nums">
              ارتقای سالن · {toFaDigits(unlockedCount)} از {toFaDigits(SALON_UPGRADES.length)} مورد فعال
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#351427] mt-1">
              بوتیک و تجهیزات سالن پرشین پتال
            </h1>
            <p className="mt-2 text-sm text-[#5E354A] leading-relaxed">
              سکه‌هایی که در مراحل به دست آورده‌اید را برای باز کردن رنگ‌های لاک و تجهیزات لوکس سالن خرج کنید. رنگ لاک انتخابی، قاب سینی بازی شما را تغییر می‌دهد و تجهیزات جدید بوستر هدیه می‌دهند.
            </p>
          </div>

          <div className="pt-4 border-t border-[#F2DCE4] flex flex-wrap items-center gap-3 text-xs font-semibold text-[#5E354A]">
            <span>
              روکش فعلی سینی:{' '}
              <strong className="text-[#351427]">
                {activePolish?.name ?? 'لاک رز امضای سالن'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              موجودی ابزارها: {toFaDigits(progress.boosters['precision-file'])} سوهان ·{' '}
              {toFaDigits(progress.boosters['uv-brush'])} قلم‌موی UV ·{' '}
              {toFaDigits(progress.boosters['salon-shuffle'])} گردباد
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SALON_UPGRADES.map((item) => {
          const isUnlocked = progress.unlockedUpgradeIds.includes(item.id);
          const isEquipped = progress.equippedPolishId === item.id;
          const levelMet = progress.highestUnlockedLevel >= item.requiredLevel;
          const canAfford = progress.coins >= item.cost;

          return (
            <div
              key={item.id}
              className="rounded-2xl surface-25d border border-[#EBCAD6] p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full border-2 border-[#D49E2A]/70 shadow-xs shrink-0"
                      style={{ backgroundColor: item.swatchColor }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold text-[#7A4D62]">
                      {CATEGORY_LABEL_FA[item.category]}
                    </span>
                  </div>
                  {!levelMet && !isUnlocked && (
                    <span className="text-xs font-bold text-[#9A2353] inline-flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      مرحله {toFaDigits(item.requiredLevel)}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-lg font-bold text-[#351427] mt-2">
                  {item.name}
                </h2>
                <p className="mt-1 text-xs text-[#5E354A] leading-relaxed">
                  {item.description}
                </p>
                <p className="mt-2 text-xs font-bold text-[#9A2353]">
                  {item.bonusLabel}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F2DCE4] flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#351427] tabular-nums inline-flex items-center gap-1">
                  {item.cost === 0 ? (
                    'رایگان'
                  ) : isUnlocked ? (
                    'خریداری شده'
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5 text-[#C89B3C]" />
                      <span>{formatFaNumber(item.cost)}</span>
                    </>
                  )}
                </span>

                {isUnlocked ? (
                  item.category === 'Polish Shade' ? (
                    <button
                      type="button"
                      onClick={() => onEquipPolish(item.id)}
                      disabled={isEquipped}
                      className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                        isEquipped
                          ? 'bg-[#FDF1F5] border border-[#E23B78] text-[#9A2353]'
                          : 'bg-[#351427] hover:bg-[#4D263A] text-white'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>فعال</span>
                        </>
                      ) : (
                        <span>انتخاب رنگ</span>
                      )}
                    </button>
                  ) : (
                    <span className="min-h-[42px] px-3 py-2 rounded-xl bg-[#FDF1F5] text-[#15806B] text-xs font-bold inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>نصب شده</span>
                    </span>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onUnlockUpgrade(item)}
                    disabled={!levelMet || !canAfford}
                    className="min-h-[42px] px-4 py-2 rounded-xl btn-3d-rose disabled:opacity-45 text-white text-xs font-bold transition-all whitespace-nowrap shrink-0"
                  >
                    {!levelMet
                      ? `باز شدن در مرحله ${toFaDigits(item.requiredLevel)}`
                      : !canAfford
                        ? 'سکه ناکافی'
                        : 'خرید و نصب'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
