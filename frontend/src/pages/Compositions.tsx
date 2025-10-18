import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Filter, Star, Eye, ThumbsUp } from 'lucide-react'
import { compositionsApi, CompositionSummary, CompositionQuery } from '../lib/api'

const Compositions = () => {
  const [filters, setFilters] = useState<CompositionQuery>({
    limit: 12,
    offset: 0,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['compositions', filters],
    queryFn: () => compositionsApi.getCompositions(filters),
  })

  const handleFilterChange = (key: keyof CompositionQuery, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filtering
    }))
  }

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'S': return 'text-tft-gold bg-tft-gold/10'
      case 'A': return 'text-tft-blue bg-tft-blue/10'
      case 'B': return 'text-tft-green bg-tft-green/10'
      case 'C': return 'text-gray-600 bg-gray-100'
      case 'D': return 'text-tft-red bg-tft-red/10'
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
        <p className="text-red-600">Failed to load compositions. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Compositions</h1>
          <p className="text-gray-600 mt-1">Discover winning TFT strategies and team builds</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.tier || ''}
            onChange={(e) => handleFilterChange('tier', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          >
            <option value="">All Tiers</option>
            <option value="S">S Tier</option>
            <option value="A">A Tier</option>
            <option value="B">B Tier</option>
            <option value="C">C Tier</option>
            <option value="D">D Tier</option>
          </select>

          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="Frontline">Frontline</option>
            <option value="Reroll">Reroll</option>
            <option value="Vertical">Vertical</option>
            <option value="Horizontal">Horizontal</option>
          </select>

          <input
            type="text"
            placeholder="Search compositions..."
            value={filters.champion || ''}
            onChange={(e) => handleFilterChange('champion', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          />

          <select
            value={filters.difficulty || ''}
            onChange={(e) => handleFilterChange('difficulty', Number(e.target.value) || undefined)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          >
            <option value="">All Difficulties</option>
            <option value="1">Very Easy (1)</option>
            <option value="2">Easy (2)</option>
            <option value="3">Medium (3)</option>
            <option value="4">Hard (4)</option>
            <option value="5">Very Hard (5)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data.map((comp: CompositionSummary) => (
          <Link
            key={comp.id}
            to={`/compositions/${comp.id}`}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-tft-gold transition-colors">
                  {comp.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(comp.tier)}`}>
                  {comp.tier}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {comp.category} • Difficulty: {comp.difficulty}/5
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{comp.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{comp.upvotes}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-tft-gold" />
                  <span>{comp.winrate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, (prev.offset || 0) - (prev.limit || 12)) }))}
              disabled={(filters.offset || 0) === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-gray-700">
              Page {data.page} of {data.total_pages}
            </span>

            <button
              onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 12) }))}
              disabled={data.page >= data.total_pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {data?.data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No compositions found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Compositions