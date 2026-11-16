import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Loader2, Trash2, Play, Pause, RotateCcw, Swords, ShieldAlert, X, Plus,
} from 'lucide-react';
import { GET_ACTIVE_SET } from '../lib/graphql';
import type { Augment, Champion, Item, Trait } from '../lib/api';
import { proxyUrl } from '../lib/imageProxy';
import TFTBoard, { BoardChampion } from '../components/TFTBoard';
import UnitConfigPopover from '../components/UnitConfigPopover';
import BuilderTraitPanel from '../components/BuilderTraitPanel';
import { DndProvider } from '../components/dnd/DndProvider';
import { useDragSource } from '../components/dnd/hooks';
import { AUGMENT_MODIFIERS, predict, simulate } from '../engine';
import type {
  CombatUnitInput, FightResult, PredictionResult, Side, TimelineEvent,
} from '../engine';

interface ActiveSetPayload {
  setId: number;
  setName: string;
  champions: Champion[];
  traits: Trait[];
  items: Item[];
  augments: Augment[];
}

const BOARD_LEVELS = Array.from({ length: 10 }, (_, index) => index + 1);

const tierColor = (cost: number) =>
  ({ 1: '#6b7280', 2: '#10b981', 3: '#3b82f6', 4: '#a855f7', 5: '#eab308' }[cost] ?? '#6b7280');

