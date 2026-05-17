import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MetaService } from './MetaService';
import { MetaCompositionModel } from '../models/MetaComposition';

describe('MetaService', () => {
  let service: MetaService;
  let isConnected = false;

  beforeAll(async () => {
    service = new MetaService();
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isConnected = true;
    } catch {
      console.warn('MongoDB not available, skipping integration tests');
    }
  });

  afterAll(async () => {
    if (isConnected) {
      try {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
      } catch {}
    }
  });

  it('should be constructable', () => {
    const s = new MetaService();
    expect(s).toBeDefined();
  });

  it('should return empty list when no meta comps in DB', async () => {
    if (!isConnected) return;
    const comps = await service.getMetaCompositions(17);
    expect(comps).toEqual([]);
  });

  it('should return null for non-existent id', async () => {
    if (!isConnected) return;
    const result = await service.getMetaCompositionById('nonexistent');
    expect(result).toBeNull();
  });

  it('should find a composition by id after creation', async () => {
    if (!isConnected) return;
    await MetaCompositionModel.create({
      id: 'test-comp', setId: 17, patchVersion: '17.3',
      champions: [], traits: [],
      stats: { matchesAnalyzed: 50, winRate: 0.2, top4Rate: 0.5, avgPlacement: 4.0, pickRate: 0.1 },
      playstyle: 'Standard',
    });
    const result = await service.getMetaCompositionById('test-comp');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('test-comp');
    expect(result!.stats.winRate).toBe(0.2);
  });
});
