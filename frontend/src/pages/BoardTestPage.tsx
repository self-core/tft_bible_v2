import React from 'react';
import Board from '../components/Board';

const BoardTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">TFT Board Component</h1>
      <p className="text-center text-gray-300 mb-8">
        Drag and drop champions onto the board to test the functionality
      </p>
      <Board />
    </div>
  );
};

export default BoardTestPage;