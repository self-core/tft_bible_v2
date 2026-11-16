import { useCallback, useMemo, useRef } from 'react';
import { proxyUrl } from '../lib/imageProxy';
import { useDragSource, useDropTarget } from './dnd/hooks';
import type { DragHandleProps, DragPayload } from './dnd/hooks';
import './arena.css';

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
  onUnitClick?: (unit: BoardChampion) => void;
  showBench?: boolean;
  title?: string;
  hideHeader?: boolean;
  /** `arena` renders a tilted 3D table with standing unit art and item icons. */
  presentation?: 'flat' | 'arena';
  resolveItemIcon?: (itemId: string) => string | null | undefined;
}

const BOARD_ROWS = 4;
const BOARD_COLS = 7;
const BENCH_SLOTS = 9;
const BENCH_ROW = -1;

const HEX_SIZE = 38;
const HEX_W = HEX_SIZE * Math.sqrt(3);
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

function isOnGrid(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

function firstFreeBenchCol(units: BoardChampion[]): number {
  const occupied = new Set(
    units.filter(u => u.row === BENCH_ROW && u.col >= 0).map(u => u.col),
  );
  let col = 0;
  while (occupied.has(col)) col++;
  return col;
}

function autoPlaceChampions(units: BoardChampion[]): BoardChampion[] {
  const placed = units.map(u => ({ ...u }));
  const gridOccupied = new Set<string>();
  const benchOccupied = new Set<number>();
  const unplaced: number[] = [];

  placed.forEach((unit, index) => {
    if (isOnGrid(unit.row, unit.col)) {
      const key = `${unit.row},${unit.col}`;
      if (gridOccupied.has(key)) unplaced.push(index);
      else gridOccupied.add(key);
    } else if (unit.row === BENCH_ROW && unit.col >= 0) {
      if (benchOccupied.has(unit.col)) unplaced.push(index);
      else benchOccupied.add(unit.col);
    } else {
      unplaced.push(index);
    }
  });

  const gridOrder = [
    ...Array.from({ length: BOARD_COLS }, (_, col) => ({ row: 2, col })),
    ...Array.from({ length: BOARD_COLS }, (_, col) => ({ row: 0, col })),
    ...Array.from({ length: BOARD_COLS }, (_, col) => ({ row: 1, col })),
    ...Array.from({ length: BOARD_COLS }, (_, col) => ({ row: 3, col })),
  ];

  for (const index of unplaced) {
    const freeGrid = gridOrder.find(pos => !gridOccupied.has(`${pos.row},${pos.col}`));
    if (freeGrid) {
      placed[index].row = freeGrid.row;
      placed[index].col = freeGrid.col;
      gridOccupied.add(`${freeGrid.row},${freeGrid.col}`);
      continue;
    }

    let benchCol = 0;
    while (benchOccupied.has(benchCol)) benchCol++;
    placed[index].row = BENCH_ROW;
    placed[index].col = benchCol;
    benchOccupied.add(benchCol);
  }

  return placed;
}

function hexCenter(row: number, col: number): [number, number] {
  const x = PAD_X + col * HEX_HORIZ + (row % 2 === 1 ? HEX_W / 2 : 0);
  const y = PAD_Y + row * HEX_VERT;
  return [x, y];
}

function benchCenter(col: number): [number, number] {
  return [PAD_X + col * HEX_HORIZ, PAD_Y];
}

function hexPath(cx: number, cy: number): string {
  return getHexPoints(cx, cy, HEX_SIZE);
}

interface UnitGlyphProps {
  unit: BoardChampion;
  cx: number;
  cy: number;
  kind: 'board-unit' | 'bench-unit';
  editMode: boolean;
  dragging: boolean;
  dragHandleProps: DragHandleProps;
  wasDragged: () => boolean;
  onRemove: (id: string) => void;
  onCycleStar: (id: string) => void;
  onUnitClick?: (unit: BoardChampion) => void;
}

function UnitGlyph({
  unit, cx, cy, kind, editMode, dragging, dragHandleProps, wasDragged,
  onRemove, onCycleStar, onUnitClick,
}: UnitGlyphProps) {
  const colors = getCostColor(unit.cost);
  const r = HEX_SIZE - 4;
  const clipId = `clip-${unit.id}`;

  return (
    <g
      {...dragHandleProps}
      style={{
        cursor: editMode ? (dragging ? 'grabbing' : 'grab') : 'default',
        opacity: dragging ? 0.35 : 1,
        ...dragHandleProps.style,
      }}
      onClick={(e) => {
        if (!editMode || !onUnitClick || wasDragged()) return;
        e.stopPropagation();
        onUnitClick(unit);
      }}
    >
      <polygon
        points={hexPath(cx, cy)}
        fill={colors.glow}
        stroke={colors.border}
        strokeWidth="2"
      />

      <clipPath id={clipId}>
        <circle cx={cx} cy={cy - 4} r={r} />
      </clipPath>

      <circle cx={cx} cy={cy - 4} r={r} fill={colors.bg} />
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="rgba(255,255,255,0.9)"
      >
        {unit.name.charAt(0).toUpperCase()}
      </text>

      {unit.iconUrl && (
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
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <circle cx={cx - r + 10} cy={cy - 4 - r + 10} r={9} fill={colors.bg} stroke={colors.border} strokeWidth="1.5" />
      <text x={cx - r + 10} y={cy - 4 - r + 13} textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">
        {unit.cost}
      </text>

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

      {unit.items.length > 0 && (
        <g transform={`translate(${cx}, ${cy + r + 14})`}>
          {unit.items.slice(0, 3).map((_, i) => (
            <circle
              key={i}
              cx={(i - (Math.min(unit.items.length, 3) - 1) / 2) * 7}
              cy={0}
              r={2.5}
              fill="#38bdf8"
              stroke="#0ea5e9"
              strokeWidth="0.5"
            />
          ))}
        </g>
      )}

      {editMode && (
        <>
          <g
            data-no-drag
            data-testid={`remove-${kind}-${unit.id}`}
            transform={`translate(${cx + HEX_SIZE - 14}, ${cy - HEX_SIZE + 6})`}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(unit.id); }}
          >
            <circle r="9" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
            <line x1="-4" y1="-4" x2="4" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="-4" x2="-4" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g
            data-no-drag
            data-testid={`stars-${kind}-${unit.id}`}
            transform={`translate(${cx - HEX_SIZE + 14}, ${cy - HEX_SIZE + 6})`}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onCycleStar(unit.id); }}
          >
            <circle r="9" fill="rgba(0,0,0,0.7)" stroke="#fbbf24" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fbbf24">
              {unit.stars < 3 ? unit.stars + 1 : 1}★
            </text>
          </g>
        </>
      )}
    </g>
  );
}

