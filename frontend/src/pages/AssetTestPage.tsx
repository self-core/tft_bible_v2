import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Sword, Shield, Zap, Target, Eye, ThumbsUp, Star, Book, Users, Package } from 'lucide-react';
import { championsApi, itemsApi, augmentsApi, ChampionSummary, ItemSummary, AugmentSummary } from '../lib/api';
import { useChampionsStore, useItemsStore, useAugmentsStore } from '../stores';

const AssetTestPage = () => {
  const [activeTab, setActiveTab] = useState<'champions' | 'items' | 'augments'>('champions');
  const [searchQuery, setSearchQuery] = useState('');

  const { champions: championsData, loading: championsLoading, error: championsError, fetchChampions } = useChampionsStore();
  const { items: itemsData, loading: itemsLoading, error: itemsError, fetchItems } = useItemsStore();
  const { augments: augmentsData, loading: augmentsLoading, error: augmentsError, fetchAugments } = useAugmentsStore();

  // Fetch data on mount
  useEffect(() => {
    fetchChampions({ limit: 12 });
    fetchItems({ limit: 12 });
    fetchAugments({ limit: 12 });
  }, [fetchChampions, fetchItems, fetchAugments]);

  const getCostColor = (cost: number) => {
    switch (cost) {
      case 1: return 'text-gray-600 bg-gray-100';
      case 2: return 'text-green-600 bg-green-100';
      case 3: return 'text-blue-600 bg-blue-100';
      case 4: return 'text-purple-600 bg-purple-100';
      case 5: return 'text-tft-gold bg-tft-gold/10';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'basic': return 'text-gray-600 bg-gray-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'artifact': return 'text-purple-600 bg-purple-100';
      case 'ornn item': return 'text-red-600 bg-red-100';
      case 'radiant': return 'text-yellow-600 bg-yellow-100';
      case 'trait': return 'text-tft-gold bg-tft-gold/10';
      case 'offensive': return 'text-tft-red bg-tft-red/10';
      case 'defensive': return 'text-tft-blue bg-tft-blue/10';
      case 'utility': return 'text-tft-green bg-tft-green/10';
      case 'gold': return 'text-tft-gold bg-tft-gold/10';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
    </div>
  );

  const renderErrorState = (error: any) => (
    <div className="text-center py-12">
      <p className="text-red-600">Failed to load assets. Please try again.</p>
    </div>
  );

  // Filter data based on search query
  const filterData = (data: any[], query: string) => {
    if (!query) return data;
    const lowerQuery = query.toLowerCase();
    return data.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.traits && item.traits.some((trait: string) => trait.toLowerCase().includes(lowerQuery))) ||
      (item.category && item.category.toLowerCase().includes(lowerQuery))
    );
  };

  const filteredChampions = filterData(championsData || [], searchQuery);
  const filteredItems = filterData(itemsData || [], searchQuery);
  const filteredAugments = filterData(augmentsData || [], searchQuery);

  // Render champion asset card
  const renderChampionCard = (champion: ChampionSummary) => {
    return (
      <div
        key={champion.id}
        className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
        style={{
          background: 'var(--bg-accent)',
          border: '1px solid var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors" style={{ color: 'var(--text-primary)' }}>
              {champion.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCostColor(champion.cost)}`}>
              {champion.cost} Cost
            </span>
          </div>

          {/* Champion icon display */}
          {champion.icon_url ? (
            <div className="w-20 h-20 mx-auto mb-3 rounded object-cover">
              <img 
                src={champion.icon_url} 
                alt={champion.name}
                className="w-full h-full rounded object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.style.display = 'none';
                  // Show fallback
                  const fallback = target.parentElement?.querySelector('.fallback-champ-icon') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-3 rounded flex items-center justify-center bg-gray-200 fallback-champ-icon">
              <span className="text-lg font-bold">{champion.name.charAt(0)}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Sword className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <span>AD: {champion.attack_damage.toFixed(0)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Shield className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <span>HP: {champion.health.toFixed(0)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Zap className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
              <span>{champion.ability_name}</span>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {champion.traits.slice(0, 3).map((trait_name, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-accent)'
                  }}
                >
                  {trait_name}
                </span>
              ))}
              {champion.traits.length > 3 && (
                <span 
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--bg-accent)'
                  }}
                >
                  +{champion.traits.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render item asset card
  const renderItemCard = (item: ItemSummary) => {
    return (
      <div
        key={item.id}
        className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
        style={{
          background: 'var(--bg-accent)',
          border: '1px solid var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors" style={{ color: 'var(--text-primary)' }}>
              {item.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
          </div>

          {/* Item icon display */}
          {item.icon_url ? (
            <div className="w-16 h-16 mx-auto mb-3 rounded object-cover">
              <img 
                src={item.icon_url} 
                alt={item.name}
                className="w-full h-full rounded object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.style.display = 'none';
                  // Show fallback
                  const fallback = target.parentElement?.querySelector('.fallback-item-icon') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto mb-3 rounded flex items-center justify-center bg-gray-200 fallback-item-icon">
              <span className="text-lg font-bold">{item.name.charAt(0)}</span>
            </div>
          )}

          <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
            {item.description}
          </p>

          <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                <span>{item.priority}</span>
              </div>
              {item.is_unique && (
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  <span>Unique</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" style={{ color: 'var(--accent1)' }} />
              <span>{item.item_type}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render augment asset card
  const renderAugmentCard = (augment: AugmentSummary) => {
    return (
      <div
        key={augment.id}
        className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
        style={{
          background: 'var(--bg-accent)',
          border: '1px solid var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors" style={{ color: 'var(--text-primary)' }}>
              {augment.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(augment.category)}`}>
              {augment.category}
            </span>
          </div>

          {/* Augment icon display */}
          {augment.icon_url ? (
            <div className="w-16 h-16 mx-auto mb-3 rounded object-cover">
              <img 
                src={augment.icon_url} 
                alt={augment.name}
                className="w-full h-full rounded object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.style.display = 'none';
                  // Show fallback
                  const fallback = target.parentElement?.querySelector('.fallback-augment-icon') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto mb-3 rounded flex items-center justify-center bg-gray-200 fallback-augment-icon">
              <span className="text-lg font-bold">{augment.name.charAt(0)}</span>
            </div>
          )}

          <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
            {augment.description}
          </p>

          <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                <span>{augment.priority}</span>
              </div>
              {augment.is_unique && (
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  <span>Unique</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" style={{ color: 'var(--accent1)' }} />
              <span>{augment.tier}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Test Page</h1>
          <p className="text-gray-600 mt-1">Verify that all champion, item, and augment icons are loading correctly</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg shadow-sm border p-6" style={{ 
        background: 'var(--bg-accent)', 
        border: '1px solid var(--bg-primary)' 
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          >
            <option value="champions" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Champions</option>
            <option value="items" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Items</option>
            <option value="augments" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Augments</option>
          </select>

          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          />

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-tft-gold text-gray-900"
            style={{ 
              backgroundColor: 'var(--accent1)',
              color: 'var(--bg-primary)'
            }}
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Results based on active tab */}
      <div>
        {activeTab === 'champions' && (
          <div>
            {championsLoading && renderLoadingState()}
            {championsError && renderErrorState(championsError)}
            {!championsLoading && !championsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredChampions.map((champion: ChampionSummary) => 
                  renderChampionCard(champion)
                )}
              </div>
            )}
            {filteredChampions.length === 0 && !championsLoading && !championsError && (
              <div className="text-center py-12">
                <p style={{ color: 'var(--text-secondary)' }}>No champions found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            {itemsLoading && renderLoadingState()}
            {itemsError && renderErrorState(itemsError)}
            {!itemsLoading && !itemsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item: ItemSummary) => 
                  renderItemCard(item)
                )}
              </div>
            )}
            {filteredItems.length === 0 && !itemsLoading && !itemsError && (
              <div className="text-center py-12">
                <p style={{ color: 'var(--text-secondary)' }}>No items found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'augments' && (
          <div>
            {augmentsLoading && renderLoadingState()}
            {augmentsError && renderErrorState(augmentsError)}
            {!augmentsLoading && !augmentsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAugments.map((augment: AugmentSummary) => 
                  renderAugmentCard(augment)
                )}
              </div>
            )}
            {filteredAugments.length === 0 && !augmentsLoading && !augmentsError && (
              <div className="text-center py-12">
                <p style={{ color: 'var(--text-secondary)' }}>No augments found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetTestPage;