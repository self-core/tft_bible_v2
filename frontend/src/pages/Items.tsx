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
      case 'ad': return 'text-red-600 bg-red-100'
      case 'ap': return 'text-blue-600 bg-blue-100'
      case 'tank': return 'text-green-600 bg-green-100'
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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="AD">Attack Damage</option>
            <option value="AP">Ability Power</option>
            <option value="Tank">Tank</option>
            <option value="Utility">Utility</option>
          </select>

          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="Component">Component</option>
            <option value="Completed">Completed</option>
            <option value="Radiant">Radiant</option>
            <option value="Artifact">Artifact</option>
          </select>

          <input
            type="text"
            placeholder="Search items..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.data.map((item: ItemSummary) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-tft-gold transition-colors">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(item.category)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {item.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-tft-gold" />
                    {item.priority}
                  </span>
                  {item.is_unique && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      Unique
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {item.item_type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Items