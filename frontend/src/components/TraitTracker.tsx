import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Clock, Target, Zap, RotateCcw } from 'lucide-react';
import { Champion, Trait } from '../types';
import { GET_CHAMPIONS, GET_TRAITS, GET_TRAIT_TRACKER } from '../lib/graphql';

interface TraitTrackerProps {
  onChampionSelect?: (champion: Champion) => void;
}

interface TraitCount {
  name: string;
  current: number;
  target: number;
  activeBreakpoints: number[]; // breakpoints that are currently active
  upcomingBreakpoint: number | null; // next breakpoint to activate
}

interface TraitPath {
  champion: Champion;
  traitsGained: string[];
  cost: number;
  efficiency: number; // traits gained per cost
}

const TraitTracker: React.FC<TraitTrackerProps> = ({ onChampionSelect }) => {
  // Current state
  const [currentChampions, setCurrentChampions] = useState<Champion[]>([]);
  const [targetTraits, setTargetTraits] = useState<{ [traitName: string]: number }>({});
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);

  // Available champions and traits using GraphQL
  const { data: championData, loading: championsLoading } = useQuery(GET_CHAMPIONS, {
    variables: { limit: 100 },
  });

  const { data: traitData, loading: traitsLoading } = useQuery(GET_TRAITS);

  // Extract champions and traits from GraphQL data
  const champions = championData?.champions || [];
  const traits = traitData?.traits || [];

  // GraphQL mutation for trait tracker
  const [getTraitTracker, { data: pathData, loading: pathLoading, error: pathError }] = useMutation(GET_TRAIT_TRACKER);

  // Calculate current trait counts
  const currentTraitCounts = useMemo(() => {
    const traitCounts: { [traitName: string]: number } = {};
    
    // Count traits from current champions
    currentChampions.forEach(champion => {
      champion.traits?.forEach(trait => {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      });
    });
    
    return traitCounts;
  }, [currentChampions]);

  // Calculate trait status (current vs target)
  const traitStatus = useMemo(() => {
    const status: TraitCount[] = [];
    
    // Add all target traits
    Object.entries(targetTraits).forEach(([traitName, targetCount]) => {
      const currentCount = currentTraitCounts[traitName] || 0;
      
      // Find breakpoints for this trait
      let activeBreakpoints: number[] = [];
      let upcomingBreakpoint: number | null = null;
      
      if (traits) {
        const traitData = traits.find(t => t.name === traitName);
        if (traitData) {
          // Find active breakpoints
          activeBreakpoints = traitData.breakpoints
            .filter(bp => currentCount >= bp.count)
            .map(bp => bp.count);
          
          // Find next upcoming breakpoint
          const sortedBreakpoints = [...traitData.breakpoints].sort((a, b) => a.count - b.count);
          for (const bp of sortedBreakpoints) {
            if (bp.count > currentCount) {
              upcomingBreakpoint = bp.count;
              break;
            }
          }
        }
      }
      
      status.push({
        name: traitName,
        current: currentCount,
        target: targetCount,
        activeBreakpoints,
        upcomingBreakpoint
      });
    });
    
    // Add any current traits that aren't in target but have been activated
    Object.entries(currentTraitCounts).forEach(([traitName, count]) => {
      if (!targetTraits[traitName]) {
        // Only include traits that have active breakpoints
        let activeBreakpoints: number[] = [];
        let upcomingBreakpoint: number | null = null;
        
        if (traits) {
          const traitData = traits.find(t => t.name === traitName);
          if (traitData) {
            activeBreakpoints = traitData.breakpoints
              .filter(bp => count >= bp.count)
              .map(bp => bp.count);
            
            // Find next upcoming breakpoint
            const sortedBreakpoints = [...traitData.breakpoints].sort((a, b) => a.count - b.count);
            for (const bp of sortedBreakpoints) {
              if (bp.count > count) {
                upcomingBreakpoint = bp.count;
                break;
              }
            }
          }
        }
        
        if (activeBreakpoints.length > 0) {
          status.push({
            name: traitName,
            current: count,
            target: count, // For non-target traits, just show current
            activeBreakpoints,
            upcomingBreakpoint
          });
        }
      }
    });
    
    return status;
  }, [targetTraits, currentTraitCounts, traits]);

  // GraphQL mutation to find shortest path to reach target traits
  const callTraitTracker = useCallback(() => {
    if (!champions || !traits || Object.keys(targetTraits).length === 0) return;

    // Format the request for the GraphQL mutation
    const input = {
      target_traits: Object.entries(targetTraits).map(([name, count]) => ({
        trait_name: name,
        required_count: count
      })),
      current_traits: Object.entries(currentTraitCounts).map(([name, count]) => ({
        name,
        count
      }))
    };

    getTraitTracker({
      variables: {
        input
      }
    }).catch(error => {
      console.error('Error finding trait path:', error);
      // Fallback could be implemented here if needed
    });
  }, [champions, traits, targetTraits, currentTraitCounts, getTraitTracker]);

  // Extract path from GraphQL response
  const shortestPath = useMemo(() => {
    if (!pathData?.traitTracker?.path) return [];

    // Map the GraphQL response to the expected format
    return pathData.traitTracker.path.map((pathItem: any) => ({
      champion: pathItem.champion,
      traitsGained: pathItem.traitsGained || [],
      cost: pathItem.champion?.cost || 1,
      efficiency: pathItem.efficiency || 1.0
    }));
  }, [pathData]);

  // Auto-calculate path when champions or targets change
  useEffect(() => {
    if (champions && traits && (Object.keys(targetTraits).length > 0 || currentChampions.length > 0)) {
      callTraitTracker(); // Trigger the GraphQL mutation
    }
  }, [champions, traits, currentChampions, targetTraits, callTraitTracker]);

  // Handlers
  const handleAddChampion = (champion: Champion) => {
    setCurrentChampions([...currentChampions, champion]);
  };

  const handleRemoveChampion = (championId: string) => {
    setCurrentChampions(currentChampions.filter(champ => champ.id !== championId));
  };

  const handleAddTargetTrait = (traitName: string, count: number) => {
    setTargetTraits(prev => ({
      ...prev,
      [traitName]: count
    }));
  };

  const handleRemoveTargetTrait = (traitName: string) => {
    setTargetTraits(prev => {
      const newTargets = { ...prev };
      delete newTargets[traitName];
      return newTargets;
    });
  };

  const handleReset = () => {
    setCurrentChampions([]);
    setTargetTraits({});
  };

  // Renderers
  const renderCurrentTraits = () => {
    if (!traits) return null;
    
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Current Traits
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {traitStatus
            .filter(trait => trait.current > 0)
            .map((trait, index) => {
              const traitData = traits.find(t => t.name === trait.name);
              const isTargetMet = trait.current >= (targetTraits[trait.name] || 0);
              const isTarget = targetTraits[trait.name] !== undefined;
              
              return (
                <div
                  key={`${trait.name}-${index}`}
                  className={`p-2 rounded border text-center ${
                    isTarget ? (isTargetMet ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300') : 
                    'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{trait.name}</div>
                  <div className={`text-xs ${
                    isTarget ? (isTargetMet ? 'text-green-700 font-medium' : 'text-blue-700') : 'text-gray-600'
                  }`}>
                    {trait.current} {isTarget && (isTargetMet ? '✓' : `/${targetTraits[trait.name]}`)}
                  </div>
                  
                  {trait.upcomingBreakpoint && (
                    <div className="text-xs mt-1 text-gray-500">
                      Next: {trait.upcomingBreakpoint}
                    </div>
                  )}
                  
                  {trait.activeBreakpoints.length > 0 && (
                    <div className="text-xs mt-1">
                      Active: {trait.activeBreakpoints.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderTargetTraits = () => {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Target Traits
        </h3>
        
        <div className="space-y-2">
          {Object.entries(targetTraits).map(([traitName, count]) => {
            const currentCount = currentTraitCounts[traitName] || 0;
            const needed = Math.max(0, count - currentCount);
            
            return (
              <div key={traitName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{traitName}</span>
                  <span className="text-gray-600 text-sm ml-2">{currentCount}/{count}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Needed: {needed}</span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveTargetTrait(traitName)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {Object.keys(targetTraits).length === 0 && (
            <div className="text-gray-500 text-center py-4">
              No target traits set. Add targets to track your progress.
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShortestPath = () => {
    if (pathLoading) {
      return (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Shortest Path
          </h3>
          <div className="text-gray-500 text-center py-4">
            Calculating optimal path...
          </div>
        </div>
      );
    }

    if (pathError) {
      return (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Shortest Path
          </h3>
          <div className="text-red-500 text-center py-4">
            Error calculating path: {pathError.message}
          </div>
        </div>
      );
    }

    if (!shortestPath || shortestPath.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Shortest Path
          </h3>
          <div className="text-gray-500 text-center py-4">
            Add champions and set target traits to calculate the shortest path.
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Shortest Path ({shortestPath.length} champions)
        </h3>

        <div className="space-y-3">
          {shortestPath.map((pathItem, index) => (
            <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <img
                  src={pathItem.champion.image}
                  alt={pathItem.champion.name}
                  className="w-12 h-12 rounded border border-gray-300"
                />

                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{pathItem.champion.name}</span>
                    <span className="text-sm font-medium text-blue-600">Cost: {pathItem.champion.cost || '?'}*</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    Traits: {pathItem.traitsGained.join(', ')}
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    Efficiency: {pathItem.efficiency.toFixed(2)} traits per cost
                  </div>
                </div>
              </div>

              <button
                className="mt-2 w-full py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                onClick={() => handleAddChampion(pathItem.champion)}
              >
                Add to Current Team
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCurrentChampions = () => {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Current Team ({currentChampions.length}/36)</h3>
        
        {currentChampions.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No champions added yet. Add champions to see your current trait composition.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {currentChampions.map(champion => (
              <div
                key={champion.id}
                className="flex flex-col items-center p-2 bg-gray-50 rounded border"
              >
                <img
                  src={champion.image}
                  alt={champion.name}
                  className="w-12 h-12 rounded border border-gray-300 mb-1"
                />
                <div className="text-xs text-center font-medium truncate w-full">
                  {champion.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {champion.cost}*
                </div>
                <button
                  className="mt-1 text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveChampion(champion.id)}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Example targets for Set 16
  const handleAddExampleTarget = (traitType: string, count: number) => {
    if (traitType === 'region') {
      // For Set 16, you need 5 region traits to unlock Ryze
      setTargetTraits(prev => ({
        ...prev,
        'Noxus': Math.max(prev['Noxus'] || 0, count),
        'Demacia': Math.max(prev['Demacia'] || 0, count),
        'Piltover': Math.max(prev['Piltover'] || 0, count),
        'Ionia': Math.max(prev['Ionia'] || 0, count),
        'Shadow Isles': Math.max(prev['Shadow Isles'] || 0, count),
      }));
    } else if (traitType === 'bronze') {
      // For quest augment with 8 bronze trait actives
      setTargetTraits(prev => ({
        ...prev,
        'Brawler': Math.max(prev['Brawler'] || 0, count),
        'Assassin': Math.max(prev['Assassin'] || 0, count),
        'Duelist': Math.max(prev['Duelist'] || 0, count),
        'Mage': Math.max(prev['Mage'] || 0, count),
        'Warden': Math.max(prev['Warden'] || 0, count),
        'Invoker': Math.max(prev['Invoker'] || 0, count),
        'Skirmisher': Math.max(prev['Skirmisher'] || 0, count),
        'Redeemer': Math.max(prev['Redeemer'] || 0, count),
      }));
    }
  };

  if (championsLoading || traitsLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading trait tracker...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TFT Trait Tracker</h1>
        <p className="text-gray-600">
          Find the shortest path to acquire max traits for unlocks and augments
        </p>
      </div>

      {/* Quick Target Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-lg border border-blue-300 transition-colors"
          onClick={() => handleAddExampleTarget('region', 5)}
        >
          🔓 Unlock Ryze (5 Region Traits)
        </button>
        <button
          className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-2 px-4 rounded-lg border border-purple-300 transition-colors"
          onClick={() => handleAddExampleTarget('bronze', 8)}
        >
          💎 Quest Augment (8 Bronze Actives)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {renderCurrentChampions()}
          <button
            className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg border border-red-300 transition-colors"
            onClick={handleReset}
          >
            Reset All
          </button>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {renderCurrentTraits()}
          {renderTargetTraits()}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {renderShortestPath()}
        </div>
      </div>
    </div>
  );
};

export default TraitTracker;