/**
 * WFRP 4e Career Rules Engine
 *
 * Functions for career advancement: XP costs for characteristics, skills and
 * talents within a career level, eligibility checks for advancing to the next
 * level, and total XP projections for career completion.
 *
 * Source: Warhammer Fantasy Roleplay 4th Edition Core Rulebook (Cubicle 7, 2018)
 * Primary pages: p.47–49 (advancement), p.58 (career levels).
 */

import type { Character } from '../types/character'
import type { Career, CareerLevel } from '../types/rules'

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Converts a display name into a slug suitable for ID comparison.
 * E.g., "Combat Reflexes" → "combat-reflexes", "Melee (Basic)" → "melee-basic".
 * This is used for best-effort matching between CareerSkillEntry/CareerTalentEntry
 * names (display text) and CharacterSkill.skillId / CharacterTalent.talentId (slugs).
 */
function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()'"]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── XP Cost Functions ─────────────────────────────────────────────────────────

/**
 * Returns the XP cost to purchase the next advance in a career characteristic.
 *
 * Career characteristics are those listed in the character's current career level.
 * Only characteristics listed at the current level may be advanced using XP.
 * Formula: 25 × (currentAdvances + 1)
 *
 * Source: WFRP 4e Core Rulebook p.49.
 *
 * @param currentAdvances - Number of advances already purchased (0 = none yet).
 */
export function getXpCostForCareerCharacteristic(currentAdvances: number): number {
  return 25 * (currentAdvances + 1)
}

/**
 * Returns the XP cost to purchase the next advance in a career skill.
 *
 * Career skills are those listed in the character's current career level.
 * Maximum of 10 advances per skill.
 * Formula: 10 × (currentAdvances + 1)
 *
 * Source: WFRP 4e Core Rulebook p.48.
 *
 * @param currentAdvances - Number of advances already purchased (0–9).
 */
export function getXpCostForCareerSkill(currentAdvances: number): number {
  if (currentAdvances >= 10) {
    throw new Error('Skill already at maximum advances (10)')
  }
  return 10 * (currentAdvances + 1)
}

/**
 * Returns the XP cost to purchase the next advance in a non-career skill.
 *
 * Non-career skills are those NOT listed in the character's current career level.
 * They cost double the career rate. Maximum of 10 advances per skill.
 * Formula: 10 × (currentAdvances + 1) × 2
 *
 * Source: WFRP 4e Core Rulebook p.48.
 *
 * @param currentAdvances - Number of advances already purchased (0–9).
 */
export function getXpCostForNonCareerSkill(currentAdvances: number): number {
  if (currentAdvances >= 10) {
    throw new Error('Skill already at maximum advances (10)')
  }
  return 10 * (currentAdvances + 1) * 2
}

/**
 * Returns the XP cost to take a talent from the current career level.
 *
 * In WFRP 4e (4th edition) ALL talent takings cost 100 XP each. There is no
 * "free first talent" — that mechanic existed in WFRP 2e and does not carry
 * over. Each taking of any talent (first or additional) costs 100 XP, up to
 * the talent's max.
 *
 * Source: WFRP 4e Core Rulebook p.49.
 *
 * @param timesTaken - How many times the talent has already been taken (unused
 *   in the cost calculation but included for signature completeness and future
 *   expansion, e.g., to enforce per-talent max validation at the call site).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getXpCostForTalent(timesTaken: number): number {
  return 100
}

// ── Career Skill Lookup ───────────────────────────────────────────────────────

/**
 * Returns whether the given skill name is a career skill for the supplied career level.
 *
 * Matching strategy: the skillName parameter is expected to be the full display
 * name of the skill (e.g., "Melee (Basic)", "Athletics"). Each CareerSkillEntry
 * is reconstructed into a comparable display name from its `skill` and optional
 * `specialisation` fields and then slug-compared against the provided name.
 *
 * For entries with `anySpecialisation: true` (e.g., "Melee (any)"), the match
 * succeeds if the root skill name matches regardless of the provided specialisation.
 *
 * Source: WFRP 4e Core Rulebook p.48.
 *
 * @param skillName  - Full display name of the skill to test (e.g., "Melee (Basic)").
 * @param careerLevel - The career level whose skill list to test against.
 */
