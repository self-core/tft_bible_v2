import { injectable } from 'tsyringe';

export interface ParticipantBoard {
  puuid: string;
  placement: number;
  level: number;
  units: Array<{
    character_id: string;
    tier: number;
    items: number[];
    rarity: number;
  }>;
  traits: Array<{
    name: string;
    num_units: number;
    style: number;
    tier_current: number;
    tier_total: number;
  }>;
}

interface ParticipantDto {
  puuid: string;
  placement: number;
  level: number;
  units: Array<{ character_id: string; tier: number; items: number[]; rarity: number }>;
  traits: Array<{ name: string; num_units: number; style: number; tier_current: number; tier_total: number }>;
}

interface MatchDto {
  metadata: { data_version: string; match_id: string };
  info: {
    game_datetime: number;
    game_length: number;
    game_version: string;
    participants: ParticipantDto[];
    queue_id: number;
    tft_set_number: number;
  };
}

@injectable()
export class MatchFetcher {
  extractParticipants(matchDto: MatchDto | null): ParticipantBoard[] {
    if (!matchDto?.info?.participants) return [];
    return matchDto.info.participants.map((p) => ({
      puuid: p.puuid,
      placement: p.placement,
      level: p.level,
      units: (p.units || []).map((u) => ({
        character_id: u.character_id,
        tier: u.tier,
        items: u.items || [],
        rarity: u.rarity,
      })),
      traits: (p.traits || []).map((t) => ({
        name: t.name,
        num_units: t.num_units,
        style: t.style,
        tier_current: t.tier_current,
        tier_total: t.tier_total,
      })),
    }));
  }
}
