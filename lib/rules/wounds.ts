/**
 * WFRP 4e Wound Rules Engine
 *
 * Functions for wound threshold calculation (by species), tracking current wounds
 * after damage, and resolving Critical Wounds when a character reaches 0 wounds.
 *
 * Source: Warhammer Fantasy Roleplay 4th Edition Core Rulebook (Cubicle 7, 2018)
 * Primary pages: p.165–166, p.340 (species traits).
 */

import { getCharacteristicBonus } from './characteristics'

// ── Wound Threshold Calculations ─────────────────────────────────────────────

/**
 * Returns the standard wound threshold for Human, High Elf, and Wood Elf characters.
 *
 * Formula: TB + (2 × WPB) + SB
 * where TB = Toughness Bonus, WPB = Willpower Bonus, SB = Strength Bonus.
 * Bonus = Math.floor(characteristic / 10).
 *
 * Source: WFRP 4e Core Rulebook p.165.
 *
 * @param toughness  - Total Toughness characteristic value.
 * @param willpower  - Total Willpower characteristic value.
 * @param strength   - Total Strength characteristic value.
 */
export function getWoundThreshold(
  toughness: number,
  willpower: number,
  strength: number,
): number {
  const tb = getCharacteristicBonus(toughness)
  const wpb = getCharacteristicBonus(willpower)
  const sb = getCharacteristicBonus(strength)
  return tb + 2 * wpb + sb
}

/**
 * Returns the wound threshold for a Halfling character.
 *
 * Halflings have the Small size trait, which modifies their wound formula to
 * exclude the Strength Bonus: TB + (2 × WPB) (no SB contribution).
 * This reflects the rules interaction between the Small size trait and the
 * standard wound formula.
 *
 * Source: WFRP 4e Core Rulebook p.340 (Halfling species traits / Small trait).
 *
 * @param toughness - Total Toughness characteristic value.
 * @param willpower - Total Willpower characteristic value.
 */
export function getHalflingWoundThreshold(toughness: number, willpower: number): number {
  const tb = getCharacteristicBonus(toughness)
  const wpb = getCharacteristicBonus(willpower)
  return tb + 2 * wpb
}

/**
 * Returns the wound threshold for a Dwarf character.
 *
 * The wound formula itself is identical to the standard formula: TB + (2 × WPB) + SB.
 * Dwarves do NOT get a bonus from the wound formula itself — the additional +2 wounds
 * that Dwarves receive come from the Resolute species talent, which is an independent
 * bonus stored in `Species.extraWounds` and applied on top of this calculation.
 *
 * ⚠️ Callers must add `species.extraWounds` (2 for Dwarves) separately. This function
 * returns only the base formula result.
 *
 * Source: WFRP 4e Core Rulebook p.165 (wound formula), p.340 (Dwarf species traits).
 *
 * @param toughness - Total Toughness characteristic value.
 * @param willpower - Total Willpower characteristic value.
 * @param strength  - Total Strength characteristic value.
 */
export function getDwarfWoundThreshold(
  toughness: number,
  willpower: number,
  strength: number,
): number {
  // Formula is identical to the standard humanoid formula.
  // The Dwarf +2 extraWounds comes from the Resolute species talent, not this formula.
  return getWoundThreshold(toughness, willpower, strength)
}

// ── Current Wounds Tracking ───────────────────────────────────────────────────

/**
 * Returns a character's current wounds after subtracting damage taken.
 *
 * Current wounds = max wounds − damage taken, minimum 0.
 * A character cannot have negative current wounds; the floor at 0 represents the
 * Seriously Wounded state. Overflow (damage beyond 0) is handled separately by
 * getCriticalWoundMagnitude.
 *
 * Source: WFRP 4e Core Rulebook p.166.
 *
 * @param maxWounds   - The character's wound threshold (maximum wounds).
 * @param damageTaken - Total damage points accumulated since last rest/healing.
 */
export function getCurrentWounds(maxWounds: number, damageTaken: number): number {
  return Math.max(0, maxWounds - damageTaken)
}

/**
 * Returns whether a character is Seriously Wounded (at 0 current wounds).
 *
 * A character reduced to 0 wounds is Seriously Wounded. They may still act but
 * must make Endurance tests to avoid losing consciousness. Any further damage
 * they receive triggers a Critical Wound.
 *
 * Source: WFRP 4e Core Rulebook p.166.
 *
 * @param currentWounds - The character's current (remaining) wound total.
 */
export function isSeriouslyWounded(currentWounds: number): boolean {
  return currentWounds <= 0
}

/**
 * Returns the magnitude of a Critical Wound inflicted on a character who is
 * already at 0 wounds.
 *
 * When a Seriously Wounded character (0 wounds) takes damage, the overflow
 * damage becomes the Critical Wound magnitude. This value is used to look up
 * the result on the Critical Wounds table.
 *
 * Calculation: magnitude = damage − currentWounds (where currentWounds ≤ 0).
 * If the character is not yet at 0 wounds, only the overflow past 0 counts.
 * The returned value is always ≥ 0.
 *
 * Example: character at 0 wounds takes 4 damage → magnitude 4.
 * Example: character at 2 wounds takes 5 damage → 3 wounds of overflow → magnitude 3.
 *
 * Source: WFRP 4e Core Rulebook p.166.
 *
 * @param damage        - The incoming damage amount.
 * @param currentWounds - The character's current wounds before this hit (may be 0).
 */
export function getCriticalWoundMagnitude(damage: number, currentWounds: number): number {
  const overflow = damage - currentWounds
  return Math.max(0, overflow)
}
