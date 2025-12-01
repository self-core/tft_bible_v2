import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, RotateCw, Trash2, Download, Share2, Copy, Check } from 'lucide-react';
import { Champion, Trait, Set } from '../../types';
import { ChampionSummary } from '../../lib/api';
import { api } from '../../lib/api';
import { useChampionsStore } from '../../stores';

// Types for our TFT custom builder
interface BoardSlot {
  champion: Champion | null;
  position: { row: number; col: number };
}

// Board dimensions
const BOARD_ROWS = 4;
const BOARD_COLS = 7;

const CustomBuilder: React.FC = () => {
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

  // Composition name and description
  const [compositionName, setCompositionName] = useState('');
  const [compositionDescription, setCompositionDescription] = useState('');

  // Import/export functionality
  const [importString, setImportString] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedString, setExportedString] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch traits data without set filter (get all traits)
  const { data: traits, isLoading: traitsLoading } = useQuery<Trait[]>({
    queryKey: ['traits'],
    queryFn: () => api.get('/api/v1/traits'),
  });

  // Fetch champions data without set filter (get all champions)
  const { data: champions, isLoading: championsLoading } = useQuery<Champion[]>({
    queryKey: ['champions'],
    queryFn: () => api.get('/api/v1/champions'),
  });

  // Define sets locally since we're using static data
  const sets = [{
    id: 'tft_set16',
    name: 'Set 16: Lore & Legends',
    version: '16.01',
    releaseDate: '2024-12-03'
  }];

  const setsLoading = false;

  // Initialize with a default set to avoid API dependency
  useEffect(() => {
    // Create a default set to use
    const defaultSet = {
      id: 'tft_set16',
      name: 'Set 16: Lore & Legends',
      version: '16.01',
      releaseDate: '2024-12-03',
      champions: [],
      traits: [],
      items: []
    };
    setSelectedSet(defaultSet);
  }, []);

  // Handle champion drag start from picker
  const handleChampionDragStart = (champion: Champion) => {
    // Set the champion as the drag data payload
    const transferData = JSON.stringify(champion);
    (window as any).currentDraggedChampion = champion;
  };

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
      if (newBoard[row][col].champion) {
        newBoard[row][col] = { champion: null, position: { row, col } };
        setBoard(newBoard);
      }
    }
  };

  // Handle board slot drag over
  const handleBoardSlotDragOver = (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => {
    e.preventDefault();
  };

  // Handle board slot drop
  const handleBoardSlotDrop = (e: React.DragEvent<HTMLDivElement>, row: number, col: number) => {
    e.preventDefault();
    const champion = (window as any).currentDraggedChampion;
    if (champion) {
      // Place champion on board
      const newBoard = [...board];
      newBoard[row][col] = { champion, position: { row, col } };
      setBoard(newBoard);
      // Clear the global variable after use
      (window as any).currentDraggedChampion = null;
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
      if (newBench[index]) {
        newBench[index] = null;
        setBench(newBench);
      }
    }
  };

  // Handle bench slot drag over
  const handleBenchSlotDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
  };

  // Handle bench slot drop
  const handleBenchSlotDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    const champion = (window as any).currentDraggedChampion;
    if (champion) {
      // Place champion on bench
      const newBench = [...bench];
      newBench[index] = champion;
      setBench(newBench);
      // Clear the global variable after use
      (window as any).currentDraggedChampion = null;
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
    setCompositionName('');
    setCompositionDescription('');
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

    // Calculate active traits based on breakpoints
    if (!traits) return [];

    return traits.map(trait => {
      const count = championTraits.get(trait.name) || 0;
      // Find the highest active breakpoint based on trait count
      const activeBreakpoint = [...trait.breakpoints]
        .sort((a, b) => b.count - a.count) // Sort by count descending
        .find(bp => bp.count <= count);

      return {
        trait,
        count,
        activeBreakpoint,
        active: !!activeBreakpoint
      };
    });
  }, [board, bench, traits]);

  const activeTraits = calculateTraits();

  // Handle set selection
  const handleSetChange = (set: Set) => {
    setSelectedSet(set);
  };

  // Render the board slots
  const renderBoard = () => {
    if (!board) return null;
    return board.map((row, rowIndex) => (
      <div key={rowIndex} className="flex gap-1" data-testid="board-row">
        {row.map((slot, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-16 h-16 rounded flex items-center justify-center cursor-pointer transition-all border-2 ${
              slot?.champion
                ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 shadow-inner'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
            }`}
            onClick={() => handleBoardSlotClick(rowIndex, colIndex)}
            onDragOver={(e) => handleBoardSlotDragOver(e, rowIndex, colIndex)}
            onDrop={(e) => handleBoardSlotDrop(e, rowIndex, colIndex)}
          >
            {slot?.champion && slot.champion.image && (
              <img
                src={slot.champion.image}
                alt={slot.champion.name}
                className="w-12 h-12 rounded border border-gray-300"
                style={{ transform: `rotate(${rotation}deg)` }}
                draggable
                onDragStart={() => handleChampionDragStart(slot.champion!)}
              />
            )}
          </div>
        ))}
      </div>
    ));
  };

  // Render the bench
  const renderBench = () => {
    if (!bench) return null;
    return bench.map((champion, index) => (
      <div
        key={index}
        className={`w-16 h-16 rounded flex items-center justify-center cursor-pointer transition-all border-2 ${
          champion
            ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-400 shadow-inner'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
        }`}
        onClick={() => handleBenchSlotClick(index)}
        onDragOver={(e) => handleBenchSlotDragOver(e, index)}
        onDrop={(e) => handleBenchSlotDrop(e, index)}
      >
        {champion && champion.image && (
          <img
            src={champion.image}
            alt={champion.name}
            className="w-12 h-12 rounded border border-gray-300"
            style={{ transform: `rotate(${rotation}deg)` }}
            draggable
            onDragStart={() => handleChampionDragStart(champion)}
          />
        )}
      </div>
    ));
  };

  // Render champion picker
  const renderChampionPicker = () => {
    if (!champions) return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-4 py-2">
          <h3 className="font-semibold text-gray-700">Champions</h3>
        </div>
        <div className="p-4 text-center text-gray-500">
          Loading champions...
        </div>
      </div>
    );

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
                className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center shadow-sm ${
                  selectedChampion?.id === champion.id
                    ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-blue-100 ring-2 ring-blue-200 transform scale-[1.02]'
                    : 'border-gray-200 bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100'
                }`}
                onClick={() => setSelectedChampion(selectedChampion?.id === champion.id ? null : champion)}
                draggable
                onDragStart={() => handleChampionDragStart(champion)}
              >
                {champion.image && (
                  <img
                    src={champion.image}
                    alt={champion.name}
                    className="w-12 h-12 rounded border border-gray-300 mb-1"
                  />
                )}
                <div className="text-xs font-medium text-center truncate w-full">
                  {champion.display_name || champion.name}
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
      <div className="overflow-hidden rounded-xl border bg-white shadow-md">
        <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2">
          <h3 className="font-semibold text-gray-800">Active Traits</h3>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-2 gap-2">
            {activeTraits
              .filter(trait => trait.count > 0)
              .map(({ trait, count, active, activeBreakpoint }, index) => {
                // Find the next breakpoint after the current active one (or the first if none is active)
                const sortedBreakpoints = [...trait.breakpoints].sort((a, b) => a.count - b.count);
                const nextBreakpoint = sortedBreakpoints.find(bp => bp.count > (activeBreakpoint?.count || 0));

                return (
                  <div
                    key={`${trait.name}-${index}`}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      active
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-sm'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{trait.name}</div>
                    <div className={`text-xs ${
                      active ? 'text-green-700 font-medium' : 'text-gray-600'
                    }`}>
                      {count} {active ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                      {activeBreakpoint && (
                        <div className="text-[10px] mt-1 bg-blue-50 text-blue-700 rounded px-1 inline-block">
                          {activeBreakpoint.description}
                        </div>
                      )}
                    </div>

                    {/* Progress bar for next trait level */}
                    {nextBreakpoint && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, (count / nextBreakpoint.count) * 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-[8px] text-gray-500 mt-0.5">
                          {count}/{nextBreakpoint.count} for +1
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  // Render set selector
  const renderSetSelector = () => {
    if (!sets || sets.length === 0) return null;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Set</label>
        <div className="relative">
          <select
            value={selectedSet?.id || sets[0].id}
            onChange={(e) => {
              const set = sets.find(s => s.id === e.target.value);
              if (set) setSelectedSet(set);
            }}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
            disabled // Disable since we're using static data
          >
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

  // Export composition function
  const exportComposition = async () => {
    if (!selectedSet) {
      alert('Please select a set first');
      return;
    }

    try {
      // In a real implementation, we would create the composition object
      // and send it to the backend for export

      // This would be the actual API call:
      // const response = await api.post(`/api/v1/compositions/${compositionId}/export`, {
      //   set_name: selectedSet.name
      // });
      // setExportedString(response.data.data);

      // For demo purposes, we'll create a mock export string
      const mockExportData = {
        name: compositionName || 'My Custom Composition',
        description: compositionDescription || 'Custom composition built in the builder',
        board: board.flat().filter(slot => slot.champion !== null).map(slot => ({
          champion: {
            id: slot.champion!.id,
            name: slot.champion!.name,
            cost: slot.champion!.cost,
            traits: slot.champion!.traits,
            image: slot.champion!.image
          },
          position: slot.position
        })),
        bench: bench.filter(champ => champ !== null).map(champ => ({
          id: champ!.id,
          name: champ!.name,
          cost: champ!.cost,
          traits: champ!.traits,
          image: champ!.image
        })),
        traits: activeTraits,
        set: selectedSet,
        exportDate: new Date().toISOString()
      };

      const jsonString = JSON.stringify(mockExportData);
      const encodedString = btoa(jsonString);
      setExportedString(encodedString);
      setShowExportModal(true);
    } catch (error) {
      console.error('Error exporting composition:', error);
      alert('Error exporting composition');
    }
  };

  // Copy export string to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Import composition function
  const importComposition = async () => {
    if (!importString.trim()) {
      alert('Please enter an import string');
      return;
    }

    try {
      // Send import string to backend

      // This would be the actual API call:
      // const response = await api.post('/api/v1/compositions/import', {
      //   import_string: importString
      // });
      // const importedComposition = response.data.data;

      // For demo purposes, decode the base64 string and simulate import
      const decodedString = atob(importString);
      const importedData = JSON.parse(decodedString);

      // Update the board and bench with imported data
      const newBoard = Array(BOARD_ROWS).fill(null).map(() =>
        Array(BOARD_COLS).fill(null).map((_, colIndex) => ({
          champion: null,
          position: { row: 0, col: colIndex }
        }))
      );

      importedData.board.forEach((slot: any) => {
        const { row, col } = slot.position;
        if (row < BOARD_ROWS && col < BOARD_COLS) {
          newBoard[row][col] = { champion: slot.champion, position: slot.position };
        }
      });

      setBoard(newBoard);
      setBench([...importedData.bench, ...Array(9 - importedData.bench.length).fill(null)]);
      setCompositionName(importedData.name || '');
      setCompositionDescription(importedData.description || '');
      setShowImportModal(false);
      setImportString('');
    } catch (error) {
      console.error('Error importing composition:', error);
      alert('Invalid import string or error importing composition');
    }
  };

  if (setsLoading || championsLoading || traitsLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // No longer checking for sets since we provide them statically

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TFT Custom Builder</h1>
        <p className="text-gray-600">Create and customize your own TFT compositions</p>
      </div>

      {/* Composition Info */}
      <div className="mb-6 bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="composition-name" className="block text-sm font-medium text-gray-700 mb-1">
              Composition Name
            </label>
            <input
              type="text"
              id="composition-name"
              value={compositionName}
              onChange={(e) => setCompositionName(e.target.value)}
              placeholder="Enter composition name..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="composition-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="composition-desc"
              value={compositionDescription}
              onChange={(e) => setCompositionDescription(e.target.value)}
              placeholder="Enter composition description..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
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
                  onClick={async () => {
                    // Create composition object
                    const composition = {
                      name: compositionName,
                      description: compositionDescription,
                      set_id: selectedSet?.id || '',
                      champions: board.flat()
                        .filter(slot => slot.champion !== null)
                        .map(slot => ({
                          id: slot.champion!.id,
                          name: slot.champion!.name,
                          star_level: 1, // default
                          position: slot.position,
                          items: [], // default
                          is_core: false, // default
                          priority: 'medium' // default
                        })),
                      augments: {
                        preferred: [],
                        acceptable: []
                      },
                      meta: {
                        tier: 'S',
                        difficulty: 3,
                        cost: 'Mixed',
                        patch: '14.22',
                        playstyle: 'Custom',
                        winrate: 0,
                        avg_placement: 0,
                        playrate: 0,
                        contest_rate: 0
                      }
                    };

                    try {
                      const response = await api.post('/api/v1/compositions', composition);
                      alert('Composition saved successfully!');
                      console.log('Saved composition ID:', response.data.id || response.data.data?.id);
                    } catch (error: any) {
                      console.error('Error saving composition:', error);
                      let errorMessage = 'Failed to save composition';
                      if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                      } else if (error.message) {
                        errorMessage = error.message;
                      }
                      alert(errorMessage);
                    }
                  }}
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  onClick={exportComposition}
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                  onClick={() => setShowImportModal(true)}
                >
                  <Download className="w-4 h-4" /> Import
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
            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 border border-blue-200">
              <div className="flex items-start gap-4">
                <img
                  src={selectedChampion.image}
                  alt={selectedChampion.name}
                  className="w-20 h-20 rounded-xl border-2 border-white shadow-md"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{selectedChampion.display_name || selectedChampion.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedChampion.cost === 1 ? 'bg-blue-200 text-blue-800' :
                          selectedChampion.cost === 2 ? 'bg-green-200 text-green-800' :
                          selectedChampion.cost === 3 ? 'bg-purple-200 text-purple-800' :
                          selectedChampion.cost === 4 ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {selectedChampion.cost || '?'} Star
                        </div>
                        <div className="text-sm text-gray-600">
                          Traits: {selectedChampion.traits?.join(', ') || 'None'}
                        </div>
                      </div>
                    </div>
                    <button
                      className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-sm"
                      onClick={() => setSelectedChampion(null)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mt-3">
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
                onClick={exportComposition}
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-600">Export Composition</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Composition</h3>
              <p className="text-sm text-gray-600 mb-4">
                Copy this string to share your composition with others.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Export String
                </label>
                <textarea
                  value={exportedString}
                  readOnly
                  className="w-full rounded-md border border-gray-300 bg-gray-50 py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Composition</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste the composition import string below to load a shared composition.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import String
                </label>
                <textarea
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  placeholder="Paste import string here..."
                  className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={importComposition}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportString('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomBuilder;