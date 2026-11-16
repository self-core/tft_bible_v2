import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ACTIVE_SET } from '../lib/graphql';
import { Champion } from '../lib/api';
import SynergyPanel from '../components/SynergyPanel';
import { SynergyFilters } from '../hooks/useSynergy';
import { proxyUrl } from '../lib/imageProxy';

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--bg-accent)',
};

const tierBadge = (cost?: number) => {
  switch (cost) {
    case 1: return 'bg-blue-100 text-blue-800';
    case 2: return 'bg-green-100 text-green-800';
    case 3: return 'bg-purple-100 text-purple-800';
    case 4: return 'bg-yellow-100 text-yellow-800';
    case 5: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-200 text-gray-700';
  }
};

const ChampionImage = ({
  champion,
  className,
}: {
  champion: Pick<Champion, 'name' | 'imageUrl' | 'iconUrl'>;
  className: string;
}) => {
  const src = proxyUrl(champion.iconUrl || champion.imageUrl);
  if (!src) {
    return (
      <div
        className={`${className} flex items-center justify-center font-bold`}
        style={{ background: 'var(--bg-accent)', color: 'var(--text-secondary)' }}
        aria-label={champion.name}
      >
        {champion.name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={champion.name}
      className={className}
      style={{ borderColor: 'var(--bg-primary)' }}
    />
  );
};

const TraitTrackerPage: React.FC = () => {
  const { data: activeSetData } = useQuery(GET_ACTIVE_SET);
  const champions = (activeSetData?.activeSet?.champions || []) as Champion[];
  const traits = (activeSetData?.activeSet?.traits || []) as any[];
  const setName = activeSetData?.activeSet?.setName || '';

  const [filters, setFilters] = useState<SynergyFilters>({
    boardSize: 8,
    enabledCosts: [1, 2, 3, 4, 5],
    emblems: {},
  });

  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  const BOARD_ROWS = 4;
  const BOARD_COLS = 7;
  const BENCH_SIZE = 9;

  const [board, setBoard] = useState<(Champion | null)[][]>(
    Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null))
  );

  const [bench, setBench] = useState<(Champion | null)[]>(Array(BENCH_SIZE).fill(null));

  const handleBoardSlotClick = (row: number, col: number) => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = selectedChampion;
    setBoard(newBoard);
    setSelectedChampion(null);
  };

  const handleBenchSlotClick = (index: number) => {
    const newBench = [...bench];
    newBench[index] = selectedChampion;
    setBench(newBench);
    setSelectedChampion(null);
  };

  const handleChampionSelect = (champion: Champion) => {
    if (selectedChampion?.id === champion.id) {
      setSelectedChampion(null);
    } else {
      setSelectedChampion(champion);
    }
  };

  const championsOnBoardFlat = board.flat().filter(champ => champ !== null) as Champion[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          TFT Trait Tracker
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Visualize and track active traits in your compositions
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Champion picker */}
        <div className="xl:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-xl" style={cardStyle}>
            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--bg-accent)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Champions</h3>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-3 gap-2">
                {champions.map((champion: Champion) => {
                  const selected = selectedChampion?.id === champion.id;
                  return (
                    <div
                      key={champion.id}
                      className="p-2 rounded-lg border cursor-pointer transition-all flex flex-col items-center"
                      style={{
                        borderColor: selected ? 'var(--accent1)' : 'var(--bg-accent)',
                        background: selected ? 'var(--bg-accent)' : 'transparent',
                        boxShadow: selected ? '0 0 0 2px var(--accent-glow)' : undefined,
                      }}
                      onClick={() => handleChampionSelect(champion)}
                    >
                      <ChampionImage champion={champion} className="" />
                      <div className="text-xs font-medium text-center truncate w-full" style={{ color: 'var(--text-primary)' }}>
                        {champion.name}
                      </div>
                      <div className={`text-xs px-1.5 py-0.5 rounded-full mt-1 ${tierBadge(champion.cost)}`}>
                        {champion.cost || '?'}★
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Board and bench */}
        <div className="xl:col-span-6 flex flex-col items-center space-y-6">
          <div className="w-full rounded-xl p-4 sm:p-6" style={cardStyle}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Game Board</h2>
            </div>

            <div className="overflow-x-auto">
              <div className="flex flex-col items-center w-max min-w-full">
                <div className="flex flex-col gap-1 mb-4">
                  {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 justify-center">
                      {row.map((champion, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-2 rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
                          style={champion ? {
                            background: 'color-mix(in srgb, var(--accent2) 16%, var(--bg-accent))',
                            borderColor: 'var(--accent2)',
                          } : {
                            background: 'var(--bg-accent)',
                            borderColor: 'var(--bg-accent)',
                          }}
                          onClick={() => handleBoardSlotClick(rowIndex, colIndex)}
                        >
                          {champion && (
                            <ChampionImage champion={champion} className="" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-1 mt-4 max-w-md">
                  {bench.map((champion, index) => (
                    <div
                      key={index}
                      className="w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 border-2 rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
                      style={champion ? {
                        background: 'color-mix(in srgb, var(--accent1) 16%, var(--bg-accent))',
                        borderColor: 'var(--accent1)',
                      } : {
                        background: 'var(--bg-accent)',
                        borderColor: 'var(--bg-accent)',
                      }}
                      onClick={() => handleBenchSlotClick(index)}
                    >
                      {champion && (
                        <ChampionImage champion={champion} className="" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs sm:text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
              Tap a champion to select, then tap a board or bench slot to place it. Tap a filled slot to clear it.
            </div>
          </div>

          {selectedChampion && (
            <div className="w-full rounded-xl p-4" style={{ ...cardStyle, borderColor: 'var(--accent2)' }}>
              <div className="flex items-start gap-4">
                <ChampionImage champion={selectedChampion} className="" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{selectedChampion.name}</h3>
                    <button
                      className="transition-opacity hover:opacity-70 shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => setSelectedChampion(null)}
                      aria-label="Clear selection"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${tierBadge(selectedChampion.cost)}`}>
                      {selectedChampion.cost || '?'} Star
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Traits: {selectedChampion.traits?.join(', ') || 'None'}
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {selectedChampion.ability?.name || 'No ability information available for this champion.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Synergy */}
        <div className="xl:col-span-3">
          <SynergyPanel
            setLabel={setName ? `Set ${activeSetData?.activeSet?.setId} · ${setName}` : 'Loading...'}
            champions={champions}
            traits={traits}
            board={championsOnBoardFlat}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
    </div>
  );
};

export default TraitTrackerPage;
