import { injectable, inject } from 'tsyringe';
import { MetaCompositionModel, IMetaStats } from '../models/MetaComposition';
import { RiotApiClient } from './RiotApiClient';
import { MatchFetcher } from './_internal/MatchFetcher';
import { CompAnalyzer } from './_internal/CompAnalyzer';

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

@injectable()
export class MetaService {
  private apiClient?: RiotApiClient;
  private isRefreshing = false;

  constructor(
    private matchFetcher: MatchFetcher,
    private analyzer: CompAnalyzer,
    @inject('RIOT_API_KEY') private apiKey: string,
  ) {}

  private getApiClient(): RiotApiClient {
    if (!this.apiClient) {
      this.apiClient = new RiotApiClient({ apiKey: this.apiKey });
    }
    return this.apiClient;
  }

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
    if (this.isRefreshing) {
      console.warn('[MetaService] Refresh already in progress, skipping');
      return;
    }
    this.isRefreshing = true;

    const region = process.env.RIOT_REGION || 'AMERICAS';
    const platform = process.env.RIOT_PLATFORM || 'NA1';
    const patchVersion = `${process.env.TFT_PATCH_VERSION || '17'}.${setId}`;

    try {
      const client = this.getApiClient();
      let challenger;
      try {
        challenger = await client.request<any>(platform, '/tft/league/v1/challenger');
      } catch (err) {
        console.error(`[MetaService] Failed to fetch challenger league for ${platform}:`, err instanceof Error ? err.message : String(err));
        return;
      }
      const entries: any[] = challenger?.entries || [];
      const puuids = entries.slice(0, 50).map((e: any) => e.puuid);
      console.log(`[MetaService] Fetched ${puuids.length} challenger PUUIDs`);

      const allMatchIds = new Set<string>();
      let puuidFailures = 0;
      for (const puuid of puuids) {
        try {
          const ids = await client.regionalRequest<string[]>(region, `/tft/match/v1/matches/by-puuid/${puuid}/ids?count=5`);
          if (ids) ids.forEach((id: string) => allMatchIds.add(id));
        } catch (err) {
          puuidFailures++;
          console.warn(`[MetaService] Failed to fetch matches for PUUID ${puuid.slice(0, 8)}...:`, err instanceof Error ? err.message : String(err));
        }
      }
      console.log(`[MetaService] Collected ${allMatchIds.size} match IDs (${puuidFailures} PUUID failures)`);

      const matchIds = [...allMatchIds].slice(0, 100);
      const allBoards: any[] = [];
      const allRawBoards: any[] = [];
      let matchFailures = 0;

      for (const matchId of matchIds) {
        try {
          const match = await client.regionalRequest<any>(region, `/tft/match/v1/matches/${matchId}`);
          const participants = this.matchFetcher.extractParticipants(match);
          for (const p of participants) {
            allBoards.push({
              units: p.units.map(u => u.character_id),
              placement: p.placement,
              level: p.level,
              traits: p.traits.map(t => ({ name: t.name, num_units: t.num_units })),
            });
            allRawBoards.push(p);
          }
        } catch (err) {
          matchFailures++;
          console.warn(`[MetaService] Failed to fetch match ${matchId.slice(0, 12)}...:`, err instanceof Error ? err.message : String(err));
        }
      }
      console.log(`[MetaService] Processed ${allBoards.length} participants from ${matchIds.length - matchFailures}/${matchIds.length} matches`);

      if (allBoards.length === 0) {
        console.warn('[MetaService] No boards to analyze, skipping clustering');
        return;
      }

      const matrix = this.analyzer.buildCoOccurrence(allBoards);
      const clusters = this.analyzer.cluster(matrix);

      for (const cluster of clusters) {
        const matchingBoards = allRawBoards.filter((p: any) =>
          cluster.filter(c => p.units.some((u: any) => u.character_id === c)).length / cluster.length >= 0.7
        );
        if (matchingBoards.length < 20) continue;

        const stats = this.analyzer.computeStats(matchingBoards, allBoards.length);

        const traitMap: Record<string, { breakpoint: number; count: number }> = {};
        for (const board of matchingBoards) {
          for (const trait of board.traits) {
            if (!traitMap[trait.name]) traitMap[trait.name] = { breakpoint: trait.num_units, count: 0 };
            traitMap[trait.name].count++;
            traitMap[trait.name].breakpoint = Math.max(traitMap[trait.name].breakpoint, trait.num_units);
          }
        }

        const itemMap: Record<string, Record<string, number>> = {};
        for (const board of matchingBoards) {
          for (const unit of board.units) {
            if (!itemMap[unit.character_id]) itemMap[unit.character_id] = {};
            for (const itemId of unit.items) {
              itemMap[unit.character_id][itemId] = (itemMap[unit.character_id][itemId] || 0) + 1;
            }
          }
        }

        const slug = cluster.slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');

        await MetaCompositionModel.findOneAndUpdate(
          { id: slug },
          {
            id: slug,
            setId,
            patchVersion,
            champions: Object.entries(itemMap).map(([championId, items]) => ({
              championId,
              count: matchingBoards.filter((b: any) => b.units.some((u: any) => u.character_id === championId)).length,
              pickRate: matchingBoards.filter((b: any) => b.units.some((u: any) => u.character_id === championId)).length / matchingBoards.length,
              items: Object.entries(items).map(([itemId, count]) => ({ itemId, count })).sort((a, b) => b.count - a.count).slice(0, 3),
            })),
            traits: Object.entries(traitMap).map(([key, val]) => ({ key, breakpoint: val.breakpoint, count: val.count })),
            stats,
            playstyle: stats.avgPlacement < 4 ? 'Fast 8' : 'Standard',
            lastUpdated: new Date(),
          },
          { upsert: true }
        );
      }
    } finally {
      this.isRefreshing = false;
    }
  }
}
