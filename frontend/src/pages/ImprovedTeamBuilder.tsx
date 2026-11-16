import { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import TFTBoard, { BoardChampion } from '../components/TFTBoard';
import UnitConfigPopover from '../components/UnitConfigPopover';
import BuilderTraitPanel from '../components/BuilderTraitPanel';
import { DndProvider } from '../components/dnd/DndProvider';
import { useDragSource } from '../components/dnd/hooks';
import { useChampionsStore } from '../stores/championsStore';
import { useTraitsStore } from '../stores/traitsStore';
import { useItemsStore } from '../stores/itemsStore';
import { proxyUrl } from '../lib/imageProxy';
import type { Champion } from '../lib/api';

const getTierColor = (tier: number) => {
  const colors: Record<number, string> = {
    1: '#6b7280',
    2: '#10b981',
    3: '#3b82f6',
    4: '#a855f7',
    5: '#eab308',
  };
  return colors[tier] || '#6b7280';
};

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
      style={{
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab',
        ...dragHandleProps.style,
      }}
      className="relative group select-none"
      title={`${champion.name} (${champion.cost}★)`}
    >
      <div
        className="relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform group-hover:scale-110"
        style={{ borderColor: getTierColor(champion.cost), backgroundColor: getTierColor(champion.cost) }}
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
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
        <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">
          {champion.cost}
        </span>
      </div>
    </div>
  );
}

const ImprovedTeamBuilder = () => {
  const [boardChampions, setBoardChampions] = useState<BoardChampion[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const championsList = useChampionsStore(s => s.champions);
  const championsLoading = useChampionsStore(s => s.loading);
  const fetchChampions = useChampionsStore(s => s.fetchChampions);

  const traits = useTraitsStore(s => s.traits);
  const fetchTraits = useTraitsStore(s => s.fetchTraits);

  const items = useItemsStore(s => s.items);
  const fetchItems = useItemsStore(s => s.fetchItems);

  useEffect(() => { fetchChampions() }, [fetchChampions]);
  useEffect(() => { fetchTraits() }, [fetchTraits]);
  useEffect(() => { fetchItems() }, [fetchItems]);

  const selectedUnit = selectedUnitId
    ? boardChampions.find(u => u.id === selectedUnitId) ?? null
    : null;

  const updateUnit = (updated: BoardChampion) => {
    setBoardChampions(prev => prev.map(unit => unit.id === updated.id ? updated : unit));
  };

  if (championsLoading) {
    return (
      <div className="flex justify-center items-center h-64" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent1)' }} />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading champions...</span>
      </div>
    );
  }

  const sortedChampions = [...championsList].sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  return (
    <DndProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Team Builder</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Create and customize your TFT compositions</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_300px] items-start">
          <div className="space-y-6 min-w-0">
            <div
              className="p-4 rounded-lg border"
              style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Champions (Drag to Board) - {sortedChampions.length} available
              </h3>
              {sortedChampions.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                  No champions loaded. Check console for errors.
                </div>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {sortedChampions.map(champion => (
                    <PaletteTile key={champion.id} champion={champion} />
                  ))}
                </div>
              )}
              <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                Drag champions to the board or bench • Click a unit to edit stars and items • Drag units to reposition
              </p>
            </div>

            <TFTBoard
              champions={boardChampions}
              editMode
              onBoardChange={setBoardChampions}
              onUnitClick={(unit) => setSelectedUnitId(unit.id)}
              title="TFT Board"
            />

            {boardChampions.length > 0 && (
              <button
                onClick={() => {
                  setBoardChampions([]);
                  setSelectedUnitId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent2)', color: 'var(--bg-primary)' }}
              >
                <Trash2 size={16} />
                Clear Board
              </button>
            )}
          </div>

          <BuilderTraitPanel units={boardChampions} traits={traits} />
        </div>

        {selectedUnit && (
          <UnitConfigPopover
            unit={selectedUnit}
            availableItems={items}
            onChange={updateUnit}
            onClose={() => setSelectedUnitId(null)}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default ImprovedTeamBuilder;
