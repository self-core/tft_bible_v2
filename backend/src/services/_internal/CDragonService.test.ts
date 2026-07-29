import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CDragonService } from './CDragonService';

describe('CDragonService', () => {
  let service: CDragonService;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CDRAGON_ENDPOINT;
    service = new CDragonService();
    service.clearCache();
  });

  it('uses latest endpoint by default', () => {
    expect(service.getBaseUrl()).toContain('latest');
  });

  it('uses pbe endpoint when env is set', () => {
    process.env.CDRAGON_ENDPOINT = 'pbe';
    expect(service.getBaseUrl()).toContain('pbe');
  });

  it('returns cached data on repeated fetch', async () => {
    const fetchSpy = vi.spyOn(service as any, 'httpGet').mockResolvedValue({
      setData: { '17': { name: 'Set 17', champions: [], traits: [] } },
      items: [],
      augments: [],
    });

    const data1 = await service.fetch();
    const data2 = await service.fetch();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(data1).toBe(data2);
  });

  it('clears cache correctly', async () => {
    vi.spyOn(service as any, 'httpGet').mockResolvedValue({
      setData: {},
      items: [],
      augments: [],
    });

    await service.fetch();
    service.clearCache();
    const fetchSpy2 = vi.spyOn(service as any, 'httpGet').mockResolvedValue({
      setData: {},
      items: [],
      augments: [],
    });

    await service.fetch();

    expect(fetchSpy2).toHaveBeenCalledTimes(1);
  });

  it('throws on HTTP error', async () => {
    vi.spyOn(service as any, 'httpGet').mockRejectedValue(new Error('CDragon fetch failed: 404'));

    await expect(service.fetch()).rejects.toThrow('CDragon fetch failed: 404');
  });
});
