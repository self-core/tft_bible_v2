import { useState, useEffect } from 'react';
import { 
  Sword, 
  Heart, 
  Zap, 
  Shield, 
  Star, 
  Plus, 
  X, 
  Share2, 
  Save, 
  RotateCcw,
  Target,
  Eye,
  ThumbsUp
} from 'lucide-react';

// Mock data for champions
const mockChampions = [
  { id: 'jinx', name: 'Jinx', cost: 5, traits: ['Big Shot', 'Deadeye'], imageUrl: '' },
  { id: 'caitlyn', name: 'Caitlyn', cost: 1, traits: ['Big Shot', 'Rapid Fire'], imageUrl: '' },
  { id: 'ezreal', name: 'Ezreal', cost: 1, traits: ['Big Shot', 'Mystic'], imageUrl: '' },
  { id: 'kaisa', name: 'Kai\'Sa', cost: 3, traits: ['Big Shot', 'Void'], imageUrl: '' },
  { id: 'sion', name: 'Sion', cost: 5, traits: ['Dominator', 'Bruiser'], imageUrl: '' },
  { id: 'garen', name: 'Garen', cost: 1, traits: ['Dominator', 'Knight'], imageUrl: '' },
  { id: 'kayle', name: 'Kayle', cost: 4, traits: ['Dominator', 'Mystic'], imageUrl: '' },
  { id: 'yasuo', name: 'Yasuo', cost: 5, traits: ['Skirmisher', 'Blade Master'], imageUrl: '' },
  { id: 'katarina', name: 'Katarina', cost: 3, traits: ['Skirmisher', 'Assassin'], imageUrl: '' },
  { id: 'azir', name: 'Azir', cost: 5, traits: ['Emperor', 'Mage'], imageUrl: '' },
  { id: 'ashe', name: 'Ashe', cost: 2, traits: ['Big Shot', 'Ranger'], imageUrl: '' },
  { id: 'tristana', name: 'Tristana', cost: 3, traits: ['Big Shot', 'Rapid Fire'], imageUrl: '' },
  // Additional champions...
];

// Mock items data
const mockItems = [
  { id: 'bf_sword', name: 'B.F. Sword', category: 'Basic' },
  { id: 'rod', name: 'Needlessly Large Rod', category: 'Basic' },
  { id: 'chain_vest', name: 'Chain Vest', category: 'Basic' },
  { id: 'negatron_cloak', name: 'Negatron Cloak', category: 'Basic' },
  { id: 'recurve_bow', name: 'Recurve Bow', category: 'Basic' },
  { id: 'tear', name: 'Tear of the Goddess', category: 'Basic' },
  { id: 'spatula', name: 'Spatula', category: 'Basic' },
  { id: 'giant_belt', name: 'Giant\'s Belt', category: 'Basic' },
  { id: 'infinity_edge', name: 'Infinity Edge', category: 'Completed' },
  { id: 'rabadon_deathcap', name: 'Rabadon\'s Deathcap', category: 'Completed' },
  { id: 'thornmail', name: 'Thornmail', category: 'Completed' },
  { id: 'warmogs_armor', name: 'Warmog\'s Armor', category: 'Completed' },
  { id: 'guinsoos_rageblade', name: 'Guinsoo\'s Rageblade', category: 'Completed' },
  { id: 'bloodthirster', name: 'Bloodthirster', category: 'Completed' },
  { id: 'statikk_shiv', name: 'Statikk Shiv', category: 'Completed' },
  { id: 'jeweled_gauntlet', name: 'Jeweled Gauntlet', category: 'Completed' },
  { id: 'dragons_claw', name: 'Dragon\'s Claw', category: 'Completed' },
  { id: 'redemption', name: 'Redemption', category: 'Completed' },
];

