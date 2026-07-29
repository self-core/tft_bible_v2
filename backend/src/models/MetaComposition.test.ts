import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MetaCompositionModel } from './MetaComposition';

describe('MetaCompositionModel', () => {
  let isConnected = false;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tft_bible_test';
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isConnected = true;
    } catch {
      console.warn('MongoDB not available, skipping model tests');
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

  it('should create a meta composition document', async () => {
    if (!isConnected) return;
    const doc = await MetaCompositionModel.create({
      id: 'psionic-gragas',
      setId: 17,
      patchVersion: '17.3',
      champions: [{ championId: 'TFT17_Gragas', count: 80, pickRate: 0.8, items: [] }],
      traits: [{ key: 'Psionic', breakpoint: 4, count: 90 }],
      stats: { matchesAnalyzed: 100, winRate: 0.15, top4Rate: 0.6, avgPlacement: 3.5, pickRate: 0.05 },
      playstyle: 'Fast 8',
      lastUpdated: new Date(),
    });
    expect(doc.id).toBe('psionic-gragas');
    expect(doc.stats.winRate).toBe(0.15);
  });

  it('should enforce unique id', async () => {
    if (!isConnected) return;
    const base = { setId: 17, patchVersion: '17.3', champions: [], traits: [], stats: { matchesAnalyzed: 0, winRate: 0, top4Rate: 0, avgPlacement: 0, pickRate: 0 }, playstyle: 'Standard' };
    await MetaCompositionModel.create({ id: 'dup', ...base });
    await expect(MetaCompositionModel.create({ id: 'dup', ...base })).rejects.toThrow();
  });
});
