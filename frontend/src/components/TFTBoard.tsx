import { useCallback, useMemo } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { proxyUrl } from '../lib/imageProxy';

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

const HEX_SIZE = 38;
const HEX_W = HEX_SIZE * Math.sqrt(3);
const HEX_H = HEX_SIZE * 2;
const HEX_HORIZ = HEX_W;
const HEX_VERT = HEX_SIZE * 1.5;
const PAD_X = HEX_SIZE;
const PAD_Y = HEX_SIZE;

function getHexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

const getCostColor = (cost: number) => {
  switch (cost) {
    case 1: return { bg: '#6b7280', border: '#9ca3af', glow: '#374151' };
    case 2: return { bg: '#10b981', border: '#34d399', glow: '#047857' };
    case 3: return { bg: '#3b82f6', border: '#60a5fa', glow: '#1d4ed8' };
    case 4: return { bg: '#a855f7', border: '#c084fc', glow: '#7e22ce' };
    case 5: return { bg: '#eab308', border: '#facc15', glow: '#a16207' };
    default: return { bg: '#6b7280', border: '#9ca3af', glow: '#374151' };
  }
};

function autoPlaceChampions(units: BoardChampion[]): BoardChampion[] {
  const placed = units.filter(u => u.row >= 0 && u.col >= 0 && u.row < BOARD_ROWS && u.col < BOARD_COLS);
  const unplaced = units.filter(u => u.row < 0 || u.col < 0 || u.row >= BOARD_ROWS || u.col >= BOARD_COLS);

  if (unplaced.length === 0) return placed;

  const occupied = new Set(placed.map(u => `${u.row},${u.col}`));
  const sorted = [...unplaced].sort((a, b) => b.cost - a.cost);

  const positions = [
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: 2, col: i })),
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: 0, col: i })),
    ...Array.from({ length: BOARD_COLS }, (_, i) => ({ row: 1, col: i })),
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

function hexCenter(row: number, col: number): [number, number] {
  const x = PAD_X + col * HEX_HORIZ + (row % 2 === 1 ? HEX_W / 2 : 0);
  const y = PAD_Y + row * HEX_VERT;
  return [x, y];
}

function hexPath(cx: number, cy: number): string {
  return getHexPoints(cx, cy, HEX_SIZE);
}

