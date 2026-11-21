export type PieceType =
  | 'rose-polish'
  | 'lavender-gem'
  | 'pearl-blossom'
  | 'mint-card'
  | 'amber-serum'
  | 'berry-bow';

export type SpecialType =
  | 'none'
  | 'line-h'
  | 'line-v'
  | 'bomb'
  | 'prism'
  | 'butterfly';

export type BoosterType = 'precision-file' | 'uv-brush' | 'salon-shuffle';

export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface TilePiece {
  id: string;
  type: PieceType;
  special: SpecialType;
  isNew?: boolean;
}

export interface BoardCell {
  row: number;
  col: number;
  piece: TilePiece | null;
  frostLevel: 0 | 1 | 2;
  locked: boolean;
  blocked: boolean;
}

export type ObjectiveKind = 'collect-piece' | 'clear-frost' | 'clear-locks';

export interface LevelObjective {
  id: string;
  kind: ObjectiveKind;
  pieceType?: PieceType;
  target: number;
  label: string;
}

export interface LevelConfig {
  id: number;
  areaId: string;
  title: string;
  subtitle: string;
  rows: number;
  cols: number;
  moves: number;
  piecePool: PieceType[];
  objectives: LevelObjective[];
  starThresholds: [number, number, number];
  coinReward: number;
  initialFrostPattern?: Array<[number, number, 1 | 2]>;
  blockedPattern?: Array<[number, number]>;
  lockedPattern?: Array<[number, number]>;
  seed?: number;
}

export interface SalonArea {
  id: string;
  name: string;
  subtitle: string;
  accentColor: string;
  requiredStars: number;
  description: string;
}

export interface CollectibleCard {
  id: string;
  title: string;
  persianTitle?: string;
  rarity: CardRarity;
  palette: [string, string, string];
  description: string;
  unlockHint: string;
  imageUrl?: string;
  motif:
    | 'winter-bow'
    | 'mysterious-blossom'
    | 'midnight-cat'
    | 'rose-pearl'
    | 'shiraz-tile'
    | 'lavender-silk'
    | 'gold-lotus'
    | 'petal-crown';
}

export interface SalonUpgrade {
  id: string;
  name: string;
  category: 'Equipment' | 'Polish Shade' | 'Decor';
  cost: number;
  requiredLevel: number;
  description: string;
  bonusLabel: string;
  swatchColor: string;
}

export interface PlayerProgress {
  highestUnlockedLevel: number;
  levelStars: Record<number, number>;
  levelHighScores: Record<number, number>;
  coins: number;
  unlockedCardIds: string[];
  cardDuplicates: Record<string, number>;
  unlockedUpgradeIds: string[];
  equippedPolishId: string;
  boosters: Record<BoosterType, number>;
  soundMuted: boolean;
  winStreak: number;
  lastWheelSpinDay: string | null;
  battleBestScore: number;
  battleBestSeed: string | null;
}

export type AppScreen = 'TITLE' | 'HUB' | 'PLAYING';
export type HubTab = 'JOURNEY' | 'CARDS' | 'STUDIO' | 'BATTLE';
export type PlayModalState = 'NONE' | 'PAUSED' | 'VICTORY' | 'OUT_OF_MOVES';
