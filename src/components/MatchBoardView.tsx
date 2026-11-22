import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyGravityAndRefill,
  areAdjacent,
  clearSingleCellWithBooster,
  cloneBoard,
  createBoard,
  createSeededRng,
  detonateQueue,
  executeSwapAndCheckSpecial,
  findValidMove,
  isSwapValid,
  resolveBoardMatches,
  shuffleBoard,
} from '../engine/match3';
import { PIECE_META, RARITY_LABEL_FA } from '../data/salonData';
import { salonAudio } from '../audio/salonAudio';
import { formatFaNumber, toFaDigits } from '../utils/formatFa';
import {
  BoardCell,
  BoosterType,
  CollectibleCard,
  LevelConfig,
  PieceType,
  PlayModalState,
} from '../types/game';
import { NailPieceGraphic } from './NailPieces';
import { CollectibleCardArt } from './CollectibleCardArt';

type SalonBoardIconName =
  | 'flower-brand'
  | 'pause'
  | 'sound-on'
  | 'sound-off'
  | 'star'
  | 'check'
  | 'nail-file'
  | 'uv-brush'
  | 'shuffle'
  | 'hint'
  | 'play'
  | 'replay'
  | 'back-map'
  | 'coin'
  | 'ribbon'
  | 'frost-petal';

const SalonBoardIcon: React.FC<{
  name: SalonBoardIconName;
  className?: string;
  filled?: boolean;
}> = ({ name, className = 'w-4 h-4', filled = false }) => {
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
    case 'pause':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <rect x="6.5" y="5" width="3.8" height="14" rx="1.5" fill="currentColor" fillOpacity="0.18" />
          <rect x="13.7" y="5" width="3.8" height="14" rx="1.5" fill="currentColor" fillOpacity="0.18" />
        </svg>
      );
    case 'sound-on':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 9.5H8.5L13.5 5.5V18.5L8.5 14.5H5C4.2 14.5 3.5 13.8 3.5 13V11C3.5 10.2 4.2 9.5 5 9.5Z" fill="currentColor" fillOpacity="0.16" />
          <path d="M16.5 9C17.6 10.2 17.6 13.8 16.5 15" />
          <path d="M19.2 6.8C21.2 9.2 21.2 14.8 19.2 17.2" />
        </svg>
      );
    case 'sound-off':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 9.5H8.5L13.5 5.5V18.5L8.5 14.5H5C4.2 14.5 3.5 13.8 3.5 13V11C3.5 10.2 4.2 9.5 5 9.5Z" fill="currentColor" fillOpacity="0.12" />
          <path d="M16.5 9.5L20.5 14.5" />
          <path d="M20.5 9.5L16.5 14.5" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M12 3L14.8 8.6L21 9.5L16.5 13.9L17.6 20L12 17.1L6.4 20L7.5 13.9L3 9.5L9.2 8.6L12 3Z"
            fill={filled ? '#B76E79' : '#F5EDE4'}
            stroke="#6B2D3C"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5L9.8 17L19 7.5" />
        </svg>
      );
    case 'nail-file':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16.8 3.8C18.2 2.4 20.4 4.6 19 6L8.2 19.6C6.9 21.1 4.5 19.1 5.8 17.5L16.8 3.8Z" fill="#E8B4B8" fillOpacity="0.45" />
          <path d="M10.5 11.5L13 13.5" />
          <path d="M13 8.5L15.5 10.5" />
        </svg>
      );
    case 'uv-brush':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 5.5L18.5 9.5L9.5 18.5L5.5 18.5L5.5 14.5L14.5 5.5Z" fill="#B76E79" fillOpacity="0.3" />
          <path d="M12.5 7.5L16.5 11.5" />
          <path d="M18.5 3.5V5.5M20.5 5.5H18.5" />
        </svg>
      );
    case 'shuffle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8C8 8 10 16 14 16H19" />
          <path d="M16.5 13.5L19.5 16L16.5 18.5" />
          <path d="M4 16C8 16 10 8 14 8H19" />
          <path d="M16.5 5.5L19.5 8L16.5 10.5" />
        </svg>
      );
    case 'hint':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 17H15M9.8 20H14.2M12 4C8.9 4 6.5 6.4 6.5 9.4C6.5 11.4 7.7 13.1 9 14.2V15.5H15V14.2C16.3 13.1 17.5 11.4 17.5 9.4C17.5 6.4 15.1 4 12 4Z" fill="#F5EDE4" />
        </svg>
      );
    case 'play':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M7 5.5L18.5 12L7 18.5V5.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'replay':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4.5 12A7.5 7.5 0 1 0 6.8 6.6L4.5 8.8" />
          <path d="M4.5 4.5V8.8H8.8" />
        </svg>
      );
    case 'back-map':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12H19" />
          <path d="M13 6L19 12L13 18" />
        </svg>
      );
    case 'coin':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" fill="#E8B4B8" stroke="#B76E79" strokeWidth="1.4" />
        </svg>
      );
    case 'ribbon':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 12C9 8.5 5 9.5 6 12.5C6.8 14.8 9.6 14.2 12 12ZM12 12C15 8.5 19 9.5 18 12.5C17.2 14.8 14.4 14.2 12 12Z" fill="#E8B4B8" stroke="#6B2D3C" strokeWidth="1.6" />
          <path d="M10.8 13.5L8 19M13.2 13.5L16 19" stroke="#6B2D3C" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.5" />
        </svg>
      );
    case 'frost-petal':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="7" r="3" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.5" />
          <circle cx="16.8" cy="10.5" r="3" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.5" />
          <circle cx="15" cy="16.2" r="3" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.5" />
          <circle cx="9" cy="16.2" r="3" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.5" />
          <circle cx="7.2" cy="10.5" r="3" fill="#F5EDE4" stroke="#6B2D3C" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2.4" fill="#B76E79" />
        </svg>
      );
  }
};

interface FloatingCallout {
  id: string;
  text: string;
  row: number;
  col: number;
}

interface SparkleBurst {
  id: string;
  row: number;
  col: number;
  color: string;
  scale: number;
}

interface ButterflyFlightVisual {
  id: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
  flyX: string;
  flyY: string;
}

interface DropMotion {
  dropY: string;
  delayMs: number;
  isSpawn: boolean;
}

interface SwapMotion {
  swapX: string;
  swapY: string;
}

interface InvalidNudge {
  row: number;
  col: number;
  nudgeX: string;
  nudgeY: string;
}

export interface LevelCompletionSummary {
  levelId: number;
  score: number;
  stars: number;
  coinsEarned: number;
  isBattleMode: boolean;
}

interface MatchBoardViewProps {
  level: LevelConfig;
  isBattleMode?: boolean;
  winStreak?: number;
  equippedPolishId: string;
  coins: number;
  boosters: Record<BoosterType, number>;
  soundMuted: boolean;
  onToggleSound: () => void;
  onUseBooster: (booster: BoosterType) => void;
  onSpendCoinsForMoves: (cost: number) => boolean;
  onLevelComplete: (summary: LevelCompletionSummary) => {
    cardReward: { card: CollectibleCard; isNew: boolean } | null;
  };
  onLevelFailed?: () => void;
  onExitToMap: () => void;
  onNextLevel?: () => void;
  hasNextLevel: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PALETTE_PARTICLE_BY_TYPE: Record<PieceType, string> = {
  'rose-polish': '#B76E79',
  'lavender-gem': '#E8B4B8',
  'pearl-blossom': '#F5EDE4',
  'mint-card': '#A8C3A0',
  'amber-serum': '#B76E79',
  'berry-bow': '#6B2D3C',
};

const SPARKLE_VECTORS: Array<{ tx: string; ty: string; isStar?: boolean }> = [
  { tx: '-22px', ty: '-24px', isStar: true },
  { tx: '22px', ty: '-22px', isStar: true },
  { tx: '-24px', ty: '16px' },
  { tx: '23px', ty: '18px' },
  { tx: '0px', ty: '-26px', isStar: true },
  { tx: '0px', ty: '24px' },
  { tx: '-25px', ty: '-4px' },
  { tx: '25px', ty: '-4px' },
];

const BOMB_RING_VECTORS: Array<{ tx: string; ty: string; isStar: boolean }> = Array.from(
  { length: 12 },
  (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = i % 2 === 0 ? 54 : 42;
    return {
      tx: `${Math.round(Math.cos(angle) * radius)}px`,
      ty: `${Math.round(Math.sin(angle) * radius)}px`,
      isStar: i % 2 === 0,
    };
  }
);

const BUTTERFLY_TRAIL_STOPS = [
  { tp: '0.25', delayMs: 30, sizeClass: 'w-2.5 h-2.5' },
  { tp: '0.5', delayMs: 65, sizeClass: 'w-2 h-2' },
  { tp: '0.75', delayMs: 100, sizeClass: 'w-1.5 h-1.5' },
];

function buildInitialBoard(
  level: LevelConfig,
  winStreak: number,
  isBattleMode: boolean
): { board: BoardCell[][]; rng: () => number } {
  const rng = level.seed !== undefined ? createSeededRng(level.seed) : Math.random;
  const board = createBoard(
    level.rows,
    level.cols,
    level.piecePool,
    level.initialFrostPattern ?? [],
    rng,
    level.blockedPattern ?? [],
    level.lockedPattern ?? []
  );

  if (!isBattleMode && winStreak > 0) {
    const bonusCount = Math.min(2, winStreak);
    const candidates: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < level.rows; r += 1) {
      for (let c = 0; c < level.cols; c += 1) {
        const cell = board[r][c];
        if (!cell.blocked && !cell.locked && cell.piece && cell.piece.special === 'none') {
          candidates.push({ row: r, col: c });
        }
      }
    }
    for (let i = 0; i < bonusCount && candidates.length > 0; i += 1) {
      const pickIdx = Math.floor(Math.random() * candidates.length);
      const picked = candidates.splice(pickIdx, 1)[0];
      const cell = board[picked.row][picked.col];
      if (cell.piece) {
        cell.piece.special = i === 0 ? 'line-h' : 'bomb';
      }
    }
  }

