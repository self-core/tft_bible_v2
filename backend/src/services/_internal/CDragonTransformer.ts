import { ISetChampion, ITrait, IItem } from '../../interfaces';
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

export class CDragonTransformer {
  static transformChampion(raw: RawCDragonChampion, cdnBase: string): ISetChampion {
    const name = raw.name || raw.apiName || 'Unknown';
    const imageUrl = raw.squareIcon
      ? `${cdnBase}/${raw.squareIcon.replace(/\.tex$/i, '.png').toLowerCase()}`
      : DataTransformer.buildChampionPortraitUrl(name);

    return {
      id: raw.apiName,
      name,
      cost: raw.cost,
      traits: raw.traits || [],
      stats: {
        hp: raw.stats?.hp ?? 600,
        mana: raw.stats?.mana ?? 40,
        damage: raw.stats?.damage ?? 50,
      },
      ability: {
        name: raw.ability?.name || '',
        variables: (raw.ability?.variables || []).map((v) => ({
          name: v.name,
          values: v.value,
        })),
      },
      imageUrl,
      splashUrl: DataTransformer.buildSplashUrl(name),
      iconUrl: imageUrl,
    };
  }

  static transformTrait(raw: RawCDragonTrait): ITrait {
    const formatVariables = (vars: any): string => {
      if (!vars) return '';
      if (Array.isArray(vars)) {
        return vars.map((v: any) => `${v.name}: ${Array.isArray(v.value) ? v.value.join('/') : v.value}`).join(', ');
      }
      if (typeof vars === 'object') {
        return Object.entries(vars)
          .filter(([, v]) => v !== null)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      }
      return String(vars);
    };

    return {
      key: raw.apiName,
      name: raw.name || raw.apiName,
      description: raw.desc || '',
      breakpoints: (raw.effects || []).map((e) => ({
        count: e.minUnits,
        bonus: formatVariables(e.variables),
      })),
    };
  }

  static transformItem(raw: RawCDragonItem, cdnBase: string): IItem {
    return {
      id: raw.apiName,
      name: raw.name || raw.apiName || 'Unknown Item',
      description: raw.description || '',
      components: [],
      imageUrl: raw.icon
        ? `${cdnBase}/${raw.icon.replace(/\.tex$/i, '.png').toLowerCase()}`
        : null,
      unique: false,
      trait: null,
    };
  }

  static transformAugment(
    raw: any,
    cdnBase: string,
  ): TransformedAugment {
    return {
      id: raw.apiName || raw.id || '',
      name: raw.name || '',
      description: raw.desc || raw.description || '',
      imageUrl: raw.icon
        ? `${cdnBase}/${raw.icon.replace(/\.tex$/i, '.png').toLowerCase()}`
        : null,
    };
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
    const prefix = `TFT${setId}_`;
    const seenChamps = new Map<string, ISetChampion>();
    const seenTraits = new Map<string, ITrait>();
    let setName = `Set ${setId}`;

    for (const key of Object.keys(raw.setData || {})) {
      const sd = raw.setData[key];
      if (!sd) continue;
      for (const c of sd.champions || []) {
        if (c.apiName.startsWith(prefix) && !seenChamps.has(c.apiName)) {
          seenChamps.set(c.apiName, this.transformChampion(c, cdnBase));
        }
      }
      for (const t of sd.traits || []) {
        if (t.apiName.startsWith(prefix) && !seenTraits.has(t.apiName)) {
          seenTraits.set(t.apiName, this.transformTrait(t));
        }
      }
    }
    const champions = Array.from(seenChamps.values());
    const traits = Array.from(seenTraits.values());

    return {
      setName,
      champions,
      traits,
      items: (raw.items || [])
        .filter((i) => !i.apiName.startsWith('TFT') || i.apiName.startsWith(prefix))
        .map((i) => this.transformItem(i, cdnBase)),
      augments: (raw.augments || [])
        .filter((a) => !a.apiName?.startsWith('TFT') || a.apiName?.startsWith(prefix))
        .map((a) => this.transformAugment(a, cdnBase)),
    };
  }
}
