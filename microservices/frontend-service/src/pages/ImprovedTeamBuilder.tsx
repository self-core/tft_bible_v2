import React, { useState, useEffect } from 'react';
import { Star, Trash2, Loader2 } from 'lucide-react';
import { graphQLApi } from '../lib/graphql-api';

// Main reusable Composition component
const ImprovedTeamBuilder = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [champions, setChampions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [draggedUnit, setDraggedUnit] = useState(null);
  const [draggedChampion, setDraggedChampion] = useState(null);
  const [mode] = useState('edit'); // Always in edit mode for this page
  const [boardSize] = useState({ rows: 4, cols: 7 });
  const [version] = useState('15.24.1');

  const isEditMode = mode === 'edit';

  // Fetch champion data from GraphQL API
  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const response = await graphQLApi.getChampions();
        const data = response.data;

        // Convert GraphQL data to expected format
        const fetchedChampions = {};
        data.champions.forEach((champion: any) => {
          fetchedChampions[champion.id] = champion;
        });

        setChampions(fetchedChampions);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch champions:', error);
        setLoading(false);
      }
    };

    fetchChampions();
  }, []);

  // Get champion image URL
  const getChampionImage = (championId: string) => {
    if (!champions[championId]) return null;
    return champions[championId].imageUrl || champions[championId].iconUrl;
  };

  // Get champion tier/cost color
  const getTierColor = (tier: number) => {
    const colors = {
      1: '#6b7280',
      2: '#10b981',
      3: '#3b82f6',
      4: '#a855f7',
      5: '#eab308'
    };
    return colors[tier] || '#6b7280';
  };

  // Handle placing a unit on the board
  const handleHexClick = (row: number, col: number) => {
    if (!isEditMode) return;

    const existingUnitIndex = units.findIndex(u => u.row === row && u.col === col);

    if (existingUnitIndex >= 0) {
      // Just clicking an occupied hex does nothing
      return;
    }
  };

  // Handle removing a unit
  const handleRemoveUnit = (unitId: number, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const newUnits = units.filter(u => u.id !== unitId);
    setUnits(newUnits);
  };

  // Handle drag start from board
  const handleDragStart = (unit: any, e: React.DragEvent) => {
    if (!isEditMode) return;
    setDraggedUnit(unit);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
  };

  // Handle drag start from champion list
  const handleChampionDragStart = (champion: any, e: React.DragEvent) => {
    if (!isEditMode) return;
    setDraggedChampion(champion);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedUnit ? 'move' : 'copy';
  };

  const handleDrop = (row: number, col: number, e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();

    // Dropping from champion list
    if (draggedChampion && !draggedUnit) {
      const existingUnit = units.find(u => u.row === row && u.col === col);

      if (existingUnit) {
        // Replace existing unit
        const newUnits = units.map(u =>
          u.id === existingUnit.id
            ? {
                id: Date.now(),
                championId: draggedChampion.id,
                stars: 1,
                row,
                col
              }
            : u
        );
        setUnits(newUnits);
      } else {
        // Add new unit
        const newUnit = {
          id: Date.now(),
          championId: draggedChampion.id,
          stars: 1,
          row,
          col
        };
        const newUnits = [...units, newUnit];
        setUnits(newUnits);
      }

      setDraggedChampion(null);
      return;
    }

    // Dropping from board
    if (draggedUnit) {
      const newUnits = units.filter(u => u.id !== draggedUnit.id);
      const existingUnit = units.find(u => u.row === row && u.col === col && u.id !== draggedUnit.id);

      if (existingUnit) {
        // Swap positions
        const updatedUnits = newUnits.map(u =>
          u.id === existingUnit.id
            ? { ...u, row: draggedUnit.row, col: draggedUnit.col }
            : u
        );
        updatedUnits.push({ ...draggedUnit, row, col });
        setUnits(updatedUnits);
      } else {
        newUnits.push({ ...draggedUnit, row, col });
        setUnits(newUnits);
      }

      setDraggedUnit(null);
    }
  };

  // Handle star upgrade
  const handleStarClick = (unitId: number, e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const newUnits = units.map(u => {
      if (u.id === unitId) {
        const newStars = u.stars >= 3 ? 1 : u.stars + 1;
        return { ...u, stars: newStars };
      }
      return u;
    });
    setUnits(newUnits);
  };

  // Render hexagon grid
  const renderBoard = () => {
    const hexagons = [];
    const hexSize = 45;
    const hexWidth = hexSize * Math.sqrt(3);
    const hexHeight = hexSize * 2;
    const vertSpacing = hexHeight * 0.75;

    for (let row = 0; row < boardSize.rows; row++) {
      for (let col = 0; col < boardSize.cols; col++) {
        const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
        const y = row * vertSpacing;

        const unitOnHex = units.find(u => u.row === row && u.col === col);

        hexagons.push(
          <g
            key={`${row}-${col}`}
            transform={`translate(${x}, ${y})`}
            onClick={() => handleHexClick(row, col)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(row, col, e)}
            className={isEditMode ? 'cursor-pointer' : ''}
          >
            {/* Hexagon shape */}
            <polygon
              points={getHexagonPoints(hexSize)}
              fill={unitOnHex ? '#1e293b' : '#0f172a'}
              stroke="#334155"
              strokeWidth="2"
              className={isEditMode ? 'hover:fill-slate-700 transition-colors' : ''}
            />

            {/* Unit on hex */}
            {unitOnHex && champions[unitOnHex.championId] && (
              <g>
                {/* Champion image container */}
                <circle
                  cx="0"
                  cy="0"
                  r="32"
                  fill={getTierColor(champions[unitOnHex.championId].cost)}
                  stroke="#cbd5e1"
                  strokeWidth="2"
                />

                {/* Champion image */}
                <clipPath id={`clip-${unitOnHex.id}`}>
                  <circle cx="0" cy="0" r="30" />
                </clipPath>
                <image
                  href={getChampionImage(unitOnHex.championId)}
                  x="-30"
                  y="-30"
                  width="60"
                  height="60"
                  clipPath={`url(#clip-${unitOnHex.id})`}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(unitOnHex, e)}
                  className={isEditMode ? 'cursor-move' : ''}
                  style={{ pointerEvents: isEditMode ? 'auto' : 'none' }}
                />

                {/* Star level */}
                <g
                  transform="translate(0, 24)"
                  onClick={(e) => handleStarClick(unitOnHex.id, e)}
                  className={isEditMode ? 'cursor-pointer' : ''}
                >
                  <rect
                    x={-unitOnHex.stars * 6}
                    y="-6"
                    width={unitOnHex.stars * 12}
                    height="12"
                    fill="rgba(0, 0, 0, 0.7)"
                    rx="2"
                  />
                  {[...Array(unitOnHex.stars)].map((_, i) => (
                    <Star
                      key={i}
                      size={8}
                      fill="#fbbf24"
                      stroke="#fbbf24"
                      x={i * 12 - (unitOnHex.stars - 1) * 6 - 4}
                      y="-4"
                    />
                  ))}
                </g>

                {/* Remove button in edit mode */}
                {isEditMode && (
                  <g
                    transform="translate(24, -24)"
                    onClick={(e) => handleRemoveUnit(unitOnHex.id, e)}
                    className="cursor-pointer hover:opacity-80"
                  >
                    <circle r="8" fill="#ef4444" />
                    <line x1="-3" y1="-3" x2="3" y2="3" stroke="white" strokeWidth="2" />
                    <line x1="3" y1="-3" x2="-3" y2="3" stroke="white" strokeWidth="2" />
                  </g>
                )}
              </g>
            )}
          </g>
        );
      }
    }

    return hexagons;
  };

  const getHexagonPoints = (size: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const boardWidth = boardSize.cols * (45 * Math.sqrt(3)) + 100;
  const boardHeight = boardSize.rows * (45 * 1.5) + 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent1)' }} />
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading champions...</span>
      </div>
    );
  }

  const championsList = Object.values(champions).sort((a: any, b: any) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  return (
    <div 
      className="space-y-6"
      style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem' }}
    >
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Team Builder</h1>
        <p className="text-gray-600 mt-1" style={{ color: 'var(--text-secondary)' }}>Create and customize your TFT compositions</p>
      </div>

      {/* Champion selector in edit mode */}
      {isEditMode && (
        <div 
          className="p-4 rounded-lg border"
          style={{
            background: 'var(--bg-accent)',
            border: '1px solid var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        >
          <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Champions (Drag to Board) - {championsList.length} available
          </h3>
          {championsList.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              No champions loaded. Check console for errors.
            </div>
          ) : (
            <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
              {championsList.map((champion: any) => (
                <div
                  key={champion.id}
                  draggable
                  onDragStart={(e) => handleChampionDragStart(champion, e)}
                  className="relative group cursor-move"
                  title={`${champion.name} (${champion.cost}⭐)`}
                >
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110"
                    style={{ borderColor: getTierColor(champion.cost) }}
                  >
                    <img
                      src={getChampionImage(champion.id)}
                      alt={champion.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
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
            💡 Drag champions to the board • Click stars to upgrade • Drag units to reposition
          </p>
        </div>
      )}

      {/* Board */}
      <div 
        className="p-6 rounded-lg border overflow-auto"
        style={{
          background: 'var(--bg-accent)',
          border: '1px solid var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>TFT Board</h2>
        <svg
          width={boardWidth}
          height={boardHeight}
          className="mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          <g transform="translate(50, 50)">
            {renderBoard()}
          </g>
        </svg>
      </div>

      {/* Clear all button in edit mode */}
      {isEditMode && units.length > 0 && (
        <button
          onClick={() => setUnits([])}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors self-start"
          style={{
            backgroundColor: 'var(--accent2)',
            color: 'var(--bg-primary)'
          }}
        >
          <Trash2 size={16} />
          Clear Board
        </button>
      )}
    </div>
  );
};

export default ImprovedTeamBuilder;