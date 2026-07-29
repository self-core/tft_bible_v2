import { useState, useEffect } from 'react'
import { useTraitsStore } from '../stores'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Trait } from '../lib/api'

const Traits = () => {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { traits, loading, error, fetchTraits } = useTraitsStore()

  useEffect(() => {
    fetchTraits()
  }, [fetchTraits])

  const filtered = traits.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.key?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
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
        <p className="text-red-600">Failed to load traits. Please try again.</p>
        <button onClick={() => fetchTraits()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Traits</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Explore all TFT traits and their breakpoints</p>
        </div>
      </div>

      <div className="rounded-lg shadow-sm border p-6" style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
        </div>
        <input
          type="text"
          placeholder="Search traits..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
          style={{ border: '1px solid var(--bg-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((trait: Trait) => (
          <div
            key={trait.key}
            className="rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{trait.name || trait.key}</h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  {trait.breakpoints?.length || 0} tiers
                </span>
              </div>

              {trait.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{trait.description}</p>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => toggleExpand(trait.key)}
                  className="flex items-center gap-1 text-sm font-medium"
                  style={{ color: 'var(--accent1)' }}
                >
                  {expanded[trait.key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Breakpoints
                </button>
                {(expanded[trait.key] ? trait.breakpoints : trait.breakpoints?.slice(0, 2))?.map((bp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded text-sm" style={{ background: 'var(--bg-secondary)' }}>
                    <span className="font-medium" style={{ color: 'var(--accent1)' }}>{bp.count}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{bp.bonus}</span>
                  </div>
                ))}
                {!expanded[trait.key] && trait.breakpoints?.length > 2 && (
                  <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                    +{trait.breakpoints.length - 2} more breakpoints
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No traits found.</p>
        </div>
      )}
    </div>
  )
}

export default Traits
