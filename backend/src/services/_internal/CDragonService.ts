import * as https from 'https';
import { injectable } from 'tsyringe';

export interface RawCDragonChampionStats {
  armor: number;
  attackSpeed: number;
  critChance: number;
  critMultiplier: number;
  damage: number;
  hp: number;
  initialMana: number;
  magicResist: number;
  mana: number;
  range: number;
}

export interface RawCDragonChampion {
  ability: {
    name: string;
    desc: string;
    variables: Array<{ name: string; value: number[] }>;
  };
  apiName: string;
  cost: number;
  icon: string;
  name: string;
  squareIcon: string;
  stats: RawCDragonChampionStats;
  traits: string[];
}

export interface RawCDragonTraitEffect {
  minUnits: number;
  maxUnits: number;
  style: number | null;
  variables: Array<{ name: string; value: number[] }>;
}

export interface RawCDragonTrait {
  apiName: string;
  desc: string;
  effects: RawCDragonTraitEffect[];
  icon: string;
  name: string;
}

export interface RawCDragonItem {
  apiName: string;
  name: string;
  description: string;
  icon: string;
}

export interface RawCDragonAugment {
  apiName: string;
  name: string;
  desc: string;
  icon: string;
}

export interface RawCDragonSetData {
  name: string;
  champions: RawCDragonChampion[];
  traits: RawCDragonTrait[];
}

export interface TftRawData {
  setData: Record<string, RawCDragonSetData>;
  items: RawCDragonItem[];
  augments: RawCDragonAugment[];
}

@injectable()
export class CDragonService {
  private static readonly LIVE_URL =
    'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json';
  private static readonly PBE_URL =
    'https://raw.communitydragon.org/pbe/cdragon/tft/en_us.json';
  private static readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  private cache: { data: TftRawData | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };

  getBaseUrl(): string {
    return process.env.CDRAGON_ENDPOINT === 'pbe'
      ? CDragonService.PBE_URL
      : CDragonService.LIVE_URL;
  }

  async fetch(): Promise<TftRawData> {
    if (this.cache.data && Date.now() - this.cache.timestamp < CDragonService.CACHE_TTL_MS) {
      return this.cache.data;
    }
    const data = await this.httpGet(this.getBaseUrl());
    this.cache = { data, timestamp: Date.now() };
    return data;
  }

  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  getCdnBase(): string {
    return process.env.CDRAGON_ENDPOINT === 'pbe'
      ? 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1'
      : 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';
  }

  private httpGet(url: string): Promise<TftRawData> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`CDragon fetch failed: ${res.statusCode}`));
            return;
          }
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Failed to parse CDragon JSON: ${e}`));
            }
          });
        })
        .on('error', reject);
    });
  }
}
