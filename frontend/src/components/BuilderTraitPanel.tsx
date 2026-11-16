import { useMemo } from 'react';
import type { Trait } from '../lib/api';
import type { BoardChampion } from './TFTBoard';
import { formatBreakpointBonus, resolveTraitStates } from '../lib/traitEngine';

interface BuilderTraitPanelProps {
  units: BoardChampion[];
  traits: Trait[];
}

interface TraitRow {
  key: string;
  name: string;
  count: number;
  activeBreakpoint: { count: number; bonus: string } | null;
  nextBreakpoint: { count: number; bonus: string } | null;
}

function buildRows(units: BoardChampion[], traits: Trait[]): TraitRow[] {
  const onBoard = units.filter(unit => unit.row >= 0);
  const resolved = resolveTraitStates(
    onBoard.map(unit => ({ traitNames: unit.traits })),
    traits,
  );

  return resolved
    .filter(row => row.count > 0)
    .map(row => ({
      key: row.key,
      name: row.name,
      count: row.count,
      activeBreakpoint: row.activeBreakpoint
        ? { count: row.activeBreakpoint.count, bonus: formatBreakpointBonus(row.activeBreakpoint) }
        : null,
      nextBreakpoint: row.nextBreakpoint
        ? { count: row.nextBreakpoint.count, bonus: formatBreakpointBonus(row.nextBreakpoint) }
        : null,
    }))
    .sort((a, b) => {
      const aActive = a.activeBreakpoint ? 1 : 0;
      const bActive = b.activeBreakpoint ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
}

const BuilderTraitPanel = ({ units, traits }: BuilderTraitPanelProps) => {
  const rows = useMemo(() => buildRows(units, traits), [units, traits]);
  const activeCount = rows.filter(row => row.activeBreakpoint).length;

  return (
    <div
      data-testid="trait-panel"
      className="rounded-xl p-4 border"
      style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Traits</h3>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {activeCount} active
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>
          Add units to the board to see active traits.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map(row => {
            const active = row.activeBreakpoint !== null;
            return (
              <li
                key={row.key}
                data-testid={`trait-${row.key}`}
                data-active={active ? 'true' : 'false'}
                className="text-xs"
                style={{ opacity: active ? 1 : 0.55 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate" style={{ color: active ? 'var(--accent1)' : 'var(--text-primary)' }}>
                    {row.name}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {row.count}
                    {row.nextBreakpoint ? ` / ${row.nextBreakpoint.count}` : ''}
                  </span>
                </div>
                {(row.activeBreakpoint ?? row.nextBreakpoint) && (
                  <div className="mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {row.activeBreakpoint ? row.activeBreakpoint.bonus : row.nextBreakpoint?.bonus}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BuilderTraitPanel;
