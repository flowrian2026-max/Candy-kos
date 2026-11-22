import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_PROGRESS, LEVELS } from './data/salonData';
import { salonAudio } from './audio/salonAudio';
import { buildBattleLevelConfig } from './multiplayer/battleProtocol';
import { formatFaNumber } from './utils/formatFa';
import {
  AppScreen,
  BoosterType,
  CollectibleCard,
  HubTab,
  LevelConfig,
  PlayerProgress,
  SalonUpgrade,
} from './types/game';
import {
  getTotalStars,
  loadProgress,
  rollSalonCardReward,
  saveProgress,
} from './utils/storage';
import { TitleScreen } from './components/TitleScreen';
import { SalonMapView } from './components/SalonMapView';
import { CollectionView } from './components/CollectionView';
import { SalonStudioView } from './components/SalonStudioView';
import { NailBattleView } from './components/NailBattleView';
import { LevelCompletionSummary, MatchBoardView } from './components/MatchBoardView';
import { SettingsModal } from './components/SettingsModal';
import { SalonWheelModal, WheelReward } from './components/SalonWheelModal';

function getTodayDayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

type AppIconName =
  | 'flower-brand'
  | 'map'
  | 'cards'
  | 'studio'
  | 'battle'
  | 'settings'
  | 'coin'
  | 'star'
  | 'play';

