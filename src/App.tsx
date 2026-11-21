import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Compass,
  CreditCard,
  Sparkles,
  Swords,
  Settings,
  Coins,
  Star,
  Play,
} from 'lucide-react';
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

  const navItems: Array<{ id: HubTab; label: string; icon: typeof Compass }> = [
    { id: 'JOURNEY', label: 'مسیر مراحل', icon: Compass },
    { id: 'CARDS', label: 'کارت‌های ناخن', icon: CreditCard },
    { id: 'STUDIO', label: 'استودیو سالن', icon: Sparkles },
    { id: 'BATTLE', label: 'نبرد ناخن', icon: Swords },
  ];

  return (
    <div className="min-h-[100dvh] text-[#351427] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#FFFDFB]/95 border-b border-[#F0DCE4] px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8 shadow-xs">
        <button
          type="button"
          onClick={() => setScreen('TITLE')}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#351427] hover:text-[#E23B78] transition-colors whitespace-nowrap shrink-0"
        >
          پرشین پتال
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
                    ? 'border-[#E23B78] text-[#351427]'
                    : 'border-transparent text-[#6C3B53] hover:text-[#351427]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#5E354A] tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#F5B922] text-[#B45309]" />
              <span>{formatFaNumber(totalStars)}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Coins className="w-4 h-4 text-[#C89B3C]" />
              <span>{formatFaNumber(progress.coins)}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="تنظیمات سالن"
            className="h-10 w-10 rounded-xl btn-3d-pearl border border-[#EBCAD6] flex items-center justify-center text-[#351427] shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleQuickPlay}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl btn-3d-rose text-white text-xs font-bold whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current rotate-180" />
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
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FFFDFB]/95 border-t border-[#EBCAD6] px-2 py-1.5 grid grid-cols-4 gap-1"
        aria-label="منوی موبایل"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = hubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setHubTab(item.id)}
              className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#FDF1F5] text-[#E23B78]'
                  : 'text-[#6C3B53] hover:text-[#351427]'
              }`}
            >
              <Icon className="w-4 h-4" />
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
