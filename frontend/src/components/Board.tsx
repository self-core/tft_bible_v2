import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Square from './Square';

interface Champion {
  id: string;
  name: string;
  cost: number;
  image: string;
}

interface BoardSquare {
  champion: Champion | null;
}

interface DragItem {
  type: string;
  champion: Champion;
}

// Draggable Champion Component
const DraggableChampion: React.FC<{ champion: Champion }> = ({ champion }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'champion',
    item: { champion },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`w-16 h-16 flex flex-col items-center justify-center border rounded-lg cursor-move transition-all duration-150 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-105'
      } border-gray-600 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 shadow-md`}
    >
      <div className="text-2xl">{champion.image}</div>
      <div className="text-xs text-white mt-1 text-center font-medium">{champion.name}</div>
    </div>
  );
};

// Draggable Square Component
const DraggableSquare: React.FC<{ 
  row: number; 
  col: number; 
  square: BoardSquare;
  onDrop: (row: number, col: number, champion: Champion) => void;
}> = ({ row, col, square, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'champion',
    drop: (item: DragItem) => onDrop(row, col, item.champion),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <Square 
      ref={drop}
      className={`${isOver ? 'bg-blue-500/30' : square.champion ? 'bg-gray-700' : 'bg-gray-800'}`}
    >
      {square.champion && (
        <div className="w-full h-full flex items-center justify-center text-2xl">
          {square.champion.image}
        </div>
      )}
    </Square>
  );
};

// Board Component wrapped with DnD Provider
const BoardWithoutProvider: React.FC = () => {
  // Initialize the board with 28 squares (7 columns x 4 rows)
  const initialBoard: BoardSquare[][] = Array(4).fill(null).map(() => 
    Array(7).fill(null).map(() => ({ champion: null }))
  );

  const [board, setBoard] = useState<BoardSquare[][]>(initialBoard);

  const handleDrop = (row: number, col: number, champion: Champion) => {
    // Place the champion on the specified square
    const newBoard = [...board];
    newBoard[row][col] = { champion };
    setBoard(newBoard);
  };

  // Sample champions for testing
  const sampleChampions: Champion[] = [
    { id: '1', name: 'Garen', cost: 1, image: '⚔️' },
    { id: '2', name: 'Darius', cost: 1, image: '🗡️' },
    { id: '3', name: 'Kha\'Zix', cost: 2, image: '🦂' },
    { id: '4', name: 'Azir', cost: 3, image: '👑' },
  ];

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-white">TFT Board</h2>
      
      {/* Board grid */}
      <div className="grid grid-cols-7 gap-1 mb-6 bg-gray-700 p-2 rounded">
        {board.map((row, rowIndex) => 
          row.map((square, colIndex) => (
            <DraggableSquare 
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              square={square}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
      
      {/* Champion selection area */}
      <div className="flex flex-wrap gap-2 justify-center">
        {sampleChampions.map(champion => (
          <DraggableChampion key={champion.id} champion={champion} />
        ))}
      </div>
    </div>
  );
};

// Main Board component that provides the DnD context
const Board: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-white bg-gradient-to-r from-blue-400 to-purple-500 py-3 rounded-lg">
            TFT Battle Board
          </h2>
          <BoardWithoutProvider />
        </div>
      </div>
    </DndProvider>
  );
};

export default Board;