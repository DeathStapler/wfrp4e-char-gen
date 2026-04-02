/**
 * WFRP 4e Characteristic Rules Tests
 *
 * These tests are written against the WFRP 4e core rulebook specification.
 * They will FAIL until Bullock implements the rules engine functions.
 * That is intentional — these tests gate correctness of the implementation.
 *
 * ⚠️  RULES VERIFICATION NEEDED:
 *   - Wound threshold formula varies by species (Halflings use a different formula).
 *     The tests here cover the standard humanoid formula. Species variants need
 *     separate verification against the corebook p.340.
 *   - Advance caps: rulebook says 99 per characteristic; confirm this applies
 *     identically to all characteristics including Fate/Resilience.
 */

import { describe, it, expect } from 'vitest'

// ── Functions under test (to be implemented by Bullock) ──────────────────────
// These imports will fail with "module not found" or "not a function" until
// the rules engine is implemented. That's expected.
import {
  getCharacteristicBonus,
  getTotalCharacteristic,
  getWoundThreshold,
  getXpCostForCharacteristicAdvance,
  rollStartingCharacteristic,
  getTalentCharacteristicBonuses,
} from '../characteristics'

import type { Talent } from '../../types/rules'

import talentsData from '../../../data/talents.json'

// ── 1. Characteristic Bonus ───────────────────────────────────────────────────
describe('getCharacteristicBonus', () => {
  it('returns floor(value / 10)', () => {
    expect(getCharacteristicBonus(35)).toBe(3)
    expect(getCharacteristicBonus(30)).toBe(3)
    expect(getCharacteristicBonus(39)).toBe(3)
    expect(getCharacteristicBonus(40)).toBe(4)
  })

  it('handles single-digit values', () => {
    expect(getCharacteristicBonus(9)).toBe(0)
    expect(getCharacteristicBonus(1)).toBe(0)
  })

  it('handles values at decade boundaries', () => {
    expect(getCharacteristicBonus(10)).toBe(1)
    expect(getCharacteristicBonus(20)).toBe(2)
    expect(getCharacteristicBonus(100)).toBe(10)
  })

  it('handles zero', () => {
    expect(getCharacteristicBonus(0)).toBe(0)
  })
})

// ── 2. Total Characteristic ───────────────────────────────────────────────────
describe('getTotalCharacteristic', () => {
  it('returns base + advances', () => {
    expect(getTotalCharacteristic(30, 5)).toBe(35)
    expect(getTotalCharacteristic(25, 0)).toBe(25)
  })

  it('caps advances at 99', () => {
    // Advances beyond 99 should be treated as 99
    expect(getTotalCharacteristic(30, 99)).toBe(129)
    expect(getTotalCharacteristic(30, 100)).toBe(129) // capped at 99 advances
    expect(getTotalCharacteristic(30, 150)).toBe(129) // still capped
  })

  it('handles zero advances', () => {
    expect(getTotalCharacteristic(35, 0)).toBe(35)
  })

  it('adds talent bonus of 0 — same result as two-arg call', () => {
    // Passing explicit 0 talent bonus must not change the result
    expect(getTotalCharacteristic(30, 5, 0)).toBe(35)
  })

  it('adds talent bonus to base + advances', () => {
    // Savvy (+5 Int) means Int total is base + advances + 5
    expect(getTotalCharacteristic(30, 5, 5)).toBe(40)
    expect(getTotalCharacteristic(25, 10, 5)).toBe(40)
  })
})

