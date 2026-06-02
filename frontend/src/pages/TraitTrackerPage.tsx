import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TRAITS, GET_CHAMPIONS } from '../lib/graphql';
import { Champion } from '../lib/api';
import TraitTracker from '../components/TraitTracker';

const TraitTrackerPage: React.FC = () => {
  const { data: traitsData, loading: traitsLoading } = useQuery(GET_TRAITS);
  const { data: championsData, loading: championsLoading } = useQuery(GET_CHAMPIONS);

  const [championsOnBoard, setChampionsOnBoard] = useState<Champion[]>([]);
  const [championsOnBench, setChampionsOnBench] = useState<Champion[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  // Board dimensions
  const BOARD_ROWS = 4;
  const BOARD_COLS = 7;
  const BENCH_SIZE = 9;

  // Initialize board and bench
  const [board, setBoard] = useState<(Champion | null)[][]>(
    Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null))
  );
  
  const [bench, setBench] = useState<(Champion | null)[]>(Array(BENCH_SIZE).fill(null));

  const handleBoardSlotClick = (row: number, col: number) => {
    if (selectedChampion) {
      // Place champion on board
      const newBoard = [...board];
      newBoard[row][col] = selectedChampion;
      setBoard(newBoard);
      setSelectedChampion(null);
    } else {
      // Remove champion from board
      const newBoard = [...board];
      newBoard[row][col] = null;
      setBoard(newBoard);
    }
  };

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

  const handleChampionSelect = (champion: Champion) => {
    if (selectedChampion?.id === champion.id) {
      setSelectedChampion(null);
    } else {
      setSelectedChampion(champion);
    }
  };

  // Calculate champions on board and bench for the trait tracker
  const championsOnBoardFlat = board.flat().filter(champ => champ !== null) as Champion[];
  const championsOnBenchFiltered = bench.filter(champ => champ !== null) as Champion[];

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TFT Trait Tracker</h1>
        <p className="text-gray-600">Visualize and track active traits in your compositions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel - Champion picker */}
        <div className="lg:col-span-3 space-y-4">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-gray-50 px-4 py-2">
              <h3 className="font-semibold text-gray-700">Champions</h3>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              <div className="grid grid-cols-3 gap-2">
                {championsData?.champions.map((champion: Champion) => (
                  <div
                    key={champion.id}
                    className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col items-center ${
                      selectedChampion?.id === champion.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleChampionSelect(champion)}
                  >
                    <img
                      src={champion.imageUrl}
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
        </div>

        {/* Center panel - Board and bench */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-6">
          <div className="w-full bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Game Board</h2>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex flex-col gap-1 mb-4">
                  {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((champion, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`w-16 h-16 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${
                            champion
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                          }`}
                          onClick={() => handleBoardSlotClick(rowIndex, colIndex)}
                        >
                          {champion && (
                            <img
                              src={champion.imageUrl}
                              alt={champion.name}
                              className="w-12 h-12 rounded border border-gray-300"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-1 mt-4">
                  {bench.map((champion, index) => (
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
                          src={champion.imageUrl}
                          alt={champion.name}
                          className="w-12 h-12 rounded border border-gray-300"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Click on a champion to select, then click on a board/bench slot to place
              </div>
            </div>
          </div>

          {/* Selected champion info */}
          {selectedChampion && (
            <div className="w-full bg-white rounded-xl shadow-md p-4 border border-blue-200">
              <div className="flex items-start gap-4">
                <img
                  src={selectedChampion.imageUrl}
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
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
                    {selectedChampion.ability?.name || 'No ability information available for this champion.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Trait tracker */}
        <div className="lg:col-span-3">
          <TraitTracker
            championsOnBoard={championsOnBoardFlat}
            championsOnBench={championsOnBenchFiltered}
          />
        </div>
      </div>
    </div>
  );
};

export default TraitTrackerPage;