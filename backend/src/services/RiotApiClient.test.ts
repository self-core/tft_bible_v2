import { describe, it, expect } from 'vitest';
import { RiotApiClient } from './RiotApiClient';

describe('RiotApiClient', () => {
  it('should be constructable with API key', () => {
    const client = new RiotApiClient('RGAPI-test-key');
    expect(client).toBeDefined();
  });

  it('should throw on missing API key', () => {
    expect(() => new RiotApiClient('')).toThrow('RIOT_API_KEY');
  });

  it('should build correct URL for challenger endpoint', () => {
    const client = new RiotApiClient('test-key');
    const url = (client as any).buildUrl('NA1', '/tft/league/v1/challenger');
    expect(url).toContain('na1.api.riotgames.com');
    expect(url).toContain('api_key=test-key');
  });
});