export function isCareerSkill(skillName: string, careerLevel: CareerLevel): boolean {
  const targetId = nameToId(skillName)

  return careerLevel.skills.some((entry) => {
    if (entry.anySpecialisation) {
      // Match any specialisation of this root skill.
      // The target slug must begin with the root skill slug.
      return targetId.startsWith(nameToId(entry.skill))
    }

    if (entry.specialisation) {
      const entryId = nameToId(`${entry.skill} ${entry.specialisation}`)
      return targetId === entryId
    }

    return targetId === nameToId(entry.skill)
  })
}

// ── Career Level Advancement Check ───────────────────────────────────────────

/**
 * Validates whether a character meets the requirements to advance to the next
 * career level (or to claim completion of the current one).
 *
 * Requirements per WFRP 4e Core Rulebook p.58:
 *   1. ALL career characteristics must have ≥ (level × 5) advances.
 *      Level 1 → 5, Level 2 → 10, Level 3 → 15, Level 4 → 20.
 *   2. At least 8 of the career level's available skills must have ≥ (level × 5) advances.
 *   3. At least 1 talent from those listed for the level has been acquired.
 *
 * Prior career advances count — the function uses the character's total advances,
 * not just advances gained within the current career.
 *
 * Matching notes:
 *   - Characteristic advances use `character.characteristicAdvances[key]`.
 *   - Skill matching converts CareerSkillEntry names to ID slugs and compares
 *     against `CharacterSkill.skillId`. For `anySpecialisation` entries, any
 *     character skill whose ID begins with the root slug counts.
 *   - Talent matching converts CareerTalentEntry talent names to ID slugs and
 *     compares against `CharacterTalent.talentId`.
 *
 * Source: WFRP 4e Core Rulebook p.58.
 *
 * @param character  - The full character sheet to evaluate.
 * @param careerLevel - The career level the character is attempting to complete.
 * @returns `{ eligible: boolean; missing: string[] }` — eligible is true when
 *   missing is empty. missing lists human-readable descriptions of unmet requirements.
 */
export function canAdvanceCareerLevel(
  character: Character,
  careerLevel: CareerLevel,
): { eligible: boolean; missing: string[] } {
  const missing: string[] = []
  const required = careerLevel.level * 5

  // 1. ALL career characteristics must have >= required advances.
  for (const key of careerLevel.characteristics) {
    const advances = character.characteristicAdvances[key] ?? 0
    if (advances < required) {
      const deficit = required - advances
      missing.push(
        `${key} needs ${deficit} more advance${deficit === 1 ? '' : 's'} (has ${advances}, needs ${required})`,
      )
    }
  }

  // 2. At least 8 of the career level's available skills must have >= required advances.
  let skillsMeetingThreshold = 0
  for (const entry of careerLevel.skills) {
    const hasSkill = character.skills.some((cs) => {
      const skillId = cs.skillId

      if (entry.anySpecialisation) {
        // Any specialisation of this root skill qualifies.
        return skillId.startsWith(nameToId(entry.skill)) && cs.advances >= required
      }

      if (entry.specialisation) {
        const entryId = nameToId(`${entry.skill} ${entry.specialisation}`)
        return skillId === entryId && cs.advances >= required
      }

      return skillId === nameToId(entry.skill) && cs.advances >= required
    })

    if (hasSkill) {
      skillsMeetingThreshold++
    }
  }

  const skillsNeeded = Math.max(0, 8 - skillsMeetingThreshold)
  if (skillsNeeded > 0) {
    missing.push(
      `Need ${skillsNeeded} more skill${skillsNeeded === 1 ? '' : 's'} at ${required}+ advances` +
        ` (${skillsMeetingThreshold}/8 required met)`,
    )
  }

  // 3. At least one talent from the career level's talent list must be taken.
  const hasTalent = careerLevel.talents.some((entry) => {
    const entryId = nameToId(entry.talent)
    return character.talents.some((ct) => ct.talentId === entryId)
  })

  if (!hasTalent && careerLevel.talents.length > 0) {
    const talentNames = careerLevel.talents.map((t) => t.talent).join(' / ')
    missing.push(`Talent: must take at least one of [${talentNames}]`)
  }

  return { eligible: missing.length === 0, missing }
}