// Trait data
const traitData = {
  'Big Shot': { units: ['jinx', 'caitlyn', 'ezreal', 'kaisa', 'ashe', 'sivir', 'tristana', 'twitch'] },
  'Deadeye': { units: ['jinx', 'caitlyn', 'ezreal'] },
  'Rapid Fire': { units: ['caitlyn', 'ashe', 'sivir', 'tristana'] },
  'Mystic': { units: ['ezreal', 'malphite', 'kayle'] },
  'Void': { units: ['kaisa', 'twitch', 'kassadin'] },
  'Dominator': { units: ['sion', 'garen', 'kled', 'sett', 'darius', 'kayle', 'leona', 'malphite'] },
  'Bruiser': { units: ['sion', 'garen', 'darius', 'leona', 'kled', 'sett'] },
  'Knight': { units: ['garen', 'leona', 'kled', 'malphite'] },
  'Skirmisher': { units: ['yasuo', 'kha\'zix', 'katarina', 'akali', 'zed', 'irelia', 'master yi', 'kassadin'] },
  'Blade Master': { units: ['yasuo', 'irelia', 'master yi'] },
  'Assassin': { units: ['katarina', 'akali', 'zed', 'kha\'zix', 'twitch'] },
  'Emperor': { units: ['azir', 'sylas', 'kassadin', 'vel\'koz', 'xerath', 'aurelion sol', 'kayle'] },
  'Mage': { units: ['azir', 'sylas', 'vel\'koz', 'xerath', 'kayle', 'aurelion sol'] },
};