const AppShellIcon: React.FC<{ name: AppIconName; className?: string }> = ({
  name,
  className = 'w-4 h-4',
}) => {
  switch (name) {
    case 'flower-brand':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="6.2" r="3.4" fill="#E8B4B8" stroke="#6B2D3C" strokeWidth="1.6" />
          <circle cx="17.5" cy="10.2" r="3.4" fill="#E8B4B8" stroke="#6B2D3C" strokeWidth="1.6" />
          <circle cx="15.4" cy="16.6" r="3.4" fill="#E8B4B8" stroke="#6B2D3C" strokeWidth="1.6" />
          <circle cx="8.6" cy="16.6" r="3.4" fill="#E8B4B8" stroke="#6B2D3C" strokeWidth="1.6" />
          <circle cx="6.5" cy="10.2" r="3.4" fill="#E8B4B8" stroke="#6B2D3C" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.2" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.6" />
        </svg>
      );
    case 'map':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6.5L9.5 4.5L14.5 6.5L20 4.5V17.5L14.5 19.5L9.5 17.5L4 19.5V6.5Z" />
          <path d="M9.5 4.5V17.5M14.5 6.5V19.5" />
        </svg>
      );
    case 'cards':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4.5" y="5" width="15" height="14" rx="3" />
          <path d="M9 11.5C9 9.8 11.2 9.2 12 10.6C12.8 9.2 15 9.8 15 11.5C15 13.5 12 15.5 12 15.5C12 15.5 9 13.5 9 11.5Z" fill="#E8B4B8" />
        </svg>
      );
    case 'studio':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" fill="#E8B4B8" />
          <path d="M18 16L18.8 18.2L21 19L18.8 19.8L18 22L17.2 19.8L15 19L17.2 18.2L18 16Z" />
        </svg>
      );
    case 'battle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 19L14.5 9.5M15 5L19 5L19 9L11.5 16.5L7.5 12.5L15 5Z" />
          <path d="M6.5 14.5L9.5 17.5" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 4.5V6.5M12 17.5V19.5M4.5 12H6.5M17.5 12H19.5M6.7 6.7L8.1 8.1M15.9 15.9L17.3 17.3M17.3 6.7L15.9 8.1M8.1 15.9L6.7 17.3" />
        </svg>
      );
    case 'coin':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" fill="#E8B4B8" stroke="#B76E79" strokeWidth="1.4" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M12 3L14.8 8.6L21 9.5L16.5 13.9L17.6 20L12 17.1L6.4 20L7.5 13.9L3 9.5L9.2 8.6L12 3Z"
            fill="#B76E79"
            stroke="#6B2D3C"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'play':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M7 5.5L18.5 12L7 18.5V5.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
  }
};

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [screen, setScreen] = useState<AppScreen>('TITLE');
  const [hubTab, setHubTab] = useState<HubTab>('JOURNEY');
  const [activeLevel, setActiveLevel] = useState<LevelConfig>(LEVELS[0]);
  const [isBattleTrial, setIsBattleTrial] = useState(false);
  const [activeBattleSeed, setActiveBattleSeed] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);

  useEffect(() => {
    salonAudio.setMuted(progress.soundMuted);
    saveProgress(progress);
  }, [progress]);

  const totalStars = useMemo(() => getTotalStars(progress), [progress]);
  const todayKey = getTodayDayKey();
  const canSpinWheel = progress.lastWheelSpinDay !== todayKey;

  const handleToggleSound = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      soundMuted: !prev.soundMuted,
    }));
  }, []);

  const handleStartLevel = useCallback((levelId: number) => {
    const found = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
    setActiveLevel(found);
    setIsBattleTrial(false);
    setActiveBattleSeed(null);
    setScreen('PLAYING');
  }, []);

  const handleQuickPlay = useCallback(() => {
    const targetId = Math.min(progress.highestUnlockedLevel, LEVELS.length);
    handleStartLevel(targetId);
  }, [progress.highestUnlockedLevel, handleStartLevel]);

  const handleStartSeededTrial = useCallback((seedString: string) => {
    const battleLevel = buildBattleLevelConfig(seedString);
    setActiveLevel(battleLevel);
    setIsBattleTrial(true);
    setActiveBattleSeed(seedString);
    setScreen('PLAYING');
  }, []);

  const handleUseBooster = useCallback((booster: BoosterType) => {
    setProgress((prev) => ({
      ...prev,
      boosters: {
        ...prev.boosters,
        [booster]: Math.max(0, prev.boosters[booster] - 1),
      },
    }));
  }, []);

  const handleSpendCoinsForMoves = useCallback(
    (cost: number): boolean => {
      if (progress.coins < cost) return false;
      setProgress((prev) => ({
        ...prev,
        coins: prev.coins - cost,
      }));
      return true;
    },
    [progress.coins]
  );

  const handleLevelFailed = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      winStreak: 0,
    }));
  }, []);

  const handleLevelComplete = useCallback(
    (
      summary: LevelCompletionSummary
    ): { cardReward: { card: CollectibleCard; isNew: boolean } | null } => {
      const reward = rollSalonCardReward(
        summary.stars,
        progress.unlockedCardIds
      );

      setProgress((prev) => {
        const duplicateBonus = reward.isNew ? 0 : 25;
        const nextCoins = prev.coins + summary.coinsEarned + duplicateBonus;
        const nextCards = reward.isNew
          ? [...prev.unlockedCardIds, reward.card.id]
          : prev.unlockedCardIds;
        const nextDupes = reward.isNew
          ? prev.cardDuplicates
          : {
              ...prev.cardDuplicates,
              [reward.card.id]: (prev.cardDuplicates[reward.card.id] ?? 0) + 1,
            };

        if (summary.isBattleMode) {
          const isBest = summary.score > prev.battleBestScore;
          return {
            ...prev,
            coins: nextCoins,
            unlockedCardIds: nextCards,
            cardDuplicates: nextDupes,
            battleBestScore: isBest ? summary.score : prev.battleBestScore,
            battleBestSeed: isBest ? activeBattleSeed : prev.battleBestSeed,
          };
        }

        const prevStars = prev.levelStars[summary.levelId] ?? 0;
        const prevBest = prev.levelHighScores[summary.levelId] ?? 0;
        const nextUnlocked = Math.min(
          LEVELS.length,
          Math.max(prev.highestUnlockedLevel, summary.levelId + 1)
        );

        return {
          ...prev,
          highestUnlockedLevel: nextUnlocked,
          winStreak: prev.winStreak + 1,
          levelStars: {
            ...prev.levelStars,
            [summary.levelId]: Math.max(prevStars, summary.stars),
          },
          levelHighScores: {
            ...prev.levelHighScores,
            [summary.levelId]: Math.max(prevBest, summary.score),
          },
          coins: nextCoins,
          unlockedCardIds: nextCards,
          cardDuplicates: nextDupes,
        };
      });

      return { cardReward: reward };
    },
    [progress.unlockedCardIds, activeBattleSeed]
  );

  const handleClaimWheelReward = useCallback(
    (reward: WheelReward) => {
      setProgress((prev) => {
        const nextBoosters = { ...prev.boosters };
        if (reward.booster && reward.boosterCount) {
          nextBoosters[reward.booster] += reward.boosterCount;
        }
        return {
          ...prev,
          coins: prev.coins + (reward.coins ?? 0),
          boosters: nextBoosters,
          lastWheelSpinDay: todayKey,
        };
      });
    },
    [todayKey]
  );

  const handleOpenGiftPack = useCallback((): {
    card: CollectibleCard;
    isNew: boolean;
  } | null => {
    if (progress.coins < 80) return null;
    const reward = rollSalonCardReward(2, progress.unlockedCardIds);
    salonAudio.playRewardChime();
    setProgress((prev) => {
      const duplicateBonus = reward.isNew ? 0 : 25;
      return {
        ...prev,
        coins: prev.coins - 80 + duplicateBonus,
        unlockedCardIds: reward.isNew
          ? [...prev.unlockedCardIds, reward.card.id]
          : prev.unlockedCardIds,
        cardDuplicates: reward.isNew
          ? prev.cardDuplicates
          : {
              ...prev.cardDuplicates,
              [reward.card.id]: (prev.cardDuplicates[reward.card.id] ?? 0) + 1,
            },
      };
    });
    return reward;
  }, [progress.coins, progress.unlockedCardIds]);

  const handleUnlockUpgrade = useCallback(
    (upgrade: SalonUpgrade) => {
      if (
        progress.coins < upgrade.cost ||
        progress.unlockedUpgradeIds.includes(upgrade.id)
      ) {
        return;
      }
      salonAudio.playRewardChime();
      setProgress((prev) => {
        const nextBoosters = { ...prev.boosters };
        if (upgrade.id === 'equip-uv-lamp') nextBoosters['uv-brush'] += 1;
        if (upgrade.id === 'equip-velvet-chair') nextBoosters['precision-file'] += 1;
        if (upgrade.id === 'equip-crystal-tray') {
          nextBoosters['salon-shuffle'] += 1;
          nextBoosters['uv-brush'] += 1;
        }
        return {
          ...prev,
          coins: prev.coins - upgrade.cost,
          unlockedUpgradeIds: [...prev.unlockedUpgradeIds, upgrade.id],
          equippedPolishId:
            upgrade.category === 'Polish Shade'
              ? upgrade.id
              : prev.equippedPolishId,
          boosters: nextBoosters,
        };
      });
    },
    [progress.coins, progress.unlockedUpgradeIds]
  );

  const handleEquipPolish = useCallback((polishId: string) => {
    salonAudio.playSelect();
    setProgress((prev) => ({
      ...prev,
      equippedPolishId: polishId,
    }));
  }, []);

  const handleResetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
    setHubTab('JOURNEY');
  }, []);

  if (screen === 'TITLE') {
    return (
      <TitleScreen
        highestLevel={Math.min(progress.highestUnlockedLevel, LEVELS.length)}
        totalStars={totalStars}
        coins={progress.coins}
        soundMuted={progress.soundMuted}
        onToggleSound={handleToggleSound}
        onEnterSalon={() => {
          setHubTab('JOURNEY');
          setScreen('HUB');
        }}
        onQuickPlay={handleQuickPlay}
      />
    );
  }

  if (screen === 'PLAYING') {
    const nextLevelObj = !isBattleTrial
      ? LEVELS.find((l) => l.id === activeLevel.id + 1)
      : undefined;

    return (
      <MatchBoardView
        level={activeLevel}
        isBattleMode={isBattleTrial}
        winStreak={progress.winStreak}
        equippedPolishId={progress.equippedPolishId}
        coins={progress.coins}
        boosters={progress.boosters}
        soundMuted={progress.soundMuted}
        onToggleSound={handleToggleSound}
        onUseBooster={handleUseBooster}
        onSpendCoinsForMoves={handleSpendCoinsForMoves}
        onLevelComplete={handleLevelComplete}
        onLevelFailed={handleLevelFailed}
        onExitToMap={() => {
          setScreen('HUB');
          setHubTab(isBattleTrial ? 'BATTLE' : 'JOURNEY');
        }}
        hasNextLevel={Boolean(nextLevelObj)}
        onNextLevel={
          nextLevelObj ? () => handleStartLevel(nextLevelObj.id) : undefined
        }
      />
    );
  }

  const navItems: Array<{ id: HubTab; label: string; icon: AppIconName }> = [
    { id: 'JOURNEY', label: 'مسیر مراحل', icon: 'map' },
    { id: 'CARDS', label: 'کارت‌های ناخن', icon: 'cards' },
    { id: 'STUDIO', label: 'استودیو سالن', icon: 'studio' },
    { id: 'BATTLE', label: 'نبرد ناخن', icon: 'battle' },
  ];

  return (
    <div className="min-h-[100dvh] text-[#6B2D3C] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#FAF6F0]/95 border-b border-[#DEC9BF] px-3 sm:px-8 h-16 flex items-center justify-between gap-3 sm:gap-8 shadow-xs">
        <button
          type="button"
          onClick={() => setScreen('TITLE')}
          className="flex items-center gap-2 font-display text-base sm:text-xl font-bold tracking-tight text-[#6B2D3C] hover:text-[#B76E79] transition-colors whitespace-nowrap shrink-0"
        >
          <AppShellIcon name="flower-brand" className="w-5 h-5 shrink-0" />
          <span dir="ltr">Persian Petal</span>
        </button>

        <nav className="hidden md:flex items-center gap-6" aria-label="بخش‌های سالن">
          {navItems.map((item) => {
            const active = hubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setHubTab(item.id)}
                className={`py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#B76E79] text-[#6B2D3C]'
                    : 'border-transparent text-[#944E59] hover:text-[#6B2D3C]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-display font-bold text-[#6B2D3C] tabular-nums">
            <span className="inline-flex items-center gap-1">
              <AppShellIcon name="star" className="w-4 h-4" />
              <span>{formatFaNumber(totalStars)}</span>
            </span>
            <span aria-hidden="true" className="text-[#B76E79]">·</span>
            <span className="inline-flex items-center gap-1">
              <AppShellIcon name="coin" className="w-4 h-4" />
              <span>{formatFaNumber(progress.coins)}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="تنظیمات سالن"
            className="h-10 w-10 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] flex items-center justify-center text-[#6B2D3C] shrink-0"
          >
            <AppShellIcon name="settings" className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleQuickPlay}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-[12px] btn-3d-rose text-[#F5EDE4] text-xs font-bold whitespace-nowrap shrink-0"
          >
            <AppShellIcon name="play" className="w-3.5 h-3.5 rotate-180" />
            <span>بازی</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-10">
        {hubTab === 'JOURNEY' && (
          <SalonMapView
            progress={progress}
            totalStars={totalStars}
            canSpinWheel={canSpinWheel}
            onOpenWheel={() => setWheelOpen(true)}
            onSelectLevel={(lvlId) => handleStartLevel(lvlId)}
          />
        )}
        {hubTab === 'CARDS' && (
          <CollectionView
            progress={progress}
            onOpenGiftPack={handleOpenGiftPack}
          />
        )}
        {hubTab === 'STUDIO' && (
          <SalonStudioView
            progress={progress}
            onUnlockUpgrade={handleUnlockUpgrade}
            onEquipPolish={handleEquipPolish}
          />
        )}
        {hubTab === 'BATTLE' && (
          <NailBattleView
            progress={progress}
            onStartSeededTrial={handleStartSeededTrial}
          />
        )}
      </main>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FAF6F0]/95 border-t border-[#DEC9BF] px-2 py-1.5 grid grid-cols-4 gap-1"
        aria-label="منوی موبایل"
      >
        {navItems.map((item) => {
          const active = hubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setHubTab(item.id)}
              className={`min-h-[48px] rounded-[12px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#F3D5D7] text-[#6B2D3C]'
                  : 'text-[#944E59] hover:text-[#6B2D3C]'
              }`}
            >
              <AppShellIcon name={item.icon} className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {settingsOpen && (
        <SettingsModal
          soundMuted={progress.soundMuted}
          onToggleSound={handleToggleSound}
          onResetProgress={handleResetProgress}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {wheelOpen && (
        <SalonWheelModal
          canSpinToday={canSpinWheel}
          onClaimReward={handleClaimWheelReward}
          onClose={() => setWheelOpen(false)}
        />
      )}
    </div>
  );
}
