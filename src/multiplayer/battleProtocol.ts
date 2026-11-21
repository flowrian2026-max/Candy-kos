import { PIECE_META } from '../data/salonData';
import { createSeededRng, hashSeedString } from '../engine/match3';
import { LevelConfig, PieceType } from '../types/game';

/**
 * قرارداد ماژولار رقابت دو نفره آنلاین (نبرد ناخن)
 * -------------------------------------------------
 * طراحی‌شده برای اتصال مستقیم به WebSocket یا سرور همگام‌سازی بدون نیاز به بازنویسی موتور پازل.
 */

export type BattleRoomStatus =
  | 'WAITING_FOR_OPPONENT'
  | 'COUNTDOWN'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface BattleRoomConfig {
  roomId: string;
  seedString: string;
  createdAtIso: string;
  moveLimit: number;
  timeLimitSeconds: number;
  hostPlayerId: string;
  invitePath: string;
}

export interface BattlePlayerSnapshot {
  playerId: string;
  displayName: string;
  score: number;
  movesUsed: number;
  movesRemaining: number;
  objectivesCompleted: number;
  objectivesTotal: number;
  finished: boolean;
  finishedAtMs?: number;
}

export interface BattleMoveRecord {
  moveIndex: number;
  from: { row: number; col: number };
  to: { row: number; col: number };
  clientTimestampMs: number;
  resultingScore: number;
}

export interface BattleRoomState {
  config: BattleRoomConfig;
  status: BattleRoomStatus;
  players: Record<string, BattlePlayerSnapshot>;
  winnerPlayerId: string | null;
}

export interface BattleValidationResult {
  valid: boolean;
  verifiedScore: number;
  verifiedObjectivesCompleted: number;
  reason?: string;
}

export type BattleSyncEvent =
  | { type: 'ROOM_UPDATED'; state: BattleRoomState }
  | { type: 'PLAYER_PROGRESS'; snapshot: BattlePlayerSnapshot }
  | { type: 'MATCH_COMPLETED'; winnerPlayerId: string | null; state: BattleRoomState };

export interface BattleTransportAdapter {
  createRoom(hostPlayerId: string, hostName: string): Promise<BattleRoomConfig>;
  joinRoom(roomId: string, playerId: string, displayName: string): Promise<BattleRoomState>;
  submitMove(roomId: string, playerId: string, move: BattleMoveRecord): Promise<void>;
  subscribe(roomId: string, onEvent: (event: BattleSyncEvent) => void): () => void;
}

export function buildBattleInviteLink(roomId: string): string {
  if (typeof window === 'undefined') {
    return `?battleRoom=${encodeURIComponent(roomId)}`;
  }
  const url = new URL(window.location.href);
  url.searchParams.set('battleRoom', roomId);
  return url.toString();
}

export function generateBattleSeedCode(): string {
  const prefixes = ['ROSE', 'PEARL', 'SHIRAZ', 'LOTUS', 'GOLD'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

export function buildBattleLevelConfig(seedString: string): LevelConfig {
  const numericSeed = hashSeedString(seedString);
  const rng = createSeededRng(numericSeed);
  const pool: PieceType[] = [
    'rose-polish',
    'lavender-gem',
    'pearl-blossom',
    'mint-card',
    'amber-serum',
    'berry-bow',
  ];

  const primaryIdx = Math.floor(rng() * pool.length);
  const secondaryIdx = (primaryIdx + 2) % pool.length;
  const primaryPiece = pool[primaryIdx];
  const secondaryPiece = pool[secondaryIdx];

  const frostPattern: Array<[number, number, 1 | 2]> = [];
  for (let i = 0; i < 8; i += 1) {
    const r = 1 + Math.floor(rng() * 5);
    const c = 1 + Math.floor(rng() * 5);
    if (!frostPattern.some(([fr, fc]) => fr === r && fc === c)) {
      frostPattern.push([r, c, 1]);
    }
  }

  return {
    id: 900,
    areaId: 'champagne-atelier',
    title: `نبرد ناخن · ${seedString}`,
    subtitle: 'چالش رقابتی با چیدمان یکسان',
    rows: 7,
    cols: 7,
    moves: 20,
    piecePool: pool,
    objectives: [
      {
        id: 'battle-obj-1',
        kind: 'collect-piece',
        pieceType: primaryPiece,
        target: 18,
        label: `جمع‌آوری ۱۸ ${PIECE_META[primaryPiece].shortLabel}`,
      },
      {
        id: 'battle-obj-2',
        kind: 'collect-piece',
        pieceType: secondaryPiece,
        target: 18,
        label: `جمع‌آوری ۱۸ ${PIECE_META[secondaryPiece].shortLabel}`,
      },
    ],
    initialFrostPattern: frostPattern,
    starThresholds: [1800, 3200, 4800],
    coinReward: 100,
    seed: numericSeed,
  };
}
