/**
 * WFRP 4e Species Rules Engine
 *
 * Functions for species-specific character creation values: starting XP,
 * fixed skills, and fixed talents.
 *
 * Source: WFRP 4e Core Rulebook pp. 24–35.
 */

import type { Species } from '../types/rules'
import randomTalentsData from '@/data/random-talents.json'

/**
 * Starting XP budget by species ID.
 *
 * ⚠️  DOCS NOTE: The provided rulebook docs do not contain a species-specific
 * starting XP table. The only XP values found in docs/rulebook.md are bonus XP
 * earned through random choices during character creation (+20 XP for accepting
 * random species, +50/+25 XP for accepting random career). These per-species
 * values reflect the WFRP 4e design principle that elder species (Elves) have
 * accumulated more life experience before play begins, and Dwarfs start with
 * slightly more due to their long apprenticeships. Use these values as the base
 * XP budget available at character creation Step 4 for purchasing skill/talent
 * advances. If the GM runs character creation with random tables, add the bonus
 * XP on top of this base.
 *
 * ⚠️  UNVERIFIED: These values are ASSUMED, not confirmed from official WFRP 4e
 * sources. They have NOT been found in the provided rulebook docs. Do not treat
 * them as canonical until cross-referenced against the printed corebook p.26–35.
 *
 * Source: WFRP 4e Core Rulebook (verified values not found in docs extracts;
 * values derived from rulebook design intent).
 */
const STARTING_XP_BY_SPECIES: Record<string, number> = {
  'human':    20,
  'dwarf':    25,
  'halfling': 20,
  'high-elf': 30,
  'wood-elf': 30,
}

/**
 * @deprecated The starting XP in WFRP 4e is NOT fixed per species.
 * It depends on how choices were made during character creation.
 * Use getCreationXP(speciesMethod, careerMethod) from lib/rules/creation-xp.ts instead.
 * These values were assumed and are incorrect.
 *
 * @param speciesId - Species identifier from data/species.json
 * @returns Starting XP amount (assumed, unverified per-species value)
 * @throws Error if speciesId is not a recognised playable species
 */
export function getStartingXP(speciesId: string): number {
  const xp = STARTING_XP_BY_SPECIES[speciesId]
  if (xp === undefined) {
    throw new Error(`Unknown species id: "${speciesId}". Valid ids: ${Object.keys(STARTING_XP_BY_SPECIES).join(', ')}`)
  }
  return xp
}

/**
 * Returns the fixed (non-random) starting skills a character of this species
 * automatically receives. Does not include roll-table choices.
 * Returns skill names as strings matching data/skills.json names.
 *
 * ⚠️  WFRP 4e design note: ALL species skills are a pool from which the player
 * chooses — there are NO fixed auto-granted species skills. The rulebook states:
 * "You may choose 3 Skills to gain 5 Advances each, and 3 Skills to gain 3
 * Advances each" from the 12-skill species pool (p.35). No skill is granted
 * without player choice. Therefore this function always returns [].
 *
 * The full 12-skill pool is available as Species.startingSkills in the species
 * data — Jane should present those 12 skills as a selection UI in Step 4, not
 * pre-populate them as automatic grants.
 *
 * @param speciesId - Species identifier from data/species.json
 * @param speciesData - Full species data array (from data/species.json)
 * @returns Empty array — all species skills are player-chosen from the pool
 */
export function getSpeciesFixedSkills(
  _speciesId: string,
  _speciesData: Species[]
): string[] {
  // All species skills in WFRP 4e are choice-based (pick 3×5 + 3×3 from the
  // 12-skill pool). No species auto-grants skills without player selection.
  return []
}

/**
 * Returns the fixed (auto-granted) starting talents for a species.
 * Delegates to getFixedSpeciesTalents() after looking up the species by id.
 *
 * @param speciesId - Species identifier from data/species.json
 * @param speciesData - Full species data array (from data/species.json)
 * @returns Array of talent name strings automatically granted to the species.
 *   Returns [] if species not found.
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export function getSpeciesFixedTalents(
  speciesId: string,
  speciesData: Species[]
): string[] {
  const species = speciesData.find(s => s.id === speciesId)
  if (!species) return []

  return species.startingTalents
    .filter((entry): entry is { type: 'fixed'; talent: string } => entry.type === 'fixed')
    .map(entry => entry.talent)
}

// ── New talent helpers (object-based API) ────────────────────────────────────

/**
 * Returns all fixed (auto-granted) talent names for a species.
 * These are granted without any player choice.
 *
 * @param species - A single Species object from data/species.json.
 * @returns Array of talent name strings that are automatically granted.
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export function getFixedSpeciesTalents(species: Species): string[] {
  return species.startingTalents
    .filter((entry): entry is { type: 'fixed'; talent: string } => entry.type === 'fixed')
    .map(entry => entry.talent)
}

/**
 * Returns all choice talent entries for a species.
 * The player must pick exactly one talent from each returned options array.
 *
 * @param species - A single Species object from data/species.json.
 * @returns Array of choice objects, each containing an `options` string array.
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export function getChoiceSpeciesTalents(
  species: Species
): Array<{ options: string[] }> {
  return species.startingTalents
    .filter((entry): entry is { type: 'choice'; options: string[] } => entry.type === 'choice')
    .map(entry => ({ options: entry.options }))
}

/**
 * Returns the number of random talents the player should roll for this species.
 * Returns 0 if the species has no random talent entry.
 *
 * @param species - A single Species object from data/species.json.
 * @returns Total count of random talent rolls (summed across all random entries).
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export function getRandomTalentCount(species: Species): number {
  return species.startingTalents
    .filter((entry): entry is { type: 'random'; count: number } => entry.type === 'random')
    .reduce((sum, entry) => sum + entry.count, 0)
}

/**
 * Returns the full list of talents available for random talent rolls.
 * Based on the Random Talent Table from the WFRP 4e Core Rulebook p.35.
 *
 * @returns Array of talent name strings from data/random-talents.json.
 *
 * Source: WFRP 4e Core Rulebook p.35 Random Talent Table.
 */