// ── Total XP Projection ───────────────────────────────────────────────────────

/**
 * Returns the minimum total XP required to satisfy the completion requirements
 * for a career level, assuming the character starts with zero advances in all
 * listed characteristics and skills.
 *
 * Breakdown (threshold = level × 5):
 *   - ALL career characteristics from 0 → threshold using career characteristic XP cost.
 *   - min(8, skills.length) career skills from 0 → threshold using career skill XP cost.
 *     If fewer than 8 skills are listed, all available skills count.
 *   - 1 talent: 100 XP (fixed cost regardless of which talent is chosen).
 *
 * Source: WFRP 4e Core Rulebook pp. 48–49, 58.
 *
 * @param careerLevel - The career level to cost out.
 */
export function getTotalXpForCareerLevel(careerLevel: CareerLevel): number {
  const threshold = careerLevel.level * 5

  // Sum XP for all career characteristics from 0 → threshold.
  let characteristicXpPerChar = 0
  for (let i = 0; i < threshold; i++) {
    characteristicXpPerChar += getXpCostForCareerCharacteristic(i)
  }
  const characteristicXp = careerLevel.characteristics.length * characteristicXpPerChar

  // Sum XP for min(8, skills.length) career skills from 0 → threshold.
  let skillXpPerSkill = 0
  for (let i = 0; i < threshold; i++) {
    skillXpPerSkill += getXpCostForCareerSkill(i)
  }
  const skillCount = Math.min(8, careerLevel.skills.length)
  const skillXp = skillCount * skillXpPerSkill

  // 1 talent at 100 XP (or 0 if the level lists no talents, edge case not in canon).
  const talentXp = careerLevel.talents.length > 0 ? 100 : 0

  return characteristicXp + skillXp + talentXp
}

// ── Starting Trappings ────────────────────────────────────────────────────────

/**
 * Computes the deduplicated list of trappings a character should receive when
 * starting at a given career level.
 *
 * Combines:
 *   1. Class starting trappings (from `data/trappings.json`, passed in as
 *      `classTrappings`) — the standard kit for all members of the career class.
 *   2. The trappings listed at `career.levels[levelIndex]` — the career-specific
 *      equipment for that particular level.
 *
 * Deduplication is case-insensitive and whitespace-normalised so that minor
 * formatting inconsistencies between the class list and career list do not
 * produce duplicates (e.g., "Dagger" from the class list vs "Dagger" from the
 * career level list both collapse to the same entry).
 *
 * Source: WFRP 4e Core Rulebook p.38 (Class Trappings), p.38 (Career Trappings).
 *
 * @param career        - The Career definition (from careers.json).
 * @param levelIndex    - Zero-based index into career.levels (0 = Level 1, 3 = Level 4).
 * @param classTrappings - Class starting trappings for the career's class, e.g.
 *                         `trappingsData.classStartingTrappings[career.careerClass]`.
 * @returns Deduplicated string array of trapping names.
 */
export function getStartingTrappings(
  career: Career,
  levelIndex: 0 | 1 | 2 | 3,
  classTrappings: string[],
): string[] {
  const careerLevelTrappings = career.levels[levelIndex]?.trappings ?? []

  const seen = new Set<string>()
  const result: string[] = []

  for (const trapping of [...classTrappings, ...careerLevelTrappings]) {
    const key = trapping.trim().toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(trapping)
    }
  }

  return result
}

