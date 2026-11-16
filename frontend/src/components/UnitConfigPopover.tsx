import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Item } from '../lib/api';
import { proxyUrl } from '../lib/imageProxy';
import type { BoardChampion } from './TFTBoard';

interface UnitConfigPopoverProps {
  unit: BoardChampion;
  availableItems: Item[];
  onChange: (unit: BoardChampion) => void;
  onClose: () => void;
}

const MAX_ITEMS = 3;

const UnitConfigPopover = ({ unit, availableItems, onChange, onClose }: UnitConfigPopoverProps) => {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const slots = Array.from({ length: MAX_ITEMS }, (_, i) => unit.items[i]);
  const itemsById = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of availableItems) map.set(item.id, item);
    return map;
  }, [availableItems]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? availableItems.filter(item => (
        item.name.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle)
      ))
      : availableItems;
    return [...pool].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 20);
  }, [availableItems, query]);

  const assignItem = (item: Item) => {
    if (activeSlot == null) return;
    const nextItems = [...unit.items];
    nextItems[activeSlot] = item.id;
    onChange({ ...unit, items: nextItems.filter(Boolean) });
    setActiveSlot(null);
    setQuery('');
  };

  const removeItem = (slot: number) => {
    const nextItems = unit.items.filter((_, index) => index !== slot);
    onChange({ ...unit, items: nextItems });
    if (activeSlot === slot) setActiveSlot(null);
  };

  const cycleStars = () => {
    onChange({ ...unit, stars: unit.stars >= 3 ? 1 : unit.stars + 1 });
  };

  return (
    <div
      data-testid="unit-config"
      role="dialog"
      aria-label={`Configure ${unit.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border shadow-2xl p-4"
        style={{ background: 'var(--bg-accent)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{unit.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {unit.cost}★ unit · {unit.traits.join(', ') || 'No traits'}
            </p>
          </div>
          <button
            data-testid="close-config"
            aria-label="Close unit configuration"
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            data-testid="star-cycle"
            onClick={cycleStars}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--bg-primary)', color: '#fbbf24' }}
          >
            {unit.stars}★ → {unit.stars >= 3 ? 1 : unit.stars + 1}★
          </button>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {unit.items.length} / {MAX_ITEMS} items
          </span>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
            Items
          </div>
          <div className="grid grid-cols-3 gap-2" data-testid="item-slots">
            {slots.map((itemId, index) => {
              const item = itemId ? itemsById.get(itemId) : undefined;
              return (
                <div key={index} className="relative">
                  <button
                    data-testid={`item-slot-${index}`}
                    data-filled={item ? 'true' : 'false'}
                    onClick={() => {
                      setActiveSlot(index);
                      setQuery('');
                    }}
                    className="relative w-full h-16 rounded-lg border flex flex-col items-center justify-center gap-1 text-xs"
                    style={{
                      borderColor: activeSlot === index ? '#38bdf8' : 'var(--bg-primary)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                    }}
                    title={item?.name || 'Assign item'}
                  >
                    <span className="text-lg leading-none" style={{ color: item ? '#38bdf8' : undefined }}>
                      {item ? '◆' : '+'}
                    </span>
                    {item?.imageUrl && (
                      <img
                        src={proxyUrl(item.imageUrl)}
                        alt={item.name}
                        className="absolute top-2 w-7 h-7 rounded object-cover"
                        draggable={false}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="leading-none">{item ? item.name : 'Empty'}</span>
                  </button>
                  {item && (
                    <button
                      data-testid={`remove-item-${index}`}
                      data-no-drag
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(index)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: '#ef4444', color: 'white' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {activeSlot != null && (
          <div className="mt-3" data-testid="item-picker">
            <input
              data-testid="item-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              className="w-full px-3 py-1.5 rounded-lg border text-sm"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--bg-primary)' }}>
              {matches.map(item => (
                <button
                  key={item.id}
                  data-testid={`item-option-${item.id}`}
                  onClick={() => assignItem(item)}
                  disabled={unit.items.length >= MAX_ITEMS && !unit.items[activeSlot]}
                  className="w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 hover:bg-[var(--bg-accent)] disabled:opacity-40"
                >
                  <span>{item.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.id}</span>
                </button>
              ))}
              {matches.length === 0 && (
                <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  No items match “{query}”.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitConfigPopover;
