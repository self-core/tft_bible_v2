import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { X, Save, RotateCw, Trash2, Download } from 'lucide-react';
import { Champion, Trait, Set } from '../../types';
import { api } from '../../lib/api';
import { CREATE_COMPOSITION, UPDATE_COMPOSITION } from '../../lib/graphql';

// Types for our TFT builder
interface BoardSlot {
  champion: Champion | null;
  position: { row: number; col: number };
}


// Board dimensions
const BOARD_ROWS = 4;
const BOARD_COLS = 7;

const Builder: React.FC = () => {
  // Current board state
  const [board, setBoard] = useState<BoardSlot[][]>(() =>
    Array(BOARD_ROWS).fill(null).map(() =>
      Array(BOARD_COLS).fill(null).map((_, colIndex) => ({
        champion: null,
        position: { row: 0, col: colIndex }
      }))
    )
  );

  // Bench state
  const [bench, setBench] = useState<(Champion | null)[]>(Array(9).fill(null));

  // Selected champion in the picker
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  // Rotation state
  const [rotation, setRotation] = useState(0);

  // Selected set for filtering
  const [selectedSet, setSelectedSet] = useState<Set | null>(null);

  // Fetch sets data
  const { data: sets, isLoading: setsLoading } = useQuery<Set[]>({
    queryKey: ['sets'],
    queryFn: () => api.get('/api/v1/sets'),
  });

  // Fetch champions data with set filter
  const { data: champions, isLoading: championsLoading } = useQuery<Champion[]>({
    queryKey: ['champions', selectedSet?.id],
    queryFn: () => {
      const params = selectedSet ? { set: selectedSet.name } : {};
      return api.get('/api/v1/champions', { params });
    },
  });

  // Fetch traits data with set filter
  const { data: traits, isLoading: traitsLoading } = useQuery<Trait[]>({
    queryKey: ['traits', selectedSet?.id],
    queryFn: () => {
      const params = selectedSet ? { set: selectedSet.name } : {};
      return api.get('/api/v1/traits', { params });
    },
  });

  // Load active set on component mount
  useEffect(() => {
    const fetchActiveSet = async () => {
      try {
        const activeSetResponse = await api.get('/api/v1/sets/active');
        if (activeSetResponse.data && activeSetResponse.data.length > 0) {
          setSelectedSet(activeSetResponse.data[0]);
        }
      } catch (error) {
        console.error('Error fetching active set:', error);
      }
    };

    fetchActiveSet();
  }, []);

  // Handle board slot click
  const handleBoardSlotClick = (row: number, col: number) => {
    if (selectedChampion) {
      // Place champion on board
      const newBoard = [...board];
      newBoard[row][col] = { champion: selectedChampion, position: { row, col } };
      setBoard(newBoard);
      setSelectedChampion(null);
    } else {
      // Remove champion from board
      const newBoard = [...board];
      newBoard[row][col] = { champion: null, position: { row, col } };
      setBoard(newBoard);
    }
  };

  // Handle bench slot click
  const handleBenchSlotClick = (index: number) => {
    if (selectedChampion) {
      // Place champion on bench
      const newBench = [...bench];
      newBench[index] = selectedChampion;
      setBench(newBench);
      setSelectedChampion(null);
    } else {
      // Remove champion from bench
      const newBench = [...bench];
      newBench[index] = null;
      setBench(newBench);
    }
  };

  // Reset the board
  const resetBoard = () => {
    setBoard(Array(BOARD_ROWS).fill(null).map(() =>
      Array(BOARD_COLS).fill(null).map((_, colIndex) => ({
        champion: null,
        position: { row: 0, col: colIndex }
      }))
    ));
    setBench(Array(9).fill(null));
  };

  // Calculate active traits based on board champions
  const calculateTraits = useCallback(() => {
    const championTraits = new Map<string, number>();

    // Count traits from board
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const slot = board[row][col];
        if (slot.champion) {
          slot.champion.traits?.forEach(traitName => {
            championTraits.set(traitName, (championTraits.get(traitName) || 0) + 1);
          });
        }
      }
    }

    // Count traits from bench
    bench.forEach(champion => {
      if (champion) {
        champion.traits?.forEach(traitName => {
          championTraits.set(traitName, (championTraits.get(traitName) || 0) + 1);
        });
      }
    });

    // Calculate active traits based on thresholds
    if (!traits) return [];

    return traits.map(trait => {
      const count = championTraits.get(trait.name) || 0;
      const activeThreshold = trait.tiers?.find(tier => count >= tier.minUnits && count <= (tier.maxUnits || Infinity));
      return {
        trait,
        count,
        active: !!activeThreshold
      };
    });
  }, [board, bench, traits]);

  const activeTraits = calculateTraits();

  // GraphQL mutation for saving composition
  const [createComposition, { loading: saveLoading }] = useMutation(CREATE_COMPOSITION);

  // Function to save the current composition
  const saveCurrentComposition = async () => {
    try {
      // Prepare the composition data from the current board state
      const compositionChampions = [];

      // Process board champions
      for (let row = 0; row < BOARD_ROWS; row++) {
        for (let col = 0; col < BOARD_COLS; col++) {
          const slot = board[row][col];
          if (slot.champion) {
            compositionChampions.push({
              champion_id: slot.champion.id,
              star_level: 1, // Default star level
              items: [], // Default to no items
              position: { x: col, y: row },
              is_core: false, // Default to non-core
            });
          }
        }
      }

      // Process bench champions
      bench.forEach((champion, index) => {
        if (champion) {
          // Add bench champions at positions beyond the board
          compositionChampions.push({
            champion_id: champion.id,
            star_level: 1, // Default star level
            items: [], // Default to no items
            position: { x: index, y: 4 }, // Use y=4 for bench
            is_core: false, // Default to non-core
          });
        }
      });

      // Prepare the input for the GraphQL mutation
      const input = {
        name: `Composition ${new Date().toLocaleDateString()}`,
        description: `Saved composition on ${new Date().toLocaleString()}`,
        category: "Custom",
        tags: ["saved", "user-generated"],
        champions: compositionChampions,
        augments: [],
        positioning: null,
        gameplan: null,
        meta: {
          tier: "C",
          difficulty: 1,
          cost: "Flexible",
          patch: "16.0",
          playstyle: "Balanced",
          winrate: 0.5,
          avg_placement: 4.0,
          playrate: 0.1,
          contest_rate: 0.1
        },
        matchups: null
      };

      // Execute the mutation
      const result = await createComposition({
        variables: {
          input: input
        }
      });

      console.log('Composition saved successfully:', result.data.createComposition);
      alert('Composition saved successfully!');
    } catch (error) {
      console.error('Error saving composition:', error);
      alert('Error saving composition. Please try again.');
    }
  };

  // Handle set selection
  const handleSetChange = (set: Set) => {
    setSelectedSet(set);
  };

  // Render the board slots
  const renderBoard = () => {
    return board.map((row, rowIndex) => (
      <div key={rowIndex} className="flex gap-1" data-testid="board-row">
        {row.map((slot, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-16 h-16 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${
              slot.champion
                ? 'bg-blue-100 border-blue-300'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }`}
            onClick={() => handleBoardSlotClick(rowIndex, colIndex)}
          >
            {slot.champion && (
              <img
                src={slot.champion.image}
                alt={slot.champion.name}
                className="w-12 h-12 rounded border border-gray-300"
                style={{ transform: `rotate(${rotation}deg)` }}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>
    ));
  };

  // Render the bench
  const renderBench = () => {
    return bench.map((champion, index) => (
      <div
        key={index}
        className={`w-16 h-16 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${
          champion
            ? 'bg-green-100 border-green-300'
            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
        }`}
        onClick={() => handleBenchSlotClick(index)}
      >
        {champion && (
          <img
            src={champion.image}
            alt={champion.name}
            className="w-12 h-12 rounded border border-gray-300"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>
    ));
  };

  // Render champion picker
  const renderChampionPicker = () => {
    if (!champions) return null;

    return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-4 py-2">
          <h3 className="font-semibold text-gray-700">Champions</h3>
          {selectedSet && (
            <div className="mt-1 text-xs text-gray-500">
              Set: {selectedSet.name}
            </div>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          <div className="grid grid-cols-6 gap-2">
            {champions.map(champion => (
              <div
                key={champion.id}
                className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col items-center ${
                  selectedChampion?.id === champion.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedChampion(selectedChampion?.id === champion.id ? null : champion)}
              >
                <img
                  src={champion.image}
                  alt={champion.name}
                  className="w-12 h-12 rounded border border-gray-300 mb-1"
                />
                <div className="text-xs font-medium text-center truncate w-full">
                  {champion.name}
                </div>
                <div className={`text-xs px-1.5 py-0.5 rounded-full mt-1 ${
                  champion.cost === 1 ? 'bg-blue-100 text-blue-800' :
                  champion.cost === 2 ? 'bg-green-100 text-green-800' :
                  champion.cost === 3 ? 'bg-purple-100 text-purple-800' :
                  champion.cost === 4 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {champion.cost || '?'}*
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render traits panel
  const renderTraitsPanel = () => {
    if (!activeTraits.length) return null;

    return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-4 py-2">
          <h3 className="font-semibold text-gray-700">Active Traits</h3>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-2 gap-2">
            {activeTraits
              .filter(trait => trait.count > 0)
              .map(({ trait, count, active }, index) => (
                <div
                  key={`${trait.name}-${index}`}
                  className={`p-2 rounded border text-center ${
                    active ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{trait.name}</div>
                  <div className={`text-xs ${
                    active ? 'text-green-700 font-medium' : 'text-gray-600'
                  }`}>
                    {count} {active ? '✓' : '✗'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  // Render set selector
  const renderSetSelector = () => {
    if (!sets) return null;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Set</label>
        <div className="relative">
          <select
            value={selectedSet?.id || ''}
            onChange={(e) => {
              const set = sets.find(s => s.id === e.target.value);
              if (set) handleSetChange(set);
            }}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select a set...</option>
            {sets.map(set => (
              <option key={set.id} value={set.id}>
                {set.name} ({set.version})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  if (setsLoading || championsLoading || traitsLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TFT Team Builder</h1>
        <p className="text-gray-600">Build and share your optimal TFT compositions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel - Set selector, Champion picker and traits */}
        <div className="lg:col-span-3 space-y-4">
          {renderSetSelector()}
          {renderChampionPicker()}
          {renderTraitsPanel()}
        </div>

        {/* Center panel - Board and bench */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-6">
          <div className="w-full bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Game Board</h2>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  onClick={saveCurrentComposition}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4" /> Save
                    </>
                  )}
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  onClick={resetBoard}
                >
                  <Trash2 className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex flex-col gap-1 mb-4">
                  {renderBoard()}
                </div>

                <div className="flex justify-center gap-1 mt-4">
                  {renderBench()}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Drag champions from the left to place them on the board
              </div>
            </div>
          </div>

          {/* Selected champion info */}
          {selectedChampion && (
            <div className="w-full bg-white rounded-xl shadow-md p-4 border border-blue-200">
              <div className="flex items-start gap-4">
                <img
                  src={selectedChampion.image}
                  alt={selectedChampion.name}
                  className="w-20 h-20 rounded-lg border border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-lg text-gray-900">{selectedChampion.name}</h3>
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => setSelectedChampion(null)}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedChampion.cost === 1 ? 'bg-blue-100 text-blue-800' :
                      selectedChampion.cost === 2 ? 'bg-green-100 text-green-800' :
                      selectedChampion.cost === 3 ? 'bg-purple-100 text-purple-800' :
                      selectedChampion.cost === 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedChampion.cost || '?'} Star
                    </div>
                    <div className="text-sm text-gray-600">
                      Traits: {selectedChampion.traits?.join(', ') || 'None'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    {selectedChampion.description || 'No description available for this champion.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Stats, instructions, and tools */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Composition Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Champions on board:</span>
                <span className="font-medium">{board.flat().filter(slot => slot.champion).length}/36</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Champions on bench:</span>
                <span className="font-medium">{bench.filter(c => c).length}/9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active traits:</span>
                <span className="font-medium">{activeTraits.filter(t => t.active).length}/{activeTraits.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total cost:</span>
                <span className="font-medium">
                  {board.flat()
                    .filter(slot => slot.champion)
                    .reduce((sum, slot) => sum + (slot.champion?.cost || 0), 0) +
                   bench
                    .filter(c => c)
                    .reduce((sum, champion) => sum + (champion?.cost || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Instructions</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span>Select a champion from the left panel</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span>Click on a board slot to place</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span>Click on a champion to remove</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span>Active traits will appear on the left</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                <span>Switch sets to see different champions</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex flex-col items-center justify-center gap-1 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setRotation(rotation + 90)}
              >
                <RotateCw className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-600">Rotate</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-1 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={resetBoard}
              >
                <X className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-600">Clear</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-1 p-3 border rounded-lg hover:bg-gray-50 transition-colors col-span-2"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-600">Export Composition</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;