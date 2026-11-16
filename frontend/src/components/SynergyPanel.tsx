import React from 'react';
import { Champion, Trait } from '../lib/api';
import { useSynergy, SynergyFilters } from '../hooks/useSynergy';
import { proxyUrl } from '../lib/imageProxy';

interface SynergyPanelProps {
  setLabel: string;
  champions: Champion[];
  traits: Trait[];
  board: Champion[];
  filters: SynergyFilters;
  onFiltersChange: (filters: SynergyFilters) => void;
}

const costColors: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800 border-blue-300',
  2: 'bg-green-100 text-green-800 border-green-300',
  3: 'bg-purple-100 text-purple-800 border-purple-300',
  4: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  5: 'bg-red-100 text-red-800 border-red-300',
};

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--bg-accent)',
};

const SynergyPanel: React.FC<SynergyPanelProps> = ({
  setLabel,
  champions,
  traits,
  board,
  filters,
  onFiltersChange,
}) => {
  const { recommendations, optimizedBoard, activeTraits } = useSynergy(champions, traits, board, filters);
  const activeCount = board.length;

  return (
    <div className="rounded-xl p-4 space-y-4" style={panelStyle}>
      <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {setLabel}
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
          Board Size
        </label>
        <div className="flex flex-wrap gap-1">
          {[5, 6, 7, 8, 9, 10].map(n => {
            const selected = filters.boardSize === n;
            return (
              <button
                key={n}
                onClick={() => onFiltersChange({ ...filters, boardSize: n })}
                className="px-2 py-1 text-xs rounded border transition-colors"
                style={{
                  background: selected ? 'var(--accent2)' : 'var(--bg-accent)',
                  color: selected ? '#fff' : 'var(--text-secondary)',
                  borderColor: selected ? 'var(--accent2)' : 'var(--bg-accent)',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
          Costs
        </label>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5].map(c => {
            const enabled = filters.enabledCosts.includes(c);
            return (
              <button
                key={c}
                onClick={() => {
                  const next = enabled
                    ? filters.enabledCosts.filter(x => x !== c)
                    : [...filters.enabledCosts, c].sort();
                  onFiltersChange({ ...filters, enabledCosts: next });
                }}
                className={`px-2 py-1 text-xs rounded border transition-all ${
                  enabled ? `${costColors[c]} border-current` : ''
                }`}
                style={enabled ? undefined : {
                  background: 'var(--bg-accent)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--bg-accent)',
                  opacity: 0.6,
                }}
              >
                {c}★
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Active Traits ({activeCount} units)
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {activeTraits.map(({ trait, currentCount, nextBreakpoint, isActive }) => (
            <div key={trait.key} className={`text-xs ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{trait.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {currentCount}/{nextBreakpoint?.count || trait.breakpoints?.[0]?.count || '—'}
                </span>
              </div>
              <div className="w-full rounded-full h-1.5 mt-0.5" style={{ background: 'var(--bg-accent)' }}>
                {nextBreakpoint && (
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (currentCount / nextBreakpoint.count) * 100)}%`,
                      background: isActive ? 'var(--accent1)' : 'var(--text-secondary)',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          {activeTraits.length === 0 && (
            <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>No trait data available</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Next Champion</h3>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div
              key={rec.champion.id}
              className="flex items-start gap-2 p-2 rounded-lg border"
              style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-accent)' }}
            >
              <span className="text-xs font-bold w-4 pt-1" style={{ color: 'var(--text-secondary)' }}>{i + 1}</span>
              {rec.champion.imageUrl && (
                <img
                  src={proxyUrl(rec.champion.imageUrl)}
                  alt={rec.champion.name}
                  className="w-8 h-8 rounded border"
                  style={{ borderColor: 'var(--bg-primary)' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{rec.champion.name}</span>
                  <span className={`text-xs px-1 rounded ${
                    costColors[rec.champion.cost]?.split(' ')[0] || ''
                  }`}>
                    {rec.champion.cost}★
                  </span>
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{rec.champion.traits.join(', ')}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--accent1)' }}>+{rec.totalScore} pts</div>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
              {board.length >= filters.boardSize ? 'Board is full' : 'No champions match filters'}
            </p>
          )}
        </div>
      </div>

      {board.length < filters.boardSize && board.length > 0 && (
        <div>
          <button
            onClick={() => {
              const filled = optimizedBoard.slice(board.length);
              console.log('Optimized additions:', filled.map(c => c.name));
            }}
            className="w-full py-2 px-3 text-sm font-semibold rounded-lg transition-all shadow-sm"
            style={{ background: 'var(--accent2)', color: '#fff' }}
          >
            Optimize Board ({filters.boardSize - board.length} slots)
          </button>
          {optimizedBoard.length > board.length && (
            <div
              className="mt-2 p-2 rounded border"
              style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-accent)' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Suggested additions:</p>
              <div className="space-y-1">
                {optimizedBoard.slice(board.length).map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>
                    {c.imageUrl && (
                      <img
                        src={proxyUrl(c.imageUrl)}
                        alt={c.name}
                        className="w-5 h-5 rounded border"
                        style={{ borderColor: 'var(--bg-primary)' }}
                      />
                    )}
                    <span>{c.name}</span>
                    <span className={`text-xs px-1 rounded ${costColors[c.cost]?.split(' ')[0] || ''}`}>{c.cost}★</span>
                    <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{c.traits.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SynergyPanel;
