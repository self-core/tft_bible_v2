import type { Item } from '../../lib/api';

/**
 * Set 18 items carry no `trait` field, but emblem ids/names encode it:
 *   DA_18_EmblemSlayer           -> "Ravager Emblem"
 *   TFT15_Item_EdgelordEmblemItem -> "Edgelord Emblem"
 */
export function emblemTraitName(item: Pick<Item, 'id' | 'name'> & { trait?: string }): string | null {
  if (item.trait) return item.trait;

  const name = (item.name ?? '').trim();
  if (/\bemblem$/i.test(name)) return name.replace(/\s*emblem$/i, '').trim();

  const id = item.id ?? '';
  const tail = id.split(/emblem/i).pop() ?? '';
  const cleaned = tail.replace(/^_/, '').replace(/_?item$/i, '').trim();
  if (!cleaned) return null;

  return cleaned
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}
