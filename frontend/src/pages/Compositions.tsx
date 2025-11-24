import { useState, useEffect } from 'react'
import { useCompositionsStore } from '../stores'
import { Link } from 'react-router-dom'
import { Filter, Star, Eye, ThumbsUp, ExternalLink, Target } from 'lucide-react'
import { compositionsApi, CompositionSummary, CompositionQuery } from '../lib/api'

const Compositions = () => {
  const [filters, setFilters] = useState<CompositionQuery>({
    limit: 12,
    offset: 0,
  })
  
  const { compositions, loading, error, fetchCompositions, clearError, totalPages, currentPage } = useCompositionsStore()

  // Fetch compositions when filters change
  useEffect(() => {
    fetchCompositions(filters)
  }, [filters, fetchCompositions])

  const handleFilterChange = (key: keyof CompositionQuery, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filtering
    }))
  }

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'S': return { textColor: 'var(--accent1)', bgColor: 'var(--accent1)' } // Gold theme
      case 'A': return { textColor: 'var(--accent2)', bgColor: 'var(--accent2)' } // Blue theme
      case 'B': return { textColor: 'var(--accent3)', bgColor: 'var(--accent3)' } // Green theme
      case 'C': return { textColor: 'var(--text-secondary)', bgColor: 'var(--bg-secondary)' } // Gray theme
      case 'D': return { textColor: 'var(--accent2)', bgColor: 'var(--accent2)' } // Red theme
      default: return { textColor: 'var(--text-secondary)', bgColor: 'var(--bg-secondary)' }
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Compositions</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            This might be because the backend server is not running or there are connection issues.
          </p>
          <button
            onClick={() => fetchCompositions(filters)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
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
      <div className="rounded-lg shadow-sm border p-6" style={{ 
        background: 'var(--bg-accent)', 
        border: '1px solid var(--bg-primary)' 
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.tier || ''}
            onChange={(e) => handleFilterChange('tier', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Tiers</option>
            <option value="S" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>S Tier</option>
            <option value="A" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>A Tier</option>
            <option value="B" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>B Tier</option>
            <option value="C" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>C Tier</option>
            <option value="D" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>D Tier</option>
          </select>

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
            <option value="Frontline" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Frontline</option>
            <option value="Reroll" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Reroll</option>
            <option value="Vertical" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Vertical</option>
            <option value="Horizontal" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Horizontal</option>
          </select>

          <input
            type="text"
            placeholder="Search compositions..."
            value={filters.champion || ''}
            onChange={(e) => handleFilterChange('champion', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          />

          <select
            value={filters.difficulty || ''}
            onChange={(e) => handleFilterChange('difficulty', e.target.value ? Number(e.target.value) : '')}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          >
            <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Difficulties</option>
            <option value="1" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Very Easy (1)</option>
            <option value="2" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Easy (2)</option>
            <option value="3" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Medium (3)</option>
            <option value="4" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Hard (4)</option>
            <option value="5" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Very Hard (5)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compositions?.map((comp: CompositionSummary) => (
          <Link
            key={comp.id}
            to={`/compositions/${comp.id}`}
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
                  {comp.name}
                </h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ color: getTierColor(comp.tier).textColor, backgroundColor: getTierColor(comp.tier).bgColor }}>
                  {comp.tier}
                </span>
              </div>

              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {comp.category} • Difficulty: {comp.difficulty || 'N/A'}/5
              </p>

              {/* Champion row with actual champion data */}
              <div className="flex items-center gap-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-xs">Champions:</span>
                <div className="flex -space-x-1 overflow-x-auto max-w-full">
                  {comp.champions?.slice(0, 5).map((champion, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-[8px] font-bold relative"
                      style={{
                        background: 'var(--bg-primary)',
                        borderColor: 'var(--bg-accent)',
                        color: 'var(--text-primary)',
                        width: '24px',
                        height: '24px'
                      }} title={champion?.name}>
                      {champion?.icon_url ? (
                        <img
                          src={champion?.icon_url}
                          alt={champion?.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show fallback
                            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <span className="fallback-icon flex items-center justify-center w-full h-full">
                          {champion?.name?.substring(0, 2)}
                        </span>
                      )}
                    </div>
                  ))}
                  {comp.champions && comp.champions.length > 5 && (
                    <div className="w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-[8px] font-bold"
                      style={{ 
                        background: 'var(--bg-accent)', 
                        borderColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        width: '24px',
                        height: '24px'
                      }} title={`+${comp.champions.length - 5} more`}>
                      +{comp.champions.length - 5}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                    <span>{comp.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                    <span>{comp.upvotes || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" style={{ color: 'var(--accent1)' }} />
                      <span>{comp.winrate ? comp.winrate.toFixed(1) : 'N/A'}%</span>
                    </div>
                    {comp.builder_code && (
                      <div className="flex items-center gap-1" style={{ color: 'var(--accent2)' }}>
                        <ExternalLink className="h-3 w-3" style={{ color: 'var(--accent2)' }} />
                        <span className="text-xs">Builder</span>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/team-builder?composition=${comp.id}`}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-tft-gold hover:text-gray-900"
                    style={{ color: 'var(--accent3)' }}
                  >
                    <Target className="h-3 w-3" />
                    Build Team
                  </Link>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset || 0) + (prev.limit || 12) }))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {compositions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No compositions found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Compositions