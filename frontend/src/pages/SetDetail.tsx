import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Droplets } from 'lucide-react';
import { GET_SET } from '../lib/graphql';
import { proxyUrl } from '../lib/imageProxy';

const COST_COLORS: Record<number, string> = {
  1: '#9aa4af',
  2: '#2fbf71',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f0b90b',
};

const Portrait = ({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={`${className ?? ''} flex items-center justify-center text-lg font-bold`}
        style={{ background: 'var(--bg-accent)', color: 'var(--text-secondary)' }}
        aria-label={alt}
      >
        {alt.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={proxyUrl(src)}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

const SetDetail = () => {
  const { setId } = useParams<{ setId: string }>();
  const setIdNum = parseInt(setId || '0', 10);

  const { loading, error, data } = useQuery(GET_SET, {
    variables: { setId: setIdNum },
    errorPolicy: 'all',
  });

  if (loading) return <div className="text-center py-10">Loading set data...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  if (!data || !data.set) return <div className="text-center py-10">Set not found</div>;

  const { set } = data;
  const traitIconByName = new Map<string, string | null>(
    (set.traits || []).flatMap((t: any) => [
      [t.name || t.key, t.imageUrl],
      [t.key, t.imageUrl],
    ]),
  );

  // cdragon rosters include PVE monsters (no traits) and duplicate ids for the
  // same unit; the set page mirrors TFT Academy and lists playable units only.
  const displayChampions = [...new Map(
    (set.champions || [])
      .filter((champion: any) => (champion.traits || []).length > 0)
      .map((champion: any) => [champion.name.toLowerCase(), champion]),
  ).values()];

  const championsByCost = new Map<number, any[]>();
  for (const champion of displayChampions) {
    const cost = Number(champion.cost) || 0;
    if (!championsByCost.has(cost)) championsByCost.set(cost, []);
    championsByCost.get(cost)!.push(champion);
  }
  const costs = [...championsByCost.keys()].sort((a, b) => a - b);

  const alreadyQualified = set.setName?.toLowerCase().trim() === `set ${set.setId}`;
  const title = alreadyQualified ? `Set ${set.setId}` : `${set.setName} (Set ${set.setId})`;

  return (
    <div className={set.status === 'archived' ? 'opacity-75' : ''}>
      <header className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
          {set.status === 'archived' && (
            <span
              className="ml-3 text-sm font-normal px-2 py-1 rounded align-middle"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--text-secondary) 20%, transparent)',
                color: 'var(--text-secondary)',
              }}
            >
              Archived
            </span>
          )}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {displayChampions.length} champions · {set.traits?.length ?? 0} traits ·{' '}
          {set.items?.length ?? 0} items · {set.augments?.length ?? 0} augments
        </p>
      </header>

      {set.status === 'archived' && (
        <div
          className="mb-6 rounded-lg border p-4"
          style={{
            borderColor: 'color-mix(in srgb, var(--warning, #f59e0b) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--warning, #f59e0b) 10%, transparent)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--warning, #f59e0b)' }}>⚠</span>
            <span className="font-medium" style={{ color: 'var(--warning, #f59e0b)' }}>
              Archived Set
            </span>
          </div>
          <p
            className="mt-1 text-sm"
            style={{ color: 'color-mix(in srgb, var(--warning, #f59e0b) 70%, transparent)' }}
          >
            This set is no longer active. You can browse champions, traits, and items, but
            cannot create new compositions.
          </p>
        </div>
      )}

      {/* Champions grouped by cost, TFT Academy style */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Champions
        </h2>
        <div className="flex flex-col gap-4">
          {costs.map((cost) => {
            const color = COST_COLORS[cost] ?? COST_COLORS[1];
            const champions = championsByCost
              .get(cost)!
              .slice()
              .sort((a: any, b: any) => a.name.localeCompare(b.name));
            return (
              <div
                key={cost}
                className="rounded-xl border p-2.5"
                style={{
                  borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
                  background: `color-mix(in srgb, ${color} 7%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 px-1 pb-2">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: color, color: '#0b0b0f' }}
                  >
                    {cost}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    cost champions
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {champions.map((champion: any) => {
                    const stats = champion.stats || {};
                    const traitNames: string[] = champion.traits || [];
                    return (
                      <div
                        key={champion.id}
                        className="flex items-stretch gap-2 overflow-hidden rounded-lg"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid color-mix(in srgb, ' + color + ' 35%, transparent)',
                        }}
                      >
                        <Portrait
                          src={champion.iconUrl || champion.imageUrl}
                          alt={champion.name}
                          className="h-16 w-16 sm:w-[72px] shrink-0 object-cover"
                        />
                        <div className="min-w-0 flex-1 py-1.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <h3
                              className="truncate text-sm font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {champion.name}
                            </h3>
                          </div>
                          <div
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Droplets size={11} aria-hidden />
                            <span>
                              {stats.initialMana ?? 0} / {stats.mana ?? 0} mana
                            </span>
                            <span className="opacity-50">·</span>
                            <span>{stats.hp ?? '—'} HP</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 overflow-hidden">
                            {traitNames.map((traitName) => {
                              const icon = traitIconByName.get(traitName);
                              return icon ? (
                                <img
                                  key={traitName}
                                  src={proxyUrl(icon)}
                                  alt={traitName}
                                  title={traitName}
                                  loading="lazy"
                                  className="h-5 w-5 rounded-sm object-contain"
                                />
                              ) : (
                                <span
                                  key={traitName}
                                  title={traitName}
                                  className="truncate text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: 'var(--bg-accent)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {traitName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Traits */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Traits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {set.traits?.map((trait: any) => (
            <div
              key={trait.key}
              className="p-4 rounded-lg border"
              style={{
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                {trait.imageUrl && (
                  <img
                    src={proxyUrl(trait.imageUrl)}
                    alt={trait.name}
                    loading="lazy"
                    className="h-10 w-10 rounded object-contain shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate">
                    {trait.name || trait.key}
                  </h3>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {trait.breakpoints?.map((bp: any) => bp.count).join(' / ')}
                    {trait.breakpoints?.length ? ' units' : 'No breakpoints'}
                  </div>
                </div>
              </div>
              {trait.description && (
                <p className="text-sm mb-3 opacity-90">{trait.description}</p>
              )}
              <ul className="space-y-1 text-sm">
                {trait.breakpoints?.map((breakpoint: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-baseline justify-between gap-3 rounded px-2 py-1"
                    style={{ background: 'var(--bg-accent)' }}
                  >
                    <span className="font-semibold shrink-0" style={{ color: 'var(--accent1)' }}>
                      {breakpoint.count}
                    </span>
                    <span className="text-right">{breakpoint.bonus}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Items */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Items
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {set.items?.map((item: any) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border text-center"
              style={{
                border: '1px solid var(--bg-accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              {item.imageUrl && (
                <img
                  src={proxyUrl(item.imageUrl)}
                  alt={item.name}
                  loading="lazy"
                  className="w-12 h-12 mx-auto mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.visibility = 'hidden';
                  }}
                />
              )}
              <h3 className="text-sm font-medium leading-tight">{item.name}</h3>
              <p className="text-xs opacity-75 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Augments */}
      {set.augments && set.augments.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Augments
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {set.augments.map((augment: any) => (
              <div
                key={augment.id}
                className="p-3 rounded-lg border text-center"
                style={{
                  border: '1px solid var(--bg-accent)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              >
                {augment.imageUrl && (
                  <img
                    src={proxyUrl(augment.imageUrl)}
                    alt={augment.name}
                    loading="lazy"
                    className="w-12 h-12 mx-auto mb-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.visibility = 'hidden';
                    }}
                  />
                )}
                <h3 className="text-sm font-medium leading-tight">{augment.name}</h3>
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
