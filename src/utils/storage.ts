import { COLLECTIBLE_CARDS, INITIAL_PROGRESS } from '../data/salonData';
import { CardRarity, CollectibleCard, PlayerProgress } from '../types/game';

const STORAGE_KEY = 'persian_petal_nail_match_v1';

export function loadProgress(): PlayerProgress {
  if (typeof window === 'undefined') return INITIAL_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      ...INITIAL_PROGRESS,
      ...parsed,
      winStreak: parsed.winStreak ?? 0,
      lastWheelSpinDay: parsed.lastWheelSpinDay ?? null,
      levelStars: { ...INITIAL_PROGRESS.levelStars, ...(parsed.levelStars ?? {}) },
      levelHighScores: {
        ...INITIAL_PROGRESS.levelHighScores,
        ...(parsed.levelHighScores ?? {}),
      },
      unlockedCardIds:
        parsed.unlockedCardIds && parsed.unlockedCardIds.length > 0
          ? parsed.unlockedCardIds
          : INITIAL_PROGRESS.unlockedCardIds,
      cardDuplicates: {
        ...INITIAL_PROGRESS.cardDuplicates,
        ...(parsed.cardDuplicates ?? {}),
      },
      unlockedUpgradeIds:
        parsed.unlockedUpgradeIds && parsed.unlockedUpgradeIds.length > 0
          ? parsed.unlockedUpgradeIds
          : INITIAL_PROGRESS.unlockedUpgradeIds,
      boosters: {
        ...INITIAL_PROGRESS.boosters,
        ...(parsed.boosters ?? {}),
      },
    };
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveProgress(progress: PlayerProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function getTotalStars(progress: PlayerProgress): number {
  return Object.values(progress.levelStars).reduce((sum, s) => sum + s, 0);
}

/**
 * Selects a collectible nail design card weighted by rarity and performance stars.
 */
export function rollSalonCardReward(
  starsEarned: number,
  unlockedIds: string[]
): { card: CollectibleCard; isNew: boolean } {
  const weights: Record<CardRarity, number> =
    starsEarned >= 3
      ? { Common: 28, Rare: 38, Epic: 24, Legendary: 10 }
      : starsEarned === 2
        ? { Common: 42, Rare: 36, Epic: 17, Legendary: 5 }
        : { Common: 60, Rare: 28, Epic: 10, Legendary: 2 };

  const roll = Math.random() * 100;
  let rarity: CardRarity = 'Common';
  if (roll < weights.Legendary) {
    rarity = 'Legendary';
  } else if (roll < weights.Legendary + weights.Epic) {
    rarity = 'Epic';
  } else if (roll < weights.Legendary + weights.Epic + weights.Rare) {
    rarity = 'Rare';
  }

  const pool = COLLECTIBLE_CARDS.filter((c) => c.rarity === rarity);
  const unownedInPool = pool.filter((c) => !unlockedIds.includes(c.id));
  const candidates = unownedInPool.length > 0 ? unownedInPool : pool;
  const card = candidates[Math.floor(Math.random() * candidates.length)] ?? COLLECTIBLE_CARDS[0];

  return {
    card,
    isNew: !unlockedIds.includes(card.id),
  };
}
