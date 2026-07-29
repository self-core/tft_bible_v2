import { describe, it, expect } from 'vitest';
import { CompAnalyzer } from './CompAnalyzer';

describe('CompAnalyzer', () => {
  const analyzer = new CompAnalyzer();

  it('should build co-occurrence matrix from participant boards', () => {
    const boards = [
      { units: ['TFT17_A', 'TFT17_B', 'TFT17_C'], placement: 1 },
      { units: ['TFT17_A', 'TFT17_B', 'TFT17_D'], placement: 4 },
      { units: ['TFT17_A', 'TFT17_C', 'TFT17_E'], placement: 2 },
    ];
    const matrix = analyzer.buildCoOccurrence(boards);
    // Values are normalized by champion appearance count
    expect(matrix['TFT17_A']['TFT17_B']).toBeCloseTo(0.667, 2);
    expect(matrix['TFT17_A']['TFT17_C']).toBeCloseTo(0.667, 2);
    expect(matrix['TFT17_B']['TFT17_D']).toBeCloseTo(0.5, 1);
  });

  it('should cluster champions with high co-occurrence', () => {
    const clusters = analyzer.cluster({
      'TFT17_A': { 'TFT17_B': 0.9, 'TFT17_C': 0.8, 'TFT17_D': 0.3 },
      'TFT17_B': { 'TFT17_A': 0.9, 'TFT17_C': 0.7, 'TFT17_D': 0.2 },
      'TFT17_C': { 'TFT17_A': 0.8, 'TFT17_B': 0.7, 'TFT17_D': 0.1 },
      'TFT17_D': { 'TFT17_A': 0.3, 'TFT17_B': 0.2, 'TFT17_C': 0.1 },
    }, 0.6);
    expect(clusters).toHaveLength(1); // A, B, C cluster together, D is isolated
    expect(clusters[0].sort()).toEqual(['TFT17_A', 'TFT17_B', 'TFT17_C']);
  });

  it('should compute stats for a cluster', () => {
    const stats = analyzer.computeStats([
      { units: [], placement: 1, level: 9, traits: [{ name: 'Psionic', num_units: 4 }] },
      { units: [], placement: 3, level: 8, traits: [{ name: 'Psionic', num_units: 4 }] },
      { units: [], placement: 7, level: 7, traits: [{ name: 'Psionic', num_units: 2 }] },
    ], 3);
    expect(stats.winRate).toBeCloseTo(0.333, 2);
    expect(stats.top4Rate).toBeCloseTo(0.667, 2);
    expect(stats.avgPlacement).toBeCloseTo(3.667, 1);
  });
});