interface DropCellProps {
  unit?: BoardChampion;
  row: number;
  col: number;
  bench?: boolean;
  editMode: boolean;
  onDropPayload: (payload: DragPayload, row: number, col: number) => void;
  onRemove: (id: string) => void;
  onCycleStar: (id: string) => void;
  onUnitClick?: (unit: BoardChampion) => void;
}

function DropCell({
  unit, row, col, bench = false, editMode, onDropPayload,
  onRemove, onCycleStar, onUnitClick,
}: DropCellProps) {
  const { isOver, dropProps } = useDropTarget((payload) => onDropPayload(payload, row, col));
  const [cx, cy] = bench ? benchCenter(col) : hexCenter(row, col);

  const source = useDragSource(() => ({
    kind: bench ? 'bench-unit' : 'board-unit',
    championId: unit?.championId ?? '',
    unitId: unit?.id,
    label: unit?.name ?? '',
    cost: unit?.cost ?? 1,
    iconUrl: unit?.iconUrl,
    traits: unit?.traits ?? [],
  }));

  return (
    <g
      data-drop-id={bench ? `bench-${col}` : `cell-${row}-${col}`}
      {...dropProps}
    >
      <polygon
        points={hexPath(cx, cy)}
        fill="#0f172a"
        stroke={isOver ? '#38bdf8' : '#1e293b'}
        strokeWidth={isOver ? '3' : '2'}
        style={{ cursor: editMode ? (isOver ? 'copy' : 'pointer') : 'default' }}
      />

      {unit && (
        <UnitGlyph
          unit={unit}
          cx={cx}
          cy={cy}
          kind={bench ? 'bench-unit' : 'board-unit'}
          editMode={editMode}
          dragging={source.isDragging}
          dragHandleProps={source.dragHandleProps}
          wasDragged={source.wasDragged}
          onRemove={onRemove}
          onCycleStar={onCycleStar}
          onUnitClick={onUnitClick}
        />
      )}

      {isOver && (
        <polygon
          data-highlight="true"
          points={hexPath(cx, cy)}
          fill="rgba(56,189,248,0.22)"
          stroke="#38bdf8"
          strokeWidth="3"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
}

const ARENA_HEX_W = 60;
const ARENA_HEX_H = 69;
const ARENA_ROW_STEP = ARENA_HEX_H * 0.75;
const ARENA_PAD = 12;
const ARENA_TILT = 46;
const ARENA_BOARD_W = Math.ceil(ARENA_PAD * 2 + BOARD_COLS * ARENA_HEX_W + ARENA_HEX_W / 2);
const ARENA_BOARD_H = Math.ceil(ARENA_PAD * 2 + (BOARD_ROWS - 1) * ARENA_ROW_STEP + ARENA_HEX_H);

interface ArenaCellProps {
  unit?: BoardChampion;
  row: number;
  col: number;
  editMode: boolean;
  onDropPayload: (payload: DragPayload, row: number, col: number) => void;
  onRemove: (id: string) => void;
  onCycleStar: (id: string) => void;
  onUnitClick?: (unit: BoardChampion) => void;
  resolveItemIcon?: (itemId: string) => string | null | undefined;
}

interface ArenaUnitProps {
  unit: BoardChampion;
  editMode: boolean;
  onRemove: (id: string) => void;
  onCycleStar: (id: string) => void;
  onUnitClick?: (unit: BoardChampion) => void;
  resolveItemIcon?: (itemId: string) => string | null | undefined;
}

function ArenaUnit({
  unit, editMode, onRemove, onCycleStar, onUnitClick, resolveItemIcon,
}: ArenaUnitProps) {
  const colors = getCostColor(unit.cost);
  const icon = proxyUrl(unit.iconUrl);
  const source = useDragSource(() => ({
    kind: 'board-unit',
    championId: unit.championId,
    unitId: unit.id,
    label: unit.name,
    cost: unit.cost,
    iconUrl: unit.iconUrl,
    traits: unit.traits,
  }));

  return (
    <>
      <div className="arena-glow" style={{ background: colors.glow }} />
      <div className="arena-shadow" />

      {unit.items.length > 0 && (
        <div className="arena-gear">
          {unit.items.slice(0, 3).map((itemId, index) => {
            const gearIcon = proxyUrl(resolveItemIcon?.(itemId));
            return (
              <span
                key={`${itemId}-${index}`}
                className="arena-gear-slot"
                data-testid={`arena-item-${unit.id}-${index}`}
                title={itemId}
              >
                {gearIcon ? (
                  <img
                    src={gearIcon}
                    alt=""
                    draggable={false}
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="arena-gear-dot" />
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="arena-standee">
        <div className="arena-standee-inner">
          <div
            className="arena-stars"
            data-testid={`arena-stars-${unit.id}`}
            aria-label={`${unit.stars} star${unit.stars === 1 ? '' : 's'}`}
          >
            {Array.from({ length: unit.stars }).map((_, index) => (
              <span key={index}>★</span>
            ))}
          </div>

          <div
            className="arena-card"
            data-testid={`arena-unit-${unit.id}`}
            aria-label={`${unit.name}, ${unit.cost} gold, ${unit.stars} star`}
            title={`${unit.name} · ${unit.cost} gold · ${unit.stars}★`}
            {...source.dragHandleProps}
            style={{
              ...source.dragHandleProps.style,
              borderColor: colors.border,
              opacity: source.isDragging ? 0.4 : 1,
              boxShadow: `0 0 14px ${colors.glow}88, 0 12px 22px rgba(0,0,0,.55)`,
            }}
            onClick={(event) => {
              if (!editMode || !onUnitClick || source.wasDragged()) return;
              event.stopPropagation();
              onUnitClick(unit);
            }}
          >
            <span
              className="arena-card-fallback"
              style={{
                color: colors.border,
                background: `linear-gradient(160deg, ${colors.bg}40 0%, #0b1220 72%)`,
              }}
            >
              {unit.name.charAt(0).toUpperCase()}
            </span>
            {icon && (
              <img
                className="arena-card-art"
                src={icon}
                alt=""
                draggable={false}
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
            )}
            <span
              className="arena-card-cost"
              style={{ background: colors.bg, borderColor: colors.border }}
            >
              {unit.cost}
            </span>
          </div>

          {editMode && (
            <>
              <button
                type="button"
                data-no-drag
                data-testid={`remove-board-unit-${unit.id}`}
                aria-label={`Remove ${unit.name}`}
                className="arena-card-control arena-card-control--remove"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); onRemove(unit.id); }}
              >
                ×
              </button>
              <button
                type="button"
                data-no-drag
                data-testid={`stars-board-unit-${unit.id}`}
                aria-label={`Upgrade ${unit.name}`}
                className="arena-card-control arena-card-control--star"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); onCycleStar(unit.id); }}
              >
                {unit.stars < 3 ? unit.stars + 1 : 1}★
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ArenaCell({
  unit, row, col, editMode, onDropPayload, onRemove, onCycleStar, onUnitClick, resolveItemIcon,
}: ArenaCellProps) {
  const { isOver, dropProps } = useDropTarget((payload) => onDropPayload(payload, row, col));
  const left = ARENA_PAD + col * ARENA_HEX_W + (row % 2 === 1 ? ARENA_HEX_W / 2 : 0);
  const top = ARENA_PAD + row * ARENA_ROW_STEP;

  return (
    <div
      className="arena-cell"
      data-drop-id={`cell-${row}-${col}`}
      style={{ left, top, width: ARENA_HEX_W, height: ARENA_HEX_H }}
      {...dropProps}
    >
      <div className="arena-hex-edge" />
      <div
        className="arena-hex"
        style={{ cursor: editMode ? (isOver ? 'copy' : 'pointer') : 'default' }}
      />
      {isOver && <div className="arena-hex arena-hex--over" data-highlight="true" />}
      {unit && (
        <ArenaUnit
          unit={unit}
          editMode={editMode}
          onRemove={onRemove}
          onCycleStar={onCycleStar}
          onUnitClick={onUnitClick}
          resolveItemIcon={resolveItemIcon}
        />
      )}
    </div>
  );
}

interface ArenaGridProps {
  units: BoardChampion[];
  editMode: boolean;
  onDropPayload: (payload: DragPayload, row: number, col: number) => void;
  onRemove: (id: string) => void;
  onCycleStar: (id: string) => void;
  onUnitClick?: (unit: BoardChampion) => void;
  resolveItemIcon?: (itemId: string) => string | null | undefined;
}

function ArenaGrid({
  units, editMode, onDropPayload, onRemove, onCycleStar, onUnitClick, resolveItemIcon,
}: ArenaGridProps) {
  const unitAt = (row: number, col: number) =>
    units.find((u) => u.row === row && u.col === col);

  return (
    <div className="arena-scroll">
      <div className="arena-scene" data-testid="arena-board">
        <div className="arena-plane" style={{ width: ARENA_BOARD_W, height: ARENA_BOARD_H }}>
          {Array.from({ length: BOARD_ROWS }, (_, row) =>
            Array.from({ length: BOARD_COLS }, (_, col) => (
              <ArenaCell
                key={`arena-${row}-${col}`}
                row={row}
                col={col}
                unit={unitAt(row, col)}
                editMode={editMode}
                onDropPayload={onDropPayload}
                onRemove={onRemove}
                onCycleStar={onCycleStar}
                onUnitClick={onUnitClick}
                resolveItemIcon={resolveItemIcon}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const TFTBoard = ({
  champions = [],
  editMode = false,
  onBoardChange,
  onUnitClick,
  showBench,
  title = 'TFT Board',
  hideHeader = false,
  presentation = 'flat',
  resolveItemIcon,
}: TFTBoardProps) => {
  const placedChampions = useMemo(() => autoPlaceChampions(champions), [champions]);
  const newUnitCounter = useRef(0);
  const benchVisible = showBench ?? editMode;

  const gridUnits = placedChampions.filter(u => isOnGrid(u.row, u.col));
  const benchUnits = placedChampions.filter(u => u.row === BENCH_ROW && u.col >= 0);
  const maxBenchCol = benchUnits.reduce((max, u) => Math.max(max, u.col), BENCH_SLOTS - 1);
  const benchSlots = Math.max(BENCH_SLOTS, maxBenchCol + 1);

  const unitAt = (row: number, col: number) =>
    placedChampions.find(u => u.row === row && u.col === col);

  const removeUnit = useCallback((id: string) => {
    if (!onBoardChange) return;
    onBoardChange(placedChampions.filter(u => u.id !== id));
  }, [placedChampions, onBoardChange]);

  const cycleStar = useCallback((id: string) => {
    if (!onBoardChange) return;
    onBoardChange(placedChampions.map(u => (
      u.id === id ? { ...u, stars: u.stars >= 3 ? 1 : u.stars + 1 } : u
    )));
  }, [placedChampions, onBoardChange]);

  const handleDrop = useCallback((payload: DragPayload, row: number, col: number) => {
    if (!editMode || !onBoardChange) return;

    if (payload.kind === 'palette-champion') {
      const next = placedChampions.map(u => ({ ...u }));
      const occupiedIndex = next.findIndex(u => u.row === row && u.col === col);
      if (occupiedIndex >= 0) {
        const benchCol = firstFreeBenchCol(next);
        next[occupiedIndex] = { ...next[occupiedIndex], row: BENCH_ROW, col: benchCol };
      }

      newUnitCounter.current += 1;
      next.push({
        id: `${payload.championId}-${Date.now()}-${newUnitCounter.current}`,
        championId: payload.championId,
        name: payload.label || payload.championId,
        cost: payload.cost || 1,
        traits: [...payload.traits],
        iconUrl: payload.iconUrl ?? null,
        stars: 1,
        items: [],
        row,
        col,
      });
      onBoardChange(next);
      return;
    }

    const next = placedChampions.map(u => ({ ...u }));
    const moverIndex = next.findIndex(u => u.id === payload.unitId);
    if (moverIndex < 0) return;

    const mover = next[moverIndex];
    if (mover.row === row && mover.col === col) return;

    const occupantIndex = next.findIndex((u, i) => i !== moverIndex && u.row === row && u.col === col);
    if (occupantIndex >= 0) {
      const occupant = next[occupantIndex];
      next[occupantIndex] = { ...occupant, row: mover.row, col: mover.col };
    }
    next[moverIndex] = { ...mover, row, col };
    onBoardChange(next);
  }, [editMode, placedChampions, onBoardChange]);

  const svgW = Math.ceil(PAD_X * 2 + BOARD_COLS * HEX_HORIZ + HEX_W / 2 + 20);
  const svgH = Math.ceil(PAD_Y * 2 + BOARD_ROWS * HEX_VERT + HEX_SIZE + 20);
  const benchW = Math.ceil(PAD_X * 2 + benchSlots * HEX_HORIZ + 20);
  const benchH = Math.ceil(PAD_Y * 2 + HEX_SIZE * 2);

  return (
    <div className={`rounded-xl p-4 sm:p-6 border ${presentation === 'arena' ? '' : 'overflow-x-auto'}`}
      style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
      {!hideHeader && (
        <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {title}
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
            ({gridUnits.length} / {BOARD_ROWS * BOARD_COLS})
          </span>
          {benchUnits.length > 0 && (
            <span className="ml-2 text-sm font-normal" style={{ color: '#38bdf8' }}>
              · {benchUnits.length} on bench
            </span>
          )}
        </h2>
      )}

      {presentation === 'arena' ? (
        <ArenaGrid
          units={placedChampions}
          editMode={editMode}
          onDropPayload={handleDrop}
          onRemove={removeUnit}
          onCycleStar={cycleStar}
          onUnitClick={onUnitClick}
          resolveItemIcon={resolveItemIcon}
        />
      ) : (
        <svg
          width={svgW}
          height={svgH}
          style={{ display: 'block', maxWidth: '100%', touchAction: editMode ? 'none' : 'auto' }}
          data-testid="board-svg"
        >
          {Array.from({ length: BOARD_ROWS }, (_, row) =>
            Array.from({ length: BOARD_COLS }, (_, col) => (
              <DropCell
                key={`cell-${row}-${col}`}
                row={row}
                col={col}
                unit={unitAt(row, col)}
                editMode={editMode}
                onDropPayload={handleDrop}
                onRemove={removeUnit}
                onCycleStar={cycleStar}
                onUnitClick={onUnitClick}
              />
            ))
          )}
        </svg>
      )}

      {benchVisible && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>
            Bench
          </div>
          <svg
            width={benchW}
            height={benchH}
            style={{ display: 'block', maxWidth: '100%', touchAction: editMode ? 'none' : 'auto' }}
            data-testid="bench-svg"
          >
            {Array.from({ length: benchSlots }, (_, col) => (
              <DropCell
                key={`bench-${col}`}
                row={BENCH_ROW}
                col={col}
                bench
                unit={benchUnits.find(u => u.col === col)}
                editMode={editMode}
                onDropPayload={handleDrop}
                onRemove={removeUnit}
                onCycleStar={cycleStar}
                onUnitClick={onUnitClick}
              />
            ))}
          </svg>
        </div>
      )}

      {editMode && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          Drag champions to the board or bench • Click a unit to edit items • Click a star to upgrade • Click X to remove
        </p>
      )}
    </div>
  );
};

export default TFTBoard;
