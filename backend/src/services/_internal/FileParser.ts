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

  static parseChampionFile(json: any, setId: number): any[] {
    if (!json?.data) return [];
    const prefix = `TFTSet${setId}_`;
    return Object.entries(json.data)
      .filter(([key]: [string, any]) => key.startsWith(prefix))
      .map(([, champ]: [string, any]) => ({
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
          variables: champ.ability.variables || champ.spellVariables || {},
        } : { name: '', variables: {} },
        imageFullPath: champ.image?.full || '',
      }))
      .filter(c => c.name && c.name.trim().length > 0);
  }

  static parseTraitFile(json: any, setId: number): any[] {
    if (!json?.data) return [];
    const prefix = `TFTSet${setId}_`;
    return Object.entries(json.data)
      .filter(([key]: [string, any]) => key.startsWith(prefix) || key.includes(`TFT${setId}`))
      .map(([, trait]: [string, any]) => ({
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
    return Object.entries(json.data)
      .filter(([key]: [string, any]) => key.includes(`Set${setId}`) || key.includes('Item'))
      .map(([, item]: [string, any]) => ({
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
