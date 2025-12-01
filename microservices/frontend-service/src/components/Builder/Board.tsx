import React from 'react';
import { Champion } from '../../types';

interface BoardSlot {
  champion: Champion | null;
  position: { row: number; col: number };
}

interface BoardProps {
  board: BoardSlot[][];
  champions: Champion[]; // Available champions for selection
  onSlotClick?: (row: number, col: number) => void;
  onSlotDrop?: (row: number, col: number, champion: Champion) => void;
  selectedChampion?: Champion | null;
  editMode: boolean; // If true, allows editing; if false, read-only display
  onChampionClick?: (champion: Champion) => void;
  onChampionSelect?: (champion: Champion) => void;
  onDragStart?: (champion: Champion) => void;
  rotation?: number;
}

const BOARD_ROWS = 4;
const BOARD_COLS = 7;

const Board: React.FC<BoardProps> = ({
  board,
  champions,
  onSlotClick,
  onSlotDrop,
  selectedChampion,
  editMode,
  onChampionClick,
  onChampionSelect,
  onDragStart,
  rotation = 0
}) => {
  const renderBoard = () => {
    if (!board) return null;
    return board.map((row, rowIndex) => (
      <div key={rowIndex} className="flex gap-1" data-testid="board-row">
        {row.map((slot, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-16 h-16 rounded flex items-center justify-center cursor-pointer transition-all border-2 ${
              slot?.champion
                ? editMode
                  ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400 shadow-inner'
                  : 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-500 shadow-inner'
                : editMode
                  ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
                  : 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400'
            }`}
            onClick={() => editMode && onSlotClick && onSlotClick(rowIndex, colIndex)}
            onDragOver={(e) => {
              if (editMode) {
                e.preventDefault();
              }
            }}
            onDrop={(e) => {
              if (editMode && onSlotDrop) {
                e.preventDefault();
                // We'd need to get the dropped champion from transfer data
                // This would require more complex drag/drop implementation
              }
            }}
          >
            {slot?.champion && slot.champion.image && (
              <img
                src={slot.champion.image}
                alt={slot.champion.name}
                className="w-12 h-12 rounded border border-gray-300"
                style={{ transform: `rotate(${rotation}deg)` }}
                onClick={() => onChampionClick && onChampionClick(slot.champion!)}
              />
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4">
      <div className="flex flex-col gap-1 mb-4">
        {renderBoard()}
      </div>
    </div>
  );
};

export default Board;