function PaletteTile({ champion }: { champion: Champion }) {
  const { dragHandleProps, isDragging } = useDragSource(() => ({
    kind: 'palette-champion',
    championId: champion.id,
    label: champion.name,
    cost: champion.cost || 1,
    iconUrl: champion.iconUrl || champion.imageUrl || null,
    traits: champion.traits,
  }));
  const icon = champion.iconUrl || champion.imageUrl;

  return (
    <div
      data-testid={`palette-${champion.id}`}
      {...dragHandleProps}
      style={{ opacity: isDragging ? 0.35 : 1, cursor: 'grab', ...dragHandleProps.style }}
      className="relative group select-none"
      title={`${champion.name} (${champion.cost} cost)`}
    >
      <div
        className="relative w-11 h-11 rounded-lg overflow-hidden border-2 transition-transform group-hover:scale-110"
        style={{ borderColor: tierColor(champion.cost), backgroundColor: tierColor(champion.cost) }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
          {champion.name?.charAt(0) || '?'}
        </span>
        {icon && (
          <img
            src={proxyUrl(icon)}
            alt={champion.name}
            className="absolute inset-0 w-full h-full object-cover z-10"
            draggable={false}
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  );
}

function fallbackChampion(unit: BoardChampion): Champion {
  return {
    id: unit.championId,
    name: unit.name,
    cost: unit.cost || 1,
    traits: unit.traits,
    stats: { hp: 600, mana: 100, damage: 50 },
    ability: { name: 'Unknown', variables: [] },
    imageUrl: unit.iconUrl ?? undefined,
    iconUrl: unit.iconUrl ?? undefined,
  };
}

function toEngineUnits(
  side: Side,
  board: BoardChampion[],
  championsById: Map<string, Champion>,
  itemsById: Map<string, Item>
): CombatUnitInput[] {
  return board
    .filter(unit => unit.row >= 0 && unit.row < 4)
    .map(unit => ({
      id: `${side}-${unit.id}`,
      championId: unit.championId,
      champion: championsById.get(unit.championId) ?? fallbackChampion(unit),
      stars: Math.min(3, Math.max(1, unit.stars || 1)),
      row: unit.row,
      col: unit.col,
      items: unit.items
        .map(id => itemsById.get(id))
        .filter((item): item is Item => Boolean(item)),
    }));
}

const sideColor = (side: Side) => (side === 'blue' ? '#38bdf8' : '#f87171');

interface SidePanelProps {
  side: Side;
  title: string;
  board: BoardChampion[];
  traits: Trait[];
  level: number;
  onLevelChange: (level: number) => void;
  onBoardChange: (board: BoardChampion[]) => void;
  onUnitClick: (unit: BoardChampion) => void;
  augments: Augment[];
  augmentOptions: Augment[];
  onAugmentChange: (augments: Augment[]) => void;
  onClear: () => void;
  itemIcon: (itemId: string) => string | null | undefined;
}

function SidePanel({
  side, title, board, traits, level, onLevelChange, onBoardChange,
  onUnitClick, augments, augmentOptions, onAugmentChange, onClear, itemIcon,
}: SidePanelProps) {
  const [augmentQuery, setAugmentQuery] = useState('');
  const deployed = board.filter(unit => unit.row >= 0).length;
  const overLevel = deployed > level;

  const filteredAugments = useMemo(() => {
    const needle = augmentQuery.trim().toLowerCase();
    const pool = needle
      ? augmentOptions.filter(augment =>
        augment.name.toLowerCase().includes(needle) ||
        augment.id.toLowerCase().includes(needle))
      : augmentOptions;
    return pool.slice(0, 8);
  }, [augmentOptions, augmentQuery]);

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)', minWidth: 0 }}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: sideColor(side) }}>
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: sideColor(side) }} />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Level</label>
          <select
            aria-label={`${side} level`}
            value={level}
            onChange={(event) => onLevelChange(Number(event.target.value))}
            className="px-2 py-1 rounded border text-sm"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            {BOARD_LEVELS.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <span className="text-xs font-semibold" style={{ color: overLevel ? '#f87171' : 'var(--text-secondary)' }}>
            {deployed}/{level}
          </span>
        </div>
      </div>

      <TFTBoard
        champions={board}
        editMode
        onBoardChange={onBoardChange}
        onUnitClick={onUnitClick}
        showBench={false}
        hideHeader
        title=""
        presentation="arena"
        resolveItemIcon={itemIcon}
      />

      {overLevel && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
          <ShieldAlert size={14} /> More units deployed than this level allows.
        </p>
      )}

      <BuilderTraitPanel units={board} traits={traits} />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            Augments ({augments.length}/3)
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {augments.map(augment => (
            <span
              key={augment.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              title={AUGMENT_MODIFIERS[augment.id] ? 'Modeled by the engine' : 'Not modeled — excluded from prediction'}
            >
              {augment.name}
              {!AUGMENT_MODIFIERS[augment.id] && <span style={{ color: '#fbbf24' }}>⚠</span>}
              <button aria-label={`Remove ${augment.name}`} onClick={() => onAugmentChange(augments.filter(a => a.id !== augment.id))}>
                <X size={12} />
              </button>
            </span>
          ))}
          {augments.length === 0 && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>None selected</span>
          )}
        </div>
        {augments.length < 3 && (
          <div className="mt-2">
            <input
              value={augmentQuery}
              onChange={(event) => setAugmentQuery(event.target.value)}
              placeholder="Search augments…"
              className="w-full px-2 py-1 rounded border text-xs"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            <div className="mt-1 max-h-28 overflow-y-auto rounded border" style={{ borderColor: 'var(--bg-primary)' }}>
              {filteredAugments
                .filter(option => !augments.some(chosen => chosen.id === option.id))
                .map(option => (
                  <button
                    key={option.id}
                    onClick={() => { onAugmentChange([...augments, option]); setAugmentQuery(''); }}
                    className="w-full text-left px-2 py-1 text-xs flex items-center justify-between gap-2 hover:bg-[var(--bg-accent)]"
                  >
                    <span className="truncate">{option.name}</span>
                    <Plus size={12} />
                  </button>
                ))}
              {filteredAugments.length === 0 && (
                <p className="px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)' }}>No augments match.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {board.length > 0 && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
        >
          <Trash2 size={13} /> Clear board
        </button>
      )}
    </div>
  );
}

function describeEvent(
  event: TimelineEvent,
  names: Map<string, string>
): string {
  const nameOf = (id?: string) => (id ? names.get(id) ?? id : '?');
  switch (event.type) {
    case 'attack':
      return `${nameOf(event.sourceId)} attacks ${nameOf(event.targetId)}`;
    case 'damage':
      return `${nameOf(event.targetId)} takes ${event.amount} ${event.damageType ?? ''} damage`;
    case 'heal':
      return `${nameOf(event.targetId)} heals ${event.amount}`;
    case 'shield':
      return `${nameOf(event.targetId)} gains a ${event.amount} shield`;
    case 'cast':
      return `${nameOf(event.sourceId)} casts ${event.text ?? 'ability'}`;
    case 'death':
      return `${nameOf(event.targetId)} is defeated`;
    case 'move':
      return `${nameOf(event.sourceId)} repositions`;
    case 'end':
      return event.text ?? 'Fight ends';
    default:
      return event.type;
  }
}

const eventColor = (event: TimelineEvent): string => {
  switch (event.type) {
    case 'death': return '#f87171';
    case 'cast': return '#c084fc';
    case 'heal': return '#4ade80';
    case 'shield': return '#38bdf8';
    case 'end': return '#fbbf24';
    default: return 'var(--text-secondary)';
  }
};

const SandboxPage = () => {
  const { data, loading, error } = useQuery(GET_ACTIVE_SET);
  const activeSet = data?.activeSet as ActiveSetPayload | undefined;

  const [blueBoard, setBlueBoard] = useState<BoardChampion[]>([]);
  const [redBoard, setRedBoard] = useState<BoardChampion[]>([]);
  const [blueAugments, setBlueAugments] = useState<Augment[]>([]);
  const [redAugments, setRedAugments] = useState<Augment[]>([]);
  const [blueLevel, setBlueLevel] = useState(8);
  const [redLevel, setRedLevel] = useState(8);
  const [selected, setSelected] = useState<{ side: Side; unitId: string } | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [sample, setSample] = useState<FightResult | null>(null);
  const [seed, setSeed] = useState(1);
  const [busy, setBusy] = useState(false);
  const [clockMs, setClockMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);

  const champions = activeSet?.champions ?? [];
  const traits = activeSet?.traits ?? [];
  const items = activeSet?.items ?? [];
  const augmentOptions = activeSet?.augments ?? [];

  const championsById = useMemo(
    () => new Map(champions.map(champion => [champion.id, champion])),
    [champions]
  );
  const itemsById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  const itemIcon = useCallback(
    (itemId: string) => itemsById.get(itemId)?.imageUrl ?? undefined,
    [itemsById]
  );

  const combatItems = useMemo(() => items.filter(item => {
    const id = item.id ?? '';
    return !/Augment|Upgrade|Anvil|Consumable|Tome|Armory|Market|Teamup|Enemy|Debug|Tutorial/i.test(id);
  }), [items]);

  const paletteChampions = useMemo(
    () => [...champions]
      .filter(champion => champion.cost >= 1 && champion.cost <= 5)
      .sort((a, b) => (a.cost !== b.cost ? a.cost - b.cost : a.name.localeCompare(b.name))),
    [champions]
  );

  const blueUnits = useMemo(
    () => toEngineUnits('blue', blueBoard, championsById, itemsById),
    [blueBoard, championsById, itemsById]
  );
  const redUnits = useMemo(
    () => toEngineUnits('red', redBoard, championsById, itemsById),
    [redBoard, championsById, itemsById]
  );

  const blueDeployed = blueUnits.length;
  const redDeployed = redUnits.length;
  const overLevel = blueDeployed > blueLevel || redDeployed > redLevel;
  const canPredict = Boolean(activeSet) && !overLevel && (blueDeployed > 0 || redDeployed > 0);

  useEffect(() => {
    setPrediction(null);
    setSample(null);
    setClockMs(0);
    setPlaying(false);
  }, [blueBoard, redBoard, blueAugments, redAugments, blueLevel, redLevel, seed]);

  useEffect(() => {
    if (!playing || !sample) return;
    const timer = window.setInterval(() => {
      setClockMs(previous => {
        const next = previous + 100 * speed;
        if (next >= sample.durationMs) {
          setPlaying(false);
          return sample.durationMs;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, sample, speed]);

  const selectedUnit = selected
    ? (selected.side === 'blue' ? blueBoard : redBoard).find(unit => unit.id === selected.unitId) ?? null
    : null;

  const updateSelectedUnit = (updated: BoardChampion) => {
    if (!selected) return;
    const setter = selected.side === 'blue' ? setBlueBoard : setRedBoard;
    setter(previous => previous.map(unit => (unit.id === updated.id ? updated : unit)));
  };

  const runPrediction = () => {
    if (!activeSet || !canPredict) return;
    setBusy(true);
    const blue = { units: blueUnits, augments: blueAugments, level: blueLevel };
    const red = { units: redUnits, augments: redAugments, level: redLevel };
    const result = predict(blue, red, traits, { runs: 128, seed });
    const oneFight = simulate(blue, red, traits, { seed });
    setPrediction(result);
    setSample(oneFight);
    setClockMs(0);
    setPlaying(true);
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent1)' }} />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading set data…</span>
      </div>
    );
  }

  if (error || !activeSet) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        <ShieldAlert size={32} className="mx-auto mb-3" />
        <p>Could not load the active set. The sandbox needs the GraphQL backend running.</p>
        {error && <p className="text-xs mt-2">{error.message}</p>}
      </div>
    );
  }

  const names = new Map<string, string>();
  sample?.blue.units.forEach(unit => names.set(unit.id, unit.name));
  sample?.red.units.forEach(unit => names.set(unit.id, unit.name));
  const visibleEvents = sample
    ? sample.events.filter(event => event.atMs <= clockMs).slice(-80)
    : [];

  const coverage = prediction?.coverage;
  const unmodeledAbilityCount = coverage?.units.filter(unit => !unit.abilityModeled).length ?? 0;
  const unmodeledItemCount = coverage?.unmodeledItemEffects.length ?? 0;

  return (
    <DndProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Sandbox</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Set {activeSet.setId} · {activeSet.setName} — place both boards, simulate the fight, and predict the winner.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Seed</label>
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Math.max(1, Number(event.target.value) || 1))}
              className="w-24 px-2 py-1 rounded border text-sm"
              style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Champions — drag onto either board
          </h3>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {paletteChampions.map(champion => (
              <PaletteTile key={champion.id} champion={champion} />
            ))}
            {paletteChampions.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>No champions in this set.</span>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2 items-start">
          <SidePanel
            side="blue"
            title="Blue board (you)"
            board={blueBoard}
            traits={traits}
            level={blueLevel}
            onLevelChange={setBlueLevel}
            onBoardChange={setBlueBoard}
            onUnitClick={(unit) => setSelected({ side: 'blue', unitId: unit.id })}
            augments={blueAugments}
            augmentOptions={augmentOptions}
            onAugmentChange={setBlueAugments}
            onClear={() => { setBlueBoard([]); setSelected(null); }}
            itemIcon={itemIcon}
          />
          <SidePanel
            side="red"
            title="Red board (opponent)"
            board={redBoard}
            traits={traits}
            level={redLevel}
            onLevelChange={setRedLevel}
            onBoardChange={setRedBoard}
            onUnitClick={(unit) => setSelected({ side: 'red', unitId: unit.id })}
            augments={redAugments}
            augmentOptions={augmentOptions}
            onAugmentChange={setRedAugments}
            onClear={() => { setRedBoard([]); setSelected(null); }}
            itemIcon={itemIcon}
          />
        </div>

        <div className="rounded-xl border p-4 flex flex-wrap items-center gap-3" style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)' }}>
          <button
            onClick={runPrediction}
            disabled={!canPredict || busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold disabled:opacity-40"
            style={{ background: 'var(--accent1)', color: 'var(--bg-primary)' }}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
            Predict outcome (128 seeded fights)
          </button>
          {overLevel && (
            <span className="text-xs" style={{ color: '#f87171' }}>
              Reduce deployed units to match the selected levels before predicting.
            </span>
          )}
          {!overLevel && (blueDeployed === 0 || redDeployed === 0) && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Place units on both boards to get a meaningful prediction.
            </span>
          )}
          <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
            Row 3 is the front row for both sides. Items and stars are set per unit.
          </span>
        </div>

        {prediction && (
          <div className="grid gap-6 xl:grid-cols-[1fr_400px] items-start">
            <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Prediction</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg p-3" style={{ background: 'rgba(56,189,248,0.12)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#38bdf8' }}>
                    {Math.round(prediction.blueWinRate * 100)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Blue wins ({prediction.blueWins})</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(148,163,184,0.12)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {Math.round(prediction.drawRate * 100)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Draws ({prediction.draws})</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(248,113,113,0.12)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#f87171' }}>
                    {Math.round(prediction.redWinRate * 100)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Red wins ({prediction.redWins})</div>
                </div>
              </div>

              <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-primary)' }}>
                <div style={{ width: `${prediction.blueWinRate * 100}%`, background: '#38bdf8' }} />
                <div style={{ width: `${prediction.drawRate * 100}%`, background: '#64748b' }} />
                <div style={{ width: `${prediction.redWinRate * 100}%`, background: '#f87171' }} />
              </div>

              <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <p>Average fight length: {(prediction.averageDurationMs / 1000).toFixed(1)}s</p>
                {coverage && (
                  <p>
                    Mechanics coverage: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(coverage.score * 100)}%</strong>
                    {unmodeledAbilityCount > 0 && ` · ${unmodeledAbilityCount} abilities without numeric data`}
                    {unmodeledItemCount > 0 && ` · ${unmodeledItemCount} unmodeled item effects`}
                  </p>
                )}
                {coverage && coverage.unmodeledAugments.length > 0 && (
                  <p>Unmodeled augments: {coverage.unmodeledAugments.length}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Fight playback</h3>
                {sample && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: 'var(--bg-primary)',
                      color: sample.winner === 'blue' ? '#38bdf8' : sample.winner === 'red' ? '#f87171' : '#fbbf24',
                    }}
                  >
                    {sample.winner === 'draw'
                      ? `Draw (${sample.reason})`
                      : `${sample.winner === 'blue' ? 'Blue' : 'Red'} wins`}
                  </span>
                )}
              </div>

              {sample && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      aria-label={playing ? 'Pause replay' : 'Play replay'}
                      onClick={() => {
                        if (!playing && clockMs >= sample.durationMs) setClockMs(0);
                        setPlaying(!playing);
                      }}
                      className="p-1.5 rounded"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      aria-label="Restart replay"
                      onClick={() => { setClockMs(0); setPlaying(true); }}
                      className="p-1.5 rounded"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <select
                      aria-label="Playback speed"
                      value={speed}
                      onChange={(event) => setSpeed(Number(event.target.value))}
                      className="px-2 py-1 rounded border text-xs"
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {[0.5, 1, 2, 4, 8, 16].map(value => <option key={value} value={value}>{value}×</option>)}
                    </select>
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
                      {(clockMs / 1000).toFixed(1)}s / {(sample.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>Blue HP {Math.round(sample.blue.units.reduce((sum, unit) => sum + unit.hp, 0))}</span>
                    <span>Red HP {Math.round(sample.red.units.reduce((sum, unit) => sum + unit.hp, 0))}</span>
                  </div>

                  <input
                    type="range"
                    aria-label="Fight timeline scrubber"
                    min={0}
                    max={sample.durationMs}
                    step={100}
                    value={clockMs}
                    onChange={(event) => {
                      setPlaying(false);
                      setClockMs(Number(event.target.value));
                    }}
                    className="w-full mb-2"
                    style={{ accentColor: 'var(--accent1)' }}
                  />

                  <div className="max-h-72 overflow-y-auto rounded border p-2 text-xs space-y-1" style={{ borderColor: 'var(--bg-primary)' }}>
                    {visibleEvents.map((event, index) => (
                      <div key={`${event.atMs}-${index}`} className="flex gap-2" style={{ color: eventColor(event) }}>
                        <span className="w-10 shrink-0 opacity-70">{(event.atMs / 1000).toFixed(1)}s</span>
                        <span>{describeEvent(event, names)}</span>
                      </div>
                    ))}
                    {visibleEvents.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)' }}>Press play to watch the fight.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedUnit && selected && (
          <UnitConfigPopover
            unit={selectedUnit}
            availableItems={combatItems}
            onChange={updateSelectedUnit}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default SandboxPage;
