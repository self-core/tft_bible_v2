import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Star, Shield, Zap, Target, Eye, ThumbsUp } from 'lucide-react';
import { AugmentSummary, AugmentQuery } from '../lib/api';
import { useAugmentsStore } from '../stores';

const Augments = () => {
  const [filters, setFilters] = useState<AugmentQuery>({
    limit: 20,
  });

  const { augments, loading, error, fetchAugments, clearError } = useAugmentsStore();

  // Fetch augments when filters change
  useEffect(() => {
    fetchAugments(filters);
  }, [filters, fetchAugments]);

  const handleFilterChange = (key: keyof AugmentQuery, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filtering
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'offensive': return { textColor: 'var(--accent2)', bgColor: 'rgba(239, 68, 68, 0.2)' };
      case 'defensive': return { textColor: 'var(--accent1)', bgColor: 'rgba(59, 130, 246, 0.2)' };
      case 'utility': return { textColor: 'var(--accent3)', bgColor: 'rgba(16, 185, 129, 0.2)' };
      case 'gold': return { textColor: '#FBBF24', bgColor: 'rgba(251, 191, 36, 0.2)' };
      default: return { textColor: 'var(--text-secondary)', bgColor: 'var(--bg-accent)' };
    }
  };

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
        <button
          onClick={() => fetchAugments(filters)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Augments</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Explore all TFT augments and their effects</p>
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
            <option value="Offensive" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Offensive</option>
            <option value="Defensive" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Defensive</option>
            <option value="Utility" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Utility</option>
            <option value="Gold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Gold</option>
          </select>

          <input
            type="text"
            placeholder="Search augments..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="rounded-lg px-3 py-2 focus:ring-2 focus:ring-tft-gold focus:border-transparent"
            style={{
              border: '1px solid var(--bg-primary)',
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)'
            }}
          />

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
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {augments.map((augment: AugmentSummary) => (
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
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    color: getCategoryColor(augment.category).textColor,
                    backgroundColor: getCategoryColor(augment.category).bgColor
                  }}
                >
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
        ))}
      </div>

      {augments.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>No augments found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Augments;