// ── Career Creation Options ───────────────────────────────────────────────────

/**
 * The characteristics, skills, and talents available for XP advancement at
 * character creation, restricted to the current career level only.
 *
 * Source: WFRP 4e Core Rulebook p.43.
 */
export interface CareerCreationOptions {
  /** The career-level characteristic abbreviations available for XP advancement (e.g. ["WS","BS","S"]). */
  characteristics: string[]
  /** The career-level skill display names available for XP advancement (e.g. ["Athletics", "Melee (Basic)"]). */
  skills: string[]
  /** The career-level talent names available for acquisition with XP. */
  talents: string[]
}

/**
 * Returns the characteristics, skills, and talents available for XP advancement
 * at character creation. Restricted to the current career level only.
 *
 * Skills are returned as display-name strings:
 *   - Non-grouped: "Athletics"
 *   - Specialised: "Melee (Basic)"
 *   - Any-specialisation: "Melee (any)"
 *
 * Source: WFRP 4e Core Rulebook p.43.
 *
 * @param career      - The Career definition (from data/careers.json).
 * @param levelNumber - Which level of the career to query (1–4).
 * @throws Error if the career has no matching level.
 */
export function getCareerCreationOptions(
  career: Career,
  levelNumber: 1 | 2 | 3 | 4
): CareerCreationOptions {
  const level = career.levels.find(l => l.level === levelNumber)
  if (!level) {
    throw new Error(`Career "${career.name}" has no level ${levelNumber}`)
  }

  const characteristics = level.characteristics as string[]

  const skills = level.skills.map(entry => {
    if (entry.anySpecialisation) return `${entry.skill} (any)`
    if (entry.specialisation) return `${entry.skill} (${entry.specialisation})`
    return entry.skill
  })

  const talents = level.talents.map(entry => entry.talent)

  return { characteristics, skills, talents }
}

// ── Random Career Roller ──────────────────────────────────────────────────────

/**
 * Rolls a random career from the provided career list, simulating a 1d100
 * roll on the Random Class and Career Table in the WFRP 4e Core Rulebook.
 *
 * Used in character creation Step 2:
 *   - Roll once and keep result → +50 XP (CareerChoiceMethod 'random')
 *   - Roll 3 times, pick one   → +25 XP (CareerChoiceMethod 'rolled3pick1')
 *
 * Call this function once per roll and collect results before the player
 * chooses. Apply the appropriate XP bonus via getCareerChoiceXP() from
 * lib/rules/creation-xp.ts.
 *
 * Source: WFRP 4e Core Rulebook p.26.
 *
 * @param allCareers - Full list of careers to select from (from data/careers.json).
 *   Caller should pre-filter by species restrictions if required.
 * @returns A randomly selected Career from the list.
 * @throws Error if allCareers is empty.
 */
export function rollRandomCareer(allCareers: Career[]): Career {
  if (allCareers.length === 0) {
    throw new Error('Career list is empty — cannot roll a random career.')
  }
  const index = Math.floor(Math.random() * allCareers.length)
  return allCareers[index]
}

/**
 * Like rollRandomCareer(), but also returns the simulated d100 value so the UI
 * can display "Rolled: 47 → Blacksmith". Maps the 1–100 roll proportionally to
 * the career list (same uniform distribution as rollRandomCareer).
 */
export function rollRandomCareerWithDie(allCareers: Career[]): { roll: number; career: Career } {
  if (allCareers.length === 0) {
    throw new Error('Career list is empty — cannot roll a random career.')
  }
  const roll = Math.floor(Math.random() * 100) + 1
  const index = Math.min(
    Math.floor((roll - 1) * allCareers.length / 100),
    allCareers.length - 1
  )
  return { roll, career: allCareers[index] }
}
