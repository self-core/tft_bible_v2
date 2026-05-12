import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Champion, Trait, Set } from '../../types';
import { api } from '../../lib/api';
import { useCompositionsStore } from '../../stores';
import Board from './Board';

interface CompositionBoardProps {
  compositionId?: string; // Optional: if provided, load this composition
  initialBoardState?: any; // Optional: initial board state to load
  editMode: boolean; // Whether the board should be editable
}

const BOARD_ROWS = 4;
const BOARD_COLS = 7;

// Types for our TFT builder
interface BoardSlot {
  champion: Champion | null;
  position: { row: number; col: number };
}

const CompositionBoard: React.FC<CompositionBoardProps> = ({ 
  compositionId, 
  initialBoardState,
  editMode 
}) => {
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

  // Fetch traits data with set filter
  const { data: traits, isLoading: traitsLoading } = useQuery<Trait[]>({
    queryKey: ['traits', selectedSet?.id],
    queryFn: () => {
      const params = selectedSet ? { set: selectedSet.name } : {};
      return api.get('/api/v1/traits', { params });
    },
  });

  // Fetch champions data with set filter
  const { data: champions, isLoading: championsLoading } = useQuery<Champion[]>({
    queryKey: ['champions', selectedSet?.id],
    queryFn: () => {
      const params = selectedSet ? { set: selectedSet.name } : {};
      return api.get('/api/v1/champions', { params });
    },
  });

  // Load active set on component mount
  useEffect(() => {
    const fetchActiveSet = async () => {
      try {
        const activeSetResponse = await api.get('/api/v1/sets/active');
        if (activeSetResponse.data && activeSetResponse.data.length > 0) {
          setSelectedSet(activeSetResponse.data[0]);
        } else {
          // Fallback: fetch first available set if no active set
          const setsResponse = await api.get('/api/v1/sets');
          if (setsResponse.data && setsResponse.data.length > 0) {
            setSelectedSet(setsResponse.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching active set:', error);
      }
    };

    fetchActiveSet();
  }, []);

  // Load composition if compositionId is provided
  useEffect(() => {
    if (compositionId) {
      const loadComposition = async () => {
        try {
          // Using the Zustand store instead of direct API call
          await useCompositionsStore.getState().fetchCompositionById(compositionId);
        } catch (error) {
          console.error('Error loading composition:', error);
        }
      };

      loadComposition();
    } else if (initialBoardState) {
      setBoard(initialBoardState);
    }
  }, [compositionId, initialBoardState]);

  // Subscribe to the store for composition data changes
  useEffect(() => {
    const unsubscribe = useCompositionsStore.subscribe((state) => {
      if (state.currentComposition && compositionId) {
        const composition = state.currentComposition;

        if (composition && composition.champions) {
          // Initialize empty board
          const newBoard = Array(BOARD_ROWS).fill(null).map(() =>
            Array(BOARD_COLS).fill(null).map((_, colIndex) => ({
              champion: null,
              position: { row: 0, col: colIndex }
            }))
          );

          // Find champions by name and place them on the board
          composition.champions.forEach((compChampion: any) => {
            if (champions) {
              const foundChampion = champions.find(champ =>
                champ.name.toLowerCase() === compChampion.champion.name.toLowerCase()
              );

              if (foundChampion && compChampion.position) {
                const { x, y } = compChampion.position;
                if (y >= 0 && y < BOARD_ROWS && x >= 0 && x < BOARD_COLS) {
                  newBoard[y][x] = {
                    champion: foundChampion,
                    position: { row: y, col: x }
                  };
                }
              }
            }
          });

          setBoard(newBoard);
        }
      }
    });

    return () => unsubscribe();
  }, [compositionId, champions]);

  // Handle board slot click
  const handleBoardSlotClick = (row: number, col: number) => {
    if (!editMode) return; // Only allow interactions in edit mode
    
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

  if (setsLoading || championsLoading || traitsLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="w-full bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Game Board</h2>
        </div>

        <div className="flex flex-col items-center">
          <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
            <Board
              board={board}
              champions={champions || []}
              onSlotClick={handleBoardSlotClick}
              editMode={editMode}
              selectedChampion={selectedChampion}
              rotation={rotation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompositionBoard;