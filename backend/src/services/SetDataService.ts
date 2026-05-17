import { ISetData } from '../interfaces';
import { Repository } from './_internal/Repository';
import { ImportService } from './ImportService';
import { EmbeddedFallback } from './_internal/EmbeddedFallback';
import { ResultCache } from './_internal/ResultCache';
import { PathResolver } from './_internal/PathResolver';
import { FileParser } from './_internal/FileParser';

export class SetDataService {
  private repository: Repository;
  private importService: ImportService;
  private embeddedFallback: typeof EmbeddedFallback;
  private cache: ResultCache;
  private initialized = false;
  private defaultSetId: number;

  constructor() {
    this.repository = new Repository();
    this.importService = new ImportService();
    this.embeddedFallback = EmbeddedFallback;
    this.cache = new ResultCache();
    this.defaultSetId = this.detectLatestSet();
  }

  private detectLatestSet(): number {
    try {
      const dir = new PathResolver().findDragontailDir();
      if (!dir) return 17;
      const championJson = FileParser.readJsonFile(new PathResolver().getChampionPath(dir)) || FileParser.readJsonFile(new PathResolver().getChampionSetPath(dir, 17));
      const sets = FileParser.detectAvailableSets(championJson);
      return sets.length > 0 ? sets[0] : 17;
    } catch {
      return 17;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.getSetData(this.defaultSetId);
    } catch {
      // Not fatal — data can be loaded on demand for any set
    }
    this.initialized = true;
  }

  async getSetData(setId?: number): Promise<ISetData> {
    const sid = setId ?? this.defaultSetId;
    const cached = this.cache.get(sid);
    if (cached) return cached;

    try {
      const fromDb = await this.repository.getSetData(sid);
      if (fromDb) {
        this.cache.set(sid, fromDb);
        return fromDb;
      }
    } catch {
    }

    try {
      await this.importService.importSet(sid);
      const fromImport = await this.repository.getSetData(sid);
      if (fromImport) {
        this.cache.set(sid, fromImport);
        return fromImport;
      }
    } catch {
    }

    const embedded = this.embeddedFallback.getSetData(sid);
    if (embedded) {
      this.cache.set(sid, embedded);
      return embedded;
    }

    throw new Error(`No data available for set ${sid}`);
  }
}
