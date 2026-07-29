import { describe, it, expect } from 'vitest';
import { EmbeddedFallback } from './EmbeddedFallback';

describe('TFT Set 18 "Enchanted Wilds" Data Test', () => {
  it('should return Set 18 data with proper name and components', () => {
    const data = EmbeddedFallback.getSetData(18);
    expect(data).not.toBeNull();
    expect(data!.setId).toBe(18);
    expect(data!.setName).toBe('Enchanted Wilds');
    expect(data!.champions.length).toBeGreaterThan(0);
    expect(data!.traits.length).toBeGreaterThan(0);
    expect(data!.items.length).toBeGreaterThan(0);
    expect(data!.augments.length).toBeGreaterThan(0);
  });

  it('should verify Set 18 Blossom trait and its custom breakpoints', () => {
    const traits = EmbeddedFallback.getTraits(18);
    expect(traits).not.toBeNull();
    const blossom = traits!.find(t => t.key === 'Blossom');
    expect(blossom).toBeDefined();
    expect(blossom!.name).toBe('Blossom');
    expect(blossom!.breakpoints.length).toBe(5);
    expect(blossom!.breakpoints).toContainEqual({ count: 3, bonus: 'Wisps are upgraded' });
    expect(blossom!.breakpoints).toContainEqual({ count: 5, bonus: 'Wisps appear in every shop' });
    expect(blossom!.breakpoints).toContainEqual({ count: 7, bonus: 'Gain gold after buying a Wisp' });
    expect(blossom!.breakpoints).toContainEqual({ count: 9, bonus: 'You can buy 2 Wisps per round' });
    expect(blossom!.breakpoints).toContainEqual({ count: 11, bonus: 'Wisps overflow with power' });
  });

  it('should verify specific Set 18 champions exist with three traits and stats', () => {
    const champions = EmbeddedFallback.getChampions(18);
    expect(champions).not.toBeNull();

    // Akali (Inferno, Adaptor, Ravager)
    const akali = champions!.find(c => c.name === 'Akali');
    expect(akali).toBeDefined();
    expect(akali!.id).toBe('TFT18_Akali');
    expect(akali!.cost).toBe(1);
    expect(akali!.traits).toContain('Inferno');
    expect(akali!.traits).toContain('Adaptor');
    expect(akali!.traits).toContain('Ravager');
    expect(akali!.ability.name).toBe('Kunai Strike');

    // Camille (Coven, Ravager)
    const camille = champions!.find(c => c.name === 'Camille');
    expect(camille).toBeDefined();
    expect(camille!.id).toBe('TFT18_Camille');
    expect(camille!.cost).toBe(1);
    expect(camille!.traits).toContain('Coven');
    expect(camille!.traits).toContain('Ravager');
    expect(camille!.ability.name).toBe('Defensive Sweep');

    // Taric (Emerald Aspect, Vanguard)
    const taric = champions!.find(c => c.name === 'Taric');
    expect(taric).toBeDefined();
    expect(taric!.id).toBe('TFT18_Taric');
    expect(taric!.cost).toBe(5);
    expect(taric!.traits).toContain('Emerald Aspect');
    expect(taric!.traits).toContain('Vanguard');
    expect(taric!.ability.name).toBe('Emerald Radiance');
  });

  it('should verify Set 18 custom items exist with correct prefixes', () => {
    const items = EmbeddedFallback.getItems(18);
    expect(items).not.toBeNull();

    const bf = items!.find(i => i.name === 'B.F. Sword');
    expect(bf).toBeDefined();
    expect(bf!.id).toBe('TFT18_BFSword');

    const edge = items!.find(i => i.name === 'Edge of Night');
    expect(edge).toBeDefined();
    expect(edge!.id).toBe('TFT18_EdgeOfNight');
    expect(edge!.components).toContain('TFT18_BFSword');
    expect(edge!.components).toContain('TFT18_ChainVest');
  });
});
