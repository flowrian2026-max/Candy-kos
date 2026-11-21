import React, { useMemo, useState } from 'react';
import { Coins, Gift, Lock, X } from 'lucide-react';
import { COLLECTIBLE_CARDS, RARITY_LABEL_FA } from '../data/salonData';
import { toFaDigits } from '../utils/formatFa';
import { CardRarity, CollectibleCard, PlayerProgress } from '../types/game';
import { CollectibleCardArt } from './CollectibleCardArt';

interface CollectionViewProps {
  progress: PlayerProgress;
  onOpenGiftPack: () => { card: CollectibleCard; isNew: boolean } | null;
}

const RARITY_FILTERS: Array<'All' | CardRarity> = [
  'All',
  'Common',
  'Rare',
  'Epic',
  'Legendary',
];

const RARITY_COLOR: Record<CardRarity, string> = {
  Common: 'text-[#5E354A]',
  Rare: 'text-[#1F6F8B]',
  Epic: 'text-[#7C4DFF]',
  Legendary: 'text-[#B6862C]',
};

export const CollectionView: React.FC<CollectionViewProps> = ({
  progress,
  onOpenGiftPack,
}) => {
  const [filter, setFilter] = useState<'All' | CardRarity>('All');
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);
  const [packResult, setPackResult] = useState<{
    card: CollectibleCard;
    isNew: boolean;
  } | null>(null);

  const filteredCards = useMemo(() => {
    if (filter === 'All') return COLLECTIBLE_CARDS;
    return COLLECTIBLE_CARDS.filter((c) => c.rarity === filter);
  }, [filter]);

  const handleOpenPack = () => {
    const res = onOpenGiftPack();
    if (res) setPackResult(res);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl surface-25d border border-[#EBCAD6] p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold text-[#9A2353] tabular-nums">
            آلبوم طراحی ناخن · {toFaDigits(progress.unlockedCardIds.length)} از {toFaDigits(COLLECTIBLE_CARDS.length)} کارت باز شده
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#351427] mt-1">
            کارت‌های کلکسیونی طراحی ناخن
          </h1>
          <p className="mt-1.5 text-sm text-[#5E354A] max-w-xl">
            با پیروزی در هر مرحله یک کارت جایزه می‌گیرید یا می‌توانید با سکه‌های داخل بازی بسته هدیه سالن باز کنید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenPack}
          disabled={progress.coins < 80}
          className="min-h-[50px] px-5 py-3 rounded-2xl btn-3d-rose disabled:opacity-45 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0"
        >
          <Gift className="w-4 h-4" />
          <span>باز کردن بسته سالن (۸۰ سکه)</span>
        </button>
      </section>

      {/* Interactive Rarity Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#F6E0EA] border border-[#E9C5D5] w-fit">
        {RARITY_FILTERS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilter(r)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              filter === r
                ? 'bg-[#FFFDFB] text-[#351427] shadow-xs'
                : 'text-[#6C3B53] hover:text-[#351427]'
            }`}
          >
            {r === 'All' ? 'همه' : RARITY_LABEL_FA[r]}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => {
          const unlocked = progress.unlockedCardIds.includes(card.id);
          const dupes = progress.cardDuplicates[card.id] ?? 0;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedCard(card)}
              className={`text-right rounded-2xl border p-3.5 transition-transform hover:-translate-y-0.5 flex flex-col gap-3 ${
                unlocked
                  ? 'surface-25d border-[#EBCAD6]'
                  : 'bg-[#FAF3F6] border-[#EFE0E6]'
              }`}
            >
              <div className="relative">
                <CollectibleCardArt card={card} unlocked={unlocked} />
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-[#351427]/75 text-white flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <span className={RARITY_COLOR[card.rarity]}>
                    {RARITY_LABEL_FA[card.rarity]}
                  </span>
                  {dupes > 0 && (
                    <span className="text-[#7A4D62] tabular-nums">
                      ×{toFaDigits(dupes + 1)}
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg font-bold text-[#351427] mt-0.5">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-xs text-[#5E354A] line-clamp-2">
                  {unlocked ? card.description : card.unlockHint}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Card Detail Inspection Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 bg-[#230E18]/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedCard.title}
        >
          <div className="w-full max-w-md rounded-3xl surface-25d border border-[#EBCAD6] p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className={`text-xs font-bold ${RARITY_COLOR[selectedCard.rarity]}`}>
                  کارت {RARITY_LABEL_FA[selectedCard.rarity]}
                </p>
                <h3 className="font-display text-2xl font-bold text-[#351427]">
                  {selectedCard.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                aria-label="بستن پیش‌نمایش کارت"
                className="h-10 w-10 rounded-full hover:bg-[#FDF1F5] flex items-center justify-center text-[#5E354A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CollectibleCardArt
              card={selectedCard}
              unlocked={progress.unlockedCardIds.includes(selectedCard.id)}
              className="w-full aspect-[4/3]"
            />

            <p className="mt-4 text-sm text-[#4F2D3D] leading-relaxed">
              {selectedCard.description}
            </p>
            <p className="mt-2 text-xs text-[#7A4D62]">
              روش دریافت: {selectedCard.unlockHint}
            </p>
          </div>
        </div>
      )}

      {/* Pack Reveal Modal */}
      {packResult && (
        <div
          className="fixed inset-0 z-50 bg-[#230E18]/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="بسته هدیه سالن باز شد"
        >
          <div className="w-full max-w-sm rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-center">
            <p className={`text-xs font-bold ${RARITY_COLOR[packResult.card.rarity]}`}>
              {RARITY_LABEL_FA[packResult.card.rarity]} · {packResult.isNew ? 'کارت جدید باز شد!' : 'کارت تکراری'}
            </p>
            <h3 className="font-display text-2xl font-bold text-[#351427] mt-1">
              {packResult.card.title}
            </h3>
            <div className="mt-4">
              <CollectibleCardArt card={packResult.card} unlocked className="w-full aspect-[4/3]" />
            </div>
            {!packResult.isNew && (
              <p className="mt-3 text-xs font-bold text-[#9A2353] inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>+۲۵ سکه جایگزین دریافت شد</span>
              </p>
            )}
            <button
              type="button"
              onClick={() => setPackResult(null)}
              className="mt-5 w-full min-h-[48px] rounded-2xl btn-3d-rose text-white font-bold text-sm"
            >
              افزودن به آلبوم
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
