import { ISetData } from '../interfaces';
import { Repository } from './_internal/Repository';
import { ImportService } from './ImportService';
import { EmbeddedFallback } from './_internal/EmbeddedFallback';
import { ResultCache } from './_internal/ResultCache';

export class SetDataService {
  private repository: Repository;
  private importService: ImportService;
  private embeddedFallback: typeof EmbeddedFallback;
  private cache: ResultCache;
  private initialized = false;

  constructor() {
    this.repository = new Repository();
    this.importService = new ImportService();
    this.embeddedFallback = EmbeddedFallback;
    this.cache = new ResultCache();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.getSetData(16);
    this.initialized = true;
  }

  async getSetData(setId: number = 16): Promise<ISetData> {
    const cached = this.cache.get(setId);
    if (cached) return cached;

    try {
      const fromDb = await this.repository.getSetData(setId);
      if (fromDb) {
        this.cache.set(setId, fromDb);
        return fromDb;
      }
    } catch {
    }

    try {
      await this.importService.importSet(setId);
      const fromImport = await this.repository.getSetData(setId);
      if (fromImport) {
        this.cache.set(setId, fromImport);
        return fromImport;
      }
    } catch {
    }

    const embedded = this.embeddedFallback.getSetData(setId);
    if (embedded) {
      this.cache.set(setId, embedded);
      return embedded;
    }

    throw new Error(`No data available for set ${setId}`);
  }
}
