import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_SET } from '../lib/graphql';
import { useState } from 'react';

const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const setIdNum = parseInt(setId || '0', 10);
  
  const { loading, error, data } = useQuery(GET_SET, {
    variables: { setId: setIdNum },
    errorPolicy: 'all'
  });

  if (loading) return <div className="text-center py-10">Loading set data...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  if (!data || !data.set) return <div className="text-center py-10">Set not found</div>;

  const { set } = data;

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${set.status === 'archived' ? 'opacity-75' : ''}`}>
      <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
        {set.setName} (Set {set.setId})
        {set.status === 'archived' && (
          <span className="ml-3 text-sm font-normal px-2 py-1 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--text-secondary) 20%, transparent)',
              color: 'var(--text-secondary)'
            }}>
            Archived
          </span>
        )}
      </h1>

      {set.status === 'archived' && (
        <div className="mb-6 rounded-lg border p-4"
          style={{
            borderColor: 'color-mix(in srgb, var(--warning, #f59e0b) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--warning, #f59e0b) 10%, transparent)'
          }}>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--warning, #f59e0b)' }}>⚠</span>
            <span className="font-medium" style={{ color: 'var(--warning, #f59e0b)' }}>Archived Set</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'color-mix(in srgb, var(--warning, #f59e0b) 70%, transparent)' }}>
            This set is no longer active. You can browse champions, traits, and items,
            but cannot create new compositions.
          </p>
        </div>
      )}

      {/* Champions Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Champions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {set.champions?.map((champion: any) => (
            <div 
              key={champion.id} 
              className="p-4 rounded-lg border transition-all duration-300 hover:scale-105"
              style={{ 
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {champion.iconUrl && (
                <img 
                  src={champion.iconUrl} 
                  alt={champion.name} 
                  className="w-16 h-16 mx-auto mb-2 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="font-medium text-center">{champion.name}</h3>
              <p className="text-sm text-center opacity-75">Cost: {champion.cost}</p>
              <div className="mt-2 text-xs">
                {champion.traits?.slice(0, 2).map((trait: string, idx: number) => (
                  <span 
                    key={idx} 
                    className="inline-block mr-1 px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'var(--bg-accent)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Traits Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Traits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {set.traits?.map((trait: any) => (
            <div 
              key={trait.key} 
              className="p-4 rounded-lg border"
              style={{ 
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <h3 className="font-semibold text-lg mb-2">{trait.name || trait.key}</h3>
              <p className="text-sm mb-3 opacity-90">{trait.description}</p>
              <div className="text-sm">
                <h4 className="font-medium mb-2" style={{ color: 'var(--accent1)' }}>Breakpoints:</h4>
                <ul className="space-y-1">
                  {trait.breakpoints?.map((breakpoint: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <span>{breakpoint.count} units:</span>
                      <span className="font-mono">{breakpoint.bonus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Items Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {set.items?.map((item: any) => (
            <div 
              key={item.id} 
              className="p-3 rounded-lg border text-center"
              style={{ 
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-12 h-12 mx-auto mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="text-sm font-medium">{item.name}</h3>
              <p className="text-xs opacity-75 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Augments Section */}
      {set.augments && set.augments.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Augments</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {set.augments.map((augment: any) => (
              <div 
                key={augment.id} 
                className="p-3 rounded-lg border text-center"
                style={{ 
                  border: '1px solid var(--bg-accent)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                {augment.imageUrl && (
                  <img 
                    src={augment.imageUrl} 
                    alt={augment.name} 
                    className="w-12 h-12 mx-auto mb-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <h3 className="text-sm font-medium">{augment.name}</h3>
                <p className="text-xs opacity-75 mt-1">{augment.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SetDetail;