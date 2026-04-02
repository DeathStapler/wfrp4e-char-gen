/**
 * WFRP 4e Wounds Rules Engine Tests
 *
 * Tests for lib/rules/wounds.ts — verifying Bullock's implementation matches rules.
 * The 10 failures in the initial run were due to function name/signature mismatches.
 * This file uses Bullock's actual exported signatures.
 *
 * ⚠️  RULES VERIFICATION NEEDED:
 *   - Halfling wound formula (TB + 2×WPB, NO SB): verify against corebook p.340.
 *     These tests assert getHalflingWoundThreshold omits the Strength Bonus.
 *   - Dwarf +2 wounds: tests assert the +2 comes from Species.extraWounds (Resolute
 *     species talent) and is NOT part of getDwarfWoundThreshold. Bullock's code says
 *     "comes from the Resolute species talent, which is an independent bonus stored
 *     in Species.extraWounds." Verify corebook p.29 and p.340.
 *   - isSeriouslyWounded threshold: tests assert 0 wounds = seriously wounded (AT 0).
 *     Verify the exact trigger: at 0 or below 0? Corebook p.166.
 *   - getCriticalWoundMagnitude formula: max(0, damage − currentWounds).
 *     Verify against corebook p.166.
 *
 * Import contract (Bullock's implementation in lib/rules/wounds.ts):
 *   getWoundThreshold(toughness: number, willpower: number, strength: number): number
 *   getHalflingWoundThreshold(toughness: number, willpower: number): number
 *   getDwarfWoundThreshold(toughness: number, willpower: number, strength: number): number
 *   getCurrentWounds(maxWounds: number, damageTaken: number): number
 *   isSeriouslyWounded(currentWounds: number): boolean
 *   getCriticalWoundMagnitude(damage: number, currentWounds: number): number
 *
 * Source: WFRP 4e Core Rulebook pp. 165–166, 340.
 */

import { describe, it, expect } from 'vitest'

// ── Functions under test ──────────────────────────────────────────────────────
import {
  getWoundThreshold,
  getHalflingWoundThreshold,
  getDwarfWoundThreshold,
  getCurrentWounds,
  isSeriouslyWounded,
  getCriticalWoundMagnitude,
} from '../wounds'

// ── 1. Standard Wound Threshold (Human / Elf) ─────────────────────────────────
// Formula: TB + (2 × WPB) + SB
// where TB = Math.floor(T / 10), WPB = Math.floor(WP / 10), SB = Math.floor(S / 10)
//
// Signature: getWoundThreshold(toughness, willpower, strength)
// Note: characteristics.ts also has a getWoundThreshold with an object arg signature.
// This wounds module uses positional number args — they implement identical logic.
//
// Source: WFRP 4e Core Rulebook p.340
describe('getWoundThreshold — standard formula (Human/Elf)', () => {
  it('calculates TB + (2 × WPB) + SB correctly', () => {
    // T:30 → TB:3, WP:31 → WPB:3, S:25 → SB:2  →  3 + (2×3) + 2 = 11
    expect(getWoundThreshold(30, 31, 25)).toBe(11)
  })

  it('handles characteristics in the 40s', () => {
    // T:40 → TB:4, WP:40 → WPB:4, S:40 → SB:4  →  4 + (2×4) + 4 = 16
    expect(getWoundThreshold(40, 40, 40)).toBe(16)
  })

  it('floors bonuses — T:39 gives TB:3, not TB:4 (critical boundary check)', () => {
    // T:39 → TB:3, WP:39 → WPB:3, S:39 → SB:3  →  3 + (2×3) + 3 = 12
    // If bonuses were rounded instead of floored this would incorrectly give 13.
    expect(getWoundThreshold(39, 39, 39)).toBe(12)
  })

  it('weights WP at double — changing WP by 10 changes wounds by 2', () => {
    // T:30 → TB:3, WP:20 → WPB:2, S:30 → SB:3  →  3 + (2×2) + 3 = 10
    expect(getWoundThreshold(30, 20, 30)).toBe(10)
    // T:30 → TB:3, WP:40 → WPB:4, S:30 → SB:3  →  3 + (2×4) + 3 = 14
    expect(getWoundThreshold(30, 40, 30)).toBe(14)
  })
})

