/**
 * WFRP 4e Wealth Rules Engine
 *
 * Currency conversion utilities and starting wealth generation.
 *
 * Currency exchange (WFRP 4e Core Rulebook p.37):
 *   1 Gold Crown (GC)     = 20 Silver Shillings = 240 Brass Pennies
 *   1 Silver Shilling (SS) = 12 Brass Pennies
 *
 * Starting Wealth by Status Tier (WFRP 4e Core Rulebook, Character Creation chapter):
 *   Brass  → 2d10 brass pennies × Status Level
 *   Silver → 1d10 silver shillings × Status Level
 *   Gold   → 1 gold crown × Status Level (deterministic; no roll)
 *
 * Status format as found in data/careers.json: "Brass 3", "Silver 2", "Gold 1"
 */

// ── Wealth type ───────────────────────────────────────────────────────────────

/**
 * Character wealth denominated in the three Old World currencies.
 *
 * Field names are lowercase short forms to match the status tier names and
 * keep expressions concise in rules logic.
 */
export interface Wealth {
  gold: number    // Gold Crowns
  silver: number  // Silver Shillings
  brass: number   // Brass Pennies
}

// ── Currency constants ────────────────────────────────────────────────────────

/** Brass pennies per gold crown (1 GC = 20 SS × 12 BP = 240 BP). */
const BP_PER_GC = 240

/** Brass pennies per silver shilling (1 SS = 12 BP). */
const BP_PER_SS = 12

// ── wealthToBrass ─────────────────────────────────────────────────────────────

/**
 * Converts any Wealth amount to a total in brass pennies.
 *
 * Useful for comparing wealth amounts, calculating change, and checking
 * whether a character can afford a purchase.
 *
 * Conversion:
 *   1 GC  = 240 BP
 *   1 SS  = 12 BP
 *   1 BP  = 1 BP
 *
 * @param wealth - The wallet to convert
 * @returns Total value expressed as brass pennies
 *
 * Source: WFRP 4e Core Rulebook p.37
 */
export function wealthToBrass(wealth: Wealth): number {
  return wealth.gold * BP_PER_GC + wealth.silver * BP_PER_SS + wealth.brass
}

// ── brassToWealth ─────────────────────────────────────────────────────────────

/**
 * Converts a total brass-penny amount to the most readable Wealth breakdown,
 * preferring higher denominations (greedy: maximise GC, then SS, remainder BP).
 *
 * Examples:
 *   240  → { gold: 1, silver: 0,  brass: 0 }
 *   252  → { gold: 1, silver: 1,  brass: 0 }  (240 + 12)
 *   13   → { gold: 0, silver: 1,  brass: 1 }  (12 + 1)
 *   1    → { gold: 0, silver: 0,  brass: 1 }
 *
 * @param totalBrass - Total brass-penny value (non-negative integer)
 * @returns Wealth broken into the fewest coins possible
 *
 * Source: WFRP 4e Core Rulebook p.37
 */
export function brassToWealth(totalBrass: number): Wealth {
  const gold = Math.floor(totalBrass / BP_PER_GC)
  const remainder = totalBrass % BP_PER_GC
  const silver = Math.floor(remainder / BP_PER_SS)
  const brass = remainder % BP_PER_SS
  return { gold, silver, brass }
}

// ── StartingWealthFormula ─────────────────────────────────────────────────────

/**
 * Describes the dice formula for starting wealth derived from a career's status.
 *
 * This type encodes the roll parameters without actually rolling so that the UI
 * can display the formula ("Roll 2d10 × 3 brass pennies") before the user
 * commits to rolling or auto-generating.
 *
 * Source: WFRP 4e Core Rulebook, Character Creation chapter,
 *         "Status Tier Starting Wealth" table (pp. 682–688 in task spec).
 */
export interface StartingWealthFormula {
  /** The status metal tier. */
  tier: 'Brass' | 'Silver' | 'Gold'

  /** The numeric standing within the tier (the number after the tier name, 1–5). */
  level: number

