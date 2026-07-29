import * as https from 'https';
import { injectable, inject } from 'tsyringe';
import { RateLimiter } from './_internal/RateLimiter';

const PLATFORM_HOSTS: Record<string, string> = {
  NA1: 'na1.api.riotgames.com',
  EUW1: 'euw1.api.riotgames.com',
  KR: 'kr.api.riotgames.com',
};

const REGIONAL_HOSTS: Record<string, string> = {
  AMERICAS: 'americas.api.riotgames.com',
  EUROPE: 'europe.api.riotgames.com',
  ASIA: 'asia.api.riotgames.com',
};

@injectable()
export class RiotApiClient {
  private limiter = new RateLimiter({ maxTokens: 500, refillRate: 50, refillIntervalMs: 1000 });

  constructor(
    @inject('RIOT_API_KEY') private apiKey: string,
  ) {
    if (!apiKey) {
      console.warn('[RiotApiClient] RIOT_API_KEY not set — Riot API calls will be unavailable');
    }
  }

  buildUrl(platform: string, path: string): string {
    const host = PLATFORM_HOSTS[platform];
    if (!host) throw new Error(`Unknown platform: ${platform}`);
    return `https://${host}${path}?api_key=${this.apiKey}`;
  }

  async request<T>(platform: string, path: string): Promise<T> {
    if (!this.apiKey) throw new Error('RIOT_API_KEY not configured');
    await this.limiter.acquire();
    const url = this.buildUrl(platform, path);
    return this.fetchJson<T>(url);
  }

  async regionalRequest<T>(region: string, path: string): Promise<T> {
    if (!this.apiKey) throw new Error('RIOT_API_KEY not configured');
    await this.limiter.acquire();
    const host = REGIONAL_HOSTS[region];
    if (!host) throw new Error(`Unknown region: ${region}`);
    const url = `https://${host}${path}?api_key=${this.apiKey}`;
    return this.fetchJson<T>(url);
  }

  private fetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Riot API error ${res.statusCode}: ${data}`));
            return;
          }
          try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON response')); }
        });
      }).on('error', reject);
    });
  }
}
