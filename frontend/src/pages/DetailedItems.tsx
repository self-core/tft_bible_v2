import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

import { useItemsStore } from '../stores';

interface Item {
  id: string;
  name: string;
  type: string;
  stats: string;
  play_rate: number;
  avg_placement: number;
  top_champions: string[];
  description: string;
  build_path: string[];
  icon_url: string;
}

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'craftable':
        return 'bg-blue-500 text-white';
      case 'artifact':
        return 'bg-purple-500 text-white';
      case 'emblem':
        return 'bg-yellow-500 text-gray-900';
      case 'ornn item':
        return 'bg-red-500 text-white';
      case 'radiant':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div 
      className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Item image */}
      <div className="relative">
        <img 
          src={item.icon_url || 'https://placehold.co/150x150?text=?'} 
          alt={item.name} 
          className="w-full h-40 object-cover"
        />
        
        {/* Type indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}>
          {item.type}
        </div>
      </div>

      {/* Name */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-center text-white">{item.name}</h3>
        
        {/* Stats */}
        <div className="mt-3 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Play Rate:</span>
            <span>{item.play_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Avg. Placement:</span>
            <span>{item.avg_placement.toFixed(1)}</span>
          </div>
        </div>
        
        {/* Top champions */}
        <div className="mt-3">
          <h4 className="text-xs text-gray-400 mb-1">TOP CHAMPIONS</h4>
          <div className="flex flex-wrap gap-1">
            {item.top_champions.slice(0, 3).map((champion, idx) => (
              <span 
                key={idx} 
                className="text-xs px-2 py-1 bg-gray-700 rounded-full"
              >
                {champion}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="text-center text-white font-bold mb-2">{item.name}</div>
          <div className="text-sm text-gray-300 mb-2">{item.description}</div>
          <div className="text-xs text-gray-400">
            Build Path: {item.build_path.join(' + ') || 'No build path'}
          </div>
        </div>
      )}
    </div>
  );
};

interface ItemsFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  typeFilters: Record<string, boolean>;
  onTypeFilterChange: (type: string, checked: boolean) => void;
}

const ItemsFilter: React.FC<ItemsFilterProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  typeFilters,
  onTypeFilterChange
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const itemTypes = [
    'Craftable',
    'Artifact',
    'Emblem',
    'Ornn Item',
    'Radiant'
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center flex-grow">
          <Search className="text-gray-400 absolute ml-3" size={20} />
          <input
            type="text"
            placeholder="Search items by name, type..."
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
              <option value="type">Sort by Type</option>
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
        <div className="mt-4 pt-4 border-t border-gray-700">
          <label className="block text-sm text-gray-300 mb-2">Item Types</label>
          <div className="flex flex-wrap gap-2">
            {itemTypes.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeFilters[type] || false}
                  onChange={(e) => onTypeFilterChange(type, e.target.checked)}
                  className="form-checkbox h-4 w-4 text-yellow-500 rounded focus:ring-yellow-500"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const DetailedItems: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    'Craftable': true,
    'Artifact': true,
    'Emblem': true,
    'Ornn Item': true,
    'Radiant': true
  });

  const { items, loading, error, fetchItems } = useItemsStore();

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold mb-6">Items</h1>
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
          <h2 className="text-2xl font-bold mb-4">Error loading items data</h2>
          <p className="text-gray-400">Please try again later</p>
          <button
            onClick={() => fetchItems()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort items
  let filteredItems = items || [];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter((item: any) =>
      item.name.toLowerCase().includes(query) ||
      (item.type && item.type.toLowerCase().includes(query))
    );
  }

  // Apply type filters
  filteredItems = filteredItems.filter((item: any) =>
    typeFilters[item.type] || false
  );

  // Sort items
  filteredItems.sort((a: any, b: any) => {
    switch (sortBy) {
      case 'type':
        return a.type.localeCompare(b.type);
      case 'play_rate':
        return b.play_rate - a.play_rate;
      case 'avg_placement':
        return a.avg_placement - b.avg_placement;
      default: // name
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Items</h1>
        
        <ItemsFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          typeFilters={typeFilters}
          onTypeFilterChange={(type, checked) => 
            setTypeFilters(prev => ({ ...prev, [type]: checked }))
          }
        />
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-400">No items found</h2>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredItems.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};