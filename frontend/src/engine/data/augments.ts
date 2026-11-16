import type { Augment } from '../../lib/api';
import type { StatModifier } from '../types';

/**
 * Curated numeric augments. cdragon exposes augment effects as raw variable
 * maps, but the GraphQL Augment type carries no numbers, so the sandbox maps
 * known ids here. Augments absent from this table are flagged as unmodeled in
 * the coverage report rather than silently ignored.
 */
export const AUGMENT_MODIFIERS: Record<string, StatModifier> = {
  // Set 18 trait augments (values verified against cdragon pbe json)
  DA_18_LunarTraitAugment: { damageAmp: 0.08, hpFlat: 100 },
  DA_18_LunarTraitAugmentPlus: { damageAmp: 0.08, hpFlat: 100 },
  DA_18_InfernoTraitAugment: { asPercent: 0.25 },
  DA_18_ElderwoodTraitAugment: { asPercent: 0.15 },
  DA_18_SolarTraitAugment: { hpFlat: 60 },

  // Set 17
  TFT17_Augment_EmergencySupplies: { damageAmp: 0.15 },

  // Set 16
  TFT16_Augment_UltraRapidFire: { asPercent: 0.2, manaRegen: 3 },

  // Generic stat augments from earlier sets (still referenced by set data)
  TFT9_Augment_CyberneticBulk1: { hpFlat: 200 },
  TFT9_Augment_CyberneticBulk2: { hpFlat: 300 },
  TFT9_Augment_CyberneticBulk3: { hpFlat: 500 },
  TFT9_Augment_Edgy1: { adPercent: 0.2, asPercent: 0.2 },
  TFT9_Augment_Edgy2: { adPercent: 0.3, asPercent: 0.3 },
  TFT9_Augment_Edgy3: { adPercent: 0.4, asPercent: 0.4 },
  TFT9_Augment_Commander_Amplify1: { critMultiplier: 0.1 },
  TFT9_Augment_Commander_Amplify2: { critMultiplier: 0.2 },
  TFT9_Augment_Commander_Amplify3: { critMultiplier: 0.3 },
  TFT9_Augment_AirspeedVelocity3: { asPercent: 0.75 },
  TFT6_Augment_Meditation1: { manaRegen: 4 },
  TFT6_Augment_Meditation2: { manaRegen: 6 },
  TFT6_Augment_Meditation3: { manaRegen: 8 },
};

export function augmentModifier(augment: Augment): StatModifier | null {
  return AUGMENT_MODIFIERS[augment.id] ?? null;
}
