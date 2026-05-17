import { MetaCompositionModel, IMetaStats } from '../models/MetaComposition';

export interface MetaCompositionResult {
  id: string;
  setId: number;
  patchVersion: string;
  champions: Array<{ championId: string; count: number; pickRate: number; items: Array<{ itemId: string; count: number }> }>;
  traits: Array<{ key: string; breakpoint: number; count: number }>;
  stats: IMetaStats;
  playstyle: string;
  lastUpdated: Date;
}

export class MetaService {
  async getMetaCompositions(setId?: number, patchVersion?: string): Promise<MetaCompositionResult[]> {
    const filter: Record<string, unknown> = {};
    if (setId) filter.setId = setId;
    if (patchVersion) filter.patchVersion = patchVersion;

    const docs = await MetaCompositionModel.find(filter)
      .sort({ 'stats.pickRate': -1 })
      .lean();
    return docs as MetaCompositionResult[];
  }

  async getMetaCompositionById(id: string): Promise<MetaCompositionResult | null> {
    const doc = await MetaCompositionModel.findOne({ id }).lean();
    return (doc as MetaCompositionResult) || null;
  }

  async refreshMetaData(setId: number): Promise<void> {
    // Stub — full pipeline wired in Task 8
  }
}
