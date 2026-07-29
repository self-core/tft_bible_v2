import * as fs from 'fs';

export class FileParser {
  static readJsonFile(filePath: string): any {
    try {
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static detectAvailableSets(json: any): number[] {
    if (!json?.data) return [];
    const sets = new Set<number>();
    for (const entry of Object.values(json.data) as any[]) {
      const m = entry?.id?.match(/TFT(\d+)_/);
      if (m) sets.add(parseInt(m[1], 10));
    }
    return [...sets].sort((a, b) => b - a);
  }

  static parseChampionFile(json: any, setId: number): any[] {
    if (!json?.data) return [];
    const idPrefix = `TFT${setId}_`;
    return Object.values(json.data)
      .filter((champ: any) => champ?.id?.startsWith(idPrefix))
      .map((champ: any) => ({
        id: champ.id || '',
        name: champ.name || '',
        cost: champ.tier ?? champ.cost ?? 1,
        traits: champ.traits || [],
        stats: {
          hp: champ.stats?.hp ?? 600,
          mana: champ.stats?.mana ?? 40,
          damage: champ.stats?.damage ?? 50,
        },
        ability: champ.ability ? {
          name: champ.ability.name || champ.spellName || '',
          variables: (() => {
            const raw = champ.ability.variables || champ.spellVariables || {};
            if (Array.isArray(raw)) return raw;
            return Object.entries(raw).map(([name, values]) => ({ name, values: values as number[] }));
          })(),
        } : { name: '', variables: [] },
        imageFullPath: champ.image?.full || '',
      }))
      .filter(c => c.name && c.name.trim().length > 0);
  }

  static parseTraitFile(json: any, setId: number): any[] {
    if (!json?.data) return [];
    const idPrefix = `TFT${setId}_`;
    return Object.values(json.data)
      .filter((trait: any) => trait?.id?.startsWith(idPrefix))
      .map((trait: any) => ({
        key: trait.key || trait.id || '',
        name: trait.name || trait.displayName || trait.key || '',
        description: trait.description || trait.desc || '',
        breakpoints: (trait.effects || trait.breakpoints || trait.tiers || []).map((bp: any) => ({
          count: bp.numUnits ?? bp.count ?? 0,
          bonus: bp.effect ?? bp.bonus ?? '',
        })),
      }));
  }

  static parseItemFile(json: any, setId: number): any[] {
    if (!json?.data) return [];
    const idPrefix = `TFT${setId}_`;
    return Object.values(json.data)
      .filter((item: any) => item?.id?.startsWith(idPrefix))
      .map((item: any) => ({
        id: item.id || '',
        name: item.name || '',
        description: item.description || item.desc || '',
        components: item.components || item.from || [],
        imageFullPath: item.image?.full || '',
        unique: item.unique || false,
        trait: item.trait || null,
      }));
  }
}