const TeamBuilder = () => {
  // State for the team/composition
  const [team, setTeam] = useState<any[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [board, setBoard] = useState<any[]>(Array(4).fill(null).map(() => Array(8).fill(null)));
  const [activeTab, setActiveTab] = useState<'champions' | 'items' | 'board' | 'export'>('champions');
  const [compositionName, setCompositionName] = useState('My Custom Composition');
  const [compositionDesc, setCompositionDesc] = useState('A custom TFT composition built with the team builder');
  const [traits, setTraits] = useState<any>({});

  // Calculate active traits based on the current team
  useEffect(() => {
    const traitCount: Record<string, number> = {};
    
    team.forEach(champion => {
      champion.traits.forEach((trait: string) => {
        traitCount[trait] = (traitCount[trait] || 0) + 1;
      });
    });
    
    setTraits(traitCount);
  }, [team]);

  // Add a champion to the team
  const addChampionToTeam = (champion: any) => {
    if (team.length < 10) { // Maximum team size
      const newChampion = {
        ...champion,
        id: `${champion.id}-${Date.now()}`, // Unique ID for this instance
        position: { x: -1, y: -1 }, // Not placed on board yet
        items: [],
        starLevel: 1
      };
      setTeam([...team, newChampion]);
    }
  };

  // Remove a champion from the team
  const removeChampionFromTeam = (id: string) => {
    setTeam(team.filter(champ => champ.id !== id));
    
    // Also remove from board if placed
    const updatedBoard = board.map(row => 
      row.map(cell => cell && cell.id === id ? null : cell)
    );
    setBoard(updatedBoard);
  };

  // Place champion on the board
  const placeChampionOnBoard = (championId: string, x: number, y: number) => {
    // First, remove from any existing position
    const updatedBoard = board.map(row => 
      row.map(cell => cell && cell.id === championId ? null : cell)
    );
    
    // Update the champion's position in the team
    const updatedTeam = team.map(champ => 
      champ.id === championId ? { ...champ, position: { x, y } } : champ
    );
    
    // Place on the new position
    updatedBoard[y][x] = team.find(champ => champ.id === championId);
    
    setTeam(updatedTeam);
    setBoard(updatedBoard);
  };

  // Clear the board
  const clearBoard = () => {
    setBoard(Array(4).fill(null).map(() => Array(8).fill(null)));
    setTeam(team.map(champ => ({ ...champ, position: { x: -1, y: -1 } })));
  };

  // Render the TFT board
  const renderBoard = () => {
    return (
      <div className="grid grid-cols-8 gap-1">
        {board.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                cell 
                  ? 'border-tft-gold bg-gray-700' 
                  : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => {
                if (cell) {
                  // Clicking on a placed champion removes it from board
                  const updatedBoard = [...board];
                  updatedBoard[y][x] = null;
                  setBoard(updatedBoard);
                  
                  // Update the champion's position in the team
                  const updatedTeam = team.map(champ => 
                    champ.id === cell.id ? { ...champ, position: { x: -1, y: -1 } } : champ
                  );
                  setTeam(updatedTeam);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const championId = e.dataTransfer.getData('championId');
                if (championId) {
                  placeChampionOnBoard(championId, x, y);
                }
              }}
            >
              {cell && (
                <>
                  {cell.icon_url ? (
                    <img 
                      src={cell.icon_url} 
                      alt={cell.name}
                      className="w-12 h-12 rounded object-cover border border-gray-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.style.display = 'none';
                        // Show fallback
                        const fallback = target.parentElement?.querySelector('.fallback-board');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-600 flex items-center justify-center text-xs font-bold border border-gray-500 fallback-board">
                      {cell.name.charAt(0)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  // Render champion list
  const renderChampionList = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {mockChampions.map((champion) => (
          <div
            key={champion.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('championId', `new-${champion.id}`)}
            className="p-3 rounded-lg border cursor-move hover:bg-gray-700 transition-colors"
            style={{ 
              background: 'var(--bg-accent)',
              borderColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
            onClick={() => addChampionToTeam(champion)}
          >
            <div className="flex items-center gap-2 mb-2">
              {champion.icon_url ? (
                <img 
                  src={champion.icon_url} 
                  alt={champion.name}
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.style.display = 'none';
                    // Show fallback
                    const fallback = target.parentElement?.querySelector('.fallback-champ');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-xs font-bold fallback-champ">
                  {champion.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-medium text-sm">{champion.name}</h3>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${
                    champion.cost === 1 ? 'text-gray-400' :
                    champion.cost === 2 ? 'text-green-400' :
                    champion.cost === 3 ? 'text-blue-400' :
                    champion.cost === 4 ? 'text-purple-400' : 'text-yellow-400'
                  }`}>
                    {champion.cost}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {champion.traits.map((trait, idx) => (
                <span 
                  key={idx} 
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render team list
  const renderTeamList = () => {
    if (team.length === 0) {
      return (
        <div 
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{ 
            borderColor: 'var(--bg-accent)',
            color: 'var(--text-secondary)'
          }}
        >
          <p>Your team is empty. Add champions from the list to start building your composition.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {team.map((champion) => (
          <div
            key={champion.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('championId', champion.id);
            }}
            className="p-3 rounded-lg border"
            style={{ 
              background: 'var(--bg-accent)',
              borderColor: 'var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {champion.icon_url ? (
                  <img 
                    src={champion.icon_url} 
                    alt={champion.name}
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.style.display = 'none';
                      // Show fallback
                      const fallback = target.parentElement?.querySelector('.fallback-team');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-xs font-bold fallback-team">
                    {champion.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-sm">{champion.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${
                      champion.cost === 1 ? 'text-gray-400' :
                      champion.cost === 2 ? 'text-green-400' :
                      champion.cost === 3 ? 'text-blue-400' :
                      champion.cost === 4 ? 'text-purple-400' : 'text-yellow-400'
                    }`}>
                      {champion.cost}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeChampionFromTeam(champion.id)}
                className="text-red-500 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {champion.traits.map((trait: string, idx: number) => (
                <span 
                  key={idx} 
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Position: {champion.position.x >= 0 ? `(${champion.position.x}, ${champion.position.y})` : 'Not placed'}</span>
              <div className="flex">
                {[1, 2, 3].map(star => (
                  <Star 
                    key={star} 
                    className={`h-3 w-3 ${star <= champion.starLevel ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render traits panel
  const renderTraitsPanel = () => {
    const activeTraits = Object.entries(traits)
      .filter(([trait, count]) => count > 0)
      .map(([trait, count]) => ({ name: trait, count, units: traitData[trait as keyof typeof traitData]?.units || [] }));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Active Traits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTraits.length > 0 ? (
            activeTraits.map((trait) => (
              <div 
                key={trait.name}
                className="p-3 rounded-lg border"
                style={{ 
                  background: 'var(--bg-accent)',
                  borderColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{trait.name}</h4>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-bold"
                    style={{ 
                      backgroundColor: 'var(--accent1)',
                      color: 'var(--bg-primary)'
                    }}
                  >
                    {trait.count}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Units: {trait.units.length} | Active: {Math.min(trait.count, trait.units.length)}
                </div>
              </div>
            ))
          ) : (
            <div 
              className="text-center py-8 rounded-lg border-2 border-dashed"
              style={{ 
                borderColor: 'var(--bg-accent)',
                color: 'var(--text-secondary)'
              }}
            >
              <p>No active traits. Add champions to see trait synergies.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Team Builder</h1>
          <p className="text-gray-500" style={{ color: 'var(--text-secondary)' }}>Create and customize your TFT compositions</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-accent)',
              color: 'var(--text-primary)',
              border: '1px solid var(--bg-primary)'
            }}
            onClick={clearBoard}
          >
            <RotateCcw className="h-4 w-4" />
            Clear Board
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-tft-gold text-gray-900"
            style={{ 
              backgroundColor: 'var(--accent1)',
              color: 'var(--bg-primary)'
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--bg-accent)' }}>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'champions' 
              ? 'text-tft-gold border-b-2 border-tft-gold' 
              : 'text-gray-500 hover:text-tft-gold'
          }`}
          style={{ 
            color: activeTab === 'champions' ? 'var(--accent1)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'champions' ? '2px solid var(--accent1)' : 'none'
          }}
          onClick={() => setActiveTab('champions')}
        >
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4" />
            Champions
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'board' 
              ? 'text-tft-gold border-b-2 border-tft-gold' 
              : 'text-gray-500 hover:text-tft-gold'
          }`}
          style={{ 
            color: activeTab === 'board' ? 'var(--accent1)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'board' ? '2px solid var(--accent1)' : 'none'
          }}
          onClick={() => setActiveTab('board')}
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Board
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'export' 
              ? 'text-tft-gold border-b-2 border-tft-gold' 
              : 'text-gray-500 hover:text-tft-gold'
          }`}
          style={{ 
            color: activeTab === 'export' ? 'var(--accent1)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'export' ? '2px solid var(--accent1)' : 'none'
          }}
          onClick={() => setActiveTab('export')}
        >
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Export
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === 'champions' && (
          <div className="space-y-6">
            {renderTraitsPanel()}
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Available Champions</h2>
              {renderChampionList()}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Team</h2>
              {renderTeamList()}
            </div>
          </div>
        )}

        {activeTab === 'board' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>TFT Board</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Drag champions from your team to place them on the board. Click on placed champions to remove them.
              </p>
              {renderBoard()}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Team</h2>
              {renderTeamList()}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div 
              className="rounded-lg p-6"
              style={{ 
                background: 'var(--bg-accent)',
                border: '1px solid var(--bg-primary)'
              }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Export Your Composition</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Composition Name</label>
                  <input
                    type="text"
                    value={compositionName}
                    onChange={(e) => setCompositionName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--bg-accent)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Enter composition name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Description</label>
                  <textarea
                    value={compositionDesc}
                    onChange={(e) => setCompositionDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--bg-accent)',
                      color: 'var(--text-primary)'
                    }}
                    rows={3}
                    placeholder="Describe your composition strategy"
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Share Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      className="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                      style={{ 
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--bg-accent)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Share2 className="h-8 w-8 mb-2" style={{ color: 'var(--accent1)' }} />
                      <span>Share Link</span>
                    </button>
                    <button 
                      className="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                      style={{ 
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--bg-accent)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Save className="h-8 w-8 mb-2" style={{ color: 'var(--accent2)' }} />
                      <span>Save Locally</span>
                    </button>
                    <button 
                      className="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                      style={{ 
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--bg-accent)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Eye className="h-8 w-8 mb-2" style={{ color: 'var(--accent3)' }} />
                      <span>Embed</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-lg p-6"
              style={{ 
                background: 'var(--bg-accent)',
                border: '1px solid var(--bg-primary)'
              }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Composition Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent1)' }}>{team.length}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Champions</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent2)' }}>{Object.keys(traits).filter(trait => traits[trait] > 0).length}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Traits</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent3)' }}>{team.reduce((sum, champ) => sum + champ.cost, 0)}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Cost</div>
                </div>
                <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>TBD</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Recommended Items</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamBuilder;