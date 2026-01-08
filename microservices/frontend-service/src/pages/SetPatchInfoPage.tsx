import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_SETS } from '../lib/graphql';
import { Set } from '../types';

const SetPatchInfoPage: React.FC = () => {
  const { data, loading, error } = useQuery(GET_SETS);

  if (loading) return <div className="container mx-auto p-4">Loading set information...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">Error loading set information: {error.message}</div>;

  const sets: Set[] = data?.sets || [];

  return (
    <div className="container mx-auto p-4 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>TFT Sets, Patches & Lore</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Detailed information about current and past TFT sets, patches, and lore</p>
      </div>

      <div className="space-y-6">
        {sets.map((set: Set) => (
          <div
            key={set.setId}
            className="rounded-xl shadow-md p-6"
            style={{
              background: 'var(--bg-accent)',
              border: '1px solid var(--bg-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{set.setName}</h2>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Set ID: {set.setId}</p>
              </div>
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: 'var(--accent1)',
                  color: 'var(--bg-primary)'
                }}
              >
                Active
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Champions</h3>
                <p
                  className="text-3xl font-bold text-center"
                  style={{ color: 'var(--accent1)' }}
                >
                  {set.champions.length}
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Traits</h3>
                <p
                  className="text-3xl font-bold text-center"
                  style={{ color: 'var(--accent2)' }}
                >
                  {set.traits.length}
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Augments</h3>
                <p
                  className="text-3xl font-bold text-center"
                  style={{ color: 'var(--accent3)' }}
                >
                  {set.augments.length}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Set Theme & Lore</h3>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <p style={{ color: 'var(--text-primary)' }}>Each TFT set features a unique theme and lore from the League of Legends universe:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1" style={{ color: 'var(--text-primary)' }}>
                  <li>Rich backstory connecting to Runeterra's history</li>
                  <li>Character relationships and faction dynamics</li>
                  <li>Visual and narrative elements that enhance gameplay</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Set Mechanics</h3>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <p style={{ color: 'var(--text-primary)' }}>This set features unique mechanics that change gameplay:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1" style={{ color: 'var(--text-primary)' }}>
                  <li>Unique board setup or game rules</li>
                  <li>Special item or trait interactions</li>
                  <li>Dynamic gameplay elements</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Patch Notes</h3>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                {set.patch_notes && set.patch_notes.length > 0 ? (
                  set.patch_notes.map((patch: any, index: number) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Patch: {patch.version || 'N/A'}</h4>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{patch.release_date ? new Date(patch.release_date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1" style={{ color: 'var(--text-primary)' }}>
                        {(patch.changes || []).map((change: string, idx: number) => (
                          <li key={idx}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="italic" style={{ color: 'var(--text-secondary)' }}>No patch notes available for this set.</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Top Meta Compositions</h3>
              {set.compositions && set.compositions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {set.compositions.slice(0, 3).map((composition: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-lg p-4 hover:shadow-md transition-shadow"
                      style={{
                        border: '1px solid var(--bg-primary)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{composition.name || 'Unnamed Composition'}</h4>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{composition.description || 'No description available'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {composition.traits?.slice(0, 3).map((trait: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: 'var(--bg-accent)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--bg-primary)'
                            }}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic" style={{ color: 'var(--text-secondary)' }}>No meta compositions available for this set.</p>
              )}
            </div>
          </div>
        ))}

        {/* Additional section for patch history */}
        <div
          className="rounded-xl shadow-md p-6"
          style={{
            background: 'var(--bg-accent)',
            border: '1px solid var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Patch History</h2>
          <div className="space-y-4">
            <div
              className="pl-4 py-1"
              style={{
                borderLeft: '4px solid var(--accent1)',
              }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Patch 15.23</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Released: December 2025 - Balance changes and bug fixes</p>
            </div>
            <div
              className="pl-4 py-1"
              style={{
                borderLeft: '4px solid var(--accent1)',
              }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Patch 15.22</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Released: November 2025 - New augments and item adjustments</p>
            </div>
            <div
              className="pl-4 py-1"
              style={{
                borderLeft: '4px solid var(--accent1)',
              }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Patch 15.21</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Released: October 2025 - Set 15 launch with new champions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPatchInfoPage;