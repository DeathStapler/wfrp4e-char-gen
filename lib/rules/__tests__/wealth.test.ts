/**
 * WFRP 4e Wealth Rules Tests
 *
 * Tests the wealth system: currency conversions, denomination breakdown,
 * starting wealth formulae, and dice-based starting wealth rolls.
 *
 * Source: WFRP 4e Core Rulebook p.37
 *
 * Currency conversions (p.37):
 *   1 Gold Crown (GC) = 20 Silver Shillings (SS) = 240 Brass Pennies (BP)
 *   1 Silver Shilling = 12 Brass Pennies
 *
 * Starting Wealth by Status Tier:
 *   Brass  → 2d10 brass pennies × Status Level
 *   Silver → 1d10 silver shillings × Status Level
 *   Gold   → 1 gold crown × Status Level (no roll; deterministic)
 *
 * Status format in careers.json: "Brass 3", "Silver 2", "Gold 1"
 *
 * These tests will FAIL until Bullock implements lib/rules/wealth.ts.
 * That is intentional — these tests gate correctness of the implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  wealthToBrass,
  brassToWealth,
  getStartingWealthFormula,
  rollStartingWealth,
} from '../wealth'

// ── 1. wealthToBrass ─────────────────────────────────────────────────────────
// Converts a { gold, silver, brass } object to a total brass-penny value.
// 1 GC = 240 BP, 1 SS = 12 BP
describe('wealthToBrass', () => {
  it('converts 1 gold crown to 240 brass pennies', () => {
    expect(wealthToBrass({ gold: 1, silver: 0, brass: 0 })).toBe(240)
  })

  it('converts 1 silver shilling to 12 brass pennies', () => {
    expect(wealthToBrass({ gold: 0, silver: 1, brass: 0 })).toBe(12)
  })

  it('keeps 1 brass penny as 1', () => {
    expect(wealthToBrass({ gold: 0, silver: 0, brass: 1 })).toBe(1)
  })

  it('adds all denominations correctly for a mixed high-value case', () => {
    // 1 GC (240) + 20 SS (240) + 240 BP (240) = 720
    expect(wealthToBrass({ gold: 1, silver: 20, brass: 240 })).toBe(720)
  })

  it('returns 0 for empty wallet', () => {
    expect(wealthToBrass({ gold: 0, silver: 0, brass: 0 })).toBe(0)
  })

  it('handles arbitrary mixed amounts: 2GC + 5SS + 7BP = 547', () => {
    // 2×240 + 5×12 + 7 = 480 + 60 + 7 = 547
    expect(wealthToBrass({ gold: 2, silver: 5, brass: 7 })).toBe(547)
  })
})

// ── 2. brassToWealth ─────────────────────────────────────────────────────────
// Converts a total brass-penny amount to the highest-denomination breakdown.
// Uses greedy algorithm: maximise GC, then SS, remainder stays as BP.
describe('brassToWealth', () => {
  it('converts 240 BP to exactly 1 GC', () => {
    expect(brassToWealth(240)).toEqual({ gold: 1, silver: 0, brass: 0 })
  })

  it('converts 252 BP to 1 GC + 1 SS (240 + 12)', () => {
    expect(brassToWealth(252)).toEqual({ gold: 1, silver: 1, brass: 0 })
  })

  it('leaves 1 BP as brass only', () => {
    expect(brassToWealth(1)).toEqual({ gold: 0, silver: 0, brass: 1 })
  })

  it('returns all-zero wallet for 0 BP', () => {
    expect(brassToWealth(0)).toEqual({ gold: 0, silver: 0, brass: 0 })
  })

  it('converts 480 BP to exactly 2 GC', () => {
    expect(brassToWealth(480)).toEqual({ gold: 2, silver: 0, brass: 0 })
  })

  it('converts 13 BP to 1 SS + 1 BP (12 + 1)', () => {
    expect(brassToWealth(13)).toEqual({ gold: 0, silver: 1, brass: 1 })
  })
})

// ── 3. getStartingWealthFormula ───────────────────────────────────────────────
// Parses a status string ("Brass 3", "Silver 2", "Gold 1") into a formula
// descriptor that encodes tier, level, dice pool, and target currency.
//
// Brass  → 2d10 per level, paid in brass pennies
// Silver → 1d10 per level, paid in silver shillings
// Gold   → deterministic (0 dice), level × 1 GC
describe('getStartingWealthFormula', () => {
  it('parses "Brass 1" correctly', () => {
    expect(getStartingWealthFormula('Brass 1')).toEqual({
      tier: 'Brass',
      level: 1,
      diceCount: 2,
      diceSides: 10,
      currency: 'brass',
    })
  })

  it('parses "Brass 3" — level scales the number of dice pools, not dice count', () => {
    // diceCount stays 2 (per level); level=3 means roll 2d10 three times (or 6d10)
    // The formula descriptor records the per-level dice, not the total.
    expect(getStartingWealthFormula('Brass 3')).toEqual({
      tier: 'Brass',
      level: 3,
      diceCount: 2,
      diceSides: 10,
      currency: 'brass',
    })
  })

  it('parses "Silver 2" correctly', () => {
    expect(getStartingWealthFormula('Silver 2')).toEqual({
      tier: 'Silver',
      level: 2,
      diceCount: 1,
      diceSides: 10,
      currency: 'silver',
    })
  })

  it('parses "Gold 4" — deterministic, no dice', () => {
    expect(getStartingWealthFormula('Gold 4')).toEqual({
      tier: 'Gold',
      level: 4,
      diceCount: 0,
      diceSides: 0,
      currency: 'gold',
    })
  })

  it('throws on invalid input', () => {
    expect(() => getStartingWealthFormula('Invalid 1')).toThrow()
    expect(() => getStartingWealthFormula('')).toThrow()
    expect(() => getStartingWealthFormula('Brass')).toThrow()
    expect(() => getStartingWealthFormula('Brass 0')).toThrow()
  })
})

// ── 4. rollStartingWealth ─────────────────────────────────────────────────────
// Rolls starting wealth for a given status string, returning a Wealth object.
//
// Brass N  → roll 2d10 N times (= 2N dice), total goes in .brass
// Silver N → roll 1d10 N times (= N dice), total goes in .silver
// Gold N   → deterministic: exactly N gold, no dice
describe('rollStartingWealth', () => {
  // Control Math.random so we can assert deterministic outcomes.
  // Each call to Math.random() maps to one die face: value × sides + 1 (floor).
  // We spy per test and restore after.

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('"Brass 1" rolls 2d10 into brass (min 2, max 20), silver=0, gold=0', () => {
    // mock Math.random to return 0.5 → each d10 = floor(0.5×10)+1 = 6
    // 2 dice × 6 = 12 brass
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = rollStartingWealth('Brass 1')
    expect(result.silver).toBe(0)
    expect(result.gold).toBe(0)
    expect(result.brass).toBeGreaterThanOrEqual(2)
    expect(result.brass).toBeLessThanOrEqual(20)
  })

  it('"Brass 1" minimum roll: all dice show 1 → brass=2', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // floor(0×10)+1 = 1
    const result = rollStartingWealth('Brass 1')
    expect(result.brass).toBe(2)
    expect(result.silver).toBe(0)
    expect(result.gold).toBe(0)
  })

  it('"Brass 1" maximum roll: all dice show 10 → brass=20', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // floor(0.99×10)+1 = 10
    const result = rollStartingWealth('Brass 1')
    expect(result.brass).toBe(20)
    expect(result.silver).toBe(0)
    expect(result.gold).toBe(0)
  })

  it('"Brass 3" result has brass between 6 (min: 6×1) and 60 (max: 6×10)', () => {
    // Brass 3 → 2d10 × 3 = 6 dice total
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // each die = 6 → 6×6 = 36
    const result = rollStartingWealth('Brass 3')
    expect(result.silver).toBe(0)
    expect(result.gold).toBe(0)
    expect(result.brass).toBeGreaterThanOrEqual(6)
    expect(result.brass).toBeLessThanOrEqual(60)
  })

  it('"Silver 2" rolls 1d10 × 2 into silver, gold=0, brass=0', () => {
    // Silver 2 → 1d10 × 2 = 2 dice; 0.5 → 6 each → 12 silver
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = rollStartingWealth('Silver 2')
    expect(result.gold).toBe(0)
    expect(result.brass).toBe(0)
    expect(result.silver).toBeGreaterThanOrEqual(2)
    expect(result.silver).toBeLessThanOrEqual(20)
  })

  it('"Silver 2" minimum: each die = 1 → silver=2', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = rollStartingWealth('Silver 2')
    expect(result.silver).toBe(2)
    expect(result.gold).toBe(0)
    expect(result.brass).toBe(0)
  })

  it('"Gold 3" is deterministic — exactly { gold: 3, silver: 0, brass: 0 }', () => {
    // Gold tier has no dice; result must not depend on Math.random
    const result = rollStartingWealth('Gold 3')
    expect(result).toEqual({ gold: 3, silver: 0, brass: 0 })
  })

  it('all rolled results have non-negative values', () => {
    // Use several status strings; Math.random is real here (no spy)
    const statuses = ['Brass 1', 'Brass 4', 'Silver 1', 'Silver 3', 'Gold 1', 'Gold 4']
    for (const status of statuses) {
      const result = rollStartingWealth(status)
      expect(result.gold).toBeGreaterThanOrEqual(0)
      expect(result.silver).toBeGreaterThanOrEqual(0)
      expect(result.brass).toBeGreaterThanOrEqual(0)
    }
  })
})
