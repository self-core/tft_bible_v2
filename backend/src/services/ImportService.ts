import { Repository } from './_internal/Repository';
import { PathResolver } from './_internal/PathResolver';
import { FileParser } from './_internal/FileParser';
import { DataTransformer } from './_internal/DataTransformer';

export class ImportService {
  private repository: Repository;

  constructor() {
    this.repository = new Repository();
  }

  async importSet(setId: number): Promise<void> {
    const pathResolver = new PathResolver(setId);
    const fileParser = new FileParser(pathResolver);

    let champions: any[] | null = null;
    let traits: any[] | null = null;
    let items: any[] | null = null;

    try {
      champions = await fileParser.parseChampions();
    } catch { }

    try {
      traits = await fileParser.parseTraits();
    } catch { }

    try {
      items = await fileParser.parseItems();
    } catch { }

    if (!champions && !traits && !items) {
      throw new Error(`No dragontail files found for set ${setId}`);
    }

    const transformer = new DataTransformer();

    if (champions) {
      const transformedChampions = transformer.transformChampions(champions, setId);
      await this.repository.saveChampions(transformedChampions);
    }

    if (traits) {
      const transformedTraits = transformer.transformTraits(traits, setId);
      await this.repository.saveTraits(transformedTraits);
    }

    if (items) {
      const transformedItems = transformer.transformItems(items, setId);
      await this.repository.saveItems(transformedItems);
    }

    const championIds = transformedChampions?.map((c: any) => c.id) ?? [];
    const traitKeys = transformedTraits?.map((t: any) => t.key) ?? [];
    const itemIds = transformedItems?.map((i: any) => i.id) ?? [];

    await this.repository.saveSetData(setId, `Set ${setId}`, championIds, traitKeys, itemIds, []);
  }
}