// ── 2. Dwarf Wound Threshold ──────────────────────────────────────────────────
// Dwarves use the SAME base formula as humans: TB + (2 × WPB) + SB.
// The Dwarf +2 bonus wounds come from the Resolute species talent stored in
// Species.extraWounds. getDwarfWoundThreshold returns the base only.
// Callers must add species.extraWounds on top.
//
// ⚠️  RULES VERIFICATION: Confirm the +2 is from "Resolute" species talent stored
//     as Species.extraWounds (not Toughness Bonus). Corebook p.29, p.340.
//
// Source: WFRP 4e Core Rulebook p.165, p.340
describe('getDwarfWoundThreshold — base formula only; extraWounds added by caller', () => {
  it('calculates the same base formula as a human with equivalent stats', () => {
    // T:40 → TB:4, WP:35 → WPB:3, S:37 → SB:3  →  4 + (2×3) + 3 = 13
    // The Dwarf species.extraWounds (+2) is NOT included — add it at call site.
    expect(getDwarfWoundThreshold(40, 35, 37)).toBe(13)
  })

  it('returns the same result as getWoundThreshold for identical stats', () => {
    // getDwarfWoundThreshold delegates to the same formula — verify no divergence.
    expect(getDwarfWoundThreshold(40, 35, 37)).toBe(getWoundThreshold(40, 35, 37))
  })

  it('documents the expected full Dwarf total WITH extraWounds applied by the caller', () => {
    // Full Dwarf wounds = getDwarfWoundThreshold result + species.extraWounds (2)
    // T:40, WP:35, S:37 → base = 13, total with extraWounds = 13 + 2 = 15
    const baseWounds = getDwarfWoundThreshold(40, 35, 37)
    const dwarfExtraWounds = 2 // from Species.extraWounds for Dwarf (corebook p.29)
    expect(baseWounds + dwarfExtraWounds).toBe(15)
  })
})

// ── 3. Halfling Wound Threshold ───────────────────────────────────────────────
// Halflings use a DIFFERENT formula: TB + (2 × WPB) — NO Strength Bonus component.
// This makes Halflings' wounds 2 fewer than a human with equivalent stats (SB:2).
//
// ⚠️  RULES VERIFICATION: Confirm TB + 2×WPB (no SB) for Halflings is correct.
//     Source: WFRP 4e Core Rulebook p.340.
//
// Signature: getHalflingWoundThreshold(toughness, willpower)
// Source: WFRP 4e Core Rulebook p.340
describe('getHalflingWoundThreshold', () => {
  it('calculates TB + (2 × WPB) without any Strength Bonus', () => {
    // T:30 → TB:3, WP:31 → WPB:3  →  3 + (2×3) = 9 wounds
    // Compared to a human with the same T and WP but S:25 (SB:2) → 11 wounds
    // Halfling is 2 fewer (missing SB:2 component)
    expect(getHalflingWoundThreshold(30, 31)).toBe(9)
  })

  it('omits SB — high Strength does not contribute to Halfling wounds', () => {
    // T:30, WP:30: TB:3, WPB:3  →  3 + (2×3) = 9 wounds regardless of Strength
    expect(getHalflingWoundThreshold(30, 30)).toBe(9)
  })

  it('is always SB fewer wounds than the equivalent standard formula', () => {
    // With T:30, WP:30, S:20 (SB:2):
    // Standard: TB:3 + (2×WPB:3) + SB:2 = 11
    // Halfling:  TB:3 + (2×WPB:3)       = 9  → difference = SB = 2
    const standardResult = getWoundThreshold(30, 30, 20)
    const halflingResult = getHalflingWoundThreshold(30, 30)
    expect(standardResult - halflingResult).toBe(2) // exactly the SB:2 difference
  })

  it('floors bonuses the same way as the standard formula', () => {
    // T:39 → TB:3 (floor, not round), WP:39 → WPB:3  →  3 + (2×3) = 9
    expect(getHalflingWoundThreshold(39, 39)).toBe(9)
  })
})

