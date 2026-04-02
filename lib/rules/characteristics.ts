import type { Talent, CharacteristicKey } from '../types/rules'

/**
 * WFRP 4e Characteristic Rules Engine
 *
 * Functions for calculating characteristic values, bonuses, wound thresholds,
 * XP costs, and starting characteristic rolls.
 *
 * Source: WFRP 4e Core Rulebook pp. 26–29, 49, 165, 340.
 */

/**
 * Returns the Characteristic Bonus — the tens digit of a characteristic value.
 * Bonus = Math.floor(value / 10).
 * Used extensively in derived stats: TB governs wounds, SB governs damage, etc.
 *
 * Source: WFRP 4e Core Rulebook p.27.
 */
export function getCharacteristicBonus(value: number): number {
  return Math.floor(value / 10)
}

/**
 * Returns the total characteristic value (base + advances), capping advances at 99.
 * The 99-advance cap is the absolute maximum per characteristic.
 *
 * Source: WFRP 4e Core Rulebook p.49.
 */
export function getTotalCharacteristic(
  base: number,
  advances: number,
  talentBonus: number = 0
): number {
  return base + Math.min(advances, 99) + talentBonus
}

/**
 * Computes the total characteristic bonus from a list of talent IDs.
 * Looks up each talent in the talents data and sums their characteristicBonus values.
 *
 * @param talentIds - Array of talent ID strings the character has
 * @param characteristicKey - The characteristic to compute bonus for
 * @param talentsData - The full talents data array to look up from
 * @returns Total bonus points from all talents for this characteristic
 */
export function getTalentCharacteristicBonuses(
  talentIds: string[],
  characteristicKey: CharacteristicKey,
  talentsData: Talent[]
): number {
  return talentIds.reduce((total, id) => {
    const talent = talentsData.find(t => t.id === id)
    if (talent?.characteristicBonus?.characteristic === characteristicKey) {
      return total + talent.characteristicBonus.value
    }
    return total
  }, 0)
}

/**
 * Calculates the standard wound threshold for humanoid characters.
 * Formula: TB + (2 × WPB) + SB
 *
 * Note: Halflings omit SB (TB + 2×WPB only). Dwarves add +2 from their
 * species extraWounds. Species-specific variants must apply those adjustments
 * on top of this base calculation.
 *
 * Source: WFRP 4e Core Rulebook p.165, p.340.
 */
export function getWoundThreshold(stats: {
  toughness: number
  willpower: number
  strength: number
}): number {
  const tb = getCharacteristicBonus(stats.toughness)
  const wpb = getCharacteristicBonus(stats.willpower)
  const sb = getCharacteristicBonus(stats.strength)
  return tb + 2 * wpb + sb
}

/**
 * XP cost per advance by tier (advances already taken → cost for next advance).
 * Source: WFRP 4e Core Rulebook — Characteristic and Skill Improvement XP Costs table.
 */
const CHARACTERISTIC_XP_TIERS: Array<{ max: number; cost: number }> = [
  { max: 5,  cost: 25  },
  { max: 10, cost: 30  },
  { max: 15, cost: 40  },
  { max: 20, cost: 50  },
  { max: 25, cost: 70  },
  { max: 30, cost: 90  },
  { max: 35, cost: 120 },
  { max: 40, cost: 150 },
  { max: 45, cost: 190 },
  { max: 50, cost: 230 },
]

/**
 * Returns the XP cost for a single characteristic advance.
 * Cost depends on the number of advances already taken.
 * Source: WFRP 4e Core Rulebook — Characteristic and Skill Improvement XP Costs table
 */
export function getXpCostForCharacteristicAdvance(currentAdvances: number): number {
  for (const tier of CHARACTERISTIC_XP_TIERS) {
    if (currentAdvances <= tier.max) return tier.cost
  }
  return 230
}

/**
 * Combines a species racial base with a 2d10 roll to produce the starting value.
 * Formula: speciesBase + roll
 *
 * In play, the player rolls 2d10 (range 2–20) and adds the species racial bonus.
 * This function takes the roll as a parameter — randomisation is handled by the caller.
 *
 * Source: WFRP 4e Core Rulebook pp. 26–29.
 */
export function rollStartingCharacteristic(speciesBase: number, roll: number): number {
  return speciesBase + roll
}
