import React, { useState, useEffect } from 'react';
import { Star, Trash2, Loader2 } from 'lucide-react';

// Main reusable Composition component
const TFTComposition = ({ 
  initialUnits = [], 
  mode = 'readonly',
  onUnitsChange = null,
  boardSize = { rows: 4, cols: 7 },
  version = '15.21.1'
}) => {
  const [units, setUnits] = useState(initialUnits);
  const [champions, setChampions] = useState({});
  const [loading, setLoading] = useState(true);
  const [draggedUnit, setDraggedUnit] = useState(null);
  const [draggedChampion, setDraggedChampion] = useState(null);

  const isEditMode = mode === 'edit';

  // Fetch champion data from DDragon API
  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`);
        const data = await response.json();
        
        console.log('Fetched data:', data);
        
        // Filter only Set 15 champions (TFT15_)
        const set15Champions = {};
        for (const [key, value] of Object.entries(data.data)) {
          if (key.includes('TFTSet15')) {
            set15Champions[value.id] = value;
          }
        }
        
        console.log('Set 15 champions:', set15Champions);
        setChampions(set15Champions);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch champions:', error);
        setLoading(false);
      }
    };

    fetchChampions();
  }, [version]);

  // Get champion image URL
  const getChampionImage = (championId) => {
    if (!champions[championId]) return null;
    const imageName = champions[championId].image.full;
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/tft-champion/${imageName}`;
  };

  // Get champion tier/cost color
  const getTierColor = (tier) => {
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
  const handleHexClick = (row, col) => {
    if (!isEditMode) return;

    const existingUnitIndex = units.findIndex(u => u.row === row && u.col === col);
    
    if (existingUnitIndex >= 0) {
      // Just clicking an occupied hex does nothing
      return;
    }
  };

  // Handle removing a unit
  const handleRemoveUnit = (unitId, e) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const newUnits = units.filter(u => u.id !== unitId);
    setUnits(newUnits);
    if (onUnitsChange) onUnitsChange(newUnits);
  };

  // Handle drag start from board
  const handleDragStart = (unit, e) => {
    if (!isEditMode) return;
    setDraggedUnit(unit);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
  };

  // Handle drag start from champion list
  const handleChampionDragStart = (champion, e) => {
    if (!isEditMode) return;
    setDraggedChampion(champion);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedUnit ? 'move' : 'copy';
  };

  const handleDrop = (row, col, e) => {
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
        if (onUnitsChange) onUnitsChange(newUnits);
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
        if (onUnitsChange) onUnitsChange(newUnits);
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
        if (onUnitsChange) onUnitsChange(updatedUnits);
      } else {
        newUnits.push({ ...draggedUnit, row, col });
        setUnits(newUnits);
        if (onUnitsChange) onUnitsChange(newUnits);
      }

      setDraggedUnit(null);
    }
  };

  // Handle star upgrade
  const handleStarClick = (unitId, e) => {
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
    if (onUnitsChange) onUnitsChange(newUnits);
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
                  fill={getTierColor(champions[unitOnHex.championId].tier)}
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

  const getHexagonPoints = (size) => {
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
      <div className="flex items-center justify-center p-12 bg-slate-900 rounded-lg border border-slate-700">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-slate-300">Loading champions...</span>
      </div>
    );
  }

  const championsList = Object.values(champions).sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  console.log('Champions list length:', championsList.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Champion selector in edit mode */}
      {isEditMode && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-white font-semibold mb-3">
            Champions (Drag to Board) - {championsList.length} available
          </h3>
          {championsList.length === 0 ? (
            <div className="text-slate-400 text-center py-4">
              No champions loaded. Check console for errors.
            </div>
          ) : (
            <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
              {championsList.map((champion) => (
                <div
                  key={champion.id}
                  draggable
                  onDragStart={(e) => handleChampionDragStart(champion, e)}
                  className="relative group cursor-move"
                  title={`${champion.name} (${champion.tier}⭐)`}
                >
                  <div 
                    className="w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110"
                    style={{ borderColor: getTierColor(champion.tier) }}
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
                      {champion.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-slate-400 text-sm mt-3">
            💡 Drag champions to the board • Click stars to upgrade • Drag units to reposition
          </p>
        </div>
      )}

      {/* Board */}
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 overflow-auto">
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
          onClick={() => {
            setUnits([]);
            if (onUnitsChange) onUnitsChange([]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors self-start"
        >
          <Trash2 size={16} />
          Clear Board
        </button>
      )}
    </div>
  );
};

// Demo component showing both modes
const TFTCompositionDemo = () => {
  const [editModeUnits, setEditModeUnits] = useState([]);

  // Sample composition for read-only mode
  const sampleUnits = [
    { id: 1, championId: 'TFT15_Jinx', stars: 2, row: 0, col: 3 },
    { id: 2, championId: 'TFT15_Vi', stars: 2, row: 1, col: 2 },
    { id: 3, championId: 'TFT15_Ekko', stars: 1, row: 1, col: 4 },
    { id: 4, championId: 'TFT15_Caitlyn', stars: 3, row: 2, col: 1 },
    { id: 5, championId: 'TFT15_Jayce', stars: 2, row: 2, col: 3 },
    { id: 6, championId: 'TFT15_Leona', stars: 2, row: 2, col: 5 },
    { id: 7, championId: 'TFT15_Zyra', stars: 1, row: 3, col: 2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">TFT Composition Board</h1>
          <p className="text-slate-400">
            Reusable component with DDragon API integration • Set 15 Champions
          </p>
        </div>

        {/* Read-only mode */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Read-Only Mode</h2>
          <TFTComposition
            initialUnits={sampleUnits}
            mode="readonly"
          />
        </div>

        {/* Edit mode */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Edit Mode</h2>
          <TFTComposition
            initialUnits={editModeUnits}
            mode="edit"
            onUnitsChange={setEditModeUnits}
          />
          
          {editModeUnits.length > 0 && (
            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <h3 className="text-white font-semibold mb-2">Composition Data:</h3>
              <pre className="text-slate-300 text-sm overflow-auto max-h-96">
                {JSON.stringify(editModeUnits, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TFTCompositionDemo;