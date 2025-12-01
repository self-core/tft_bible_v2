import { useState } from 'react';
import { Book, RotateCcw, Zap, TrendingUp, Trophy, Swords } from 'lucide-react';

const PatchNotes = () => {
  const [activeTab, setActiveTab] = useState<'patch' | 'mechanics' | 'champions'>('patch');

  // Mock data for current patch
  const currentPatch = {
    version: '14.22',
    releaseDate: 'October 23, 2024',
    title: 'TFT Set 12: Elderwood',
    description: 'Welcome to the Elderwood set! This set introduces new mechanics and a unique board composition system.',
    setInfo: {
      name: 'Elderwood',
      theme: 'Nature-based team composition',
      newMechanics: ['Elderwood', 'Druid', 'Invoker'],
      featuredUnits: ['Zoe', 'Gnar', 'Nidalee'],
      items: ['Elderwood Heart', 'Invoker Emblem', 'Druid Emblem']
    }
  };

  // Mock data for champion changes
  const championChanges = [
    {
      name: 'Zoe',
      cost: 5,
      previousStats: { health: 950, damage: 50 },
      newStats: { health: 1000, damage: 55 },
      changes: ['Increased health from 950 to 1000', 'Increased ability damage from 500/750/1200 to 550/825/1320'],
      tierChange: 'S → S+'
    },
    {
      name: 'Gnar',
      cost: 3,
      previousStats: { health: 650, damage: 40 },
      newStats: { health: 600, damage: 45 },
      changes: ['Decreased health from 650 to 600', 'Increased ability damage from 300/450/900 to 330/495/990'],
      tierChange: 'A → B'
    },
    {
      name: 'Nidalee',
      cost: 4,
      previousStats: { health: 700, damage: 45 },
      newStats: { health: 700, damage: 45 },
      changes: ['No base stat changes', 'Improved synergy with other units'],
      tierChange: 'B → A'
    }
  ];

  // Mock data for set mechanics
  const setMechanics = [
    {
      name: 'Elderwood',
      description: 'Elderwood units transform into powerful Ancient versions for the rest of combat after taking damage for the first time each combat.',
      units: ['Zoe', 'Gnar', 'Nidalee', 'Poppy', 'Rell'],
      strategy: 'Stack items on Elderwood units to maximize their effectiveness when they transform.'
    },
    {
      name: 'Invoker',
      description: 'Invoker units grant bonus items to other units in the same row at the start of combat.',
      units: ['Zoe', 'Veigar', 'Azir', 'Sona', 'Yasuo'],
      strategy: 'Position Invoker units strategically to provide item benefits to your key carries.'
    },
    {
      name: 'Druid',
      description: 'Druid units gain bonus healing and mana at the start of combat.',
      units: ['Nidalee', 'Sylas', 'Gnar', 'Lillia', 'Rell'],
      strategy: 'Combine with healing items to create very durable units.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-tft-gold to-tft-blue text-white mb-4">
          <Trophy className="h-5 w-5" />
          <span className="font-bold">Patch {currentPatch.version}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{currentPatch.title}</h1>
        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>{currentPatch.description}</p>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Released: {currentPatch.releaseDate}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--bg-accent)' }}>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'patch' 
              ? 'text-tft-gold border-b-2 border-tft-gold' 
              : 'text-gray-500 hover:text-tft-gold'
          }`}
          style={{ 
            color: activeTab === 'patch' ? 'var(--accent1)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'patch' ? '2px solid var(--accent1)' : 'none'
          }}
          onClick={() => setActiveTab('patch')}
        >
          <div className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Patch Notes
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
            activeTab === 'mechanics' 
              ? 'text-tft-gold border-b-2 border-tft-gold' 
              : 'text-gray-500 hover:text-tft-gold'
          }`}
          style={{ 
            color: activeTab === 'mechanics' ? 'var(--accent1)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'mechanics' ? '2px solid var(--accent1)' : 'none'
          }}
          onClick={() => setActiveTab('mechanics')}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Set Mechanics
          </div>
        </button>
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
            <Swords className="h-4 w-4" />
            Champion Changes
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === 'patch' && (
          <div className="space-y-6">
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-accent)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Patch Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5" style={{ color: 'var(--accent1)' }} />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Meta Shifts</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    The Elderwood set promotes aggressive board positioning and item dependency strategies. 
                    Look for compositions that can take advantage of the Elderwood transformation mechanic.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-5 w-5" style={{ color: 'var(--accent2)' }} />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Balance Changes</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Several high-tier compositions have been adjusted to make room for new Elderwood synergies. 
                    Zoe's increased durability makes her a more reliable late-game carry.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5" style={{ color: 'var(--accent3)' }} />
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Mechanics</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    The introduction of Elderwood, Invoker, and Druid traits creates new strategic possibilities. 
                    Combining these traits can lead to very powerful compositions.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-accent)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Set Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Set Theme: {currentPatch.setInfo.name}</h3>
                  <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {currentPatch.setInfo.theme}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Mechanics</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentPatch.setInfo.newMechanics.map((mechanic, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ 
                          backgroundColor: 'var(--accent1)',
                          color: 'var(--bg-primary)'
                        }}
                      >
                        {mechanic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Featured Units</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentPatch.setInfo.featuredUnits.map((unit, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ 
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--bg-accent)'
                        }}
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>New Items</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentPatch.setInfo.items.map((item, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ 
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--bg-accent)'
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mechanics' && (
          <div className="space-y-6">
            {setMechanics.map((mechanic, index) => (
              <div 
                key={index} 
                className="rounded-lg p-6 border" 
                style={{ 
                  background: 'var(--bg-accent)',
                  borderColor: 'var(--bg-primary)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{mechanic.name}</h2>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{mechanic.description}</p>
                    
                    <div className="mt-4">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Units with this trait:</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mechanic.units.map((unit, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ 
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--bg-accent)'
                            }}
                          >
                            {unit}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Strategy Tips:</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>{mechanic.strategy}</p>
                    </div>
                  </div>
                  <div className="ml-4 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <Zap className="h-8 w-8" style={{ color: 'var(--accent1)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'champions' && (
          <div className="space-y-6">
            {championChanges.map((champion, index) => (
              <div 
                key={index} 
                className="rounded-lg p-6 border" 
                style={{ 
                  background: 'var(--bg-accent)',
                  borderColor: 'var(--bg-primary)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{champion.name} (Cost {champion.cost})</h2>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      color: champion.tierChange.includes('→ S') ? 'var(--accent1)' : 
                             champion.tierChange.includes('→ A') ? 'var(--accent2)' : 
                             champion.tierChange.includes('→ B') ? 'var(--accent3)' : 
                             'var(--text-secondary)',
                      backgroundColor: champion.tierChange.includes('→ S') ? 'var(--accent1)' : 
                                      champion.tierChange.includes('→ A') ? 'var(--accent2)' : 
                                      champion.tierChange.includes('→ B') ? 'var(--accent3)' : 
                                      'var(--bg-secondary)'
                    }}
                  >
                    {champion.tierChange}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Previous Stats</h3>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <p>Health: {champion.previousStats.health}</p>
                      <p>Damage: {champion.previousStats.damage}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>New Stats</h3>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      <p>Health: {champion.newStats.health}</p>
                      <p>Damage: {champion.newStats.damage}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Changes:</h3>
                  <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    {champion.changes.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatchNotes;