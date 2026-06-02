import { useState, useEffect } from 'react';
import { Filter, SearchIcon } from 'lucide-react';
import { useAugmentsStore } from '../stores';
import { Augment } from '../lib/api';

const Augments = () => {
  const [search, setSearch] = useState('');

  const { augments, loading, error, fetchAugments } = useAugmentsStore();

  useEffect(() => {
    fetchAugments();
  }, [fetchAugments]);

  const filtered = augments.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tft-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load augments. Please try again.</p>
        <button onClick={() => fetchAugments()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Augments</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Explore all TFT augments and their effects</p>
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
            placeholder="Search augments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{ border: '1px solid var(--bg-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((augment: Augment) => (
          <div
            key={augment.id}
            className="rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
            style={{ background: 'var(--bg-accent)', border: '1px solid var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold group-hover:text-tft-gold transition-colors mb-3" style={{ color: 'var(--text-primary)' }}>
                {augment.name}
              </h3>

              {augment.imageUrl ? (
                <div className="w-16 h-16 mx-auto mb-3">
                  <img src={augment.imageUrl} alt={augment.name} className="w-full h-full rounded object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto mb-3 rounded flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                  <span className="text-lg font-bold">{augment.name.charAt(0)}</span>
                </div>
              )}

              <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                {augment.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No augments found.</p>
        </div>
      )}
    </div>
  );
};

export default Augments;