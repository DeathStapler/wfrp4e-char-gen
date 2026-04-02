/**
 * WFRP 4e Character Creation Bonus XP
 *
 * Starting XP in WFRP 4e is NOT a fixed per-species value. It is earned by
 * making RANDOM choices during character creation. Any choice made freely
 * (not rolled) earns no bonus XP.
 *
 * Maximum possible bonus XP: +120 (random species + random career kept + random attributes kept).
 *
 * Source: WFRP 4e Core Rulebook, Character Creation chapter (pp. 20–37).
 */

/**
 * How the player chose their species during character creation.
 *
 * - 'random'  — Rolled 1d100 on the Random Species Table and accepted the result → +20 XP
 * - 'chosen'  — Chose freely (or re-rolled until satisfied)                      → +0 XP
 *
 * Source: WFRP 4e Core Rulebook p.24.
 */
export type SpeciesChoiceMethod = 'random' | 'chosen'

/**
 * How the player chose their career during character creation.
 *
 * - 'random'       — Rolled 1d100 once and kept the result                        → +50 XP
 * - 'rolled3pick1' — Rolled 1d100 three times and picked one of the three results → +25 XP
 * - 'chosen'       — Chose freely (or kept re-rolling with no XP reward)           → +0 XP
 *
 * Source: WFRP 4e Core Rulebook p.26, Step 2.
 */
export type CareerChoiceMethod = 'random' | 'rolled3pick1' | 'chosen'

/**
 * How the player assigned attribute values during character creation.
 *
 * - 'random-keep'      — Rolled 2d10 for each characteristic and kept as-is          → +50 XP
 * - 'random-rearrange' — Rolled 2d10 ten times and freely rearranged among the 10   → +25 XP
 * - 'manual'           — Allocated 100 points manually or re-rolled with rearrange   → +0 XP
 *
 * Source: WFRP 4e Core Rulebook p.26–27, Step 3.
 */
export type AttributeChoiceMethod = 'random-keep' | 'random-rearrange' | 'manual'

/**
 * Returns the XP bonus for just the species choice.
 *
 * - Rolled randomly and accepted: +20 XP
 * - Chosen freely: +0 XP
 *
 * Source: WFRP 4e Core Rulebook p.24.
 */
export function getSpeciesChoiceXP(method: SpeciesChoiceMethod): number {
  return method === 'random' ? 20 : 0
}

/**
 * Returns the XP bonus for just the career choice.
 *
 * - Rolled once and kept result: +50 XP
 * - Rolled 3 times and picked one: +25 XP
 * - Chosen freely: +0 XP
 *
 * Source: WFRP 4e Core Rulebook p.26.
 */
export function getCareerChoiceXP(method: CareerChoiceMethod): number {
  switch (method) {
    case 'random':       return 50
    case 'rolled3pick1': return 25
    case 'chosen':       return 0
  }
}

/**
 * Returns the XP bonus for just the attribute assignment method.
 *
 * - Rolled 2d10 for each and kept as-is: +50 XP
 * - Rolled 2d10 ten times and rearranged: +25 XP
 * - Manually allocated 100 points: +0 XP
 *
 * Source: WFRP 4e Core Rulebook p.26–27, Step 3.
 */
export function getAttributeChoiceXP(method: AttributeChoiceMethod): number {
  switch (method) {
    case 'random-keep':      return 50
    case 'random-rearrange': return 25
    case 'manual':           return 0
  }
}

/**
 * Returns the total bonus XP earned based on how the player made their
 * character creation choices.
 *
 * Source: WFRP 4e Core Rulebook, Character Creation chapter.
 * - Species rolled randomly: +20 XP
 * - Career rolled randomly (kept first result): +50 XP
 * - Career rolled 3 times and player picked one: +25 XP
 * - Attributes rolled and kept as-is: +50 XP
 * - Attributes rolled and rearranged: +25 XP
 * - Any choice made freely (not rolled): +0 XP
 *
 * @param speciesMethod - How the player chose their species ('random' | 'chosen')
 * @param careerMethod  - How the player chose their career ('random' | 'rolled3pick1' | 'chosen')
 * @param attributeMethod - How the player assigned attributes ('random-keep' | 'random-rearrange' | 'manual')
 * @returns Total bonus XP (0–120)
 */
export function getCreationXP(
  speciesMethod: SpeciesChoiceMethod,
  careerMethod: CareerChoiceMethod,
  attributeMethod?: AttributeChoiceMethod,
): number {
  return (
    getSpeciesChoiceXP(speciesMethod) + 
    getCareerChoiceXP(careerMethod) + 
    (attributeMethod ? getAttributeChoiceXP(attributeMethod) : 0)
  )
}