// ── 4. Current Wounds ─────────────────────────────────────────────────────────
// Returns the character's remaining wounds after taking damage.
// Formula: max(0, maxWounds − damage)
//
// Wounds cannot go below 0 via this calculation — negative wounds are tracked
// separately as Serious Wounds (SWs) per the combat system. This function
// returns the "remaining wounds" for display, clamped at 0.
//
// Source: WFRP 4e Core Rulebook p.166
describe('getCurrentWounds', () => {
  it('returns maxWounds minus damage when damage is below threshold', () => {
    expect(getCurrentWounds(12, 5)).toBe(7)
  })

  it('returns 0 when damage equals maxWounds (exactly at threshold)', () => {
    expect(getCurrentWounds(12, 12)).toBe(0)
  })

  it('returns 0 when damage exceeds maxWounds (does not go negative)', () => {
    // Overflow damage becomes a Critical Wound — tracked by getCriticalWoundMagnitude
    expect(getCurrentWounds(12, 15)).toBe(0)
  })

  it('returns maxWounds when damage is 0', () => {
    expect(getCurrentWounds(12, 0)).toBe(12)
  })

  it('handles a single wound point remaining', () => {
    expect(getCurrentWounds(10, 9)).toBe(1)
  })
})

// ── 5. Seriously Wounded ─────────────────────────────────────────────────────
// A character is Seriously Wounded when they have 0 current wounds.
// At 0 wounds, the character must test for a Serious Wound each time they take damage.
//
// ⚠️  RULES VERIFICATION: Corebook p.166 — does Seriously Wounded trigger AT 0 or
//     only BELOW 0? These tests assume 0 current wounds = seriously wounded (AT 0).
//
// Source: WFRP 4e Core Rulebook p.166
describe('isSeriouslyWounded', () => {
  it('returns true when currentWounds is 0', () => {
    expect(isSeriouslyWounded(0)).toBe(true)
  })

  it('returns false when currentWounds is 1 (still has wounds left)', () => {
    expect(isSeriouslyWounded(1)).toBe(false)
  })

  it('returns false when currentWounds is well above 0', () => {
    expect(isSeriouslyWounded(10)).toBe(false)
  })

  it('returns true even if currentWounds is somehow negative (belt-and-suspenders guard)', () => {
    // Defensive: if wounds somehow go negative (e.g., legacy data), still seriously wounded
    expect(isSeriouslyWounded(-1)).toBe(true)
  })
})

// ── 6. Critical Wound Magnitude ───────────────────────────────────────────────
// When a hit deals more damage than the character has remaining wounds, the excess
// becomes a Critical Wound. The magnitude of the Critical Wound is the overflow.
//
// Formula: max(0, damage − currentWounds)
//
// If damage ≤ currentWounds: no critical (the character has wounds to absorb it).
// If damage > currentWounds: overflow = damage − currentWounds (a Critical Wound
// of that magnitude is rolled on the Critical Wounds table).
//
// ⚠️  RULES VERIFICATION: Verify the critical wound overflow formula (damage minus
//     remaining wounds) against corebook p.166.
//
// Source: WFRP 4e Core Rulebook p.166
describe('getCriticalWoundMagnitude', () => {
  it('returns the overflow when damage exceeds current wounds', () => {
    // 5 damage, 2 wounds remaining → 5 - 2 = 3 overflow → Critical +3
    expect(getCriticalWoundMagnitude(5, 2)).toBe(3)
  })

  it('returns 0 when damage is absorbed by remaining wounds', () => {
    // 3 damage, 5 wounds remaining → fully absorbed, no critical
    expect(getCriticalWoundMagnitude(3, 5)).toBe(0)
  })

  it('returns 0 when damage exactly equals current wounds (no overflow)', () => {
    // 5 damage, 5 wounds remaining → wounds hit 0, no overflow → no critical
    // The character is now Seriously Wounded but no Critical Wound yet
    expect(getCriticalWoundMagnitude(5, 5)).toBe(0)
  })

  it('returns the full damage as overflow when character is already at 0 wounds', () => {
    // 4 damage, 0 wounds remaining → 4 - 0 = 4 overflow → Critical +4
    expect(getCriticalWoundMagnitude(4, 0)).toBe(4)
  })

  it('returns 0 when damage is 0 (no hit)', () => {
    expect(getCriticalWoundMagnitude(0, 5)).toBe(0)
  })
})
