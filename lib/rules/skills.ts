/**
 * WFRP 4e Skill Rules Engine
 *
 * Functions for calculating skill XP costs, total skill values, and advance caps.
 *
 * Source: WFRP 4e Core Rulebook pp. 47–48.
 */

/**
 * XP cost per advance by tier (advances already taken → cost for next advance).
 * Source: WFRP 4e Core Rulebook — Characteristic and Skill Improvement XP Costs table.
 */
const SKILL_XP_TIERS: Array<{ max: number; cost: number }> = [
  { max: 5,  cost: 10  },
  { max: 10, cost: 15  },
  { max: 15, cost: 20  },
  { max: 20, cost: 30  },
  { max: 25, cost: 40  },
  { max: 30, cost: 60  },
  { max: 35, cost: 80  },
  { max: 40, cost: 110 },
  { max: 45, cost: 140 },
  { max: 50, cost: 180 },
]

/**
 * Returns the XP cost for a single skill advance.
 * Cost depends on the number of advances already taken.
 * Source: WFRP 4e Core Rulebook — Characteristic and Skill Improvement XP Costs table
 *
 * @param currentAdvances - Number of advances already purchased (0 = no advances yet).
 * @param _isCareerSkill  - Ignored. Career/non-career status does not affect cost.
 */
export function getSkillXpCost(currentAdvances: number, _isCareerSkill?: boolean): number {
  for (const tier of SKILL_XP_TIERS) {
    if (currentAdvances < tier.max) return tier.cost
  }
  return 180
}

/**
 * Returns the total skill value for a test.
 * Formula: linked characteristic total + skill advances.
 *
 * Source: WFRP 4e Core Rulebook p.47.
 *
 * @param characteristicTotal - The full value of the governing characteristic (base + advances).
 * @param skillAdvances       - Number of advances purchased in this skill.
 */
export function getTotalSkillValue(characteristicTotal: number, skillAdvances: number): number {
  return characteristicTotal + skillAdvances
}

/**
 * Returns the maximum number of advances that can be purchased in any single skill.
 * This cap is 10 advances per skill, regardless of career or non-career status.
 *
 * Source: WFRP 4e Core Rulebook p.48.
 */
export function getMaxSkillAdvances(): number {
  return 10
}

// ── Career Skill Allocation at Creation ──────────────────────────────────────

/**
 * Represents a single career skill's advance allocation during character creation.
 * The player distributes 40 advances across the 8 career skills, with no more
 * than 10 to any single skill.
 *
 * For grouped skills with anySpecialisation: true, the player may provide a
 * custom specialisation via customSpecialisation (e.g., "Basic", "Reikspiel").
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export interface CareerSkillAllocation {
  skillId: string
  advances: number // 0–10
  /**
   * For skills with anySpecialisation: true, the player-chosen specialisation.
   * E.g., "Basic" for Melee (any), "Reikspiel" for Language (any).
   */
  customSpecialisation?: string
}

/**
 * Validates a career skill allocation at character creation.
 * Rules (source: WFRP 4e Core Rulebook p.35):
 *   - Total advances must equal exactly 40.
 *   - No single skill may have more than 10 advances.
 *   - No skill may have negative advances.
 *   - All skills must be from the career level's skills array.
 * Returns an array of errors (empty if valid).
 *
 * @param allocation  - The player's per-skill advance entries.
 * @param careerSkills - The skill IDs available at the current career level.
 */
export function validateCareerSkillAllocation(
  allocation: CareerSkillAllocation[],
  careerSkills: string[]
): string[] {
  const errors: string[] = []

  const careerSkillSet = new Set(careerSkills)
  for (const entry of allocation) {
    if (!careerSkillSet.has(entry.skillId)) {
      errors.push(`Skill "${entry.skillId}" is not a career skill at this level`)
    }
    if (entry.advances < 0) {
      errors.push(`Skill "${entry.skillId}" cannot have negative advances`)
    }
    if (entry.advances > 10) {
      errors.push(
        `Skill "${entry.skillId}" cannot exceed 10 advances at this stage (has ${entry.advances})`
      )
    }
  }

  const total = getTotalAllocatedAdvances(allocation)
  if (total !== 40) {
    errors.push(`Total advances must equal exactly 40 (currently ${total})`)
  }

  return errors
}

/**
 * Returns the total advances allocated so far (sum of all allocation.advances).
 * Useful for the UI "X / 40 advances allocated" counter.
 *
 * @param allocation - The current per-skill advance entries.
 */
export function getTotalAllocatedAdvances(
  allocation: CareerSkillAllocation[]
): number {
  return allocation.reduce((sum, entry) => sum + entry.advances, 0)
}
