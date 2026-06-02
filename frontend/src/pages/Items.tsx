import { useState, useEffect } from 'react'
import { useItemsStore } from '../stores'
import { Filter, SearchIcon, Shield, Package } from 'lucide-react'
import { Item } from '../lib/api'

const Items = () => {
  const [search, setSearch] = useState('')

  const { items, loading, error, fetchItems } = useItemsStore()

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  )

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
        <p className="text-red-600">Failed to load items. Please try again.</p>
        <button onClick={() => fetchItems()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Items</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Browse all TFT items and their effects</p>
        </div>
      </div>

      <div className="rounded-lg shadow-sm border p-6" style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filter</h3>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{ border: '1px solid var(--bg-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((item: Item) => (
          <div
            key={item.id}
            className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
            style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <div className="p-6">
              {item.imageUrl ? (
                <div className="flex justify-center mb-4">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              ) : (
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                    <Package className="h-8 w-8" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors text-center mb-3" style={{ color: 'var(--text-primary)' }}>
                {item.name}
              </h3>

              <p className="text-sm mb-4 line-clamp-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>

              <div className="flex items-center justify-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {item.components && item.components.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {item.components.length} components
                  </span>
                )}
                {item.unique && (
                  <span className="px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--accent1)' }}>
                    Unique
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No items found.</p>
        </div>
      )}
    </div>
  )
}

export default Items