// ── 3. Wound Threshold (standard humanoid formula) ───────────────────────────
// Formula: TB + (2 × WPB) + SB
// Source: WFRP 4e Core Rulebook p.340
//
// ⚠️  RULES VERIFICATION: Halflings use TB + (2 × WPB) (no SB).
//     Ogres use a different formula entirely. Species-specific overrides
//     need to be tested separately once the Species type is implemented.
describe('getWoundThreshold', () => {
  it('calculates TB + (2 × WPB) + SB for standard humanoids', () => {
    // T:30 → TB:3, WP:31 → WPB:3, S:25 → SB:2  →  3 + (2×3) + 2 = 11
    expect(getWoundThreshold({ toughness: 30, willpower: 31, strength: 25 })).toBe(11)
  })

  it('uses bonuses (floor/10), not raw stats', () => {
    // T:39 → TB:3, WP:39 → WPB:3, S:39 → SB:3  →  3 + 6 + 3 = 12
    expect(getWoundThreshold({ toughness: 39, willpower: 39, strength: 39 })).toBe(12)
  })

  it('handles minimum stats', () => {
    // T:10 → TB:1, WP:10 → WPB:1, S:10 → SB:1  →  1 + 2 + 1 = 4
    expect(getWoundThreshold({ toughness: 10, willpower: 10, strength: 10 })).toBe(4)
  })

  it('handles high characteristic values', () => {
    // T:50 → TB:5, WP:50 → WPB:5, S:50 → SB:5  →  5 + 10 + 5 = 20
    expect(getWoundThreshold({ toughness: 50, willpower: 50, strength: 50 })).toBe(20)
  })

  it('correctly weights WP double', () => {
    // Same TB and SB but different WP
    // T:30 → TB:3, WP:20 → WPB:2, S:30 → SB:3  →  3 + 4 + 3 = 10
    // T:30 → TB:3, WP:40 → WPB:4, S:30 → SB:3  →  3 + 8 + 3 = 14
    expect(getWoundThreshold({ toughness: 30, willpower: 20, strength: 30 })).toBe(10)
    expect(getWoundThreshold({ toughness: 30, willpower: 40, strength: 30 })).toBe(14)
  })
})

// ── 4. XP Cost for Characteristic Advance ────────────────────────────────────
// Tiered cost table — cost is based on advances ALREADY taken.
// Source: WFRP 4e Core Rulebook — Characteristic and Skill Improvement XP Costs table
//
// | Advances already taken | Cost |
// |------------------------|------|
// | 0–5                    | 25   |
// | 6–10                   | 30   |
// | 11–15                  | 40   |
// | 16–20                  | 50   |
// | 21–25                  | 70   |
// | 26–30                  | 90   |
// | 31–35                  | 120  |
// | 36–40                  | 150  |
// | 41–45                  | 190  |
// | 46–50                  | 230  |
describe('getXpCostForCharacteristicAdvance', () => {
  it('costs 25 XP at 0 advances (tier 0–5, lower boundary)', () => {
    expect(getXpCostForCharacteristicAdvance(0)).toBe(25)
  })

  it('costs 25 XP at 5 advances (tier 0–5, upper boundary)', () => {
    expect(getXpCostForCharacteristicAdvance(5)).toBe(25)
  })

  it('costs 30 XP at 6 advances (tier 6–10, lower boundary)', () => {
    expect(getXpCostForCharacteristicAdvance(6)).toBe(30)
  })

  it('costs 30 XP at 10 advances (tier 6–10, upper boundary)', () => {
    expect(getXpCostForCharacteristicAdvance(10)).toBe(30)
  })

  it('costs 40 XP at 11 advances (tier 11–15)', () => {
    expect(getXpCostForCharacteristicAdvance(11)).toBe(40)
  })

  it('costs 50 XP at 16 advances (tier 16–20)', () => {
    expect(getXpCostForCharacteristicAdvance(16)).toBe(50)
  })

  it('costs 70 XP at 21 advances (tier 21–25)', () => {
    expect(getXpCostForCharacteristicAdvance(21)).toBe(70)
  })

  it('costs 90 XP at 26 advances (tier 26–30)', () => {
    expect(getXpCostForCharacteristicAdvance(26)).toBe(90)
  })

  it('costs 120 XP at 31 advances (tier 31–35)', () => {
    expect(getXpCostForCharacteristicAdvance(31)).toBe(120)
  })

  it('costs 150 XP at 36 advances (tier 36–40)', () => {
    expect(getXpCostForCharacteristicAdvance(36)).toBe(150)
  })

  it('costs 190 XP at 41 advances (tier 41–45)', () => {
    expect(getXpCostForCharacteristicAdvance(41)).toBe(190)
  })

  it('costs 230 XP at 46 advances (tier 46–50)', () => {
    expect(getXpCostForCharacteristicAdvance(46)).toBe(230)
  })
})

