import { injectable } from 'tsyringe';
import { Repository } from './_internal/Repository';
import { PathResolver } from './_internal/PathResolver';
import { FileParser } from './_internal/FileParser';
import { DataTransformer } from './_internal/DataTransformer';
import { CDragonService } from './_internal/CDragonService';
import { CDragonTransformer } from './_internal/CDragonTransformer';

const CDN_BASE = 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1';

@injectable()
export class ImportService {
  constructor(
    private repository: Repository,
    private pathResolver: PathResolver,
    private cdragonService: CDragonService,
  ) {}

  async importSet(
    setId: number,
    status: 'upcoming' | 'active' | 'archived' = 'active'
  ): Promise<{ champions: number; traits: number; items: number }> {
    const dragontailDir = this.pathResolver.findDragontailDir();
    if (!dragontailDir) {
      throw new Error(`No dragontail data directory found for set ${setId}`);
    }

    const championJson = FileParser.readJsonFile(this.pathResolver.getChampionSetPath(dragontailDir, setId))
      ?? FileParser.readJsonFile(this.pathResolver.getChampionPath(dragontailDir));
    const traitJson = FileParser.readJsonFile(this.pathResolver.getTraitSetPath(dragontailDir, setId))
      ?? FileParser.readJsonFile(this.pathResolver.getTraitPath(dragontailDir));
    const itemJson = FileParser.readJsonFile(this.pathResolver.getItemSetPath(dragontailDir, setId))
      ?? FileParser.readJsonFile(this.pathResolver.getItemPath(dragontailDir));

    if (!championJson || !traitJson || !itemJson) {
      throw new Error(`One or more dragontail data files not found for set ${setId}`);
    }

    const rawChampions = FileParser.parseChampionFile(championJson, setId);
    const rawTraits = FileParser.parseTraitFile(traitJson, setId);
    const rawItems = FileParser.parseItemFile(itemJson, setId);

    if (rawChampions.length === 0) {
      throw new Error(`Dragontail has 0 champions for set ${setId} — refusing to save empty data`);
    }

    const champions = rawChampions.map((c: any) => {
      const portraitName = c.imageFullPath
        ? c.imageFullPath.replace(/_splash_centered_\d+\.TFT_Set\d+\.png$/i, '.png')
        : '';
      return {
        id: `TFT${setId}_${c.name.trim().replace(/\s+/g, '')}`,
        name: c.name,
        cost: c.cost,
        traits: c.traits,
        stats: c.stats,
        ability: c.ability,
        imageUrl: portraitName
          ? `${CDN_BASE}/tft/champion-portraits/${portraitName.toLowerCase()}`
          : DataTransformer.buildChampionPortraitUrl(c.name),
        splashUrl: c.imageFullPath
          ? `${CDN_BASE}/champion-splashes/tft-set${setId}/${c.imageFullPath}`
          : DataTransformer.buildSplashUrl(c.name),
        iconUrl: portraitName
          ? `${CDN_BASE}/tft/champion-portraits/${portraitName.toLowerCase()}`
          : null,
      };
    });

    const traits = rawTraits.map(DataTransformer.parseTrait);
    const items = rawItems.map((i: any) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      components: i.components,
      imageUrl: i.imageFullPath
        ? `${CDN_BASE}/tft/item-icons/${i.imageFullPath.toLowerCase()}`
        : null,
      unique: i.unique ?? false,
      trait: i.trait ?? null,
    }));

    await this.repository.saveChampions(champions);
    await this.repository.saveTraits(traits);
    await this.repository.saveItems(items);

    await this.repository.saveSetData(
      setId,
      `Set ${setId}`,
      champions.map((c: any) => c.id),
      traits.map((t: any) => t.key),
      items.map((i: any) => i.id),
      [],
      status
    );

    return { champions: champions.length, traits: traits.length, items: items.length };
  }

  async importFromCDragon(
    setId: number,
    status: 'upcoming' | 'active' | 'archived' = 'active',
  ): Promise<{ champions: number; traits: number; items: number }> {
    console.log(`[ImportService] CDragon importFromCDragon called for set ${setId}`);
    const raw = await this.cdragonService.fetch();
    console.log(`[ImportService] CDragon fetch succeeded for set ${setId}`);
    const cdnBase = this.cdragonService.getCdnBase();
    const transformed = CDragonTransformer.transformSet(raw, setId, cdnBase);

    console.log(`[ImportService] CDragon transformed set ${setId}: ${transformed.champions.length} champs, ${transformed.traits.length} traits, ${transformed.items.length} items`);

    if (transformed.champions.length === 0) {
      throw new Error(`CDragon returned 0 champions for set ${setId} — refusing to save empty data`);
    }

    await this.repository.saveChampions(transformed.champions);
    await this.repository.saveTraits(transformed.traits);
    await this.repository.saveItems(transformed.items);

    await this.repository.saveSetData(
      setId,
      transformed.setName,
      transformed.champions.map((c) => c.id),
      transformed.traits.map((t) => t.key),
      transformed.items.map((i) => i.id),
      transformed.augments,
      status,
    );

    return {
      champions: transformed.champions.length,
      traits: transformed.traits.length,
      items: transformed.items.length,
    };
  }
}
