/**
 * WFRP 4e Fate and Resilience Rules Engine Tests
 *
 * Tests for calculating Fate and Resilience totals at character creation.
 *
 * Source: WFRP 4e Core Rulebook, Attributes Table p.26.
 *
 * Correct WFRP 4e values:
 * | Species   | Base Fate | Base Resilience | Extra Points |
 * |-----------|-----------|-----------------|--------------|
 * | Human     | 2         | 1               | 3            |
 * | Dwarf     | 0         | 2               | 2            |
 * | Halfling  | 0         | 2               | 3            |
 * | High Elf  | 0         | 0               | 2            |
 * | Wood Elf  | 0         | 0               | 2            |
 */

import { describe, it, expect } from 'vitest'
import {
  getFateTotal,
  getResilienceTotal,
  validateExtraPoints,
  getDefaultExtraPointsAllocation,
} from '../fate-resilience'

// ── Human (fate: 2, resilience: 1, extraPoints: 3) ──────────────────────────

describe('getFateTotal', () => {
  it('calculates correct total: Human with 0 extra to Fate', () => {
    expect(getFateTotal(2, 0)).toBe(2)
  })

  it('calculates correct total: Human with 1 extra to Fate', () => {
    expect(getFateTotal(2, 1)).toBe(3)
  })

  it('calculates correct total: Human with 3 extra to Fate', () => {
    expect(getFateTotal(2, 3)).toBe(5)
  })

  it('calculates correct total: Dwarf with 2 extra to Fate', () => {
    expect(getFateTotal(0, 2)).toBe(2)
  })
})

describe('getResilienceTotal', () => {
  it('calculates correct total: Human with 0 extra to Fate (all 3 to Resilience)', () => {
    expect(getResilienceTotal(1, 3, 0)).toBe(4)
  })

  it('calculates correct total: Human with 1 extra to Fate (2 to Resilience)', () => {
    expect(getResilienceTotal(1, 3, 1)).toBe(3)
  })

  it('calculates correct total: Human with 3 extra to Fate (0 to Resilience)', () => {
    expect(getResilienceTotal(1, 3, 3)).toBe(1)
  })

  it('calculates correct total: Dwarf with 0 extra to Fate (all 2 to Resilience)', () => {
    expect(getResilienceTotal(2, 2, 0)).toBe(4)
  })

  it('calculates correct total: Dwarf with 1 extra to Fate (1 to Resilience)', () => {
    expect(getResilienceTotal(2, 2, 1)).toBe(3)
  })

  it('calculates correct total: Halfling with 3 extra to Fate (0 to Resilience)', () => {
    expect(getResilienceTotal(2, 3, 3)).toBe(2)
  })
})

// ── Validation ───────────────────────────────────────────────────────────────

describe('validateExtraPoints', () => {
  it('returns true: allocate 0 out of 3', () => {
    expect(validateExtraPoints(0, 3)).toBe(true)
  })

  it('returns true: allocate 1 out of 3', () => {
    expect(validateExtraPoints(1, 3)).toBe(true)
  })

  it('returns true: allocate all 3 out of 3', () => {
    expect(validateExtraPoints(3, 3)).toBe(true)
  })

  it('returns false: allocate 4 out of 3 (over limit)', () => {
    expect(validateExtraPoints(4, 3)).toBe(false)
  })

  it('returns false: allocate -1 (negative)', () => {
    expect(validateExtraPoints(-1, 3)).toBe(false)
  })

  it('returns false: allocate 1.5 (non-integer)', () => {
    expect(validateExtraPoints(1.5, 3)).toBe(false)
  })

  it('returns true: allocate 0 out of 0 (species with no extra points, edge case)', () => {
    expect(validateExtraPoints(0, 0)).toBe(true)
  })
})

// ── Default Allocation ───────────────────────────────────────────────────────

describe('getDefaultExtraPointsAllocation', () => {
  it('returns 1 for 3 extra points (floor(3/2) = 1)', () => {
    expect(getDefaultExtraPointsAllocation(3)).toBe(1)
  })

  it('returns 1 for 2 extra points (floor(2/2) = 1)', () => {
    expect(getDefaultExtraPointsAllocation(2)).toBe(1)
  })

  it('returns 0 for 1 extra point (floor(1/2) = 0)', () => {
    expect(getDefaultExtraPointsAllocation(1)).toBe(0)
  })

  it('returns 0 for 0 extra points', () => {
    expect(getDefaultExtraPointsAllocation(0)).toBe(0)
  })
})

// ── Integration Tests (Full Species Examples) ────────────────────────────────

describe('Integration: Full species scenarios', () => {
  it('Human: 2 fate + 1 resilience + 3 extra (all to Fate) = 5 Fate, 1 Resilience', () => {
    const extraToFate = 3
    const fate = getFateTotal(2, extraToFate)
    const resilience = getResilienceTotal(1, 3, extraToFate)
    expect(fate).toBe(5)
    expect(resilience).toBe(1)
  })

  it('Human: 2 fate + 1 resilience + 3 extra (all to Resilience) = 2 Fate, 4 Resilience', () => {
    const extraToFate = 0
    const fate = getFateTotal(2, extraToFate)
    const resilience = getResilienceTotal(1, 3, extraToFate)
    expect(fate).toBe(2)
    expect(resilience).toBe(4)
  })

  it('Dwarf: 0 fate + 2 resilience + 2 extra (all to Fate) = 2 Fate, 2 Resilience', () => {
    const extraToFate = 2
    const fate = getFateTotal(0, extraToFate)
    const resilience = getResilienceTotal(2, 2, extraToFate)
    expect(fate).toBe(2)
    expect(resilience).toBe(2)
  })

  it('Halfling: 0 fate + 2 resilience + 3 extra (split 1 Fate, 2 Resilience) = 1 Fate, 4 Resilience', () => {
    const extraToFate = 1
    const fate = getFateTotal(0, extraToFate)
    const resilience = getResilienceTotal(2, 3, extraToFate)
    expect(fate).toBe(1)
    expect(resilience).toBe(4)
  })

  it('High Elf: 0 fate + 0 resilience + 2 extra (split evenly) = 1 Fate, 1 Resilience', () => {
    const extraToFate = 1
    const fate = getFateTotal(0, extraToFate)
    const resilience = getResilienceTotal(0, 2, extraToFate)
    expect(fate).toBe(1)
    expect(resilience).toBe(1)
  })
})
