import { useState, useEffect } from 'react'
import { useChampionsStore } from '../stores'
import { Filter, Sword, Shield, Zap } from 'lucide-react'
import { ChampionSummary, ChampionQuery } from '../lib/api'

const Champions = () => {
  const [filters, setFilters] = useState<ChampionQuery>({
    limit: 20,
  })
  
  const { champions, loading, error, fetchChampions, clearError } = useChampionsStore()

  // Fetch champions when filters change
  useEffect(() => {
    fetchChampions(filters)
  }, [filters, fetchChampions])

  const handleFilterChange = (key: keyof ChampionQuery, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filtering
    }))
  }

  const getCostColor = (cost: number) => {
    switch (cost) {
      case 1: return 'text-gray-600 bg-gray-100'
      case 2: return 'text-green-600 bg-green-100'
      case 3: return 'text-blue-600 bg-blue-100'
      case 4: return 'text-purple-600 bg-purple-100'
      case 5: return 'text-tft-gold bg-tft-gold/10'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load champions. Please try again.</p>
        <button 
          onClick={() => fetchChampions(filters)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Champions</h1>
          <p className="text-gray-600 mt-1">Explore all TFT champions and their abilities</p>
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
            value={filters.cost || ''}
            onChange={(e) => handleFilterChange('cost', e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Costs</option>
            <option value="1" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>1 Cost</option>
            <option value="2" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>2 Cost</option>
            <option value="3" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>3 Cost</option>
            <option value="4" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>4 Cost</option>
            <option value="5" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>5 Cost</option>
          </select>

          <input
            type="text"
            placeholder="Search champions..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          />

          <input
            type="text"
            placeholder="Filter by traits (comma-separated)..."
            value={filters.traits || ''}
            onChange={(e) => handleFilterChange('traits', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {champions.map((champion: ChampionSummary) => (
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
              
              {/* Champion icon display with theme-consistent styling */}
              <div className={`relative mb-4 rounded-lg p-2 ${
                champion.cost === 1 ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-l-2 border-gray-600' :
                champion.cost === 2 ? 'bg-gradient-to-br from-green-800/50 to-green-900/50 border-l-2 border-green-600' :
                champion.cost === 3 ? 'bg-gradient-to-br from-blue-800/50 to-blue-900/50 border-l-2 border-blue-600' :
                champion.cost === 4 ? 'bg-gradient-to-br from-purple-800/50 to-purple-900/50 border-l-2 border-purple-600' : 'bg-gradient-to-br from-yellow-800/50 to-yellow-900/50 border-l-2 border-yellow-600'
              }`}>
                {champion.icon_url ? (
                  <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center bg-gray-800">
                    <img 
                      src={champion.icon_url} 
                      alt={champion.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.style.display = 'none';
                        // Show fallback
                        const fallback = target.parentElement?.querySelector('.fallback-champ-icon');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center bg-gray-800">
                    <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center fallback-champ-icon">
                      <span className="text-2xl font-bold">{champion.name.charAt(0)}</span>
                    </div>
                  </div>
                )}
                {/* Cost badge */}
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  champion.cost === 1 ? 'bg-gray-800 border-gray-600 text-gray-300' :
                  champion.cost === 2 ? 'bg-green-800 border-green-600 text-green-300' :
                  champion.cost === 3 ? 'bg-blue-800 border-blue-600 text-blue-300' :
                  champion.cost === 4 ? 'bg-purple-800 border-purple-600 text-purple-300' : 'bg-yellow-800 border-yellow-600 text-yellow-300'
                }`}>
                  {champion.cost}
                </div>
              </div>

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
                      className="px-2 py-1 rounded-full text-xs font-medium"
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
                      className="px-2 py-1 rounded-full text-xs font-medium"
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
        ))}
      </div>

      {champions.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No champions found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Champions