import type { SpeciesAppearance, AppearanceRollEntry } from '@/lib/types/rules'

/**
 * Simulates rolling 2d10 — returns a value in the range 2–20.
 */
export function roll2d10(): number {
  return Math.ceil(Math.random() * 10) + Math.ceil(Math.random() * 10)
}

/**
 * Simulates rolling Nd10 — returns a value in the range N to N*10.
 */
export function rollNd10(n: number): number {
  let total = 0
  for (let i = 0; i < n; i++) {
    total += Math.ceil(Math.random() * 10)
  }
  return total
}

/** Individual die values and their sum from a Nd10 roll. */
export interface Nd10RollDetails {
  dice: number[]
  total: number
}

/**
 * Like rollNd10(), but returns each individual die value for display purposes.
 */
export function rollNd10WithDetails(n: number): Nd10RollDetails {
  const dice: number[] = []
  for (let i = 0; i < n; i++) {
    dice.push(Math.ceil(Math.random() * 10))
  }
  return { dice, total: dice.reduce((a, b) => a + b, 0) }
}

/** A single 2d10 roll plus the string result it mapped to. */
export interface ColourRollDetails {
  die1: number
  die2: number
  total: number
  result: string
}

/**
 * Looks up a roll result in a 2d10 appearance table.
 * Returns the matching result string, or throws if no entry covers the roll.
 */
export function lookupAppearanceRoll(
  roll: number,
  table: AppearanceRollEntry[]
): string {
  const entry = table.find(e => roll >= e.min && roll <= e.max)
  if (!entry) {
    throw new Error(`No appearance table entry found for roll ${roll}`)
  }
  return entry.result
}

/**
 * Rolls a random eye colour for the given species appearance.
 * For elves (canRollEyeTwice), rolls twice and returns both colours joined with " / ".
 */
export function rollEyeColour(appearance: SpeciesAppearance): string {
  const first = lookupAppearanceRoll(roll2d10(), appearance.eyeColour)
  if (appearance.canRollEyeTwice) {
    const second = lookupAppearanceRoll(roll2d10(), appearance.eyeColour)
    return `${first} / ${second}`
  }
  return first
}

/**
 * Like rollEyeColour(), but returns individual die values for display purposes.
 */
export function rollEyeColourWithDetails(appearance: SpeciesAppearance): {
  rolls: ColourRollDetails[]
  result: string
} {
  const doRoll = (): ColourRollDetails => {
    const die1 = Math.ceil(Math.random() * 10)
    const die2 = Math.ceil(Math.random() * 10)
    const total = die1 + die2
    return { die1, die2, total, result: lookupAppearanceRoll(total, appearance.eyeColour) }
  }
  const first = doRoll()
  if (appearance.canRollEyeTwice) {
    const second = doRoll()
    return { rolls: [first, second], result: `${first.result} / ${second.result}` }
  }
  return { rolls: [first], result: first.result }
}

/**
 * Rolls a random hair colour for the given species appearance.
 * For elves (canRollHairTwice), rolls twice and returns both colours joined with " / ".
 */
export function rollHairColour(appearance: SpeciesAppearance): string {
  const first = lookupAppearanceRoll(roll2d10(), appearance.hairColour)
  if (appearance.canRollHairTwice) {
    const second = lookupAppearanceRoll(roll2d10(), appearance.hairColour)
    return `${first} / ${second}`
  }
  return first
}

/**
 * Like rollHairColour(), but returns individual die values for display purposes.
 */
export function rollHairColourWithDetails(appearance: SpeciesAppearance): {
  rolls: ColourRollDetails[]
  result: string
} {
  const doRoll = (): ColourRollDetails => {
    const die1 = Math.ceil(Math.random() * 10)
    const die2 = Math.ceil(Math.random() * 10)
    const total = die1 + die2
    return { die1, die2, total, result: lookupAppearanceRoll(total, appearance.hairColour) }
  }
  const first = doRoll()
  if (appearance.canRollHairTwice) {
    const second = doRoll()
    return { rolls: [first, second], result: `${first.result} / ${second.result}` }
  }
  return { rolls: [first], result: first.result }
}

/**
 * Rolls a random age for the given species appearance.
 * Returns the result in years: base + NdN.
 */
export function rollAge(appearance: SpeciesAppearance): number {
  return appearance.age.base + rollNd10(appearance.age.diceCount)
}

/**
 * Like rollAge(), but returns individual die values for display purposes.
 */
export function rollAgeWithDetails(appearance: SpeciesAppearance): {
  roll: Nd10RollDetails
  result: number
} {
  const roll = rollNd10WithDetails(appearance.age.diceCount)
  return { roll, result: appearance.age.base + roll.total }
}

/**
 * Rolls a random height for the given species appearance.
 * Returns total inches: baseInches + NdN.
 */
export function rollHeight(appearance: SpeciesAppearance): number {
  return appearance.height.baseInches + rollNd10(appearance.height.diceCount)
}

/**
 * Like rollHeight(), but returns individual die values for display purposes.
 */
export function rollHeightWithDetails(appearance: SpeciesAppearance): {
  roll: Nd10RollDetails
  result: number
} {
  const roll = rollNd10WithDetails(appearance.height.diceCount)
  return { roll, result: appearance.height.baseInches + roll.total }
}

/**
 * Converts a total-inches value to a feet+inches string.
 * Example: 69 → "5'9\""
 */
export function inchesToFeetString(inches: number): string {
  const feet = Math.floor(inches / 12)
  const remaining = inches % 12
  return `${feet}'${remaining}"`
}
