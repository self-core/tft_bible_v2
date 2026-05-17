export class DataTransformer {
  static readonly CDN_BASE =
    'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1';

  static buildChampionPortraitUrl(championName: string): string {
    return `${this.CDN_BASE}/tft/champion-portraits/${encodeURIComponent(championName)}.png`;
  }

  static buildSplashUrl(championName: string): string {
    return `${this.CDN_BASE}/champion-splashes/tft-set16/${encodeURIComponent(championName)}.jpg`;
  }

  static parseChampion(raw: any) {
    return {
      id: raw.id,
      name: raw.name,
      cost: raw.cost ?? 1,
      traits: raw.traits || [],
      stats: {
        hp: raw.stats?.hp ?? 600,
        mana: raw.stats?.mana ?? 40,
        damage: raw.stats?.damage ?? 50,
      },
      ability: {
        name: raw.ability?.name || '',
        variables: raw.ability?.variables
          ? (Array.isArray(raw.ability.variables)
            ? raw.ability.variables
            : Object.entries(raw.ability.variables).map(([name, values]) => ({ name, values: values as number[] })))
          : [],
      },
      imageUrl: raw.imageUrl || this.buildChampionPortraitUrl(raw.name),
      splashUrl: raw.splashUrl || this.buildSplashUrl(raw.name),
      iconUrl: raw.iconUrl || null,
    };
  }

  static parseTrait(raw: any) {
    return {
      key: raw.key,
      name: raw.name || raw.key,
      description: raw.description || '',
      breakpoints: (raw.breakpoints || []).map((bp: any) => ({
        count: bp.count,
        bonus: bp.bonus || '',
      })),
    };
  }

  static parseItem(raw: any) {
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description || '',
      components: raw.components || raw.from || [],
      imageUrl: raw.imageUrl || null,
      unique: raw.unique || false,
      trait: raw.trait || null,
    };
  }

  static parseSetData(setId: number, setName: string, data: { champions?: any[]; traits?: any[]; items?: any[]; augments?: any[] }) {
    return {
      setId,
      setName,
      champions: (data.champions || []).map((raw: any) => DataTransformer.parseChampion(raw)),
      traits: (data.traits || []).map((raw: any) => DataTransformer.parseTrait(raw)),
      items: (data.items || []).map((raw: any) => DataTransformer.parseItem(raw)),
      augments: data.augments || [],
      mechanics: {},
    };
  }
}
