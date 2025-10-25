import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Star, Shield, Sword, Zap } from 'lucide-react'
import { itemsApi, ItemSummary, ItemQuery } from '../lib/api'

const Items = () => {
  const [filters, setFilters] = useState<ItemQuery>({
    limit: 20,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', filters],
    queryFn: () => itemsApi.getItems(filters).then(res => res.data),
  })

  const handleFilterChange = (key: keyof ItemQuery, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filtering
    }))
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ad': return <Sword className="h-4 w-4" />
      case 'ap': return <Zap className="h-4 w-4" />
      case 'tank': return <Shield className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ad': return 'text-tft-red bg-tft-red/10'
      case 'ap': return 'text-tft-blue bg-tft-blue/10'
      case 'tank': return 'text-tft-green bg-tft-green/10'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load items. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600 mt-1">Browse all TFT items and their effects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg shadow-sm border p-6" style={{ 
        background: 'var(--bg-accent)', 
        border: '1px solid var(--bg-primary)' 
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Categories</option>
            <option value="AD" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Attack Damage</option>
            <option value="AP" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Ability Power</option>
            <option value="Tank" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Tank</option>
            <option value="Utility" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Utility</option>
          </select>

          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Types</option>
            <option value="Component" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Component</option>
            <option value="Completed" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Completed</option>
            <option value="Radiant" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Radiant</option>
            <option value="Artifact" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Artifact</option>
          </select>

          <input
            type="text"
            placeholder="Search items..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
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
        {data?.data.map((item: ItemSummary) => (
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
                <div className="flex items-center gap-2">
                  {getCategoryIcon(item.category)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`} style={{ 
                    color: getCategoryColor(item.category).includes('text-tft-red') ? 'var(--text-primary)' : 
                           getCategoryColor(item.category).includes('text-tft-blue') ? 'var(--accent2)' : 
                           getCategoryColor(item.category).includes('text-tft-green') ? 'var(--accent3)' : 
                           'var(--text-secondary)',
                    backgroundColor: getCategoryColor(item.category).includes('bg-tft-red') ? 'var(--accent2)' : 
                                     getCategoryColor(item.category).includes('bg-tft-blue') ? 'var(--accent2)' : 
                                     getCategoryColor(item.category).includes('bg-tft-green') ? 'var(--accent3)' : 
                                     'var(--bg-secondary)'
                  }}>
                    {item.category}
                  </span>
                </div>
              </div>

              <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>

              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" style={{ color: 'var(--accent1)' }} />
                    {item.priority}
                  </span>
                  {item.is_unique && (
                    <span className="px-2 py-1 rounded text-xs" style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      color: 'var(--accent2)',
                      border: '1px solid var(--bg-accent)'
                    }}>
                      Unique
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {item.item_type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, (prev.offset || 0) - (prev.limit || 20)) }))}
              disabled={(filters.offset || 0) === 0}
              className="px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--bg-accent)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Previous
            </button>

            <span className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>
              Page {data.page} of {data.total_pages}
            </span>

            <button
              onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 20) }))}
              disabled={data.page >= data.total_pages}
              className="px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--bg-accent)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {data?.data.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No items found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Items