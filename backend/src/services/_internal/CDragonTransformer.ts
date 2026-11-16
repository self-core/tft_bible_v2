import { ISetChampion, ITrait, IItem, IChampionStats, ITraitRawVariable, ITraitVariable } from '../../interfaces';
import {
  RawCDragonChampion,
  RawCDragonTrait,
  RawCDragonItem,
  TftRawData,
} from './CDragonService';
import { DataTransformer } from './DataTransformer';

interface TransformedAugment {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
}

const STAT_DEFAULTS: IChampionStats = {
  hp: 600,
  mana: 40,
  damage: 50,
  armor: 40,
  magicResist: 40,
  attackSpeed: 0.55,
  range: 1,
  initialMana: 0,
  critChance: 0.25,
  critMultiplier: 1.4,
};

const HASH_KEY = /^\{.*\}$/;

function firstNumber(value: number | number[] | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0];
  return null;
}

function splitVariables(
  raw: Record<string, number | number[] | null> | Array<{ name: string; value: number[] }> | null | undefined,
): { variables: ITraitVariable[]; rawVariables: ITraitRawVariable[] } {
  const variables: ITraitVariable[] = [];
  const rawVariables: ITraitRawVariable[] = [];
  if (!raw) return { variables, rawVariables };

  const entries: Array<[string, number | number[] | null]> = Array.isArray(raw)
    ? raw.map((v) => [v.name, v.value] as [string, number | number[]])
    : Object.entries(raw);

  for (const [name, value] of entries) {
    const numeric = firstNumber(value);
    if (numeric === null || numeric === undefined) continue;
    if (HASH_KEY.test(name)) {
      rawVariables.push({ key: name, value: numeric });
    } else {
      variables.push({ name, value: numeric });
    }
  }
  return { variables, rawVariables };
}

function formatVariables(variables: ITraitVariable[]): string {
  return variables.map((v) => `${v.name}: ${v.value}`).join(', ');
}

/**
 * cdragon ships internal asset paths (`ASSETS/...foo.tex`, sometimes with a
 * `.TFT_Set17` variant suffix). The raw CDN exposes them lowercased under
 * `.../global/default/assets/...` with a `.png` extension and no variant
 * suffix — keeping either produces a 404.
 */
function cdragonAssetUrl(cdnBase: string, assetPath: string | null | undefined): string | null {
  if (!assetPath) return null;
  const normalized = assetPath
    .replace(/\.(tex|png|jpe?g)$/i, '')
    .replace(/\.tft_set\d+(?:_postlaunchaugments)?$/i, '')
    .replace(/\.tft_\d+_\d+$/i, '')
    .toLowerCase();
  return `${cdnBase.replace(/\/+$/, '')}/${normalized}.png`;
}

function augmentNameFromId(id: string): string {
  const stripped = id.replace(/^TFT\d*_Augment_/i, '').replace(/^TFT\d*_/i, '');
  const spaced = stripped.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.trim() || id;
}

// cdragon trait text is client markup: per-tier <row>/<expandRow> blocks,
// @Variable@ / @TFTUnitProperty...@ placeholders resolved only in-game,
// %i:icon% tokens, and inline style tags. Breakpoints are rendered from
// `effects`, so keep only prose and drop unresolvable fragments.
const DROPPED_BLOCK_TAGS = ['expandRow', 'row', 'TFTTracker', 'TFTBonus'];

function stripBlockTag(text: string, tag: string): string {
  const block = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  let result = text;
  for (let previous = ''; previous !== result; ) {
    previous = result;
    result = result.replace(block, ' ');
  }
  return result;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x?[0-9a-f]+;/gi, ' ');
}

export function sanitizeDescription(raw: string | null | undefined): string {
  if (!raw) return '';
  let text = raw;
  for (const tag of DROPPED_BLOCK_TAGS) text = stripBlockTag(text, tag);

  text = text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/%i:[^%]*%/g, ' ')
    .replace(/@[^@\s]+@/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  text = decodeEntities(text)
    .replace(/(^|[^\d])%\s+(?=[A-Za-z])/g, '$1')
    .replace(/([^\d])%\s*\)/g, '$1)')
    .replace(/\(\s*\)|\[\s*\]/g, '')
    .replace(/\([^()]*:\s*\)/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:])\s*[,;:]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return /[A-Za-z0-9]/.test(text) ? text : '';
}

// Names occasionally carry the same client tokens (e.g. "@Tier@-Cost Shop",
// quest items whose "name" is a sentence). Strip them, then trim leftovers.
export function sanitizeName(raw: string | null | undefined): string {
  const text = sanitizeDescription(raw).replace(/^[\s\-–—:;,.·]+|[\s\-–—:;,.·]+$/g, '');
  return /[A-Za-z0-9]/.test(text) ? text : '';
}