  /**
   * Number of d10s to roll per level.
   *   Brass  → 2 (roll 2d10 per level = 2×level dice total)
   *   Silver → 1 (roll 1d10 per level = level dice total)
   *   Gold   → 0 (deterministic; no dice)
   */
  diceCount: number

  /**
   * Die size.
   *   Brass/Silver → 10 (d10)
   *   Gold         → 0 (no dice)
   */
  diceSides: number

  /** The denomination the roll result is paid in. */
  currency: 'brass' | 'silver' | 'gold'

  /**
   * Human-readable formula description for display in the UI.
   * E.g., "Roll 2d10 × 3 brass pennies" for Brass 3.
   * Optional — not required when calling code only needs the numeric parameters.
   */
  description?: string
}

// ── getStartingWealthFormula ──────────────────────────────────────────────────

/**
 * Parses a career status string into a StartingWealthFormula descriptor.
 *
 * Does NOT roll dice — returns the formula parameters so the caller can choose
 * between displaying the formula, rolling, or applying a deterministic result.
 *
 * @param status - Status string in the format "Tier Level", e.g. "Brass 3".
 *   Valid tiers: "Brass", "Silver", "Gold".
 *   Level must be a positive integer ≥ 1.
 * @returns StartingWealthFormula describing the dice pool and currency
 * @throws Error for invalid format, unknown tier, or level ≤ 0
 *
 * Source: WFRP 4e Core Rulebook, Character Creation chapter
 */
export function getStartingWealthFormula(status: string): StartingWealthFormula {
  if (!status || !status.includes(' ')) {
    throw new Error(`Invalid status string: "${status}". Expected format: "Tier Level" e.g. "Brass 3"`)
  }

  const parts = status.trim().split(/\s+/)
  if (parts.length !== 2) {
    throw new Error(`Invalid status string: "${status}". Expected exactly two parts: tier and level.`)
  }

  const [tierRaw, levelRaw] = parts
  const tier = tierRaw as 'Brass' | 'Silver' | 'Gold'
  const level = parseInt(levelRaw, 10)

  if (isNaN(level) || level <= 0) {
    throw new Error(`Invalid status level in "${status}": level must be a positive integer.`)
  }

  switch (tier) {
    case 'Brass':
      return { tier: 'Brass', level, diceCount: 2, diceSides: 10, currency: 'brass' }
    case 'Silver':
      return { tier: 'Silver', level, diceCount: 1, diceSides: 10, currency: 'silver' }
    case 'Gold':
      return { tier: 'Gold', level, diceCount: 0, diceSides: 0, currency: 'gold' }
    default:
      throw new Error(`Unknown status tier: "${tierRaw}". Valid tiers: Brass, Silver, Gold.`)
  }
}

// ── rollStartingWealth ────────────────────────────────────────────────────────

/**
 * Rolls starting wealth for a given career status string and returns the result
 * as a Wealth object.
 *
 * Dice are rolled using Math.random():
 *   d10 result = Math.floor(Math.random() × 10) + 1  →  range 1–10
 *
 * Roll quantities per status:
 *   Brass  N: roll 2d10 N times (= 2N dice), total placed in .brass
 *   Silver N: roll 1d10 N times (= N dice), total placed in .silver
 *   Gold   N: deterministic — exactly { gold: N, silver: 0, brass: 0 }
 *
 * @param status - Status string, e.g. "Brass 3", "Silver 2", "Gold 1"
 * @returns Wealth object with rolled amount in the appropriate denomination
 * @throws Error for invalid status string (via getStartingWealthFormula)
 *
 * Source: WFRP 4e Core Rulebook, Character Creation chapter
 */
export function rollStartingWealth(status: string): Wealth {
  const formula = getStartingWealthFormula(status)

  if (formula.tier === 'Gold') {
    return { gold: formula.level, silver: 0, brass: 0 }
  }

  const totalDice = formula.diceCount * formula.level
  let total = 0
  for (let i = 0; i < totalDice; i++) {
    total += Math.floor(Math.random() * formula.diceSides) + 1
  }

  if (formula.tier === 'Brass') {
    return { gold: 0, silver: 0, brass: total }
  } else {
    // Silver
    return { gold: 0, silver: total, brass: 0 }
  }
}
