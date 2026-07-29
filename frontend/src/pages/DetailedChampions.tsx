import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Zap, Shield, Target } from 'lucide-react';
import { useChampionsStore } from '../stores';

interface Champion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  health: number;
  attack_damage: number;
  play_rate: number;
  avg_placement: number;
  icon_url: string;
  trait_images: string[]; // URLs for trait icons
}

interface ChampionCardProps {
  champion: Champion;
}

interface ChampionsFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  costFilter: number | null;
  onCostFilterChange: (value: number | null) => void;
  traitFilter: string;
  onTraitFilterChange: (value: string) => void;
}

const ChampionCard: React.FC<ChampionCardProps> = ({ champion }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getCostColor = (cost: number) => {
    switch (cost) {
      case 1: return 'bg-gray-600 text-white';
      case 2: return 'bg-green-600 text-white';
      case 3: return 'bg-blue-600 text-white';
      case 4: return 'bg-purple-600 text-white';
      case 5: return 'bg-yellow-600 text-yellow-900';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div 
      className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Champion image */}
      <div className="relative">
        <img 
          src={champion.icon_url || 'https://placehold.co/150x150?text=?'} 
          alt={champion.name} 
          className="w-full h-40 object-cover"
        />
        
        {/* Cost indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getCostColor(champion.cost)}`}>
          {champion.cost}
        </div>
        
        {/* Traits */}
        <div className="absolute bottom-2 left-2 flex space-x-1">
          {(champion.trait_images || []).slice(0, 3).map((trait, idx) => (
            <img
              key={idx}
              src={trait}
              alt={`Trait ${idx}`}
              className="w-6 h-6 rounded-full border border-gray-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.style.display = 'none'; // Hide broken image
              }}
            />
          ))}
          {champion.trait_images && champion.trait_images.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
              +{champion.trait_images.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-center text-white">{champion.name}</h3>
        
        {/* Stats */}
        <div className="mt-3 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Play Rate:</span>
            <span>{champion.play_rate?.toFixed(1) || 'N/A'}%</span>
          </div>
          <div className="flex justify-between">
            <span>Avg. Placement:</span>
            <span>{champion.avg_placement?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="text-center text-white font-bold mb-2">{champion.name}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800 p-2 rounded">Health: {champion.health || 'N/A'}</div>
            <div className="bg-gray-800 p-2 rounded">AD: {champion.attack_damage || 'N/A'}</div>
            <div className="bg-gray-800 p-2 rounded">Cost: {champion.cost}</div>
            <div className="bg-gray-800 p-2 rounded">Traits: {champion.traits?.join(', ') || 'None'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ChampionsFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  costFilter: number | null;
  onCostFilterChange: (value: number | null) => void;
  traitFilter: string;
  onTraitFilterChange: (value: string) => void;
}

const ChampionsFilter: React.FC<ChampionsFilterProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  costFilter,
  onCostFilterChange,
  traitFilter,
  onTraitFilterChange
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <Search className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" size={20} />
          <input
            type="text"
            placeholder="Search champions by name, traits..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select
              className="bg-gray-700 text-white py-2 px-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="cost">Sort by Cost</option>
              <option value="play_rate">Sort by Play Rate</option>
              <option value="avg_placement">Sort by Placement</option>
            </select>
          </div>

          <button
            className="flex items-center gap-2 bg-gray-700 text-white py-2 px-4 rounded-lg border border-gray-600 hover:bg-gray-600"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filters
            {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Cost</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((cost) => (
                <button
                  key={cost}
                  className={`px-3 py-1 rounded-full text-sm ${
                    costFilter === cost
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-700 text-white'
                  }`}
                  onClick={() => onCostFilterChange(costFilter === cost ? null : cost)}
                >
                  {cost}
                </button>
              ))}
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  costFilter === null
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-700 text-white'
                }`}
                onClick={() => onCostFilterChange(null)}
              >
                All
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Trait</label>
            <input
              type="text"
              placeholder="e.g., Big Shot, Rapid Fire..."
              className="w-full py-2 px-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={traitFilter}
              onChange={(e) => onTraitFilterChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const DetailedChampions: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [costFilter, setCostFilter] = useState<number | null>(null);
  const [traitFilter, setTraitFilter] = useState('');

  const { champions, loading, error, fetchChampions } = useChampionsStore();

  // Fetch champions on mount
  useEffect(() => {
    if (fetchChampions) {
      fetchChampions({ limit: 100 }); // Fetch up to 100 champions
    }
  }, [fetchChampions]);

  // Mock data to use if API fails
  useEffect(() => {
    if ((!champions || champions.length === 0) && !loading && !error) {
      const mockChampions = [
        {
          id: 'jinx',
          name: 'Jinx',
          cost: 5,
          traits: ['Big Shot', 'Deadeye'],
          health: 700,
          attack_damage: 80,
          play_rate: 15.2,
          avg_placement: 4.1,
          icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222.png',
          trait_images: ['https://placehold.co/30x30?text=BS', 'https://placehold.co/30x30?text=DD']
        },
        {
          id: 'caitlyn',
          name: 'Caitlyn',
          cost: 1,
          traits: ['Big Shot', 'Rapid Fire'],
          health: 550,
          attack_damage: 50,
          play_rate: 8.7,
          avg_placement: 3.9,
          icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/51.png',
          trait_images: ['https://placehold.co/30x30?text=BS', 'https://placehold.co/30x30?text=RF']
        }
      ];
    }
  }, [champions, loading, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold mb-6">Champions</h1>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 h-16"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error loading champions data</h2>
          <p className="text-gray-400">Please try again later</p>
          <button
            onClick={() => {
              if (fetchChampions) {
                fetchChampions({ limit: 100 });
              }
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort champions
  let filteredChampions = champions || [];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredChampions = filteredChampions.filter((champion) =>
      champion.name.toLowerCase().includes(query) ||
      champion.traits.some((trait) => trait.toLowerCase().includes(query))
    );
  }

  if (costFilter !== null) {
    filteredChampions = filteredChampions.filter((champion) => champion.cost === costFilter);
  }

  if (traitFilter) {
    const trait = traitFilter.toLowerCase();
    filteredChampions = filteredChampions.filter((champion) =>
      champion.traits.some((traitName) => traitName.toLowerCase().includes(trait))
    );
  }

  // Sort champions
  filteredChampions.sort((a, b) => {
    switch (sortBy) {
      case 'cost':
        return a.cost - b.cost;
      case 'play_rate':
        return (b.play_rate || 0) - (a.play_rate || 0);
      case 'avg_placement':
        return (a.avg_placement || 0) - (b.avg_placement || 0);
      default: // name
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Champions</h1>
        
        <ChampionsFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          costFilter={costFilter}
          onCostFilterChange={setCostFilter}
          traitFilter={traitFilter}
          onTraitFilterChange={setTraitFilter}
        />
        
        {filteredChampions.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-400">No champions found</h2>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredChampions.map((champion: any) => (
              <ChampionCard key={champion.id} champion={champion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};