const DEFAULT_ASSET_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

export class CDragonTransformer {
  static transformChampion(raw: RawCDragonChampion, cdnBase: string): ISetChampion {
    const name = raw.name || raw.apiName || 'Unknown';
    // cdragon field names are misleading: `tileIcon` is the square portrait
    // used in-game, `squareIcon` is the wide splash tile.
    const portraitUrl = cdragonAssetUrl(cdnBase, raw.tileIcon);
    const splashUrl = cdragonAssetUrl(cdnBase, raw.squareIcon);
    const imageUrl =
      portraitUrl ??
      splashUrl ??
      DataTransformer.buildChampionPortraitUrl(name);

    const stats: IChampionStats = {
      hp: raw.stats?.hp ?? STAT_DEFAULTS.hp,
      mana: raw.stats?.mana ?? STAT_DEFAULTS.mana,
      damage: raw.stats?.damage ?? STAT_DEFAULTS.damage,
      armor: raw.stats?.armor ?? STAT_DEFAULTS.armor,
      magicResist: raw.stats?.magicResist ?? STAT_DEFAULTS.magicResist,
      attackSpeed: raw.stats?.attackSpeed ?? STAT_DEFAULTS.attackSpeed,
      range: raw.stats?.range ?? STAT_DEFAULTS.range,
      initialMana: raw.stats?.initialMana ?? STAT_DEFAULTS.initialMana,
      critChance: raw.stats?.critChance ?? STAT_DEFAULTS.critChance,
      critMultiplier: raw.stats?.critMultiplier ?? STAT_DEFAULTS.critMultiplier,
    };

    return {
      id: raw.apiName,
      name,
      cost: raw.cost,
      traits: raw.traits || [],
      stats,
      ability: {
        name: raw.ability?.name || '',
        description: raw.ability?.desc || '',
        variables: (raw.ability?.variables || []).map((v) => ({
          name: v.name,
          values: Array.isArray(v.value)
            ? v.value.filter((n) => typeof n === 'number' && Number.isFinite(n))
            : [],
        })),
      },
      imageUrl,
      splashUrl,
      iconUrl: portraitUrl ?? imageUrl,
    };
  }

  static transformTrait(raw: RawCDragonTrait, cdnBase: string = DEFAULT_ASSET_BASE): ITrait {
    return {
      key: raw.apiName,
      name: sanitizeName(raw.name) || raw.apiName,
      description: sanitizeDescription(raw.desc),
      imageUrl: cdragonAssetUrl(cdnBase, raw.icon),
      breakpoints: (raw.effects || [])
        .filter((e) => typeof e.minUnits === 'number' && Number.isFinite(e.minUnits) && e.minUnits >= 1)
        .map((e) => {
          const { variables, rawVariables } = splitVariables(e.variables);
          return {
            count: e.minUnits,
            bonus: formatVariables(variables),
            variables,
            rawVariables,
          };
        }),
    };
  }

  static transformItem(raw: RawCDragonItem, cdnBase: string): IItem {
    const { variables, rawVariables } = splitVariables(raw.effects);
    return {
      id: raw.apiName,
      name: sanitizeName(raw.name) || raw.apiName || 'Unknown Item',
      description: sanitizeDescription(raw.description || raw.desc),
      components: raw.composition || [],
      effects: variables,
      rawEffects: rawVariables,
      imageUrl: cdragonAssetUrl(cdnBase, raw.icon),
      unique: raw.unique ?? false,
      trait: raw.associatedTraits?.[0] ?? null,
    };
  }

  static transformAugment(
    raw: any,
    cdnBase: string,
  ): TransformedAugment {
    return {
      id: raw.apiName || raw.id || '',
      name: sanitizeName(raw.name) || augmentNameFromId(raw.apiName || raw.id || ''),
      description: sanitizeDescription(raw.desc || raw.description),
      imageUrl: cdragonAssetUrl(cdnBase, raw.icon),
    };
  }

  /** cdragon only carries augment IDs under setData; names come from dragontail when available. */
  static transformAugmentId(id: string, enrichment?: Map<string, TransformedAugment>): TransformedAugment {
    const known = enrichment?.get(id);
    if (known) return known;
    return {
      id,
      name: augmentNameFromId(id),
      description: '',
      imageUrl: null,
    };
  }

