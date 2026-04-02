/**
 * WFRP 4e Fate and Resilience Rules Engine
 *
 * Functions for calculating Fate and Resilience totals at character creation,
 * taking into account the species' base values and the Extra Points allocation.
 *
 * Each species has:
 * - A base Fate value (fixed)
 * - A base Resilience value (fixed)
 * - Extra Points — a pool the player distributes freely between Fate and Resilience
 *
 * Final totals:
 * - Fate Total = species.fate + extraPointsToFate
 * - Resilience Total = species.resilience + (species.extraPoints - extraPointsToFate)
 *
 * Source: WFRP 4e Core Rulebook, Attributes Table p.26.
 */

/**
 * Calculates the total Fate points for a character at creation.
 *
 * @param speciesFate - The base Fate value from the species (e.g., Human = 2)
 * @param extraPointsToFate - Number of Extra Points the player allocated to Fate
 * @returns Total Fate points
 */
export function getFateTotal(speciesFate: number, extraPointsToFate: number): number {
  return speciesFate + extraPointsToFate
}

/**
 * Calculates the total Resilience points for a character at creation.
 *
 * @param speciesResilience - The base Resilience value from the species (e.g., Human = 1)
 * @param speciesExtraPoints - The total Extra Points pool from the species (e.g., Human = 3)
 * @param extraPointsToFate - Number of Extra Points the player allocated to Fate
 * @returns Total Resilience points
 */
export function getResilienceTotal(
  speciesResilience: number,
  speciesExtraPoints: number,
  extraPointsToFate: number
): number {
  return speciesResilience + (speciesExtraPoints - extraPointsToFate)
}

/**
 * Validates that the Extra Points allocation to Fate is within bounds.
 *
 * Valid range: 0 <= extraPointsToFate <= speciesExtraPoints
 *
 * @param extraPointsToFate - Number of Extra Points the player wants to allocate to Fate
 * @param speciesExtraPoints - The total Extra Points pool from the species
 * @returns true if valid, false otherwise
 */
export function validateExtraPoints(
  extraPointsToFate: number,
  speciesExtraPoints: number
): boolean {
  return (
    Number.isInteger(extraPointsToFate) &&
    extraPointsToFate >= 0 &&
    extraPointsToFate <= speciesExtraPoints
  )
}

/**
 * Returns a default Extra Points allocation (evenly split, rounding down for Fate).
 * Use this as an initial value when the player hasn't made a choice yet.
 *
 * @param speciesExtraPoints - The total Extra Points pool from the species
 * @returns Default allocation (floor(extraPoints / 2) to Fate)
 */
export function getDefaultExtraPointsAllocation(speciesExtraPoints: number): number {
  return Math.floor(speciesExtraPoints / 2)
}