const TFTBoard = ({ champions = [], editMode = false, onBoardChange, title = 'TFT Board' }: TFTBoardProps) => {
  const placedChampions = useMemo(() => autoPlaceChampions(champions), [champions]);

  const championAt = useMemo(() => {
    const map = new Map<string, BoardChampion>();
    for (const u of placedChampions) {
      if (u.row >= 0 && u.row < BOARD_ROWS && u.col >= 0 && u.col < BOARD_COLS) {
        map.set(`${u.row},${u.col}`, u);
      }
    }
    return map;
  }, [placedChampions]);

  const removeUnit = useCallback((id: string) => {
    if (!onBoardChange) return;
    onBoardChange(placedChampions.filter(u => u.id !== id));
  }, [placedChampions, onBoardChange]);

  const cycleStar = useCallback((id: string) => {
    if (!onBoardChange) return;
    const unit = placedChampions.find(u => u.id === id);
    if (!unit) return;
    const next = placedChampions.map(u => u.id === id ? { ...u, stars: u.stars >= 3 ? 1 : u.stars + 1 } : u);
    onBoardChange(next);
  }, [placedChampions, onBoardChange]);

  const handleDrop = useCallback((row: number, col: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const svgW = Math.ceil(PAD_X * 2 + BOARD_COLS * HEX_HORIZ + HEX_W / 2 + 20);
  const svgH = Math.ceil(PAD_Y * 2 + BOARD_ROWS * HEX_VERT + HEX_SIZE + 20);

  return (
    <div className="rounded-xl p-4 sm:p-6 border overflow-x-auto"
      style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
      <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        {title}
        <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
          ({placedChampions.length} / {BOARD_ROWS * BOARD_COLS})
        </span>
      </h2>

      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {/* Background hex cells */}
        {Array.from({ length: BOARD_ROWS }, (_, row) =>
          Array.from({ length: BOARD_COLS }, (_, col) => {
            const [cx, cy] = hexCenter(row, col);
            return (
              <polygon
                key={`bg-${row}-${col}`}
                points={hexPath(cx, cy)}
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2"
                style={{ cursor: editMode ? 'pointer' : 'default' }}
                onClick={() => {}}
                onDragOver={(e) => { if (editMode) e.preventDefault(); }}
                onDrop={(e) => handleDrop(row, col, e)}
              />
            );
          })
        )}

        {/* Champions on board */}
        {placedChampions
          .filter(u => u.row >= 0 && u.row < BOARD_ROWS && u.col >= 0 && u.col < BOARD_COLS)
          .map(unit => {
            const [cx, cy] = hexCenter(unit.row, unit.col);
            const colors = getCostColor(unit.cost);
            const r = HEX_SIZE - 4;
            const clipId = `clip-${unit.id}`;

            return (
              <g key={unit.id} style={{ cursor: editMode ? 'grab' : 'default' }}>
                {/* Hex background */}
                <polygon
                  points={hexPath(cx, cy)}
                  fill={colors.glow}
                  stroke={colors.border}
                  strokeWidth="2"
                />

                {/* Champion image clip */}
                <clipPath id={clipId}>
                  <circle cx={cx} cy={cy - 4} r={r} />
                </clipPath>

                {/* Champion image or fallback */}
                {unit.iconUrl ? (
                  <image
                    href={proxyUrl(unit.iconUrl) || ''}
                    x={cx - r}
                    y={cy - 4 - r}
                    width={r * 2}
                    height={r * 2}
                    clipPath={`url(#${clipId})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ pointerEvents: 'none' }}
                    onError={(e) => {
                      (e.target as SVGImageElement).setAttribute('href', '');
                    }}
                  />
                ) : (
                  <circle cx={cx} cy={cy - 4} r={r} fill={colors.bg} />
                )}

                {/* Cost badge */}
                <circle cx={cx - r + 10} cy={cy - 4 - r + 10} r={9} fill={colors.bg} stroke={colors.border} strokeWidth="1.5" />
                <text x={cx - r + 10} y={cy - 4 - r + 13} textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">
                  {unit.cost}
                </text>

                {/* Name label */}
                <text
                  x={cx}
                  y={cy + r - 2}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="white"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {unit.name.length > 8 ? unit.name.slice(0, 7) + '…' : unit.name}
                </text>

                {/* Stars */}
                {unit.stars > 0 && (
                  <g transform={`translate(${cx - unit.stars * 5}, ${cy + r + 4})`}>
                    {Array.from({ length: unit.stars }).map((_, i) => (
                      <g key={i} transform={`translate(${i * 12}, 0)`}>
                        <polygon
                          points="6,0 7.5,4.5 12,4.5 8.5,7.5 10,12 6,9 2,12 3.5,7.5 0,4.5 4.5,4.5"
                          fill="#fbbf24"
                          stroke="#f59e0b"
                          strokeWidth="0.5"
                          transform="scale(0.7)"
                        />
                      </g>
                    ))}
                  </g>
                )}

                {/* Edit mode controls */}
                {editMode && (
                  <>
                    {/* Remove button */}
                    <g
                      transform={`translate(${cx + HEX_SIZE - 14}, ${cy - HEX_SIZE + 6})`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); removeUnit(unit.id); }}
                    >
                      <circle r="9" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="-4" x2="-4" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </g>

                    {/* Star cycle button */}
                    <g
                      transform={`translate(${cx - HEX_SIZE + 14}, ${cy - HEX_SIZE + 6})`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); cycleStar(unit.id); }}
                    >
                      <circle r="9" fill="rgba(0,0,0,0.7)" stroke="#fbbf24" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fbbf24">
                        {unit.stars < 3 ? unit.stars + 1 : 1}★
                      </text>
                    </g>

                    {/* Drag handle (invisible rect for dragging) */}
                    <rect
                      x={cx - r}
                      y={cy - 4 - r}
                      width={r * 2}
                      height={r * 2}
                      fill="transparent"
                      style={{ cursor: 'grab' }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/unit-id', unit.id);
                        e.dataTransfer.setData('text/plain', '');
                      }}
                    />
                  </>
                )}
              </g>
            );
          })}
      </svg>

      {/* Edit mode hint */}
      {editMode && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          Drag champions to board • Click star button to cycle stars • Click X to remove
        </p>
      )}
    </div>
  );
};

export default TFTBoard;