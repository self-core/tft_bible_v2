import { useCallback, useMemo } from 'react';
import { Star, Trash2 } from 'lucide-react';

export interface BoardChampion {
  id: string;
  championId: string;
  name: string;
  cost: number;
  traits: string[];
  iconUrl?: string | null;
  stars: number;
  items: string[];
  row: number;
  col: number;
}

interface TFTBoardProps {
  champions?: BoardChampion[];
  editMode?: boolean;
  onBoardChange?: (champions: BoardChampion[]) => void;
  title?: string;
}

const BOARD_ROWS = 4;
const BOARD_COLS = 7;

const getCostColor = (cost: number) => {
  switch (cost) {
    case 1: return { bg: '#6b7280', border: '#6b7280' };
    case 2: return { bg: '#10b981', border: '#10b981' };
    case 3: return { bg: '#3b82f6', border: '#3b82f6' };
    case 4: return { bg: '#a855f7', border: '#a855f7' };
    case 5: return { bg: '#eab308', border: '#eab308' };
    default: return { bg: '#6b7280', border: '#6b7280' };
  }
};

function autoPlaceChampions(units: BoardChampion[]): BoardChampion[] {
  const placed = units.filter(u => u.row >= 0 && u.col >= 0 && u.row < BOARD_ROWS && u.col < BOARD_COLS);
  const unplaced = units.filter(u => u.row < 0 || u.col < 0 || u.row >= BOARD_ROWS || u.col >= BOARD_COLS);

  if (unplaced.length === 0) return placed;

  const occupied = new Set(placed.map(u => `${u.row},${u.col}`));
  const sorted = [...unplaced].sort((a, b) => b.cost - a.cost);

  const frontRow = 2;
  const backRow = 0;
  const midRow = 1;

  const positions = [
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: frontRow, col: i })),
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: backRow, col: i })),
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: midRow, col: i })),
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: 3, col: i })),
  ];

  for (const unit of sorted) {
    for (const pos of positions) {
      const key = `${pos.row},${pos.col}`;
      if (!occupied.has(key)) {
        unit.row = pos.row;
        unit.col = pos.col;
        occupied.add(key);
        break;
      }
    }
  }

  return [...placed, ...sorted];
}

const TFTBoardCell = ({ unit, editMode, onRemove, onStarClick }: {
  unit: BoardChampion | null;
  editMode: boolean;
  onRemove: (id: string) => void;
  onStarClick: (id: string) => void;
}) => {
  if (!unit) {
    return (
      <div className="w-full aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
        style={{ borderColor: 'var(--bg-primary)', backgroundColor: 'transparent', minWidth: 0 }}>
        <div className="w-1/3 h-1/3 rounded border border-dashed" style={{ borderColor: 'var(--bg-accent)' }} />
      </div>
    );
  }

  const colors = getCostColor(unit.cost);
  return (
    <div className="relative w-full aspect-square rounded-lg overflow-hidden group"
      style={{ backgroundColor: colors.bg, border: `2px solid ${colors.border}` }}>
      {unit.iconUrl ? (
        <img src={unit.iconUrl} alt={unit.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: colors.bg }}>
          {unit.name?.charAt(0) || '?'}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-0.5">
        {Array.from({ length: unit.stars }).map((_, i) => (
          <Star key={i} size={10} fill="#fbbf24" stroke="#fbbf24" className="drop-shadow-sm" />
        ))}
      </div>

      {editMode && (
        <>
          <button onClick={() => onStarClick(unit.id)}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fbbf24' }}
            title="Cycle star level">
            {unit.stars < 3 ? unit.stars + 1 : 1}★
          </button>
          <button onClick={() => onRemove(unit.id)}
            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            style={{ backgroundColor: 'rgba(239,68,68,0.8)' }}
            title="Remove champion">
            <Trash2 size={10} color="white" />
          </button>
        </>
      )}
    </div>
  );
};

const TFTBoard = ({ champions = [], editMode = false, onBoardChange, title = 'TFT Board' }: TFTBoardProps) => {
  const placedChampions = useMemo(() => autoPlaceChampions(champions), [champions]);

  const grid = useMemo(() => {
    const g: (BoardChampion | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => null)
    );
    for (const unit of placedChampions) {
      if (unit.row >= 0 && unit.row < BOARD_ROWS && unit.col >= 0 && unit.col < BOARD_COLS) {
        g[unit.row][unit.col] = unit;
      }
    }
    return g;
  }, [placedChampions]);

  const updateUnit = useCallback((id: string, updates: Partial<BoardChampion>) => {
    if (!onBoardChange) return;
    const next = placedChampions.map(u => u.id === id ? { ...u, ...updates } : u);
    onBoardChange(next);
  }, [placedChampions, onBoardChange]);

  const removeUnit = useCallback((id: string) => {
    if (!onBoardChange) return;
    onBoardChange(placedChampions.filter(u => u.id !== id));
  }, [placedChampions, onBoardChange]);

  const cycleStar = useCallback((id: string) => {
    const unit = placedChampions.find(u => u.id === id);
    if (!unit) return;
    updateUnit(id, { stars: unit.stars >= 3 ? 1 : unit.stars + 1 });
  }, [placedChampions, updateUnit]);

  const handleDrop = useCallback((row: number, col: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!editMode || !onBoardChange) return;

    const championId = e.dataTransfer.getData('text/champion-id');
    const unitId = e.dataTransfer.getData('text/unit-id');

    if (unitId) {
      const existing = placedChampions.find(u => u.id === unitId);
      if (existing) {
        const swap = placedChampions.find(u => u.row === row && u.col === col && u.id !== unitId);
        if (swap) {
          onBoardChange(placedChampions.map(u => {
            if (u.id === unitId) return { ...u, row, col };
            if (u.id === swap.id) return { ...u, row: existing.row, col: existing.col };
            return u;
          }));
        } else {
          onBoardChange(placedChampions.map(u => u.id === unitId ? { ...u, row, col } : u));
        }
      }
      return;
    }

    if (championId) {
      const existing = placedChampions.find(u => u.row === row && u.col === col);
      if (!existing) {
        const newUnit: BoardChampion = {
          id: `${championId}-${Date.now()}`,
          championId,
          name: e.dataTransfer.getData('text/champion-name') || championId,
          cost: parseInt(e.dataTransfer.getData('text/champion-cost') || '1'),
          traits: [],
          iconUrl: e.dataTransfer.getData('text/champion-icon') || null,
          stars: 1,
          items: [],
          row,
          col,
        };
        onBoardChange([...placedChampions, newUnit]);
      }
    }
  }, [editMode, placedChampions, onBoardChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!editMode) return;
    e.preventDefault();
  }, [editMode]);

  return (
    <div className="rounded-xl p-4 sm:p-6 border"
      style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
      <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
        <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
          ({placedChampions.length} / {BOARD_ROWS * BOARD_COLS})
        </span>
      </h2>

      <div className="flex flex-col gap-1.5 sm:gap-2">
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1.5 sm:gap-2">
            {row.map((cell, colIdx) => {
              return (
                <div key={`${rowIdx}-${colIdx}`} className="flex-1 min-w-0"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(rowIdx, colIdx, e)}>
                  <TFTBoardCell
                    unit={cell}
                    editMode={editMode}
                    onRemove={removeUnit}
                    onStarClick={cycleStar}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TFTBoard;