  private static collectSetChampions(raw: TftRawData, setId: number): RawCDragonChampion[] {
    const roster = raw.sets?.[String(setId)]?.champions;
    if (roster && roster.length > 0) {
      const seen = new Map<string, RawCDragonChampion>();
      for (const c of roster) if (!seen.has(c.apiName)) seen.set(c.apiName, c);
      return Array.from(seen.values());
    }
    // Legacy fallback: prefix scan across setData (misses non-prefixed champions).
    const prefix = `TFT${setId}_`;
    const seen = new Map<string, RawCDragonChampion>();
    for (const sd of Object.values(raw.setData || {})) {
      for (const c of sd.champions || []) {
        if (c.apiName.startsWith(prefix) && !seen.has(c.apiName)) seen.set(c.apiName, c);
      }
    }
    return Array.from(seen.values());
  }

  private static collectSetTraits(raw: TftRawData, setId: number): RawCDragonTrait[] {
    const roster = raw.sets?.[String(setId)]?.traits;
    if (roster && roster.length > 0) {
      const seen = new Map<string, RawCDragonTrait>();
      for (const t of roster) if (!seen.has(t.apiName)) seen.set(t.apiName, t);
      return Array.from(seen.values());
    }
    const prefix = `TFT${setId}_`;
    const seen = new Map<string, RawCDragonTrait>();
    for (const sd of Object.values(raw.setData || {})) {
      for (const t of sd.traits || []) {
        if (t.apiName.startsWith(prefix) && !seen.has(t.apiName)) seen.set(t.apiName, t);
      }
    }
    return Array.from(seen.values());
  }

  private static collectSetEntries(raw: TftRawData, setId: number) {
    return Object.values(raw.setData || {}).filter((sd) => sd && sd.number === setId);
  }

  private static collectSetItems(raw: TftRawData, setId: number): RawCDragonItem[] {
    const byId = new Map<string, RawCDragonItem>();
    for (const item of raw.items || []) {
      if (item.apiName && !byId.has(item.apiName)) byId.set(item.apiName, item);
    }

    const picked = new Map<string, RawCDragonItem>();
    for (const sd of this.collectSetEntries(raw, setId)) {
      for (const entry of (sd.items || []) as Array<RawCDragonItem | string>) {
        const id = typeof entry === 'string' ? entry : entry.apiName;
        if (!id || picked.has(id)) continue;
        const full = typeof entry === 'string' ? byId.get(id) : entry;
        picked.set(id, full ?? { apiName: id, name: augmentNameFromId(id), description: '', icon: '' });
      }
    }
    if (picked.size > 0) return Array.from(picked.values());

    // Legacy fallback: top-level items, keep non-set items plus this set's prefix.
    const prefix = `TFT${setId}_`;
    return (raw.items || []).filter((i) => !i.apiName.startsWith('TFT') || i.apiName.startsWith(prefix));
  }

  private static collectSetAugments(raw: TftRawData, setId: number, cdnBase: string): TransformedAugment[] {
    const enrichment = new Map<string, TransformedAugment>();
    for (const a of raw.augments || []) {
      enrichment.set(a.apiName, this.transformAugment(a, cdnBase));
    }
    // cdragon lists augment ids in setData but only carries their display name and
    // icon on the matching entry of the top-level items array.
    const itemsById = new Map<string, RawCDragonItem>();
    for (const item of raw.items || []) {
      if (item.apiName && !itemsById.has(item.apiName)) itemsById.set(item.apiName, item);
    }

    const ids = new Set<string>();
    for (const sd of this.collectSetEntries(raw, setId)) {
      for (const id of sd.augments || []) ids.add(id);
    }

    for (const id of ids) {
      if (enrichment.has(id)) continue;
      const item = itemsById.get(id);
      if (item?.icon) enrichment.set(id, this.transformAugment(item, cdnBase));
    }

    if (ids.size === 0) {
      const prefix = `TFT${setId}_`;
      for (const a of raw.augments || []) {
        if (!a.apiName.startsWith('TFT') || a.apiName.startsWith(prefix)) {
          ids.add(a.apiName);
        }
      }
    }

    return Array.from(ids).map((id) => this.transformAugmentId(id, enrichment));
  }

  static transformSet(
    raw: TftRawData,
    setId: number,
    cdnBase: string,
  ): {
    setName: string;
    champions: ISetChampion[];
    traits: ITrait[];
    items: IItem[];
    augments: TransformedAugment[];
  } {
    const champions = this.collectSetChampions(raw, setId).map((c) => this.transformChampion(c, cdnBase));
    const traits = this.collectSetTraits(raw, setId).map((t) => this.transformTrait(t, cdnBase));
    const items = this.collectSetItems(raw, setId).map((i) => this.transformItem(i, cdnBase));
    const augments = this.collectSetAugments(raw, setId, cdnBase);

    return {
      setName: `Set ${setId}`,
      champions,
      traits,
      items,
      augments,
    };
  }
}
