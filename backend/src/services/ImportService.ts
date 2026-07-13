import { injectable } from 'tsyringe';
import { Repository } from './_internal/Repository';
import { PathResolver } from './_internal/PathResolver';
import { FileParser } from './_internal/FileParser';
import { DataTransformer } from './_internal/DataTransformer';

const CDN_BASE = 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1';

@injectable()
export class ImportService {
  constructor(
    private repository: Repository,
    private pathResolver: PathResolver,
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
}