export function getRandomTalentPool(): string[] {
  return (randomTalentsData as { talents: string[] }).talents
}

// ── Species Skill Pool Selection ─────────────────────────────────────────────

/**
 * Represents one skill chosen from the species' starting skill pool at creation.
 * The player picks 3 skills for +5 advances and 3 different skills for +3 advances
 * from the 12-skill species pool.
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export interface SpeciesSkillSelection {
  skillId: string
  advances: 5 | 3
  customSpecialisation?: string
}

/**
 * Validates a player's species skill selections.
 * Must pick exactly 3 skills for +5 advances and 3 different skills for +3 advances.
 * All skills must be from the species' startingSkills pool.
 * The same skill cannot appear twice across either tier.
 * Returns an array of errors (empty if valid).
 *
 * Source: WFRP 4e Core Rulebook p.35.
 *
 * @param selections           - The player's chosen skill/advance pairs.
 * @param speciesStartingSkills - The 12-entry skill pool from Species.startingSkills.
 */
export function validateSpeciesSkillSelections(
  selections: SpeciesSkillSelection[],
  speciesStartingSkills: string[]
): string[] {
  const errors: string[] = []

  const fiveAdvance = selections.filter(s => s.advances === 5)
  const threeAdvance = selections.filter(s => s.advances === 3)

  if (fiveAdvance.length !== 3) {
    errors.push(
      `Must select exactly 3 skills for +5 advances (selected ${fiveAdvance.length})`
    )
  }
  if (threeAdvance.length !== 3) {
    errors.push(
      `Must select exactly 3 skills for +3 advances (selected ${threeAdvance.length})`
    )
  }

  // Each skill may only appear once across both tiers.
  const allIds = selections.map(s => s.skillId)
  const uniqueIds = new Set(allIds)
  if (uniqueIds.size !== allIds.length) {
    errors.push('Each skill may only be selected once across both tiers')
  }

  // Every selected skill must come from the species pool.
  const poolSet = new Set(speciesStartingSkills)
  for (const selection of selections) {
    if (!poolSet.has(selection.skillId)) {
      errors.push(
        `Skill "${selection.skillId}" is not in this species' starting skills pool`
      )
    }
  }

  return errors
}

/**
 * Returns the total advances a character has in a skill from their species selection.
 * Returns 0 if the skill was not selected.
 *
 * @param skillId    - The skill ID to look up.
 * @param selections - The player's species skill selections.
 */
export function getSpeciesSkillAdvances(
  skillId: string,
  selections: SpeciesSkillSelection[]
): number {
  const selection = selections.find(s => s.skillId === skillId)
  return selection ? selection.advances : 0
}

/**
 * Rolls a random species using a d100 (percentile) roll, as per the Random
 * Species Table in the WFRP 4e Core Rulebook.
 *
 * Distribution (source: WFRP 4e Core Rulebook p.24):
 *   01–90  Human     (90%)
 *   91–94  Halfling  (4%)
 *   95–98  Dwarf     (4%)
 *   99     High Elf  (1%)
 *   00     Wood Elf  (1%)  — "00" is treated as 100 on a percentile roll
 *
 * @returns The species id string matching data/species.json
 *   ("human" | "halfling" | "dwarf" | "high-elf" | "wood-elf")
 */
export function rollRandomSpecies(): string {
  // Produces 1–100 inclusive, where 100 represents the "00" result.
  const roll = Math.floor(Math.random() * 100) + 1
  if (roll <= 90) return 'human'
  if (roll <= 94) return 'halfling'
  if (roll <= 98) return 'dwarf'
  if (roll <= 99) return 'high-elf'
  return 'wood-elf' // roll === 100, the "00" result
}

/**
 * Like rollRandomSpecies(), but also returns the d100 value that was rolled
 * so the UI can display "Rolled: 47 → Human".
 */
export function rollRandomSpeciesWithDie(): { roll: number; speciesId: string } {
  const roll = Math.floor(Math.random() * 100) + 1
  let speciesId: string
  if (roll <= 90) speciesId = 'human'
  else if (roll <= 94) speciesId = 'halfling'
  else if (roll <= 98) speciesId = 'dwarf'
  else if (roll <= 99) speciesId = 'high-elf'
  else speciesId = 'wood-elf'
  return { roll, speciesId }
}
