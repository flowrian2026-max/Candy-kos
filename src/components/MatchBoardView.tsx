import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Shuffle,
  Wand2,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  Star,
  Coins,
  Check,
  Play,
} from 'lucide-react';
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

const COMBO_PRAISE_FA = ['خوش‌سلیقه!', 'درخشان!', 'عالی بود!', 'جادویی!', 'شاهکار پرشین!'];

const SPARKLE_VECTORS: Array<{ tx: string; ty: string }> = [
  { tx: '-18px', ty: '-22px' },
  { tx: '20px', ty: '-20px' },
  { tx: '-20px', ty: '16px' },
  { tx: '18px', ty: '18px' },
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

  // Apply Win Streak starting bonus specials (up to 2) in Saga mode
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
  const [clearingKeys, setClearingKeys] = useState<Set<string>>(new Set());
  const [sparkles, setSparkles] = useState<SparkleBurst[]>([]);
  const [beamRows, setBeamRows] = useState<number[]>([]);
  const [beamCols, setBeamCols] = useState<number[]>([]);
  const [bombCenters, setBombCenters] = useState<Array<{ row: number; col: number }>>([]);
  const [butterflyTargetKeys, setButterflyTargetKeys] = useState<Set<string>>(new Set());
  const [trayBump, setTrayBump] = useState(false);
  const [comboPraise, setComboPraise] = useState<string | null>(null);
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
    setSparkles([]);
    setBeamRows([]);
    setBeamCols([]);
    setBombCenters([]);
    setButterflyTargetKeys(new Set());
    setTrayBump(false);
    setComboPraise(null);
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
    }, 720);
  }, []);

  const showPraiseBanner = useCallback((text: string) => {
    setComboPraise(text);
    window.setTimeout(() => {
      if (mountedRef.current) {
        setComboPraise((cur) => (cur === text ? null : cur));
      }
    }, 900);
  }, []);

  // Signature Candy Crush "Sugar Crush" / درخشش پایانی Finale
  const runSalonCrushFinale = useCallback(
    async (
      currentBoard: BoardCell[][],
      remainingMoves: number,
      startingScore: number
    ): Promise<number> => {
      let workingBoard = cloneBoard(currentBoard);
      let finalScore = startingScore;

      if (remainingMoves <= 0) return finalScore;

      showPraiseBanner('درخشش پایانی!');
      salonAudio.playSpecialTrigger('prism');

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
        setBoard(cloneBoard(workingBoard));
        await sleep(110);
        if (!mountedRef.current) return finalScore;

        const step = detonateQueue(workingBoard, [pick], new Set(), 2);
        setBeamRows(step.beamRows);
        setBeamCols(step.beamCols);
        setBombCenters(step.bombCenters);
        setClearingKeys(new Set(step.clearedCoords.map((p) => `${p.row},${p.col}`)));
        salonAudio.playSpecialTrigger(m % 3 === 2 ? 'bomb' : 'line-h');

        finalScore += step.pointsEarned + 120;
        setScore(finalScore);
        addCallout(`+${formatFaNumber(step.pointsEarned + 120)}`, pick.row, pick.col);

        await sleep(150);
        if (!mountedRef.current) return finalScore;
        setClearingKeys(new Set());
        setBeamRows([]);
        setBeamCols([]);
        setBombCenters([]);

        workingBoard = applyGravityAndRefill(
          step.board,
          level.piecePool,
          rngRef.current
        );
        setBoard(workingBoard);
        await sleep(120);
      }

      return finalScore;
    },
    [level.rows, level.cols, level.piecePool, showPraiseBanner, addCallout]
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
      initialStep?: ReturnType<typeof resolveBoardMatches>
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
          setClearingKeys(
            new Set(step.clearedCoords.map((p) => `${p.row},${p.col}`))
          );
          setButterflyTargetKeys(
            new Set(step.butterflyFlights.map((f) => `${f.to.row},${f.to.col}`))
          );

          const newSparkles: SparkleBurst[] = step.clearedCoords
            .slice(0, 14)
            .map((coord, idx) => {
              const cellPiece = workingBoard[coord.row]?.[coord.col]?.piece;
              return {
                id: `sp-${Date.now()}-${idx}`,
                row: coord.row,
                col: coord.col,
                color: cellPiece ? PIECE_META[cellPiece.type].color : '#E23B78',
              };
            });
          setSparkles(newSparkles);

          setBeamRows(step.beamRows);
          setBeamCols(step.beamCols);
          setBombCenters(step.bombCenters);

          if (step.beamRows.length > 0 || step.beamCols.length > 0) {
            salonAudio.playSpecialTrigger('line-h');
            setTrayBump(true);
          } else if (step.bombCenters.length > 0) {
            salonAudio.playSpecialTrigger('bomb');
            setTrayBump(true);
          } else {
            salonAudio.playMatch(cascadeDepth);
          }

          if (step.clearedFrost > 0 || step.clearedLocks > 0) {
            salonAudio.playFrostBreak();
          }

          if (cascadeDepth >= 2 || step.clearedCoords.length >= 5) {
            const praiseIdx = Math.min(cascadeDepth - 1, COMBO_PRAISE_FA.length - 1);
            showPraiseBanner(COMBO_PRAISE_FA[Math.max(0, praiseIdx)]);
          }

          const anchor = step.clearedCoords[0] ?? { row: 3, col: 3 };
          const prefix = cascadeDepth > 1 ? `کمبو ×${toFaDigits(cascadeDepth)} ` : '';
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

          await sleep(185);
          if (!mountedRef.current) return;

          setClearingKeys(new Set());
          setButterflyTargetKeys(new Set());
          setSparkles([]);
          setBeamRows([]);
          setBeamCols([]);
          setBombCenters([]);
          setTrayBump(false);

          workingBoard = applyGravityAndRefill(
            step.board,
            level.piecePool,
            rngRef.current
          );
          setBoard(workingBoard);

          await sleep(185);
          if (!mountedRef.current) return;

          cascadeDepth += 1;
          step = resolveBoardMatches(
            workingBoard,
            [],
            cascadeDepth,
            priorityPieceTypes
          );
        }

        if (!findValidMove(workingBoard) && mountedRef.current) {
          setShuffleNotice(true);
          await sleep(340);
          workingBoard = shuffleBoard(workingBoard, rngRef.current);
          setBoard(workingBoard);
          await sleep(240);
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
          setIsBusy(false);
        }
      }
    },
    [
      score,
      collectedPieces,
      clearedFrostCount,
      clearedLocksCount,
      level.piecePool,
      priorityPieceTypes,
      addCallout,
      showPraiseBanner,
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

      if (!isSwapValid(board, a, b)) {
        salonAudio.playInvalidSwap();
        return;
      }

      salonAudio.playSwap();
      const nextMoves = Math.max(0, movesLeft - 1);
      setMovesLeft(nextMoves);

      const { nextBoard, specialComboResult } = executeSwapAndCheckSpecial(
        board,
        a,
        b,
        priorityPieceTypes
      );
      setBoard(nextBoard);
      await sleep(120);
      if (!mountedRef.current) return;

      if (specialComboResult) {
        salonAudio.playSpecialTrigger('prism');
        showPraiseBanner('ترکیب ویژه!');
        await runResolutionPipeline(nextBoard, [b, a], nextMoves, specialComboResult);
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
        setBoard(updated);
        addCallout('قلم‌موی UV آماده شد!', row, col);
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
      const isRtl =
        typeof document !== 'undefined' &&
        getComputedStyle(document.documentElement).direction === 'rtl';
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
    equippedPolishId === 'polish-champagne-foil'
      ? 'border-[#D49E2A]'
      : equippedPolishId === 'polish-lavender-haze'
        ? 'border-[#A77DF0]'
        : 'border-[#E682AA]';

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
    <div className="min-h-[100dvh] w-full text-[#351427] flex flex-col items-center justify-between px-3 py-3 sm:px-6 sm:py-5 select-none">
      {/* Compact 2.5D Salon Game HUD */}
      <header className="w-full max-w-[540px] flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setModalState('PAUSED')}
            aria-label="توقف بازی"
            className="h-11 px-3.5 rounded-xl btn-3d-pearl border border-[#EBCAD6] text-[#351427] flex items-center gap-2 font-bold text-sm shrink-0"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">توقف</span>
          </button>

          <div className="text-center min-w-0 flex-1 px-2">
            <p className="text-[11px] font-bold text-[#9A2353] truncate">
              {isBattleMode ? 'چالش رقابتی نبرد ناخن' : `مرحله ${toFaDigits(level.id)}`} · {level.title}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-bold tabular-nums">
              <span>امتیاز {formatFaNumber(score)}</span>
              <span aria-hidden="true" className="text-[#B78B9E]">·</span>
              <span className="inline-flex items-center gap-0.5 text-[#C89B3C]">
                {[1, 2, 3].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${
                      idx <= currentStarsPreview ? 'fill-[#F5B922] text-[#B45309]' : 'text-[#DFC7D0]'
                    }`}
                  />
                ))}
              </span>
            </div>
            <div className="mt-1 mx-auto w-36 h-2 rounded-full bg-[#F1D6E2] overflow-hidden border border-[#E4B8CA]">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#FBBF24] via-[#F472B6] to-[#E23B78] transition-all duration-300"
                style={{ width: `${starMeterPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundMuted ? 'وصل صدا' : 'قطع صدا'}
            className="h-11 w-11 rounded-xl btn-3d-pearl border border-[#EBCAD6] text-[#351427] flex items-center justify-center shrink-0"
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* 2.5D Objectives & Moves Strip */}
        <div className="rounded-2xl surface-25d border border-[#EBCAD6] px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3.5 min-w-0">
            {objectiveProgress.map((obj) => (
              <div key={obj.id} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl cell-25d border border-[#F0D4DE] p-1 shrink-0 flex items-center justify-center">
                  {obj.kind === 'clear-frost' ? (
                    <span className="text-base font-bold text-[#E23B78]" aria-hidden="true">
                      ✿
                    </span>
                  ) : obj.kind === 'clear-locks' ? (
                    <span className="text-sm font-bold text-[#9A2353]" aria-hidden="true">
                      🎀
                    </span>
                  ) : obj.pieceType ? (
                    <NailPieceGraphic type={obj.pieceType} />
                  ) : null}
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] text-[#6C3B53] font-bold">
                    {obj.kind === 'clear-frost'
                      ? 'کاشی گل یخی'
                      : obj.kind === 'clear-locks'
                        ? 'گره روبان'
                        : obj.pieceType
                          ? PIECE_META[obj.pieceType].shortLabel
                          : 'هدف'}
                  </div>
                  <div className="text-sm font-bold tabular-nums flex items-center gap-1">
                    {obj.done ? (
                      <span className="text-[#15806B] inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        تکمیل
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

          <div className="pr-3 border-r border-[#F2DCE4] text-center shrink-0 min-w-[64px]">
            <div className="text-[11px] font-bold text-[#6C3B53]">حرکت</div>
            <div
              className={`text-2xl font-display font-bold tabular-nums leading-none mt-0.5 ${
                movesLeft <= 5 ? 'text-[#C81E5A] scale-105' : 'text-[#351427]'
              }`}
            >
              {toFaDigits(movesLeft)}
            </div>
          </div>
        </div>
      </header>

      {/* Main 2.5D Match-3 Salon Tray */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
        {activeBooster && (
          <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-[#351427] text-white text-xs font-bold flex items-center gap-2.5 shadow-md">
            <span>
              {activeBooster === 'precision-file'
                ? 'روی هر خانه بزنید تا سوهان بخورد و پاک شود'
                : 'روی هر مهره آزاد بزنید تا به قلم‌موی لیزری UV تبدیل شود'}
            </span>
            <button
              type="button"
              onClick={() => setActiveBooster(null)}
              className="underline text-amber-300"
            >
              انصراف
            </button>
          </div>
        )}

        {shuffleNotice && (
          <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-[#FFFDFB] border border-[#E4BCCB] text-xs font-bold text-[#9A2353] shadow-sm">
            حرکتی نماند · در حال چیدن دوباره سینی سالن...
          </div>
        )}

        <div
          className={`relative w-full max-w-[468px] aspect-square rounded-[28px] tray-25d border-[3px] p-2.5 sm:p-3.5 ${trayBorderClass} ${
            trayBump ? 'animate-tray-bump' : ''
          }`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="grid w-full h-full gap-1.5 sm:gap-2 relative"
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
                const isButterflyTarget = butterflyTargetKeys.has(key);
                const isHint =
                  hintPair?.some((h) => h.row === r && h.col === c) ?? false;

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
                    className={`relative rounded-xl sm:rounded-2xl flex items-center justify-center p-1 sm:p-1.5 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#E23B78] touch-none ${
                      cell.frostLevel === 2
                        ? 'cell-25d-frost-2 border border-[#D4558E]'
                        : cell.frostLevel === 1
                          ? 'cell-25d-frost-1 border border-[#E589B3]'
                          : 'cell-25d border border-[#F2DAE4]'
                    } ${
                      isSelected
                        ? 'ring-3 ring-[#E23B78] scale-108 z-10 brightness-105'
                        : 'hover:brightness-[1.02]'
                    } ${isHint ? 'animate-hint ring-3 ring-[#EAB331] z-10' : ''} ${
                      isButterflyTarget ? 'ring-3 ring-amber-400 scale-105' : ''
                    }`}
                  >
                    {cell.frostLevel > 0 && (
                      <span
                        className="pointer-events-none absolute top-0.5 left-1 text-[10px] font-bold text-[#8E1C4B] leading-none z-10"
                        aria-hidden="true"
                      >
                        {cell.frostLevel === 2 ? '۲✿' : '✿'}
                      </span>
                    )}

                    {cell.piece && (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          isClearing
                            ? 'animate-tile-clear'
                            : cell.piece.isNew
                              ? 'animate-petal-pop'
                              : ''
                        }`}
                      >
                        <NailPieceGraphic
                          type={cell.piece.type}
                          special={cell.piece.special}
                        />
                      </div>
                    )}

                    {/* Satin Ribbon Cage Overlay (Locked Obstacle) */}
                    {cell.locked && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-[#D63B72] bg-[#FFE4EF]/25 flex items-center justify-center z-20"
                        aria-hidden="true"
                      >
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#E23B78]/75" />
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 bg-[#E23B78]/75" />
                        <span className="relative z-10 w-5 h-5 rounded-full bg-amber-300 border border-[#B45309] text-[10px] flex items-center justify-center shadow">
                          🎀
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Sparkle Particle Bursts */}
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
                  className="absolute w-2.5 h-2.5 rounded-full animate-sparkle"
                  style={
                    {
                      backgroundColor: i % 2 === 0 ? sp.color : '#FDE047',
                      '--tx': vec.tx,
                      '--ty': vec.ty,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ))}

          {/* UV Horizontal Beam Flash */}
          {beamRows.map((rowIdx) => (
            <div
              key={`beam-h-${rowIdx}`}
              className="pointer-events-none absolute left-2 right-2 h-7 rounded-full bg-gradient-to-r from-rose-300/20 via-amber-200/95 to-rose-300/20 shadow-[0_0_16px_rgba(251,191,36,0.8)] animate-beam-h"
              style={{
                top: `calc(${((rowIdx + 0.5) / level.rows) * 100}% - 14px)`,
              }}
            />
          ))}

          {/* UV Vertical Beam Flash */}
          {beamCols.map((colIdx) => (
            <div
              key={`beam-v-${colIdx}`}
              className="pointer-events-none absolute top-2 bottom-2 w-7 rounded-full bg-gradient-to-b from-rose-300/20 via-amber-200/95 to-rose-300/20 shadow-[0_0_16px_rgba(251,191,36,0.8)] animate-beam-v"
              style={{
                right: `calc(${((colIdx + 0.5) / level.cols) * 100}% - 14px)`,
              }}
            />
          ))}

          {/* Crystal Bomb Burst Flash */}
          {bombCenters.map((center, idx) => (
            <div
              key={`bomb-${idx}-${center.row}-${center.col}`}
              className="pointer-events-none absolute w-32 h-32 rounded-full bg-amber-300/45 border-2 border-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.75)] animate-tile-clear"
              style={{
                top: `calc(${((center.row + 0.5) / level.rows) * 100}% - 64px)`,
                right: `calc(${((center.col + 0.5) / level.cols) * 100}% - 64px)`,
              }}
            />
          ))}

          {/* Combo Praise Banner */}
          {comboPraise && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex justify-center">
              <div className="px-6 py-2 rounded-2xl btn-3d-gold text-[#351427] font-display text-2xl sm:text-3xl font-bold shadow-xl animate-combo-banner border-2 border-white">
                {comboPraise}
              </div>
            </div>
          )}

          {/* Floating Score Callouts */}
          {callouts.map((c) => (
            <div
              key={c.id}
              className="pointer-events-none absolute z-20 px-2.5 py-0.5 rounded-lg bg-[#351427]/90 text-amber-200 text-xs font-bold tabular-nums shadow animate-float-score"
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

      {/* Bottom 2.5D Salon Boosters Tray */}
      <footer className="w-full max-w-[540px] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setActiveBooster((b) =>
              b === 'precision-file' ? null : boosters['precision-file'] > 0 ? 'precision-file' : null
            )
          }
          disabled={isBusy || boosters['precision-file'] <= 0}
          className={`flex-1 min-h-[50px] px-2.5 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-45 ${
            activeBooster === 'precision-file'
              ? 'btn-3d-rose border-[#991345] text-white'
              : 'btn-3d-pearl border-[#EBCAD6] text-[#351427]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-[#D63B72]" />
          <span className="truncate">سوهان</span>
          <span className="tabular-nums opacity-80">({toFaDigits(boosters['precision-file'])})</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveBooster((b) =>
              b === 'uv-brush' ? null : boosters['uv-brush'] > 0 ? 'uv-brush' : null
            )
          }
          disabled={isBusy || boosters['uv-brush'] <= 0}
          className={`flex-1 min-h-[50px] px-2.5 py-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-45 ${
            activeBooster === 'uv-brush'
              ? 'bg-[#7C4DFF] border-[#5B21B6] text-white'
              : 'btn-3d-pearl border-[#EBCAD6] text-[#351427]'
          }`}
        >
          <Wand2 className="w-4 h-4 shrink-0 text-[#7C4DFF]" />
          <span className="truncate">قلم‌موی UV</span>
          <span className="tabular-nums opacity-80">({toFaDigits(boosters['uv-brush'])})</span>
        </button>

        <button
          type="button"
          onClick={handleShuffleBooster}
          disabled={isBusy || boosters['salon-shuffle'] <= 0}
          className="flex-1 min-h-[50px] px-2.5 py-2 rounded-2xl btn-3d-pearl border border-[#EBCAD6] text-[#351427] text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-45"
        >
          <Shuffle className="w-4 h-4 shrink-0 text-[#199473]" />
          <span className="truncate">گردباد</span>
          <span className="tabular-nums opacity-80">({toFaDigits(boosters['salon-shuffle'])})</span>
        </button>

        <button
          type="button"
          onClick={handleHintClick}
          disabled={isBusy}
          className="min-h-[50px] px-3.5 py-2 rounded-2xl btn-3d-pearl border border-[#EBCAD6] text-[#351427] text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
        >
          <Lightbulb className="w-4 h-4 text-[#D49E2A]" />
          <span className="hidden sm:inline">راهنما</span>
        </button>
      </footer>

      {/* Pause Modal */}
      {modalState === 'PAUSED' && (
        <div
          className="fixed inset-0 z-50 bg-[#230E18]/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="توقف بازی"
        >
          <div className="w-full max-w-sm rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#351427]">
              استراحت سالن
            </h2>
            <p className="mt-1 text-sm text-[#6C3B53]">
              مرحله {toFaDigits(level.id)} · {level.title}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => setModalState('NONE')}
                className="w-full min-h-[48px] rounded-2xl btn-3d-rose text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current rotate-180" />
                <span>ادامه بازی</span>
              </button>
              <button
                type="button"
                onClick={resetLevelState}
                className="w-full min-h-[48px] rounded-2xl btn-3d-pearl border border-[#E4BCCB] text-[#351427] font-bold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>شروع مجدد مرحله</span>
              </button>
              <button
                type="button"
                onClick={onExitToMap}
                className="w-full min-h-[48px] rounded-2xl btn-3d-pearl border border-[#EBCAD6] text-[#5E354A] font-bold text-sm flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت به نقشه سالن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {modalState === 'VICTORY' && victoryDrop && (
        <div
          className="fixed inset-0 z-50 bg-[#230E18]/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="مرحله با موفقیت انجام شد"
        >
          <div className="w-full max-w-md rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-10 h-10 drop-shadow-sm ${
                    s <= victoryDrop.stars
                      ? 'fill-[#F5B922] text-[#B45309]'
                      : 'text-[#E6D4DB]'
                  }`}
                />
              ))}
            </div>

            <h2 className="font-display text-3xl font-bold text-[#351427]">
              {isBattleMode ? 'چالش نبرد تکمیل شد!' : 'مانیکور درخشان شد!'}
            </h2>
            <p className="mt-1.5 text-sm text-[#6C3B53] tabular-nums">
              امتیاز نهایی: {formatFaNumber(score)} · پاداش: {formatFaNumber(victoryDrop.coinsEarned)} سکه
            </p>

            {victoryDrop.cardReward && (
              <div className="mt-5 rounded-2xl bg-[#FDF1F5] border border-[#EBCAD6] p-4 text-right">
                <div className="flex items-center justify-between text-xs font-bold text-[#9A2353] mb-2">
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
                    <p className="font-display font-bold text-base text-[#351427] truncate">
                      {victoryDrop.cardReward.card.title}
                    </p>
                    <p className="mt-1 text-xs text-[#5E354A] line-clamp-2">
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
                  className="flex-1 min-h-[48px] px-5 rounded-2xl btn-3d-rose text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current rotate-180" />
                  <span>مرحله بعدی</span>
                </button>
              )}
              <button
                type="button"
                onClick={resetLevelState}
                className="flex-1 min-h-[48px] px-4 rounded-2xl btn-3d-pearl border border-[#E4BCCB] text-[#351427] font-bold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تکرار</span>
              </button>
              <button
                type="button"
                onClick={onExitToMap}
                className="flex-1 min-h-[48px] px-4 rounded-2xl btn-3d-pearl border border-[#EBCAD6] text-[#5E354A] font-bold text-sm flex items-center justify-center gap-2"
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
          className="fixed inset-0 z-50 bg-[#230E18]/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="پایان حرکت‌ها"
        >
          <div className="w-full max-w-sm rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-[#351427]">
              حرکت‌ها تمام شد
            </h2>
            <p className="mt-1 text-sm text-[#6C3B53]">
              فقط کمی تا تکمیل سفارش سالن مانده! می‌توانید ۵ حرکت اضافه بگیرید یا از اول شروع کنید.
            </p>

            <div className="mt-4 space-y-1.5 text-right rounded-2xl bg-[#FDF1F5] p-3.5 text-xs border border-[#F0D4DE]">
              {objectiveProgress.map((obj) => (
                <div key={obj.id} className="flex items-center justify-between font-bold">
                  <span>{obj.label}</span>
                  <span className="tabular-nums">
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
                className="w-full min-h-[48px] rounded-2xl btn-3d-rose disabled:opacity-45 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span>+۵ حرکت اضافه با ۶۰ سکه</span>
              </button>
              <button
                type="button"
                onClick={resetLevelState}
                className="w-full min-h-[48px] rounded-2xl btn-3d-pearl border border-[#E4BCCB] text-[#351427] font-bold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تلاش دوباره</span>
              </button>
              <button
                type="button"
                onClick={onExitToMap}
                className="w-full min-h-[48px] rounded-2xl btn-3d-pearl border border-[#EBCAD6] text-[#5E354A] font-bold text-sm"
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
