import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetaService } from './MetaService';
import { MatchFetcher } from './_internal/MatchFetcher';
import { CompAnalyzer } from './_internal/CompAnalyzer';
import { RiotApiClient } from './RiotApiClient';
import type { IMetaStats } from '../models/MetaComposition';

vi.mock('../models/MetaComposition', () => ({
  MetaCompositionModel: {
    findOneAndUpdate: vi.fn().mockResolvedValue({}),
  },
  IMetaStats: {} as IMetaStats,
}));

const mockMatchFetcher = {
  extractParticipants: vi.fn(),
};

const mockCompAnalyzer = {
  buildCoOccurrence: vi.fn(),
  cluster: vi.fn(),
  computeStats: vi.fn(),
};

const makeBoard = (placement: number) => ({
  puuid: `puuid-${placement}`,
  placement,
  level: 8,
  units: [
    { character_id: 'TFT16_Ahri', tier: 2, items: [1001], rarity: 4 },
    { character_id: 'TFT16_Viego', tier: 1, items: [], rarity: 5 },
  ],
  traits: [
    { name: 'Arcane', num_units: 2, style: 1, tier_current: 1, tier_total: 3 },
  ],
});

describe('MetaService.refreshMetaData', () => {
  let service: MetaService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(RiotApiClient.prototype, 'request').mockRejectedValue(new Error('API unreachable'));
    vi.spyOn(RiotApiClient.prototype, 'regionalRequest').mockRejectedValue(new Error('API unreachable'));
    service = new MetaService(
      new RiotApiClient('test-api-key'),
      mockMatchFetcher as unknown as MatchFetcher,
      mockCompAnalyzer as unknown as CompAnalyzer,
      'AMERICAS',
      'NA1',
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles challenger API failure gracefully without throwing', async () => {
    await expect(service.refreshMetaData(16)).resolves.toBeUndefined();
    expect(mockMatchFetcher.extractParticipants).not.toHaveBeenCalled();
  });

  it('handles empty challenger entries gracefully', async () => {
    const requestSpy = vi.spyOn(RiotApiClient.prototype, 'request');
    requestSpy.mockResolvedValue({ entries: [] });

    await expect(service.refreshMetaData(16)).resolves.toBeUndefined();
    expect(requestSpy).toHaveBeenCalledWith('NA1', '/tft/league/v1/challenger');
  });

  it('processes matches and saves meta compositions when data is available', async () => {
    const requestSpy = vi.spyOn(RiotApiClient.prototype, 'request');
    const regionalSpy = vi.spyOn(RiotApiClient.prototype, 'regionalRequest');

    requestSpy.mockResolvedValue({
      entries: Array.from({ length: 3 }, (_, i) => ({
        puuid: `puuid-${i}`,
        summonerName: `Player${i}`,
        leaguePoints: 1000 - i * 100,
      })),
    });
    regionalSpy.mockImplementation(async (region: string, path: string) => {
      if (path.includes('/ids')) return [`match-main`];
      return {
        info: { participants: [] },
        metadata: { match_id: path.split('/').pop() },
      };
    });

    mockMatchFetcher.extractParticipants.mockImplementation(() => {
      return Array.from({ length: 25 }, (_, j) => makeBoard(j + 1));
    });

    mockCompAnalyzer.buildCoOccurrence.mockReturnValue({});
    mockCompAnalyzer.cluster.mockReturnValue([['TFT16_Ahri', 'TFT16_Viego']]);
    mockCompAnalyzer.computeStats.mockReturnValue({
      matchesAnalyzed: 5,
      winRate: 0.2,
      top4Rate: 0.5,
      avgPlacement: 4.0,
      pickRate: 0.1,
    });

    const { MetaCompositionModel } = await import('../models/MetaComposition');
    const updateSpy = vi.mocked(MetaCompositionModel.findOneAndUpdate);

    await expect(service.refreshMetaData(16)).resolves.toBeUndefined();

    expect(mockMatchFetcher.extractParticipants).toHaveBeenCalled();
    expect(mockCompAnalyzer.buildCoOccurrence).toHaveBeenCalled();
    expect(mockCompAnalyzer.cluster).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('skips clustering when no boards found', async () => {
    const requestSpy = vi.spyOn(RiotApiClient.prototype, 'request');
    const regionalSpy = vi.spyOn(RiotApiClient.prototype, 'regionalRequest');

    requestSpy.mockResolvedValue({
      entries: [{ puuid: 'test-puuid', summonerName: 'TestPlayer', leaguePoints: 1000 }],
    });
    regionalSpy.mockImplementation(async (region: string, path: string) => {
      if (path.includes('/ids')) return ['match-1'];
      return {
        info: { participants: [] },
        metadata: { match_id: 'match-1' },
      };
    });

    mockMatchFetcher.extractParticipants.mockReturnValue([]);

    await expect(service.refreshMetaData(16)).resolves.toBeUndefined();
    expect(mockCompAnalyzer.buildCoOccurrence).not.toHaveBeenCalled();
  });
});
