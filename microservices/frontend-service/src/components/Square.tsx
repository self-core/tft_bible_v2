import React, { forwardRef } from 'react';

interface SquareProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const Square = forwardRef<HTMLDivElement, SquareProps>(({ children, onClick, className = '' }, ref) => {
  return (
    <div 
      ref={ref}
      className={`w-16 h-16 border border-gray-700 bg-gray-800 flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

export default Square;