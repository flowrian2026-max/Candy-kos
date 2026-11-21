import { BoardCell, PieceType, SpecialType, TilePiece } from '../types/game';

let pieceSeq = 1;
export function nextPieceId(): string {
  pieceSeq += 1;
  return `p-${pieceSeq}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeedString(seedStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function cloneBoard(board: BoardCell[][]): BoardCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      piece: cell.piece ? { ...cell.piece } : null,
    }))
  );
}

function randomFromPool(pool: PieceType[], rng: () => number): PieceType {
  const idx = Math.floor(rng() * pool.length);
  return pool[Math.min(idx, pool.length - 1)];
}

export function createBoard(
  rows: number,
  cols: number,
  pool: PieceType[],
  frostPattern: Array<[number, number, 1 | 2]> = [],
  rng: () => number = Math.random,
  blockedPattern: Array<[number, number]> = [],
  lockedPattern: Array<[number, number]> = []
): BoardCell[][] {
  const frostMap = new Map<string, 1 | 2>();
  for (const [r, c, level] of frostPattern) {
    frostMap.set(`${r},${c}`, level);
  }
  const blockedSet = new Set(blockedPattern.map(([r, c]) => `${r},${c}`));
  const lockedSet = new Set(lockedPattern.map(([r, c]) => `${r},${c}`));

  const board: BoardCell[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const rowArr: BoardCell[] = [];
    for (let c = 0; c < cols; c += 1) {
      const key = `${r},${c}`;
      const blocked = blockedSet.has(key);
      if (blocked) {
        rowArr.push({
          row: r,
          col: c,
          frostLevel: 0,
          locked: false,
          blocked: true,
          piece: null,
        });
        continue;
      }

      let chosen = randomFromPool(pool, rng);
      let guard = 0;
      while (guard < 28) {
        const leftMatch =
          c >= 2 &&
          rowArr[c - 1].piece?.type === chosen &&
          rowArr[c - 2].piece?.type === chosen;
        const upMatch =
          r >= 2 &&
          board[r - 1][c].piece?.type === chosen &&
          board[r - 2][c].piece?.type === chosen;
        const squareMatch =
          r >= 1 &&
          c >= 1 &&
          rowArr[c - 1].piece?.type === chosen &&
          board[r - 1][c].piece?.type === chosen &&
          board[r - 1][c - 1].piece?.type === chosen;
        if (!leftMatch && !upMatch && !squareMatch) break;
        chosen = randomFromPool(pool, rng);
        guard += 1;
      }

      rowArr.push({
        row: r,
        col: c,
        frostLevel: frostMap.get(key) ?? 0,
        locked: lockedSet.has(key),
        blocked: false,
        piece: {
          id: nextPieceId(),
          type: chosen,
          special: 'none',
        },
      });
    }
    board.push(rowArr);
  }

  if (!findValidMove(board)) {
    return shuffleBoard(board, rng);
  }
  return board;
}

export function areAdjacent(
  a: { row: number; col: number },
  b: { row: number; col: number }
): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

interface RunSegment {
  cells: Array<{ row: number; col: number }>;
  kind: 'h' | 'v' | 'square';
  type: PieceType;
}

export interface MatchCluster {
  cells: Array<{ row: number; col: number }>;
  type: PieceType;
  spawnSpecial: SpecialType;
}

export function findMatchClusters(board: BoardCell[][]): MatchCluster[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const runs: RunSegment[] = [];

  // Horizontal runs >= 3
  for (let r = 0; r < rows; r += 1) {
    let c = 0;
    while (c < cols) {
      const cell = board[r][c];
      const piece = cell.piece;
      if (cell.blocked || !piece || piece.special === 'prism') {
        c += 1;
        continue;
      }
      let end = c + 1;
      while (
        end < cols &&
        !board[r][end].blocked &&
        board[r][end].piece &&
        board[r][end].piece!.special !== 'prism' &&
        board[r][end].piece!.type === piece.type
      ) {
        end += 1;
      }
      if (end - c >= 3) {
        const cells = [];
        for (let k = c; k < end; k += 1) {
          cells.push({ row: r, col: k });
        }
        runs.push({ cells, kind: 'h', type: piece.type });
      }
      c = end;
    }
  }

  // Vertical runs >= 3
  for (let c = 0; c < cols; c += 1) {
    let r = 0;
    while (r < rows) {
      const cell = board[r][c];
      const piece = cell.piece;
      if (cell.blocked || !piece || piece.special === 'prism') {
        r += 1;
        continue;
      }
      let end = r + 1;
      while (
        end < rows &&
        !board[end][c].blocked &&
        board[end][c].piece &&
        board[end][c].piece!.special !== 'prism' &&
        board[end][c].piece!.type === piece.type
      ) {
        end += 1;
      }
      if (end - r >= 3) {
        const cells = [];
        for (let k = r; k < end; k += 1) {
          cells.push({ row: k, col: c });
        }
        runs.push({ cells, kind: 'v', type: piece.type });
      }
      r = end;
    }
  }

  // 2x2 Square matches (Butterfly / Swedish Fish style!)
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const c00 = board[r][c];
      const c01 = board[r][c + 1];
      const c10 = board[r + 1][c];
      const c11 = board[r + 1][c + 1];
      if (c00.blocked || c01.blocked || c10.blocked || c11.blocked) continue;
      const p00 = c00.piece;
      const p01 = c01.piece;
      const p10 = c10.piece;
      const p11 = c11.piece;
      if (!p00 || !p01 || !p10 || !p11) continue;
      if (
        p00.special === 'prism' ||
        p01.special === 'prism' ||
        p10.special === 'prism' ||
        p11.special === 'prism'
      ) {
        continue;
      }
      if (
        p00.type === p01.type &&
        p00.type === p10.type &&
        p00.type === p11.type
      ) {
        runs.push({
          cells: [
            { row: r, col: c },
            { row: r, col: c + 1 },
            { row: r + 1, col: c },
            { row: r + 1, col: c + 1 },
          ],
          kind: 'square',
          type: p00.type,
        });
      }
    }
  }

  if (runs.length === 0) return [];

  // Merge overlapping runs of the same type
  const used = new Array(runs.length).fill(false);
  const clusters: MatchCluster[] = [];

  for (let i = 0; i < runs.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    const groupRuns: RunSegment[] = [runs[i]];
    const cellSet = new Set(runs[i].cells.map((p) => `${p.row},${p.col}`));

    let added = true;
    while (added) {
      added = false;
      for (let j = 0; j < runs.length; j += 1) {
        if (used[j] || runs[j].type !== runs[i].type) continue;
        const overlaps = runs[j].cells.some((p) => cellSet.has(`${p.row},${p.col}`));
        if (overlaps) {
          used[j] = true;
          groupRuns.push(runs[j]);
          runs[j].cells.forEach((p) => cellSet.add(`${p.row},${p.col}`));
          added = true;
        }
      }
    }

    let maxH = 0;
    let maxV = 0;
    let hasSquare = false;
    for (const seg of groupRuns) {
      if (seg.kind === 'h') maxH = Math.max(maxH, seg.cells.length);
      if (seg.kind === 'v') maxV = Math.max(maxV, seg.cells.length);
      if (seg.kind === 'square') hasSquare = true;
    }

    let spawnSpecial: SpecialType = 'none';
    if (maxH >= 5 || maxV >= 5) {
      spawnSpecial = 'prism';
    } else if (maxH >= 3 && maxV >= 3) {
      spawnSpecial = 'bomb';
    } else if (maxH === 4) {
      spawnSpecial = 'line-v';
    } else if (maxV === 4) {
      spawnSpecial = 'line-h';
    } else if (hasSquare) {
      spawnSpecial = 'butterfly';
    }

    const cells = Array.from(cellSet).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    });

    clusters.push({
      cells,
      type: runs[i].type,
      spawnSpecial,
    });
  }

  return clusters;
}

export interface ClearStepResult {
  board: BoardCell[][];
  clearedPieces: Record<PieceType, number>;
  clearedFrost: number;
  clearedLocks: number;
  pointsEarned: number;
  clearedCoords: Array<{ row: number; col: number }>;
  beamRows: number[];
  beamCols: number[];
  bombCenters: Array<{ row: number; col: number }>;
  butterflyFlights: Array<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  }>;
  hadMatch: boolean;
}

function emptyPieceCounts(): Record<PieceType, number> {
  return {
    'rose-polish': 0,
    'lavender-gem': 0,
    'pearl-blossom': 0,
    'mint-card': 0,
    'amber-serum': 0,
    'berry-bow': 0,
  };
}

export function isSwapValid(
  board: BoardCell[][],
  a: { row: number; col: number },
  b: { row: number; col: number }
): boolean {
  if (!areAdjacent(a, b)) return false;
  const cellA = board[a.row]?.[a.col];
  const cellB = board[b.row]?.[b.col];
  if (!cellA || !cellB || cellA.blocked || cellB.blocked) return false;
  if (cellA.locked || cellB.locked) return false;
  const pA = cellA.piece;
  const pB = cellB.piece;
  if (!pA || !pB) return false;

  if (pA.special === 'prism' || pB.special === 'prism') return true;
  if (pA.special !== 'none' && pB.special !== 'none') return true;

  const test = cloneBoard(board);
  test[a.row][a.col].piece = pB;
  test[b.row][b.col].piece = pA;
  return findMatchClusters(test).length > 0;
}

export function executeSwapAndCheckSpecial(
  board: BoardCell[][],
  a: { row: number; col: number },
  b: { row: number; col: number },
  priorityTypes: PieceType[] = []
): {
  nextBoard: BoardCell[][];
  specialComboResult: ClearStepResult | null;
} {
  const nextBoard = cloneBoard(board);
  const pA = nextBoard[a.row][a.col].piece;
  const pB = nextBoard[b.row][b.col].piece;
  if (!pA || !pB) {
    return { nextBoard, specialComboResult: null };
  }

  nextBoard[a.row][a.col].piece = pB;
  nextBoard[b.row][b.col].piece = pA;

  const isPrismCombo = pA.special === 'prism' || pB.special === 'prism';
  const isDualSpecial = pA.special !== 'none' && pB.special !== 'none';

  if (isPrismCombo || isDualSpecial) {
    const res = resolveSpecialSwapCombo(nextBoard, a, b, priorityTypes);
    return { nextBoard: res.board, specialComboResult: res };
  }

  return { nextBoard, specialComboResult: null };
}

function pickButterflyTarget(
  board: BoardCell[][],
  excludeKeys: Set<string>,
  priorityTypes: PieceType[]
): { row: number; col: number } | null {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  // Priority 1: Locked cages
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = board[r][c];
      if (!cell.blocked && cell.locked && !excludeKeys.has(`${r},${c}`)) {
        return { row: r, col: c };
      }
    }
  }
  // Priority 2: Frosted flower tiles
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = board[r][c];
      if (!cell.blocked && cell.frostLevel > 0 && !excludeKeys.has(`${r},${c}`)) {
        return { row: r, col: c };
      }
    }
  }
  // Priority 3: Needed objective piece type
  if (priorityTypes.length > 0) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cell = board[r][c];
        if (
          !cell.blocked &&
          cell.piece &&
          priorityTypes.includes(cell.piece.type) &&
          !excludeKeys.has(`${r},${c}`)
        ) {
          return { row: r, col: c };
        }
      }
    }
  }
  // Fallback: Any playable cell
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = board[r][c];
      if (!cell.blocked && cell.piece && !excludeKeys.has(`${r},${c}`)) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function detonateQueue(
  board: BoardCell[][],
  initialTargets: Array<{ row: number; col: number }>,
  exemptCoords: Set<string> = new Set(),
  cascadeDepth = 1,
  priorityTypes: PieceType[] = [],
  butterflyPayloadSpecial: SpecialType = 'none'
): ClearStepResult {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const clearedSet = new Set<string>();
  const queue: Array<{ row: number; col: number }> = [];
  const activatedSpecials = new Set<string>();
  const beamRows = new Set<number>();
  const beamCols = new Set<number>();
  const bombCenters: Array<{ row: number; col: number }> = [];
  const butterflyFlights: Array<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  }> = [];

  const enqueue = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (board[r][c].blocked) return;
    const key = `${r},${c}`;
    if (exemptCoords.has(key)) return;
    if (!clearedSet.has(key)) {
      clearedSet.add(key);
      queue.push({ row: r, col: c });
    }
  };

  for (const t of initialTargets) {
    enqueue(t.row, t.col);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const key = `${curr.row},${curr.col}`;
    const cell = board[curr.row][curr.col];
    const piece = cell.piece;
    if (!piece || piece.special === 'none' || activatedSpecials.has(key)) continue;

    activatedSpecials.add(key);
    if (piece.special === 'line-h') {
      beamRows.add(curr.row);
      for (let c = 0; c < cols; c += 1) enqueue(curr.row, c);
    } else if (piece.special === 'line-v') {
      beamCols.add(curr.col);
      for (let r = 0; r < rows; r += 1) enqueue(r, curr.col);
    } else if (piece.special === 'bomb') {
      bombCenters.push({ row: curr.row, col: curr.col });
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          enqueue(curr.row + dr, curr.col + dc);
        }
      }
    } else if (piece.special === 'butterfly') {
      const target = pickButterflyTarget(board, clearedSet, priorityTypes);
      if (target) {
        butterflyFlights.push({ from: curr, to: target });
        if (
          butterflyPayloadSpecial !== 'none' &&
          butterflyPayloadSpecial !== 'prism' &&
          board[target.row][target.col].piece
        ) {
          board[target.row][target.col].piece!.special = butterflyPayloadSpecial;
        }
        enqueue(target.row, target.col);
      }
    } else if (piece.special === 'prism') {
      const counts: Partial<Record<PieceType, number>> = {};
      let bestType: PieceType = 'rose-polish';
      let bestCount = -1;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const tp = board[r][c].piece;
          if (!board[r][c].blocked && tp && tp.special !== 'prism') {
            counts[tp.type] = (counts[tp.type] ?? 0) + 1;
            if ((counts[tp.type] ?? 0) > bestCount) {
              bestCount = counts[tp.type] ?? 0;
              bestType = tp.type;
            }
          }
        }
      }
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (!board[r][c].blocked && board[r][c].piece?.type === bestType) {
            enqueue(r, c);
          }
        }
      }
    }
  }

  const clearedPieces = emptyPieceCounts();
  let clearedFrost = 0;
  let clearedLocks = 0;
  const clearedCoords: Array<{ row: number; col: number }> = [];

  for (const key of clearedSet) {
    const [r, c] = key.split(',').map(Number);
    const cell = board[r][c];
    if (cell.blocked) continue;

    // If ribbon-locked, breaking the lock frees the piece instead of deleting it!
    if (cell.locked) {
      cell.locked = false;
      clearedLocks += 1;
      clearedCoords.push({ row: r, col: c });
      continue;
    }

    if (cell.piece) {
      clearedPieces[cell.piece.type] += 1;
      cell.piece = null;
      clearedCoords.push({ row: r, col: c });
    }
    if (cell.frostLevel > 0) {
      cell.frostLevel = (cell.frostLevel - 1) as 0 | 1 | 2;
      clearedFrost += 1;
    }
  }

  const totalCleared = clearedCoords.length;
  const specialBonus = activatedSpecials.size * 95;
  const obstacleBonus = (clearedFrost + clearedLocks) * 50;
  const pointsEarned = (totalCleared * 35 + specialBonus + obstacleBonus) * cascadeDepth;

  return {
    board,
    clearedPieces,
    clearedFrost,
    clearedLocks,
    pointsEarned,
    clearedCoords,
    beamRows: Array.from(beamRows),
    beamCols: Array.from(beamCols),
    bombCenters,
    butterflyFlights,
    hadMatch: totalCleared > 0,
  };
}

function resolveSpecialSwapCombo(
  board: BoardCell[][],
  a: { row: number; col: number },
  b: { row: number; col: number },
  priorityTypes: PieceType[]
): ClearStepResult {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const pA = board[a.row][a.col].piece!;
  const pB = board[b.row][b.col].piece!;
  const targets: Array<{ row: number; col: number }> = [];

  // Prism + Prism -> Clear entire board!
  if (pA.special === 'prism' && pB.special === 'prism') {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (!board[r][c].blocked) targets.push({ row: r, col: c });
      }
    }
    return detonateQueue(board, targets, new Set(), 1, priorityTypes);
  }

  // Prism + Any piece
  if (pA.special === 'prism' || pB.special === 'prism') {
    const prismCoord = pA.special === 'prism' ? a : b;
    const otherPiece = pA.special === 'prism' ? pB : pA;
    targets.push(prismCoord);

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (board[r][c].blocked) continue;
        const cellPiece = board[r][c].piece;
        if (cellPiece && cellPiece.type === otherPiece.type) {
          if (otherPiece.special !== 'none' && otherPiece.special !== 'prism') {
            cellPiece.special =
              otherPiece.special === 'bomb'
                ? 'bomb'
                : otherPiece.special === 'butterfly'
                  ? 'butterfly'
                  : (r + c) % 2 === 0
                    ? 'line-h'
                    : 'line-v';
          }
          targets.push({ row: r, col: c });
        }
      }
    }
    return detonateQueue(board, targets, new Set(), 1, priorityTypes);
  }

  // Butterfly + Butterfly -> spawns 3 targeted hits
  if (pA.special === 'butterfly' && pB.special === 'butterfly') {
    targets.push(a, b);
    return detonateQueue(board, targets, new Set(), 1, priorityTypes);
  }

  // Butterfly + Line or Bomb -> carries the special to a priority target!
  if (pA.special === 'butterfly' || pB.special === 'butterfly') {
    const butterflyCoord = pA.special === 'butterfly' ? a : b;
    const otherPiece = pA.special === 'butterfly' ? pB : pA;
    const otherCoord = pA.special === 'butterfly' ? b : a;
    const payload = otherPiece.special;
    otherPiece.special = 'none';
    targets.push(butterflyCoord, otherCoord);
    return detonateQueue(board, targets, new Set(), 1, priorityTypes, payload);
  }

  const aIsBomb = pA.special === 'bomb';
  const bIsBomb = pB.special === 'bomb';

  if (aIsBomb && bIsBomb) {
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        targets.push({ row: b.row + dr, col: b.col + dc });
      }
    }
    return detonateQueue(board, targets, new Set(), 1, priorityTypes);
  }

  if (aIsBomb || bIsBomb) {
    for (let d = -1; d <= 1; d += 1) {
      for (let c = 0; c < cols; c += 1) targets.push({ row: b.row + d, col: c });
      for (let r = 0; r < rows; r += 1) targets.push({ row: r, col: b.col + d });
    }
    return detonateQueue(board, targets, new Set(), 1, priorityTypes);
  }

  // Line + Line -> Full cross beam
  for (let c = 0; c < cols; c += 1) targets.push({ row: b.row, col: c });
  for (let r = 0; r < rows; r += 1) targets.push({ row: r, col: b.col });
  return detonateQueue(board, targets, new Set(), 1, priorityTypes);
}

export function resolveBoardMatches(
  board: BoardCell[][],
  preferredCoords: Array<{ row: number; col: number }> = [],
  cascadeDepth = 1,
  priorityTypes: PieceType[] = []
): ClearStepResult {
  const nextBoard = cloneBoard(board);
  const clusters = findMatchClusters(nextBoard);
  if (clusters.length === 0) {
    return {
      board: nextBoard,
      clearedPieces: emptyPieceCounts(),
      clearedFrost: 0,
      clearedLocks: 0,
      pointsEarned: 0,
      clearedCoords: [],
      beamRows: [],
      beamCols: [],
      bombCenters: [],
      butterflyFlights: [],
      hadMatch: false,
    };
  }

  const clearTargets: Array<{ row: number; col: number }> = [];
  const exemptCoords = new Set<string>();

  for (const cluster of clusters) {
    let spawnCoord: { row: number; col: number } | null = null;
    if (cluster.spawnSpecial !== 'none') {
      spawnCoord =
        cluster.cells.find(
          (cell) =>
            !nextBoard[cell.row][cell.col].locked &&
            preferredCoords.some((p) => p.row === cell.row && p.col === cell.col)
        ) ??
        cluster.cells.find((cell) => !nextBoard[cell.row][cell.col].locked) ??
        null;
    }

    for (const cell of cluster.cells) {
      if (
        spawnCoord &&
        cell.row === spawnCoord.row &&
        cell.col === spawnCoord.col
      ) {
        const targetCell = nextBoard[cell.row][cell.col];
        if (targetCell.piece) {
          targetCell.piece = {
            id: nextPieceId(),
            type: cluster.type,
            special: cluster.spawnSpecial,
            isNew: true,
          };
          exemptCoords.add(`${cell.row},${cell.col}`);
        }
      } else {
        clearTargets.push(cell);
      }
    }
  }

  return detonateQueue(nextBoard, clearTargets, exemptCoords, cascadeDepth, priorityTypes);
}

export function clearSingleCellWithBooster(
  board: BoardCell[][],
  coord: { row: number; col: number },
  priorityTypes: PieceType[] = []
): ClearStepResult {
  const nextBoard = cloneBoard(board);
  return detonateQueue(nextBoard, [coord], new Set(), 1, priorityTypes);
}

export function applyGravityAndRefill(
  board: BoardCell[][],
  pool: PieceType[],
  rng: () => number = Math.random
): BoardCell[][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const nextBoard = cloneBoard(board);

  // Mark surviving pieces as not-new first
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (nextBoard[r][c].piece) {
        nextBoard[r][c].piece!.isNew = false;
      }
    }
  }

  // Top-most open row per column acts as spawner
  const topOpenRowByCol: number[] = new Array(cols).fill(-1);
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      if (!nextBoard[r][c].blocked) {
        topOpenRowByCol[c] = r;
        break;
      }
    }
  }

  const maxPasses = rows * cols * 2;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;

    // 1. Vertical fall
    for (let r = rows - 2; r >= 0; r -= 1) {
      for (let c = 0; c < cols; c += 1) {
        const curr = nextBoard[r][c];
        const below = nextBoard[r + 1][c];
        if (
          !curr.blocked &&
          !curr.locked &&
          curr.piece &&
          !below.blocked &&
          !below.locked &&
          below.piece === null
        ) {
          below.piece = curr.piece;
          curr.piece = null;
          changed = true;
        }
      }
    }

    // 2. Refill top open cells
    for (let c = 0; c < cols; c += 1) {
      const topR = topOpenRowByCol[c];
      if (
        topR >= 0 &&
        !nextBoard[topR][c].blocked &&
        !nextBoard[topR][c].locked &&
        nextBoard[topR][c].piece === null
      ) {
        nextBoard[topR][c].piece = {
          id: nextPieceId(),
          type: randomFromPool(pool, rng),
          special: 'none',
          isNew: true,
        };
        changed = true;
      }
    }

    // 3. Diagonal slide around blocked / locked obstacles
    if (!changed) {
      for (let r = rows - 2; r >= 0; r -= 1) {
        for (let c = 0; c < cols; c += 1) {
          const curr = nextBoard[r][c];
          if (curr.blocked || curr.locked || !curr.piece) continue;
          const diagTargets = [c - 1, c + 1];
          for (const nc of diagTargets) {
            if (nc < 0 || nc >= cols) continue;
            const target = nextBoard[r + 1][nc];
            const aboveTarget = nextBoard[r][nc];
            if (
              !target.blocked &&
              !target.locked &&
              target.piece === null &&
              (aboveTarget.blocked || aboveTarget.locked)
            ) {
              target.piece = curr.piece;
              curr.piece = null;
              changed = true;
              break;
            }
          }
          if (changed) break;
        }
        if (changed) break;
      }
    }

    if (!changed) break;
  }

  // Safety guarantee: ensure no non-blocked cell remains empty
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!nextBoard[r][c].blocked && nextBoard[r][c].piece === null) {
        nextBoard[r][c].piece = {
          id: nextPieceId(),
          type: randomFromPool(pool, rng),
          special: 'none',
          isNew: true,
        };
      }
    }
  }

  return nextBoard;
}

export function findValidMove(
  board: BoardCell[][]
): [{ row: number; col: number }, { row: number; col: number }] | null {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (c + 1 < cols && isSwapValid(board, { row: r, col: c }, { row: r, col: c + 1 })) {
        return [{ row: r, col: c }, { row: r, col: c + 1 }];
      }
      if (r + 1 < rows && isSwapValid(board, { row: r, col: c }, { row: r + 1, col: c })) {
        return [{ row: r, col: c }, { row: r + 1, col: c }];
      }
    }
  }
  return null;
}

export function shuffleBoard(
  board: BoardCell[][],
  rng: () => number = Math.random
): BoardCell[][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const movableCoords: Array<{ row: number; col: number }> = [];
  const pieces: TilePiece[] = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = board[r][c];
      if (!cell.blocked && !cell.locked && cell.piece) {
        movableCoords.push({ row: r, col: c });
        pieces.push({ ...cell.piece, isNew: true });
      }
    }
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    for (let i = pieces.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    const candidate = cloneBoard(board);
    movableCoords.forEach((coord, idx) => {
      candidate[coord.row][coord.col].piece = pieces[idx];
    });
    if (findMatchClusters(candidate).length === 0 && findValidMove(candidate)) {
      return candidate;
    }
  }

  return cloneBoard(board);
}
