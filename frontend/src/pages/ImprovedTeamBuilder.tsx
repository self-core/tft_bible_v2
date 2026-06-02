import { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import TFTBoard, { BoardChampion } from '../components/TFTBoard';
import { useChampionsStore } from '../stores/championsStore';

const ImprovedTeamBuilder = () => {
  const [boardChampions, setBoardChampions] = useState<BoardChampion[]>([]);
  const championsList = useChampionsStore(s => s.champions);
  const loading = useChampionsStore(s => s.loading);
  const fetchChampions = useChampionsStore(s => s.fetchChampions);

  useEffect(() => { fetchChampions() }, [fetchChampions]);

  const getTierColor = (tier: number) => {
    const colors: Record<number, string> = {
      1: '#6b7280',
      2: '#10b981',
      3: '#3b82f6',
      4: '#a855f7',
      5: '#eab308'
    };
    return colors[tier] || '#6b7280';
  };

  const handleChampionDragStart = (champion: any, e: React.DragEvent) => {
    e.dataTransfer.setData('text/champion-id', champion.id);
    e.dataTransfer.setData('text/champion-name', champion.name);
    e.dataTransfer.setData('text/champion-cost', String(champion.cost || 1));
    e.dataTransfer.setData('text/champion-icon', champion.iconUrl || champion.imageUrl || '');
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent1)' }} />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading champions...</span>
      </div>
    );
  }

  const sortedChampions = [...championsList].sort((a: any, b: any) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem' }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Team Builder</h1>
        <p className="text-gray-600 mt-1" style={{ color: 'var(--text-secondary)' }}>Create and customize your TFT compositions</p>
      </div>

      {/* Champion pool */}
      <div className="p-4 rounded-lg border"
        style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)', color: 'var(--text-primary)' }}>
        <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Champions (Drag to Board) - {sortedChampions.length} available
        </h3>
        {sortedChampions.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            No champions loaded. Check console for errors.
          </div>
        ) : (
          <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
            {sortedChampions.map((champion: any) => (
              <div key={champion.id} draggable
                onDragStart={(e) => handleChampionDragStart(champion, e)}
                className="relative group cursor-grab active:cursor-grabbing"
                title={`${champion.name} (${champion.cost}⭐)`}>
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110"
                  style={{ borderColor: getTierColor(champion.cost) }}>
                  {champion.iconUrl || champion.imageUrl ? (
                    <img src={champion.iconUrl || champion.imageUrl} alt={champion.name}
                      className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: getTierColor(champion.cost) }}>
                      {champion.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-lg transition-all flex items-center justify-center">
                  <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100">
                    {champion.cost}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
          Drag champions to the board • Click stars to upgrade • Drag units to reposition
        </p>
      </div>

      {/* TFT Board in edit mode */}
      <TFTBoard champions={boardChampions} editMode onBoardChange={setBoardChampions} title="TFT Board" />

      {/* Clear all button */}
      {boardChampions.length > 0 && (
        <button onClick={() => setBoardChampions([])}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors self-start"
          style={{ backgroundColor: 'var(--accent2)', color: 'var(--bg-primary)' }}>
          <Trash2 size={16} />
          Clear Board
        </button>
      )}
    </div>
  );
};

export default ImprovedTeamBuilder;