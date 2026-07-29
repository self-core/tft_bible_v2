import { describe, it, expect } from 'vitest';
import { MatchFetcher } from './MatchFetcher';

describe('MatchFetcher', () => {
  it('should parse participants from match DTO', () => {
    const fetcher = new MatchFetcher();
    const participants = fetcher.extractParticipants({
      metadata: { data_version: '2', match_id: 'TFT_123' },
      info: {
        game_datetime: 1700000000000,
        game_length: 1800,
        game_version: 'Version 17.3',
        participants: [
          {
            puuid: 'p1',
            placement: 1,
            level: 9,
            last_round: 10,
            players_eliminated: 7,
            total_damage_to_players: 100,
            units: [
              { character_id: 'TFT17_Gragas', tier: 2, items: [1001, 1002], rarity: 3, chosen: '', name: '' },
            ],
            traits: [
              { name: 'Psionic', num_units: 4, style: 1, tier_current: 2, tier_total: 3 },
            ],
          },
        ],
        queue_id: 1100,
        tft_set_number: 17,
      },
    } as any);
    expect(participants).toHaveLength(1);
    expect(participants[0].placement).toBe(1);
    expect(participants[0].units[0].character_id).toBe('TFT17_Gragas');
  });

  it('should handle null input', () => {
    const fetcher = new MatchFetcher();
    const result = fetcher.extractParticipants(null);
    expect(result).toEqual([]);
  });

  it('should handle missing info field', () => {
    const fetcher = new MatchFetcher();
    const result = fetcher.extractParticipants({ metadata: { data_version: '2', match_id: 'TFT_123' } } as any);
    expect(result).toEqual([]);
  });

  it('should handle missing participants field', () => {
    const fetcher = new MatchFetcher();
    const result = fetcher.extractParticipants({ metadata: { data_version: '2', match_id: 'TFT_123' }, info: {} } as any);
    expect(result).toEqual([]);
  });

  it('should handle empty participants array', () => {
    const fetcher = new MatchFetcher();
    const result = fetcher.extractParticipants({
      metadata: { data_version: '2', match_id: 'TFT_123' },
      info: { game_datetime: 0, game_length: 0, game_version: '', participants: [], queue_id: 0, tft_set_number: 0 },
    });
    expect(result).toEqual([]);
  });

  it('should handle participants with missing units and traits', () => {
    const fetcher = new MatchFetcher();
    const participants = fetcher.extractParticipants({
      metadata: { data_version: '2', match_id: 'TFT_123' },
      info: {
        game_datetime: 0, game_length: 0, game_version: '',
        participants: [{ puuid: 'p1', placement: 5, level: 8 }],
        queue_id: 0, tft_set_number: 0,
      },
    } as any);
    expect(participants).toHaveLength(1);
    expect(participants[0].units).toEqual([]);
    expect(participants[0].traits).toEqual([]);
  });
});