  return { board, rng };
}

function getIsRtl(): boolean {
  if (typeof document === 'undefined') return true;
  return getComputedStyle(document.documentElement).direction === 'rtl';
}

export const MatchBoardView: React.FC<MatchBoardViewProps> = ({
  level,
  isBattleMode = false,
  winStreak = 0,
  equippedPolishId,
  coins,
  boosters,
  soundMuted,
  onToggleSound,
  onUseBooster,
  onSpendCoinsForMoves,
  onLevelComplete,
  onLevelFailed,
  onExitToMap,
  onNextLevel,
  hasNextLevel,
}) => {
  const rngRef = useRef<() => number>(Math.random);

  const [board, setBoard] = useState<BoardCell[][]>(() => {
    const init = buildInitialBoard(level, winStreak, isBattleMode);
    rngRef.current = init.rng;
    return init.board;
  });

  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [score, setScore] = useState(0);
  const [collectedPieces, setCollectedPieces] = useState<Record<PieceType, number>>({
    'rose-polish': 0,
    'lavender-gem': 0,
    'pearl-blossom': 0,
    'mint-card': 0,
    'amber-serum': 0,
    'berry-bow': 0,
  });
  const [clearedFrostCount, setClearedFrostCount] = useState(0);
  const [clearedLocksCount, setClearedLocksCount] = useState(0);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);

  // Animation States
  const [clearingKeys, setClearingKeys] = useState<Set<string>>(new Set());
  const [spawnSpecialKeys, setSpawnSpecialKeys] = useState<Set<string>>(new Set());
  const [dropMotions, setDropMotions] = useState<Record<string, DropMotion>>({});
  const [swapMotions, setSwapMotions] = useState<Record<string, SwapMotion>>({});
  const [invalidNudges, setInvalidNudges] = useState<InvalidNudge[]>([]);
  const [sparkles, setSparkles] = useState<SparkleBurst[]>([]);
  const [beamRows, setBeamRows] = useState<number[]>([]);
  const [beamCols, setBeamCols] = useState<number[]>([]);
  const [bombCenters, setBombCenters] = useState<Array<{ row: number; col: number }>>([]);
  const [prismCenters, setPrismCenters] = useState<Array<{ row: number; col: number }>>([]);
  const [butterflyFlights, setButterflyFlights] = useState<ButterflyFlightVisual[]>([]);
  const [butterflyTargetKeys, setButterflyTargetKeys] = useState<Set<string>>(new Set());
  const [trayBumpMode, setTrayBumpMode] = useState<'none' | 'soft' | 'strong'>('none');
  const [comboGlowDepth, setComboGlowDepth] = useState(0);
  const [comboPraise, setComboPraise] = useState<string | null>(null);
  const [isIntenseCombo, setIsIntenseCombo] = useState(false);
  const [callouts, setCallouts] = useState<FloatingCallout[]>([]);
  const [hintPair, setHintPair] = useState<[{ row: number; col: number }, { row: number; col: number }] | null>(null);
  const [shuffleNotice, setShuffleNotice] = useState(false);
  const [modalState, setModalState] = useState<PlayModalState>('NONE');
  const [victoryDrop, setVictoryDrop] = useState<{
    stars: number;
    coinsEarned: number;
    cardReward: { card: CollectibleCard; isNew: boolean } | null;
  } | null>(null);

  const dragOriginRef = useRef<{ row: number; col: number; x: number; y: number } | null>(null);
  const mountedRef = useRef(true);
  const completionTriggeredRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetLevelState = useCallback(() => {
    const init = buildInitialBoard(level, winStreak, isBattleMode);
    rngRef.current = init.rng;
    setBoard(init.board);
    setMovesLeft(level.moves);
    setScore(0);
    setCollectedPieces({
      'rose-polish': 0,
      'lavender-gem': 0,
      'pearl-blossom': 0,
      'mint-card': 0,
      'amber-serum': 0,
      'berry-bow': 0,
    });
    setClearedFrostCount(0);
    setClearedLocksCount(0);
    setSelected(null);
    setIsBusy(false);
    setActiveBooster(null);
    setClearingKeys(new Set());
    setSpawnSpecialKeys(new Set());
    setDropMotions({});
    setSwapMotions({});
    setInvalidNudges([]);
    setSparkles([]);
    setBeamRows([]);
    setBeamCols([]);
    setBombCenters([]);
    setPrismCenters([]);
    setButterflyFlights([]);
    setButterflyTargetKeys(new Set());
    setTrayBumpMode('none');
    setComboGlowDepth(0);
    setComboPraise(null);
    setIsIntenseCombo(false);
    setCallouts([]);
    setHintPair(null);
    setShuffleNotice(false);
    setModalState('NONE');
    setVictoryDrop(null);
    completionTriggeredRef.current = false;
    lastActivityRef.current = Date.now();
  }, [level, winStreak, isBattleMode]);

  useEffect(() => {
    resetLevelState();
  }, [resetLevelState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalState === 'NONE') setModalState('PAUSED');
        else if (modalState === 'PAUSED') setModalState('NONE');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalState]);

  useEffect(() => {
    if (isBusy || modalState !== 'NONE') return;
    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > 5500) {
        setHintPair((prev) => prev ?? findValidMove(board));
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [board, isBusy, modalState]);

  const objectiveProgress = useMemo(() => {
    return level.objectives.map((obj) => {
      const current =
        obj.kind === 'clear-frost'
          ? clearedFrostCount
          : obj.kind === 'clear-locks'
            ? clearedLocksCount
            : obj.pieceType
              ? collectedPieces[obj.pieceType]
              : 0;
      const clamped = Math.min(current, obj.target);
      return {
        ...obj,
        current: clamped,
        done: clamped >= obj.target,
      };
    });
  }, [level.objectives, clearedFrostCount, clearedLocksCount, collectedPieces]);

  const priorityPieceTypes = useMemo(() => {
    return objectiveProgress
      .filter((o) => !o.done && o.kind === 'collect-piece' && o.pieceType)
      .map((o) => o.pieceType!);
  }, [objectiveProgress]);

  const allObjectivesComplete = useMemo(
    () => objectiveProgress.every((o) => o.done),
    [objectiveProgress]
  );

  const addCallout = useCallback((text: string, row: number, col: number) => {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCallouts((prev) => [...prev.slice(-4), { id, text, row, col }]);
    window.setTimeout(() => {
      if (mountedRef.current) {
        setCallouts((prev) => prev.filter((item) => item.id !== id));
      }
    }, 620);
  }, []);

  const showPraiseBanner = useCallback((text: string, intense = false) => {
    setComboPraise(text);
    setIsIntenseCombo(intense);
    window.setTimeout(() => {
      if (mountedRef.current) {
        setComboPraise((cur) => {
          if (cur === text) {
            setIsIntenseCombo(false);
            return null;
          }
          return cur;
        });
      }
    }, 600);
  }, []);

  const computeGravityMotions = useCallback(
    (beforeBoard: BoardCell[][], afterBoard: BoardCell[][]): {
      drops: Record<string, DropMotion>;
      spawns: Set<string>;
    } => {
      const prevRowById = new Map<string, number>();
      for (let r = 0; r < beforeBoard.length; r += 1) {
        for (let c = 0; c < (beforeBoard[r]?.length ?? 0); c += 1) {
          const p = beforeBoard[r][c].piece;
          if (p) prevRowById.set(p.id, r);
        }
      }

      const drops: Record<string, DropMotion> = {};
      const spawns = new Set<string>();
      const newCountByCol = new Map<number, number>();

      for (let r = 0; r < afterBoard.length; r += 1) {
        for (let c = 0; c < (afterBoard[r]?.length ?? 0); c += 1) {
          const p = afterBoard[r][c].piece;
          if (!p) continue;
          if (p.isNew && !prevRowById.has(p.id)) {
            newCountByCol.set(c, (newCountByCol.get(c) ?? 0) + 1);
          }
        }
      }

      for (let r = 0; r < afterBoard.length; r += 1) {
        for (let c = 0; c < (afterBoard[r]?.length ?? 0); c += 1) {
          const p = afterBoard[r][c].piece;
          if (!p) continue;
          const prevR = prevRowById.get(p.id);
          if (prevR !== undefined) {
            const deltaRows = r - prevR;
            if (deltaRows > 0) {
              drops[p.id] = {
                dropY: `${-deltaRows * 108}%`,
                delayMs: c * 10,
                isSpawn: false,
              };
            }
          } else if (p.isNew) {
            const colSpawnCount = newCountByCol.get(c) ?? 1;
            const dropCells = Math.max(1.2, colSpawnCount + 0.35);
            drops[p.id] = {
              dropY: `${-dropCells * 112}%`,
              delayMs: c * 12,
              isSpawn: true,
            };
          }
        }
      }

      return { drops, spawns };
    },
    []
  );

  // End-of-Level Bonus Finale
  const runSalonCrushFinale = useCallback(
    async (
      currentBoard: BoardCell[][],
      remainingMoves: number,
      startingScore: number
    ): Promise<number> => {
      let workingBoard = cloneBoard(currentBoard);
      let finalScore = startingScore;

      if (remainingMoves <= 0) return finalScore;

      showPraiseBanner('درخشش پایانی!', true);
      salonAudio.playSpecialTrigger('prism');
      setComboGlowDepth(3);

      const beats = Math.min(remainingMoves, 6);
      const leftoverDirectBonus = Math.max(0, remainingMoves - beats) * 140;
      finalScore += leftoverDirectBonus;

      for (let m = 0; m < beats && mountedRef.current; m += 1) {
        setMovesLeft((prev) => Math.max(0, prev - 1));
        const candidates: Array<{ row: number; col: number }> = [];
        for (let r = 0; r < level.rows; r += 1) {
          for (let c = 0; c < level.cols; c += 1) {
            const cell = workingBoard[r][c];
            if (!cell.blocked && cell.piece && cell.piece.special === 'none') {
              candidates.push({ row: r, col: c });
            }
          }
        }
        if (candidates.length === 0) break;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        workingBoard[pick.row][pick.col].piece!.special =
          m % 3 === 2 ? 'bomb' : m % 2 === 0 ? 'line-h' : 'line-v';
        setSpawnSpecialKeys(new Set([`${pick.row},${pick.col}`]));
        setBoard(cloneBoard(workingBoard));
        await sleep(110);
        if (!mountedRef.current) return finalScore;
        setSpawnSpecialKeys(new Set());

        const step = detonateQueue(workingBoard, [pick], new Set(), 2);
        setBeamRows(step.beamRows);
        setBeamCols(step.beamCols);
        setBombCenters(step.bombCenters);
        setClearingKeys(new Set(step.clearedCoords.map((p) => `${p.row},${p.col}`)));
        setTrayBumpMode(step.bombCenters.length > 0 ? 'strong' : 'soft');
        salonAudio.playSpecialTrigger(m % 3 === 2 ? 'bomb' : 'line-h');

        finalScore += step.pointsEarned + 120;
        setScore(finalScore);
        addCallout(`+${formatFaNumber(step.pointsEarned + 120)}`, pick.row, pick.col);

        await sleep(220);
        if (!mountedRef.current) return finalScore;
        setClearingKeys(new Set());
        setBeamRows([]);
        setBeamCols([]);
        setBombCenters([]);
        setTrayBumpMode('none');

        const nextBoard = applyGravityAndRefill(
          step.board,
          level.piecePool,
          rngRef.current
        );
        const { drops } = computeGravityMotions(step.board, nextBoard);
        setDropMotions(drops);
        workingBoard = nextBoard;
        setBoard(workingBoard);
        await sleep(200);
        setDropMotions({});
      }

      setComboGlowDepth(0);
      return finalScore;
    },
    [level.rows, level.cols, level.piecePool, showPraiseBanner, addCallout, computeGravityMotions]
  );

  const checkEndConditions = useCallback(
    async (
      currentBoard: BoardCell[][],
      nextMoves: number,
      nextScore: number,
      nextCollected: Record<PieceType, number>,
      nextFrost: number,
      nextLocks: number
    ) => {
      if (completionTriggeredRef.current) return;

      const objectivesDone = level.objectives.every((obj) => {
        const val =
          obj.kind === 'clear-frost'
            ? nextFrost
            : obj.kind === 'clear-locks'
              ? nextLocks
              : obj.pieceType
                ? nextCollected[obj.pieceType]
                : 0;
        return val >= obj.target;
      });

      if (objectivesDone) {
        completionTriggeredRef.current = true;
        const finalScore = await runSalonCrushFinale(
          currentBoard,
          nextMoves,
          nextScore
        );
        if (!mountedRef.current) return;

        setMovesLeft(0);
        setScore(finalScore);

        const [s1, s2, s3] = level.starThresholds;
        const stars = finalScore >= s3 ? 3 : finalScore >= s2 ? 2 : finalScore >= s1 ? 1 : 1;
        const coinsEarned = level.coinReward + stars * 15;

        salonAudio.playVictory();
        const rewardRes = onLevelComplete({
          levelId: level.id,
          score: finalScore,
          stars,
          coinsEarned,
          isBattleMode,
        });

        setVictoryDrop({
          stars,
          coinsEarned,
          cardReward: rewardRes.cardReward,
        });
        setModalState('VICTORY');
      } else if (nextMoves <= 0) {
        salonAudio.playOutOfMoves();
        onLevelFailed?.();
        setModalState('OUT_OF_MOVES');
      }
    },
    [level, isBattleMode, onLevelComplete, onLevelFailed, runSalonCrushFinale]
  );

  const runResolutionPipeline = useCallback(
    async (
      startingBoard: BoardCell[][],
      preferredCoords: Array<{ row: number; col: number }>,
      movesAfterMove: number,
      initialStep?: ReturnType<typeof resolveBoardMatches>,
      explicitPrisms: Array<{ row: number; col: number }> = []
    ) => {
      setIsBusy(true);
      let workingBoard = startingBoard;
      let runningScore = score;
      const runningCollected = { ...collectedPieces };
      let runningFrost = clearedFrostCount;
      let runningLocks = clearedLocksCount;
      let cascadeDepth = 1;

      try {
        let step =
          initialStep ??
          resolveBoardMatches(
            workingBoard,
            preferredCoords,
            cascadeDepth,
            priorityPieceTypes
          );

        while (step.hadMatch && mountedRef.current) {
          const isRtl = getIsRtl();

          const newSpecials = new Set<string>();
          for (let r = 0; r < level.rows; r += 1) {
            for (let c = 0; c < level.cols; c += 1) {
              const prevP = workingBoard[r][c].piece;
              const nextP = step.board[r][c].piece;
              if (nextP && nextP.isNew && nextP.special !== 'none' && prevP?.id !== nextP.id) {
                newSpecials.add(`${r},${c}`);
              }
            }
          }
          setSpawnSpecialKeys(newSpecials);

          const prisms: Array<{ row: number; col: number }> =
            cascadeDepth === 1 ? [...explicitPrisms] : [];
          for (const coord of step.clearedCoords) {
            if (workingBoard[coord.row]?.[coord.col]?.piece?.special === 'prism') {
              if (!prisms.some((p) => p.row === coord.row && p.col === coord.col)) {
                prisms.push({ row: coord.row, col: coord.col });
              }
            }
          }
          setPrismCenters(prisms);

          const flights: ButterflyFlightVisual[] = step.butterflyFlights.map((f, idx) => {
            const dxCells = isRtl ? f.from.col - f.to.col : f.to.col - f.from.col;
            const dyCells = f.to.row - f.from.row;
            return {
              id: `bf-${Date.now()}-${idx}`,
              from: f.from,
              to: f.to,
              flyX: `${dxCells * 100}%`,
              flyY: `${dyCells * 100}%`,
            };
          });
          setButterflyFlights(flights);
          setButterflyTargetKeys(
            new Set(step.butterflyFlights.map((f) => `${f.to.row},${f.to.col}`))
          );

          setClearingKeys(
            new Set(step.clearedCoords.map((p) => `${p.row},${p.col}`))
          );

          const particleScale = cascadeDepth >= 3 ? 1.35 : cascadeDepth === 2 ? 1.18 : 1;
          const maxSparkles = cascadeDepth >= 3 ? 22 : 16;
          const newSparkles: SparkleBurst[] = step.clearedCoords
            .slice(0, maxSparkles)
            .map((coord, idx) => {
              const cellPiece = workingBoard[coord.row]?.[coord.col]?.piece;
              return {
                id: `sp-${Date.now()}-${idx}`,
                row: coord.row,
                col: coord.col,
                color: cellPiece ? PALETTE_PARTICLE_BY_TYPE[cellPiece.type] : '#B76E79',
                scale: particleScale,
              };
            });
          setSparkles(newSparkles);

          setBeamRows(step.beamRows);
          setBeamCols(step.beamCols);
          setBombCenters(step.bombCenters);

          const hasBigSpecial =
            step.bombCenters.length > 0 ||
            prisms.length > 0 ||
            step.beamRows.length > 0 ||
            step.beamCols.length > 0;

          if (
            cascadeDepth >= 3 ||
            step.bombCenters.length > 0 ||
            prisms.length > 0 ||
            step.beamRows.length > 0 ||
            step.beamCols.length > 0
          ) {
            setTrayBumpMode('strong');
          } else if (cascadeDepth === 2 || hasBigSpecial || step.clearedCoords.length >= 5) {
            setTrayBumpMode('soft');
          } else {
            setTrayBumpMode('none');
          }

          setComboGlowDepth(cascadeDepth);

          if (prisms.length > 0) {
            salonAudio.playSpecialTrigger('prism');
          } else if (step.beamRows.length > 0 || step.beamCols.length > 0) {
            salonAudio.playSpecialTrigger('line-h');
          } else if (step.bombCenters.length > 0) {
            salonAudio.playSpecialTrigger('bomb');
          } else {
            salonAudio.playMatch(cascadeDepth);
          }

          if (step.clearedFrost > 0 || step.clearedLocks > 0) {
            salonAudio.playFrostBreak();
          }

          if (cascadeDepth >= 2) {
            showPraiseBanner(`Combo ×${cascadeDepth}`, cascadeDepth >= 3);
          } else if (step.clearedCoords.length >= 5) {
            showPraiseBanner('درخشش عالی!', false);
          }

          const anchor = step.clearedCoords[0] ?? { row: 3, col: 3 };
          const prefix = cascadeDepth > 1 ? `Combo ×${cascadeDepth} · ` : '';
          addCallout(`${prefix}+${formatFaNumber(step.pointsEarned)}`, anchor.row, anchor.col);

          runningScore += step.pointsEarned;
          (Object.keys(step.clearedPieces) as PieceType[]).forEach((pt) => {
            runningCollected[pt] += step.clearedPieces[pt];
          });
          runningFrost += step.clearedFrost;
          runningLocks += step.clearedLocks;

          setScore(runningScore);
          setCollectedPieces({ ...runningCollected });
          setClearedFrostCount(runningFrost);
          setClearedLocksCount(runningLocks);

          // Match clear pop + radial wave + particles (240-290ms)
          await sleep(flights.length > 0 ? 290 : 250);
          if (!mountedRef.current) return;

          setClearingKeys(new Set());
          setSpawnSpecialKeys(new Set());
          setButterflyTargetKeys(new Set());
          setButterflyFlights([]);
          setSparkles([]);
          setBeamRows([]);
          setBeamCols([]);
          setBombCenters([]);
          setPrismCenters([]);
          setTrayBumpMode('none');

          await sleep(20);
          if (!mountedRef.current) return;

          const nextBoard = applyGravityAndRefill(
            step.board,
            level.piecePool,
            rngRef.current
          );
          const { drops } = computeGravityMotions(step.board, nextBoard);
          setDropMotions(drops);
          workingBoard = nextBoard;
          setBoard(workingBoard);

          await sleep(225);
          if (!mountedRef.current) return;
          setDropMotions({});

          await sleep(20);
          if (!mountedRef.current) return;

          cascadeDepth += 1;
          step = resolveBoardMatches(
            workingBoard,
            [],
            cascadeDepth,
            priorityPieceTypes
          );
        }

        setComboGlowDepth(0);

        if (!findValidMove(workingBoard) && mountedRef.current) {
          setShuffleNotice(true);
          await sleep(260);
          workingBoard = shuffleBoard(workingBoard, rngRef.current);
          setBoard(workingBoard);
          await sleep(220);
          setShuffleNotice(false);
        }

        if (mountedRef.current) {
          await checkEndConditions(
            workingBoard,
            movesAfterMove,
            runningScore,
            runningCollected,
            runningFrost,
            runningLocks
          );
        }
      } finally {
        if (mountedRef.current) {
          setComboGlowDepth(0);
          setIsBusy(false);
        }
      }
    },
    [
      score,
      collectedPieces,
      clearedFrostCount,
      clearedLocksCount,
      level.rows,
      level.cols,
      level.piecePool,
      priorityPieceTypes,
      addCallout,
      showPraiseBanner,
      computeGravityMotions,
      checkEndConditions,
    ]
  );

  const attemptSwap = useCallback(
    async (a: { row: number; col: number }, b: { row: number; col: number }) => {
      if (isBusy || modalState !== 'NONE') return;
      if (!areAdjacent(a, b)) return;

      lastActivityRef.current = Date.now();
      setHintPair(null);
      setSelected(null);

      const isRtl = getIsRtl();
      const rawDx = b.col - a.col;
      const dxScreen = isRtl ? -rawDx : rawDx;
      const dyScreen = b.row - a.row;

      if (!isSwapValid(board, a, b)) {
        salonAudio.playInvalidSwap();
        setIsBusy(true);
        setInvalidNudges([
          {
            row: a.row,
            col: a.col,
            nudgeX: `${dxScreen * 22}%`,
            nudgeY: `${dyScreen * 22}%`,
          },
          {
            row: b.row,
            col: b.col,
            nudgeX: `${-dxScreen * 22}%`,
            nudgeY: `${-dyScreen * 22}%`,
          },
        ]);
        await sleep(230);
        if (mountedRef.current) {
          setInvalidNudges([]);
          setIsBusy(false);
        }
        return;
      }

      salonAudio.playSwap();
      const nextMoves = Math.max(0, movesLeft - 1);
      setMovesLeft(nextMoves);

      const pA = board[a.row][a.col].piece;
      const pB = board[b.row][b.col].piece;
      const explicitPrisms: Array<{ row: number; col: number }> = [];
      if (pA?.special === 'prism') explicitPrisms.push(b);
      if (pB?.special === 'prism') explicitPrisms.push(a);

      const swaps: Record<string, SwapMotion> = {};
      if (pA) {
        swaps[pA.id] = {
          swapX: `${-dxScreen * 105}%`,
          swapY: `${-dyScreen * 105}%`,
        };
      }
      if (pB) {
        swaps[pB.id] = {
          swapX: `${dxScreen * 105}%`,
          swapY: `${dyScreen * 105}%`,
        };
      }

      const { nextBoard, specialComboResult } = executeSwapAndCheckSpecial(
        board,
        a,
        b,
        priorityPieceTypes
      );
      setSwapMotions(swaps);
      setBoard(nextBoard);
      await sleep(145);
      if (!mountedRef.current) return;
      setSwapMotions({});

      if (specialComboResult) {
        salonAudio.playSpecialTrigger('prism');
        showPraiseBanner('Combo ×2', true);
        await runResolutionPipeline(
          nextBoard,
          [b, a],
          nextMoves,
          specialComboResult,
          explicitPrisms
        );
      } else {
        await runResolutionPipeline(nextBoard, [b, a], nextMoves);
      }
    },
    [
      board,
      isBusy,
      modalState,
      movesLeft,
      priorityPieceTypes,
      runResolutionPipeline,
      showPraiseBanner,
    ]
  );

  const handleCellTap = useCallback(
    async (row: number, col: number) => {
      if (isBusy || modalState !== 'NONE') return;
      const cell = board[row]?.[col];
      if (!cell || cell.blocked) return;

      lastActivityRef.current = Date.now();
      setHintPair(null);

      if (activeBooster === 'precision-file') {
        if (boosters['precision-file'] <= 0) {
          setActiveBooster(null);
          return;
        }
        onUseBooster('precision-file');
        setActiveBooster(null);
        salonAudio.playBooster();
        const step = clearSingleCellWithBooster(board, { row, col }, priorityPieceTypes);
        await runResolutionPipeline(board, [], movesLeft, step);
        return;
      }

      if (activeBooster === 'uv-brush') {
        if (boosters['uv-brush'] <= 0) {
          setActiveBooster(null);
          return;
        }
        if (!cell.piece || cell.locked) return;
        onUseBooster('uv-brush');
        setActiveBooster(null);
        salonAudio.playBooster();
        const updated = cloneBoard(board);
        updated[row][col].piece = {
          ...cell.piece,
          special: (row + col) % 2 === 0 ? 'line-h' : 'line-v',
          isNew: true,
        };
        setSpawnSpecialKeys(new Set([`${row},${col}`]));
        setBoard(updated);
        addCallout('قلم UV آماده شد', row, col);
        window.setTimeout(() => {
          if (mountedRef.current) setSpawnSpecialKeys(new Set());
        }, 260);
        return;
      }

      if (cell.locked) {
        salonAudio.playInvalidSwap();
        return;
      }

      if (!selected) {
        salonAudio.playSelect();
        setSelected({ row, col });
        return;
      }

      if (selected.row === row && selected.col === col) {
        setSelected(null);
        return;
      }

      if (areAdjacent(selected, { row, col })) {
        await attemptSwap(selected, { row, col });
      } else {
        salonAudio.playSelect();
        setSelected({ row, col });
      }
    },
    [
      isBusy,
      modalState,
      board,
      activeBooster,
      boosters,
      onUseBooster,
      priorityPieceTypes,
      movesLeft,
      runResolutionPipeline,
      addCallout,
      selected,
      attemptSwap,
    ]
  );

  const handlePointerDown = (row: number, col: number, e: React.PointerEvent) => {
    if (isBusy || modalState !== 'NONE' || activeBooster) return;
    const cell = board[row]?.[col];
    if (!cell || cell.blocked || cell.locked) return;
    dragOriginRef.current = { row, col, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const origin = dragOriginRef.current;
    if (!origin || isBusy || modalState !== 'NONE') return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    const threshold = 22;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    dragOriginRef.current = null;
    let targetRow = origin.row;
    let targetCol = origin.col;
    if (Math.abs(dx) > Math.abs(dy)) {
      const isRtl = getIsRtl();
      const colStep = dx > 0 ? (isRtl ? -1 : 1) : isRtl ? 1 : -1;
      targetCol += colStep;
    } else {
      targetRow += dy > 0 ? 1 : -1;
    }

    if (
      targetRow >= 0 &&
      targetRow < level.rows &&
      targetCol >= 0 &&
      targetCol < level.cols
    ) {
      attemptSwap({ row: origin.row, col: origin.col }, { row: targetRow, col: targetCol });
    }
  };

  const handlePointerUp = () => {
    dragOriginRef.current = null;
  };

  const handleShuffleBooster = () => {
    if (isBusy || modalState !== 'NONE' || boosters['salon-shuffle'] <= 0) return;
    onUseBooster('salon-shuffle');
    salonAudio.playBooster();
    setBoard((prev) => shuffleBoard(prev, rngRef.current));
    setSelected(null);
    setHintPair(null);
  };

  const handleHintClick = () => {
    if (isBusy || modalState !== 'NONE') return;
    const found = findValidMove(board);
    if (found) {
      salonAudio.playSelect();
      setHintPair(found);
    }
  };

  const handleBuyMoreMoves = () => {
    if (onSpendCoinsForMoves(60)) {
      salonAudio.playRewardChime();
      setMovesLeft((m) => m + 5);
      setModalState('NONE');
    }
  };

  const trayBorderClass =
    comboGlowDepth >= 3
      ? 'border-[#B76E79] ring-4 ring-[#E8B4B8]/65'
      : comboGlowDepth === 2
        ? 'border-[#B76E79] ring-2 ring-[#E8B4B8]/50'
        : equippedPolishId === 'polish-champagne-foil'
          ? 'border-[#B76E79]'
          : equippedPolishId === 'polish-lavender-haze'
            ? 'border-[#E8B4B8]'
            : 'border-[#D3B6AC]';

  const currentStarsPreview = useMemo(() => {
    const [s1, s2, s3] = level.starThresholds;
    if (score >= s3) return 3;
    if (score >= s2) return 2;
    if (score >= s1) return 1;
    return 0;
  }, [score, level.starThresholds]);

  const starMeterPercent = Math.min(
    100,
    Math.round((score / Math.max(1, level.starThresholds[2])) * 100)
  );

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden pp-salon-table text-[#6B2D3C] flex flex-col items-center justify-between px-1.5 py-2.5 sm:px-6 sm:py-4 select-none">
      {/* Luxury Salon Header & Objectives Strip */}
      <header className="w-full max-w-[520px] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setModalState('PAUSED')}
            aria-label="توقف بازی"
            className="h-10 sm:h-11 px-3 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] flex items-center gap-1.5 font-bold text-xs sm:text-sm shrink-0"
          >
            <SalonBoardIcon name="pause" className="w-4 h-4" />
            <span className="hidden sm:inline">توقف</span>
          </button>

          <div className="text-center min-w-0 flex-1 px-1">
            <div className="flex items-center justify-center gap-1.5">
              <SalonBoardIcon name="flower-brand" className="w-4 h-4 shrink-0" />
              <span
                dir="ltr"
                className="font-display text-sm sm:text-base font-bold tracking-tight text-[#6B2D3C] whitespace-nowrap"
              >
                Persian Petal
              </span>
              <span aria-hidden="true" className="text-[#B76E79] text-xs">·</span>
              <span className="text-[11px] font-bold text-[#944E59] truncate">
                {isBattleMode ? 'نبرد ناخن' : `مرحله ${toFaDigits(level.id)}`}
              </span>
            </div>

            <div className="mt-0.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-display font-bold tabular-nums text-[#6B2D3C]">
              <span>امتیاز {formatFaNumber(score)}</span>
              <span aria-hidden="true" className="text-[#B76E79]">·</span>
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3].map((idx) => (
                  <SalonBoardIcon
                    key={idx}
                    name="star"
                    filled={idx <= currentStarsPreview}
                    className={`w-4 h-4 transition-transform duration-200 ${
                      idx <= currentStarsPreview ? 'scale-110' : 'opacity-55'
                    }`}
                  />
                ))}
              </span>
            </div>

            <div className="mt-1 mx-auto w-36 h-1.5 rounded-full bg-[#E8DCD0] overflow-hidden border border-[#DEC9BF]">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#6B2D3C] via-[#B76E79] to-[#E8B4B8] transition-all duration-300"
                style={{ width: `${starMeterPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundMuted ? 'وصل صدا' : 'قطع صدا'}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] flex items-center justify-center shrink-0"
          >
            <SalonBoardIcon name={soundMuted ? 'sound-off' : 'sound-on'} className="w-4 h-4" />
          </button>
        </div>

        {/* Ceramic Orders & Remaining Moves Bar */}
        <div className="rounded-[16px] surface-25d border border-[#DEC9BF] px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {objectiveProgress.map((obj) => (
              <div key={obj.id} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[10px] cell-25d border border-[#DEC9BF] p-1 shrink-0 flex items-center justify-center">
                  {obj.kind === 'clear-frost' ? (
                    <SalonBoardIcon name="frost-petal" className="w-5 h-5" />
                  ) : obj.kind === 'clear-locks' ? (
                    <SalonBoardIcon name="ribbon" className="w-5 h-5" />
                  ) : obj.pieceType ? (
                    <NailPieceGraphic type={obj.pieceType} />
                  ) : null}
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] text-[#944E59] font-bold">
                    {obj.kind === 'clear-frost'
                      ? 'کاشی گل'
                      : obj.kind === 'clear-locks'
                        ? 'گره روبان'
                        : obj.pieceType
                          ? PIECE_META[obj.pieceType].shortLabel
                          : 'هدف'}
                  </div>
                  <div className="text-xs sm:text-sm font-display font-bold tabular-nums flex items-center gap-1">
                    {obj.done ? (
                      <span className="text-[#2E8B63] inline-flex items-center gap-1">
                        <SalonBoardIcon name="check" className="w-3.5 h-3.5" />
                        <span>تکمیل</span>
                      </span>
                    ) : (
                      <span>
                        {toFaDigits(obj.current)} از {toFaDigits(obj.target)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pr-3 border-r border-[#DEC9BF] text-center shrink-0 min-w-[58px]">
            <div className="text-[11px] font-bold text-[#944E59]">حرکت</div>
            <div
              className={`text-2xl font-display font-bold tabular-nums leading-none mt-0.5 transition-transform duration-200 ${
                movesLeft <= 5 ? 'text-[#C94A5A] scale-110' : 'text-[#6B2D3C]'
              }`}
            >
              {toFaDigits(movesLeft)}
            </div>
          </div>
        </div>
      </header>

      {/* Ceramic Manicure Tray & Recessed Grid */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-1.5 sm:my-2 relative">
        {activeBooster && (
          <div className="mb-2 px-3.5 py-1.5 rounded-[12px] bg-[#6B2D3C] text-[#F5EDE4] text-xs font-bold flex items-center gap-2.5 shadow-md">
            <span>
              {activeBooster === 'precision-file'
                ? 'روی یک خانه بزنید تا سوهان بخورد'
                : 'روی یک مهره آزاد بزنید تا قلم UV شود'}
            </span>
            <button
              type="button"
              onClick={() => setActiveBooster(null)}
              className="underline text-[#E8B4B8]"
            >
              انصراف
            </button>
          </div>
        )}

        {shuffleNotice && (
          <div className="mb-2 px-3.5 py-1.5 rounded-[12px] bg-[#FAF6F0] border border-[#DEC9BF] text-xs font-bold text-[#6B2D3C] shadow-sm">
            در حال چیدن دوباره سینی سالن...
          </div>
        )}

        <div
          className={`relative w-full max-w-[468px] aspect-square rounded-[20px] sm:rounded-[26px] tray-25d border-[2.5px] p-1.5 sm:p-3 transition-shadow duration-200 ${trayBorderClass} ${
            trayBumpMode === 'strong'
              ? 'animate-tray-bump-strong'
              : trayBumpMode === 'soft'
                ? 'animate-tray-bump'
                : ''
          }`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="grid w-full h-full gap-[3px] sm:gap-1.5 relative"
            style={{
              gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${level.rows}, minmax(0, 1fr))`,
            }}
          >
            {board.map((rowArr, r) =>
              rowArr.map((cell, c) => {
                if (cell.blocked) {
                  return <div key={`${r},${c}`} aria-hidden="true" />;
                }

                const key = `${r},${c}`;
                const isSelected = selected?.row === r && selected?.col === c;
                const isClearing = clearingKeys.has(key);
                const isSpawnSpecial = spawnSpecialKeys.has(key);
                const isButterflyTarget = butterflyTargetKeys.has(key);
                const isHint =
                  hintPair?.some((h) => h.row === r && h.col === c) ?? false;

                const nudge = invalidNudges.find((n) => n.row === r && n.col === c);
                const pieceId = cell.piece?.id ?? '';
                const dropMotion = pieceId ? dropMotions[pieceId] : undefined;
                const swapMotion = pieceId ? swapMotions[pieceId] : undefined;
                const isSpecialIdle = cell.piece && cell.piece.special !== 'none';

                let pieceAnimClass = '';
                let pieceAnimStyle: React.CSSProperties | undefined;

                if (isClearing) {
                  pieceAnimClass = 'animate-tile-clear';
                } else if (nudge) {
                  pieceAnimClass = 'animate-invalid-wiggle';
                  pieceAnimStyle = {
                    '--nudge-x': nudge.nudgeX,
                    '--nudge-y': nudge.nudgeY,
                  } as React.CSSProperties;
                } else if (swapMotion) {
                  pieceAnimClass = 'animate-swap-glide';
                  pieceAnimStyle = {
                    '--swap-x': swapMotion.swapX,
                    '--swap-y': swapMotion.swapY,
                  } as React.CSSProperties;
                } else if (isSpawnSpecial) {
                  pieceAnimClass = 'animate-petal-pop';
                } else if (dropMotion) {
                  pieceAnimClass = 'animate-gravity-fall';
                  pieceAnimStyle = {
                    '--drop-y': dropMotion.dropY,
                    '--drop-opacity': dropMotion.isSpawn ? '0.6' : '0.95',
                    animationDelay: `${dropMotion.delayMs}ms`,
                  } as React.CSSProperties;
                } else if (isSelected) {
                  pieceAnimClass = 'animate-selected-glow';
                } else if (isSpecialIdle) {
                  pieceAnimClass = 'animate-special-shimmer';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCellTap(r, c)}
                    onPointerDown={(e) => handlePointerDown(r, c, e)}
                    aria-label={
                      cell.piece
                        ? `${PIECE_META[cell.piece.type].name} ردیف ${toFaDigits(r + 1)} ستون ${toFaDigits(c + 1)}`
                        : `خانه خالی ردیف ${toFaDigits(r + 1)} ستون ${toFaDigits(c + 1)}`
                    }
                    className={`relative rounded-[10px] sm:rounded-[14px] flex items-center justify-center p-0.5 sm:p-1.5 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#6B2D3C] touch-none ${
                      cell.frostLevel === 2
                        ? 'cell-25d-frost-2 border border-[#944E59]'
                        : cell.frostLevel === 1
                          ? 'cell-25d-frost-1 border border-[#B76E79]'
                          : 'cell-25d border border-[#DFCFC4]'
                    } ${
                      isSelected
                        ? 'ring-2 ring-[#B76E79] shadow-[0_0_14px_rgba(183,110,121,0.5)] scale-105 z-10'
                        : 'hover:brightness-[1.015]'
                    } ${
                      isHint
                        ? 'animate-hint ring-2 ring-[#B76E79] shadow-[0_0_12px_rgba(183,110,121,0.45)] z-10'
                        : ''
                    } ${isButterflyTarget ? 'ring-2 ring-[#A8C3A0] scale-105 z-10' : ''}`}
                  >
                    {cell.frostLevel > 0 && (
                      <span
                        className="pointer-events-none absolute top-0.5 left-0.5 flex items-center gap-0.5 z-10"
                        aria-hidden="true"
                      >
                        <SalonBoardIcon name="frost-petal" className="w-3 h-3" />
                        {cell.frostLevel === 2 && (
                          <span className="text-[9px] font-bold text-[#6B2D3C] leading-none">
                            {toFaDigits(2)}
                          </span>
                        )}
                      </span>
                    )}

                    {/* Match Radial Glow & Expanding Wave */}
                    {isClearing && (
                      <>
                        <span
                          className="pointer-events-none absolute -inset-1 rounded-full animate-clear-ring z-10"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(245,237,228,0.92) 0%, rgba(232,180,184,0.52) 55%, rgba(232,180,184,0) 78%)',
                          }}
                          aria-hidden="true"
                        />
                        <span
                          className="pointer-events-none absolute inset-1 rounded-full border-2 border-[#B76E79] bg-[#F5EDE4]/55 animate-clear-ring z-10"
                          aria-hidden="true"
                        />
                      </>
                    )}

                    {cell.piece && (
                      <div
                        key={cell.piece.id}
                        style={pieceAnimStyle}
                        className={`w-full h-full flex items-center justify-center ${pieceAnimClass}`}
                      >
                        <NailPieceGraphic
                          type={cell.piece.type}
                          special={cell.piece.special}
                        />
                      </div>
                    )}

                    {/* Satin Ribbon Cage Overlay */}
                    {cell.locked && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-[10px] sm:rounded-[14px] border-2 border-[#B76E79] bg-[#F5EDE4]/35 flex items-center justify-center z-20"
                        aria-hidden="true"
                      >
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#B76E79]/75" />
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 bg-[#B76E79]/75" />
                        <span className="relative z-10 w-5 h-5 rounded-full bg-[#F5EDE4] border border-[#6B2D3C] flex items-center justify-center shadow-sm">
                          <SalonBoardIcon name="ribbon" className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Outward Tile-Matched Particle Bursts */}
          {sparkles.map((sp) => (
            <div
              key={sp.id}
              className="pointer-events-none absolute z-20"
              style={{
                top: `calc(${((sp.row + 0.5) / level.rows) * 100}%)`,
                right: `calc(${((sp.col + 0.5) / level.cols) * 100}%)`,
              }}
            >
              {SPARKLE_VECTORS.map((vec, i) => (
                <span
                  key={i}
                  className={`absolute animate-sparkle ${
                    vec.isStar ? 'w-2.5 h-2.5 rotate-45 rounded-[2px]' : 'w-2 h-2 rounded-full'
                  }`}
                  style={
                    {
                      backgroundColor: i % 3 === 0 ? '#F5EDE4' : sp.color,
                      boxShadow: `0 0 6px ${sp.color}`,
                      '--tx': vec.tx,
                      '--ty': vec.ty,
                      '--ps': String(sp.scale),
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ))}

          {/* Rose-Gold Horizontal & Vertical Beam Flashes */}
          {beamRows.map((rowIdx) => (
            <div
              key={`beam-h-${rowIdx}`}
              className="pointer-events-none absolute left-2 right-2 h-8 rounded-full bg-gradient-to-r from-[#E8B4B8]/25 via-[#F5EDE4]/95 to-[#E8B4B8]/25 shadow-[0_0_20px_rgba(183,110,121,0.8)] animate-beam-h z-20 flex items-center"
              style={{
                top: `calc(${((rowIdx + 0.5) / level.rows) * 100}% - 16px)`,
              }}
            >
              <div className="w-full h-2 rounded-full bg-[#F5EDE4] shadow-[0_0_8px_#F5EDE4]" />
            </div>
          ))}

          {beamCols.map((colIdx) => (
            <div
              key={`beam-v-${colIdx}`}
              className="pointer-events-none absolute top-2 bottom-2 w-8 rounded-full bg-gradient-to-b from-[#E8B4B8]/25 via-[#F5EDE4]/95 to-[#E8B4B8]/25 shadow-[0_0_20px_rgba(183,110,121,0.8)] animate-beam-v z-20 flex justify-center"
              style={{
                right: `calc(${((colIdx + 0.5) / level.cols) * 100}% - 16px)`,
              }}
            >
              <div className="h-full w-2 rounded-full bg-[#F5EDE4] shadow-[0_0_8px_#F5EDE4]" />
            </div>
          ))}

          {/* Rose-Gold Crystal Bomb Shockwaves + Radial Particle Ring */}
          {bombCenters.map((center, idx) => (
            <React.Fragment key={`bomb-${idx}-${center.row}-${center.col}`}>
              <div
                className="pointer-events-none absolute w-32 h-32 rounded-full bg-[#E8B4B8]/40 border-[3px] border-[#F5EDE4] shadow-[0_0_24px_rgba(183,110,121,0.75)] animate-bomb-wave z-20"
                style={{
                  top: `calc(${((center.row + 0.5) / level.rows) * 100}% - 64px)`,
                  right: `calc(${((center.col + 0.5) / level.cols) * 100}% - 64px)`,
                }}
              />
              <div
                className="pointer-events-none absolute w-22 h-22 rounded-full bg-[#B76E79]/30 border-2 border-[#F5EDE4] animate-bomb-wave z-20"
                style={{
                  animationDelay: '45ms',
                  top: `calc(${((center.row + 0.5) / level.rows) * 100}% - 44px)`,
                  right: `calc(${((center.col + 0.5) / level.cols) * 100}% - 44px)`,
                }}
              />
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: `calc(${((center.row + 0.5) / level.rows) * 100}%)`,
                  right: `calc(${((center.col + 0.5) / level.cols) * 100}%)`,
                }}
              >
                {BOMB_RING_VECTORS.map((vec, pIdx) => (
                  <span
                    key={pIdx}
                    className={`absolute animate-sparkle ${
                      vec.isStar ? 'w-2.5 h-2.5 rotate-45 rounded-[2px]' : 'w-2 h-2 rounded-full'
                    }`}
                    style={
                      {
                        backgroundColor:
                          pIdx % 3 === 0 ? '#F5EDE4' : pIdx % 2 === 0 ? '#B76E79' : '#E8B4B8',
                        boxShadow: '0 0 6px rgba(183,110,121,0.8)',
                        '--tx': vec.tx,
                        '--ty': vec.ty,
                        '--ps': '1.25',
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </React.Fragment>
          ))}

          {/* Prism Color-Wave Shockwave + Diagonal Cream-Rose Board Sweep */}
          {prismCenters.length > 0 && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px] z-20">
              <div
                className="absolute -inset-y-1/2 left-0 w-2/3 animate-prism-sweep"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(245,237,228,0) 0%, rgba(232,180,184,0.45) 35%, rgba(245,237,228,0.65) 50%, rgba(168,195,160,0.4) 68%, rgba(245,237,228,0) 100%)',
                  filter: 'blur(4px)',
                }}
              />
            </div>
          )}

          {prismCenters.map((center, idx) => (
            <div
              key={`prism-${idx}-${center.row}-${center.col}`}
              className="pointer-events-none absolute w-36 h-36 rounded-full border-[3px] border-[#F5EDE4] animate-prism-wave z-20"
              style={{
                background:
                  'radial-gradient(circle, rgba(245,237,228,0.75) 0%, rgba(232,180,184,0.48) 48%, rgba(168,195,160,0.32) 75%, rgba(183,110,121,0) 100%)',
                boxShadow: '0 0 30px rgba(183,110,121,0.72)',
                top: `calc(${((center.row + 0.5) / level.rows) * 100}% - 72px)`,
                right: `calc(${((center.col + 0.5) / level.cols) * 100}% - 72px)`,
              }}
            />
          ))}

          {/* Flying Rose-Gold Butterfly Sprites + Cream Sparkle Trail */}
          {butterflyFlights.length > 0 && (
            <div className="pointer-events-none absolute inset-1.5 sm:inset-3 z-30">
              {butterflyFlights.map((flight) => (
                <React.Fragment key={flight.id}>
                  {BUTTERFLY_TRAIL_STOPS.map((stop, tIdx) => (
                    <div
                      key={`${flight.id}-tr-${tIdx}`}
                      className="pointer-events-none absolute flex items-center justify-center animate-butterfly-trail"
                      style={
                        {
                          top: `calc(${(flight.from.row / level.rows) * 100}%)`,
                          right: `calc(${(flight.from.col / level.cols) * 100}%)`,
                          width: `calc(${100 / level.cols}%)`,
                          height: `calc(${100 / level.rows}%)`,
                          '--fly-x': flight.flyX,
                          '--fly-y': flight.flyY,
                          '--tp': stop.tp,
                          animationDelay: `${stop.delayMs}ms`,
                        } as React.CSSProperties
                      }
                    >
                      <span
                        className={`rounded-full bg-[#F5EDE4] border border-[#B76E79] shadow-[0_0_8px_rgba(183,110,121,0.85)] ${stop.sizeClass}`}
                      />
                    </div>
                  ))}
                  <div
                    className="pointer-events-none absolute flex items-center justify-center animate-butterfly-fly"
                    style={
                      {
                        top: `calc(${(flight.from.row / level.rows) * 100}%)`,
                        right: `calc(${(flight.from.col / level.cols) * 100}%)`,
                        width: `calc(${100 / level.cols}%)`,
                        height: `calc(${100 / level.rows}%)`,
                        '--fly-x': flight.flyX,
                        '--fly-y': flight.flyY,
                      } as React.CSSProperties
                    }
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#F5EDE4] via-[#E8B4B8] to-[#B76E79] border-2 border-[#6B2D3C] shadow-[0_0_14px_rgba(183,110,121,0.75)] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#6B2D3C]" fill="currentColor" aria-hidden="true">
                        <path d="M12 11 C9 5, 3 4, 3 9 C3 12, 7 13, 10 12 C7 14, 5 18, 8 19 C10 20, 11 16, 12 14 C13 16, 14 20, 16 19 C19 18, 17 14, 14 12 C17 13, 21 12, 21 9 C21 4, 15 5, 12 11 Z" />
                      </svg>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Combo ×N Banner (0.8 -> 1 scale, 600ms fade-out) */}
          {comboPraise && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex justify-center">
              <div
                dir="ltr"
                className={`px-5 py-1.5 rounded-[12px] btn-3d-rose text-[#F5EDE4] font-display font-bold tabular-nums border border-[#F5EDE4] ${
                  isIntenseCombo || comboGlowDepth >= 3
                    ? 'animate-combo-banner-intense text-2xl sm:text-3xl shadow-[0_8px_24px_rgba(107,45,60,0.4)]'
                    : 'animate-combo-banner text-xl sm:text-2xl shadow-lg'
                }`}
              >
                {comboPraise}
              </div>
            </div>
          )}

          {/* Floating Score Callouts */}
          {callouts.map((c) => (
            <div
              key={c.id}
              className="pointer-events-none absolute z-20 px-2.5 py-0.5 rounded-[10px] bg-[#6B2D3C]/95 text-[#F5EDE4] text-xs font-display font-bold tabular-nums shadow animate-float-score"
              style={{
                top: `calc(${((c.row + 0.3) / level.rows) * 100}%)`,
                right: `calc(${((c.col + 0.5) / level.cols) * 100}% - 26px)`,
              }}
            >
              {c.text}
            </div>
          ))}
        </div>
      </main>

      {/* Bottom 12px Luxury Boosters Bar */}
      <footer className="w-full max-w-[520px] grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() =>
            setActiveBooster((b) =>
              b === 'precision-file' ? null : boosters['precision-file'] > 0 ? 'precision-file' : null
            )
          }
          disabled={isBusy || boosters['precision-file'] <= 0}
          className={`min-h-[46px] px-2 py-1.5 rounded-[12px] border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-45 ${
            activeBooster === 'precision-file'
              ? 'btn-3d-rose border-[#6B2D3C] text-[#F5EDE4]'
              : 'btn-3d-pearl border-[#DEC9BF] text-[#6B2D3C]'
          }`}
        >
          <SalonBoardIcon name="nail-file" className="w-4 h-4 shrink-0" />
          <span className="truncate">سوهان</span>
          <span className="font-display tabular-nums opacity-80">
            ({toFaDigits(boosters['precision-file'])})
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveBooster((b) =>
              b === 'uv-brush' ? null : boosters['uv-brush'] > 0 ? 'uv-brush' : null
            )
          }
          disabled={isBusy || boosters['uv-brush'] <= 0}
          className={`min-h-[46px] px-2 py-1.5 rounded-[12px] border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-45 ${
            activeBooster === 'uv-brush'
              ? 'btn-3d-rose border-[#6B2D3C] text-[#F5EDE4]'
              : 'btn-3d-pearl border-[#DEC9BF] text-[#6B2D3C]'
          }`}
        >
          <SalonBoardIcon name="uv-brush" className="w-4 h-4 shrink-0" />
          <span className="truncate">قلم UV</span>
          <span className="font-display tabular-nums opacity-80">
            ({toFaDigits(boosters['uv-brush'])})
          </span>
        </button>

        <button
          type="button"
          onClick={handleShuffleBooster}
          disabled={isBusy || boosters['salon-shuffle'] <= 0}
          className="min-h-[46px] px-2 py-1.5 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-45"
        >
          <SalonBoardIcon name="shuffle" className="w-4 h-4 shrink-0 text-[#73936B]" />
          <span className="truncate">چیدمان</span>
          <span className="font-display tabular-nums opacity-80">
            ({toFaDigits(boosters['salon-shuffle'])})
          </span>
        </button>

        <button
          type="button"
          onClick={handleHintClick}
          disabled={isBusy}
          className="min-h-[46px] px-2 py-1.5 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-45"
        >
          <SalonBoardIcon name="hint" className="w-4 h-4 shrink-0 text-[#B76E79]" />
          <span className="truncate">راهنما</span>
        </button>
      </footer>

      {/* Pause Modal */}
      {modalState === 'PAUSED' && (
        <div
          className="fixed inset-0 z-50 bg-[#4B1C27]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="توقف بازی"
        >
          <div className="w-full max-w-sm rounded-[20px] surface-25d border border-[#DEC9BF] p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#6B2D3C]">
              استراحت سالن
            </h2>
            <p className="mt-1 text-sm text-[#944E59]">
              مرحله {toFaDigits(level.id)} · {level.title}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setModalState('NONE')}
                className="w-full min-h-[46px] rounded-[12px] btn-3d-rose text-[#F5EDE4] font-bold text-sm flex items-center justify-center gap-2"
              >
                <SalonBoardIcon name="play" className="w-4 h-4 rotate-180" />
                <span>ادامه بازی</span>
              </button>
              <button
                type="button"
                onClick={resetLevelState}
                className="w-full min-h-[46px] rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] font-bold text-sm flex items-center justify-center gap-2"
              >
                <SalonBoardIcon name="replay" className="w-4 h-4" />
                <span>شروع مجدد مرحله</span>
              </button>
              <button
                type="button"
                onClick={onExitToMap}
                className="w-full min-h-[46px] rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#944E59] font-bold text-sm flex items-center justify-center gap-2"
              >
                <SalonBoardIcon name="back-map" className="w-4 h-4" />
                <span>بازگشت به نقشه سالن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {modalState === 'VICTORY' && victoryDrop && (
        <div
          className="fixed inset-0 z-50 bg-[#4B1C27]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="مرحله با موفقیت انجام شد"
        >
          <div className="w-full max-w-md rounded-[20px] surface-25d border border-[#DEC9BF] p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3].map((s) => (
                <SalonBoardIcon
                  key={s}
                  name="star"
                  filled={s <= victoryDrop.stars}
                  className={`w-9 h-9 ${s <= victoryDrop.stars ? '' : 'opacity-45'}`}
                />
              ))}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#6B2D3C]">
              {isBattleMode ? 'چالش نبرد تکمیل شد!' : 'مانیکور درخشان شد!'}
            </h2>
            <p className="mt-1.5 text-sm text-[#944E59] font-display tabular-nums">
              امتیاز نهایی: {formatFaNumber(score)} · پاداش: {formatFaNumber(victoryDrop.coinsEarned)} سکه
            </p>

            {victoryDrop.cardReward && (
              <div className="mt-5 rounded-[14px] bg-[#FAF6F0] border border-[#DEC9BF] p-4 text-right">
                <div className="flex items-center justify-between text-xs font-bold text-[#944E59] mb-2">
                  <span>
                    {victoryDrop.cardReward.isNew
                      ? 'کارت طراحی ناخن جدید باز شد!'
                      : 'کارت تکراری (+۲۵ سکه پاداش)'}
                  </span>
                  <span>{RARITY_LABEL_FA[victoryDrop.cardReward.card.rarity]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CollectibleCardArt
                    card={victoryDrop.cardReward.card}
                    unlocked
                    className="w-24 h-18 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-display font-bold text-base text-[#6B2D3C] truncate">
                      {victoryDrop.cardReward.card.title}
                    </p>
                    <p className="mt-1 text-xs text-[#944E59] line-clamp-2">
                      {victoryDrop.cardReward.card.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              {!isBattleMode && hasNextLevel && onNextLevel && (
                <button
                  type="button"
                  onClick={onNextLevel}
                  className="flex-1 min-h-[46px] px-5 rounded-[12px] btn-3d-rose text-[#F5EDE4] font-bold text-sm flex items-center justify-center gap-2"
                >
                  <SalonBoardIcon name="play" className="w-4 h-4 rotate-180" />
                  <span>مرحله بعدی</span>
                </button>
              )}
              <button
                type="button"
                onClick={resetLevelState}
                className="flex-1 min-h-[46px] px-4 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] font-bold text-sm flex items-center justify-center gap-2"
              >
                <SalonBoardIcon name="replay" className="w-4 h-4" />
                <span>تکرار</span>
              </button>
              <button
                type="button"
                onClick={onExitToMap}
                className="flex-1 min-h-[46px] px-4 rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#944E59] font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>نقشه سالن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Moves Modal */}
      {modalState === 'OUT_OF_MOVES' && !allObjectivesComplete && (
        <div
          className="fixed inset-0 z-50 bg-[#4B1C27]/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="پایان حرکت‌ها"
        >
          <div className="w-full max-w-sm rounded-[20px] surface-25d border border-[#DEC9BF] p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#6B2D3C]">
              حرکت‌ها تمام شد
            </h2>
            <p className="mt-1 text-sm text-[#944E59]">
              فقط کمی تا تکمیل سفارش سالن مانده! می‌توانید ۵ حرکت اضافه بگیرید یا از اول شروع کنید.
            </p>

            <div className="mt-4 space-y-1.5 text-right rounded-[14px] bg-[#FAF6F0] p-3.5 text-xs border border-[#DEC9BF]">
              {objectiveProgress.map((obj) => (
                <div key={obj.id} className="flex items-center justify-between font-bold text-[#6B2D3C]">
                  <span>{obj.label}</span>
                  <span className="font-display tabular-nums">
                    {toFaDigits(obj.current)}/{toFaDigits(obj.target)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleBuyMoreMoves}
                disabled={coins < 60}
                className="w-full min-h-[46px] rounded-[12px] btn-3d-rose disabled:opacity-45 text-[#F5EDE4] font-bold text-sm flex items-center justify-center gap-2"
              >
                <SalonBoardIcon name="coin" className="w-4 h-4" />
                <span>+۵ حرکت اضافه با ۶۰ سکه</span>
              </button>
              <button
                type="button"
                onClick={resetLevelState}
                className="w-full min-h-[46px] rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#6B2D3C] font-bold text-sm flex items-center justify-center gap-2"
              >
                <SalonBoardIcon name="replay" className="w-4 h-4" />
                <span>تلاش دوباره</span>
              </button>
              <button
                type="button"
                onClick={onExitToMap}
                className="w-full min-h-[46px] rounded-[12px] btn-3d-pearl border border-[#DEC9BF] text-[#944E59] font-bold text-sm"
              >
                بازگشت به نقشه سالن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
