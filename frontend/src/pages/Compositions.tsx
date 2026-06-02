import { useEffect } from 'react'
import { useCompositionsStore } from '../stores'
import { Link } from 'react-router-dom'
import { Filter, Star, Target } from 'lucide-react'
import { Composition } from '../lib/api'

const Compositions = () => {
  const { compositions, loading, error, fetchCompositions } = useCompositionsStore()

  useEffect(() => {
    fetchCompositions()
  }, [fetchCompositions])

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
            onClick={() => fetchCompositions()}
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
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Compositions</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Browse all team compositions
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compositions?.map((comp: Composition) => (
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
                  {comp.title}
                </h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  {comp.difficulty || 'N/A'}
                </span>
              </div>

              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {comp.description || 'No description'}
              </p>

              <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><Star className="h-4 w-4" style={{ color: 'var(--accent1)' }} /> {comp.setId}</span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {comp.championIds?.length || 0} champions</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {compositions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No compositions found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Compositions