// ── 5. Starting Characteristic Math ──────────────────────────────────────────
// Starting value = species base + 2d10 roll
// We don't test randomness — we test that the math combines correctly.
//
// ⚠️  RULES VERIFICATION: Confirm species base values match corebook p.26-29.
//     Human WS base is 20. Dwarf WS base is 30. Halfling WS base is 10.
describe('rollStartingCharacteristic', () => {
  it('adds the roll to the species base value', () => {
    // species base of 20 + roll of 7 = 27
    expect(rollStartingCharacteristic(20, 7)).toBe(27)
  })

  it('works with zero roll (minimum possible)', () => {
    expect(rollStartingCharacteristic(20, 2)).toBe(22) // 2d10 min = 2
  })

  it('works with maximum 2d10 roll (20)', () => {
    expect(rollStartingCharacteristic(20, 20)).toBe(40) // 2d10 max = 20
  })

  it('handles varying species bases', () => {
    expect(rollStartingCharacteristic(30, 10)).toBe(40) // Dwarf-like base
    expect(rollStartingCharacteristic(10, 10)).toBe(20) // Halfling-like base
  })
})

// ── 6. Talent Characteristic Bonuses ─────────────────────────────────────────
// Some talents grant a permanent +5 bonus to a starting characteristic.
// This bonus does NOT count as advances (it's tracked separately).
// Examples: Savvy (+5 Int), Warrior Born (+5 WS), Suave (+5 Fel), etc.
//
// Source: WFRP 4e Core Rulebook pp. 140–142 (characteristic bonus talents).
describe('getTalentCharacteristicBonuses', () => {
  // ── Mock talent fixtures ──────────────────────────────────────────────────
  const savvyMock: Talent = {
    id: 'savvy',
    name: 'Savvy',
    max: 1,
    characteristicBonus: { characteristic: 'Int', value: 5 },
  }

  const warriorBornMock: Talent = {
    id: 'warrior-born',
    name: 'Warrior Born',
    max: 1,
    characteristicBonus: { characteristic: 'WS', value: 5 },
  }

  const noBonus: Talent = {
    id: 'combat-reflexes',
    name: 'Combat Reflexes',
    max: 1,
    // No characteristicBonus field
  }

  const intBonus2: Talent = {
    id: 'second-int-talent',
    name: 'Second Int Talent',
    max: 1,
    characteristicBonus: { characteristic: 'Int', value: 5 },
  }

  // Suppress unused-variable warning — warriorBornMock used in mock suite context
  void warriorBornMock

  it('returns 0 when no talent IDs are provided', () => {
    expect(getTalentCharacteristicBonuses([], 'Int', [savvyMock])).toBe(0)
  })

  it('returns 0 when the talent has no characteristicBonus', () => {
    expect(getTalentCharacteristicBonuses(['combat-reflexes'], 'WS', [noBonus])).toBe(0)
  })

  it('returns the correct bonus for a single talent', () => {
    expect(getTalentCharacteristicBonuses(['savvy'], 'Int', [savvyMock])).toBe(5)
  })

  it('returns 0 when the talent bonus is for a different characteristic', () => {
    // savvy gives +5 Int — querying WS must return 0
    expect(getTalentCharacteristicBonuses(['savvy'], 'WS', [savvyMock])).toBe(0)
  })

  it('sums multiple bonuses to the same characteristic', () => {
    // Two mock talents each granting +5 Int → total 10
    expect(
      getTalentCharacteristicBonuses(['savvy', 'second-int-talent'], 'Int', [savvyMock, intBonus2])
    ).toBe(10)
  })

  it('returns 0 gracefully for a talent ID not found in talentsData', () => {
    expect(getTalentCharacteristicBonuses(['unknown-talent-xyz'], 'Int', [savvyMock])).toBe(0)
  })

  // ── Real data cases (require Bullock to populate characteristicBonus in talents.json) ──

  it('savvy gives +5 Int — verified against talents.json', () => {
    // Requires talents.json to have characteristicBonus: { characteristic: 'Int', value: 5 }
    // on the savvy entry. Will fail until Bullock populates that field.
    const talents = talentsData as unknown as Talent[]
    expect(getTalentCharacteristicBonuses(['savvy'], 'Int', talents)).toBe(5)
  })

  it('warrior-born gives +5 WS — verified against talents.json', () => {
    // Requires talents.json to have characteristicBonus: { characteristic: 'WS', value: 5 }
    // on the warrior-born entry. Will fail until Bullock populates that field.
    const talents = talentsData as unknown as Talent[]
    expect(getTalentCharacteristicBonuses(['warrior-born'], 'WS', talents)).toBe(5)
  })
})
