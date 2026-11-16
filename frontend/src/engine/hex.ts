import { ENGINE_CONFIG } from './config';
import type { Side } from './types';

export interface GridHex {
  row: number;
  col: number;
}

/**
 * Maps an input board position (row 0 = back row, row 3 = front row) onto the
 * shared 8-row battlefield. Blue occupies rows 0-3, red rows 4-7, so the two
 * front rows (3 and 4) touch.
 */
export function toGridPosition(side: Side, row: number, col: number): GridHex {
  const clampedRow = Math.max(0, Math.min(ENGINE_CONFIG.rowsPerSide - 1, Math.round(row)));
  const clampedCol = Math.max(0, Math.min(ENGINE_CONFIG.boardCols - 1, Math.round(col)));
  return {
    row: side === 'blue' ? clampedRow : ENGINE_CONFIG.boardRows - 1 - clampedRow,
    col: clampedCol,
  };
}

/** Converts an odd-r offset hex to cube coordinates. */
function toCube(hex: GridHex): { x: number; y: number; z: number } {
  const x = hex.col - (hex.row - (hex.row & 1)) / 2;
  const z = hex.row;
  return { x, y: -x - z, z };
}

/** Distance between two hexes in steps. */
export function hexDistance(a: GridHex, b: GridHex): number {
  const ca = toCube(a);
  const cb = toCube(b);
  return Math.max(Math.abs(ca.x - cb.x), Math.abs(ca.y - cb.y), Math.abs(ca.z - cb.z));
}

const EVEN_ROW_OFFSETS: ReadonlyArray<[number, number]> = [
  [0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0],
];
const ODD_ROW_OFFSETS: ReadonlyArray<[number, number]> = [
  [0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1],
];

export function neighborHexes(hex: GridHex): GridHex[] {
  const offsets = hex.row & 1 ? ODD_ROW_OFFSETS : EVEN_ROW_OFFSETS;
  return offsets.map(([dRow, dCol]) => ({ row: hex.row + dRow, col: hex.col + dCol }));
}

export function isOnBoard(hex: GridHex): boolean {
  return (
    hex.row >= 0 &&
    hex.row < ENGINE_CONFIG.boardRows &&
    hex.col >= 0 &&
    hex.col < ENGINE_CONFIG.boardCols
  );
}

export function validNeighbors(hex: GridHex): GridHex[] {
  return neighborHexes(hex).filter(isOnBoard);
}

export function hexKey(hex: GridHex): string {
  return `${hex.row}:${hex.col}`;
}
