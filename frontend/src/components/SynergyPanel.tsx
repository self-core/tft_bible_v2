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
    <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
      {/* Set label */}
      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{setLabel}</div>

      {/* Board size selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Board Size</label>
        <div className="flex gap-1">
          {[5, 6, 7, 8, 9, 10].map(n => (
            <button
              key={n}
              onClick={() => onFiltersChange({ ...filters, boardSize: n })}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                filters.boardSize === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Cost toggles */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Costs</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(c => (
            <button
              key={c}
              onClick={() => {
                const was = filters.enabledCosts.includes(c);
                const next = was
                  ? filters.enabledCosts.filter(x => x !== c)
                  : [...filters.enabledCosts, c].sort();
                onFiltersChange({ ...filters, enabledCosts: next });
              }}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                filters.enabledCosts.includes(c)
                  ? `${costColors[c]} border-current`
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}
            >
              {c}★
            </button>
          ))}
        </div>
      </div>

      {/* Active Traits */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Active Traits ({activeCount} units)</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activeTraits.map(({ trait, currentCount, nextBreakpoint, isActive }) => (
            <div key={trait.key} className={`text-xs ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{trait.name}</span>
                <span className="text-gray-500">
                  {currentCount}/{nextBreakpoint?.count || trait.breakpoints?.[0]?.count || '—'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                {nextBreakpoint && (
                  <div
                    className={`h-1.5 rounded-full transition-all ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
                    style={{ width: `${Math.min(100, (currentCount / nextBreakpoint.count) * 100)}%` }}
                  />
                )}
              </div>
            </div>
          ))}
          {activeTraits.length === 0 && (
            <p className="text-xs text-gray-400 italic">No trait data available</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Next Champion</h3>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={rec.champion.id} className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-xs font-bold text-gray-400 w-4 pt-1">{i + 1}</span>
              {rec.champion.imageUrl && (
                <img src={proxyUrl(rec.champion.imageUrl)} alt={rec.champion.name} className="w-8 h-8 rounded border border-gray-300" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{rec.champion.name}</span>
                  <span className={`text-xs px-1 rounded ${
                    costColors[rec.champion.cost]?.split(' ')[0] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {rec.champion.cost}★
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">{rec.champion.traits.join(', ')}</div>
                <div className="text-xs text-blue-600 font-medium">+{rec.totalScore} pts</div>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              {board.length >= filters.boardSize ? 'Board is full' : 'No champions match filters'}
            </p>
          )}
        </div>
      </div>

      {/* Optimize button */}
      {board.length < filters.boardSize && board.length > 0 && (
        <div>
          <button
            onClick={() => {
              const filled = optimizedBoard.slice(board.length);
              console.log('Optimized additions:', filled.map(c => c.name));
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
          >
            ✨ Optimize Board ({filters.boardSize - board.length} slots)
          </button>
          {optimizedBoard.length > board.length && (
            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Suggested additions:</p>
              <div className="space-y-1">
                {optimizedBoard.slice(board.length).map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                    {c.imageUrl && <img src={proxyUrl(c.imageUrl)} alt={c.name} className="w-5 h-5 rounded border border-gray-300" />}
                    <span>{c.name}</span>
                    <span className={`text-xs px-1 rounded ${costColors[c.cost]?.split(' ')[0] || 'bg-gray-100'}`}>{c.cost}★</span>
                    <span className="text-gray-400 truncate">{c.traits.join(', ')}</span>
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
