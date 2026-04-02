/**
 * WFRP 4e Skill Rules Tests
 *
 * These tests are written against the WFRP 4e core rulebook specification.
 * They will FAIL until Bullock implements the rules engine functions.
 * That is intentional — these tests gate correctness of the implementation.
 *
 * ⚠️  RULES VERIFICATION NEEDED:
 *   - The "career skill" designation resets each career tier. A skill that was
 *     non-career in tier 1 but becomes a career skill in tier 2 may have
 *     cost implications mid-career. This needs corebook clarification (p.48).
 *   - Grouped skills (e.g., Melee (Basic), Melee (Brawling)): each group
 *     advances independently but shares a linked characteristic. Confirm
 *     the max advances cap (10) applies per group, not per root skill.
 *   - Language skills and other grouped skills: same cap question applies.
 */

import { describe, it, expect } from 'vitest'

// ── Functions under test (to be implemented by Bullock) ──────────────────────
import {
  getSkillXpCost,
  getTotalSkillValue,
  getMaxSkillAdvances,
} from '../skills'

// ── 1. Skill XP Cost (tiered table) ──────────────────────────────────────────
// Cost is based on advances ALREADY taken. Career/non-career status is ignored.
// Source: WFRP 4e Core Rulebook — Characteristic and Skill Improvement XP Costs table
//
// | Advances already taken | Cost |
// |------------------------|------|
// | 0–5                    | 10   |
// | 6–10                   | 15   |
// | 11–15                  | 20   |
// | 16–20                  | 30   |
// | 21–25                  | 40   |
// | 26–30                  | 60   |
// | 31–35                  | 80   |
// | 36–40                  | 110  |
// | 41–45                  | 140  |
// | 46–50                  | 180  |
describe('getSkillXpCost', () => {
  it('costs 10 XP at 0 advances (tier 0–5, lower boundary)', () => {
    expect(getSkillXpCost(0)).toBe(10)
  })

  it('costs 10 XP at 4 advances (tier 0–4, upper boundary)', () => {
    expect(getSkillXpCost(4)).toBe(10)
  })

  it('costs 15 XP at 5 advances (tier 5–9, lower boundary)', () => {
    expect(getSkillXpCost(5)).toBe(15)
  })

  it('costs 15 XP at 9 advances (tier 5–9, upper boundary)', () => {
    expect(getSkillXpCost(9)).toBe(15)
  })

  it('costs 20 XP at 11 advances (tier 11–15)', () => {
    expect(getSkillXpCost(11)).toBe(20)
  })

  it('costs 30 XP at 16 advances (tier 16–20)', () => {
    expect(getSkillXpCost(16)).toBe(30)
  })

  it('costs 40 XP at 21 advances (tier 21–25)', () => {
    expect(getSkillXpCost(21)).toBe(40)
  })

  it('costs 60 XP at 26 advances (tier 26–30)', () => {
    expect(getSkillXpCost(26)).toBe(60)
  })

  it('costs 80 XP at 31 advances (tier 31–35)', () => {
    expect(getSkillXpCost(31)).toBe(80)
  })

  it('costs 110 XP at 36 advances (tier 36–40)', () => {
    expect(getSkillXpCost(36)).toBe(110)
  })

  it('costs 140 XP at 41 advances (tier 41–45)', () => {
    expect(getSkillXpCost(41)).toBe(140)
  })

  it('costs 180 XP at 46 advances (tier 46–50)', () => {
    expect(getSkillXpCost(46)).toBe(180)
  })

  it('isCareerSkill flag is ignored — same cost regardless', () => {
    expect(getSkillXpCost(0, true)).toBe(getSkillXpCost(0, false))
    expect(getSkillXpCost(6, true)).toBe(getSkillXpCost(6, false))
    expect(getSkillXpCost(11, true)).toBe(getSkillXpCost(11, false))
  })
})

// ── 2. Total Skill Value ───────────────────────────────────────────────────────
// Formula: linked characteristic total + skill advances
// Source: WFRP 4e Core Rulebook p.47
describe('getTotalSkillValue', () => {
  it('returns characteristic + advances', () => {
    expect(getTotalSkillValue(35, 3)).toBe(38)
    expect(getTotalSkillValue(40, 0)).toBe(40)
  })

  it('returns just the characteristic when no advances', () => {
    expect(getTotalSkillValue(30, 0)).toBe(30)
  })

  it('handles maximum advances (10)', () => {
    expect(getTotalSkillValue(30, 10)).toBe(40)
  })

  it('handles a characteristic of 0 (edge case)', () => {
    // Degenerate but the math should still work
    expect(getTotalSkillValue(0, 5)).toBe(5)
  })
})

// ── 3. Maximum Skill Advances ─────────────────────────────────────────────────
// Hard cap: 10 advances per skill (per career tier grouping)
// Source: WFRP 4e Core Rulebook p.48
describe('getMaxSkillAdvances', () => {
  it('returns 10', () => {
    expect(getMaxSkillAdvances()).toBe(10)
  })
})

// ── 4. Career Skill Allocation Validation ─────────────────────────────────────
// At character creation the player distributes exactly 40 advances across their
// 8 career level skills, with no more than 10 to any single skill.
// Source: WFRP 4e Core Rulebook p.35.
import {
  validateCareerSkillAllocation,
  getTotalAllocatedAdvances,
} from '../skills'
import type { CareerSkillAllocation } from '../skills'

const careerSkills = [
  'skill-1', 'skill-2', 'skill-3', 'skill-4',
  'skill-5', 'skill-6', 'skill-7', 'skill-8',
]

describe('validateCareerSkillAllocation', () => {
  it('returns no errors: 8 skills totalling exactly 40, none over 10', () => {
    const allocation: CareerSkillAllocation[] = careerSkills.map(id => ({
      skillId: id,
      advances: 5,
    }))
    expect(validateCareerSkillAllocation(allocation, careerSkills)).toEqual([])
  })

  it('returns error when total advances are below 40', () => {
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'skill-1', advances: 5 },
      { skillId: 'skill-2', advances: 5 },
    ]
    const errors = validateCareerSkillAllocation(allocation, careerSkills)
    expect(errors.some(e => e.includes('40'))).toBe(true)
  })

  it('returns error when total advances exceed 40', () => {
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'skill-1', advances: 10 },
      { skillId: 'skill-2', advances: 10 },
      { skillId: 'skill-3', advances: 10 },
      { skillId: 'skill-4', advances: 10 },
      { skillId: 'skill-5', advances: 5 }, // total = 45
    ]
    const errors = validateCareerSkillAllocation(allocation, careerSkills)
    expect(errors.some(e => e.includes('40'))).toBe(true)
  })

  it('returns error when a single skill has more than 10 advances', () => {
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'skill-1', advances: 11 }, // over cap
      { skillId: 'skill-2', advances: 10 },
      { skillId: 'skill-3', advances: 10 },
      { skillId: 'skill-4', advances: 9 },
    ]
    const errors = validateCareerSkillAllocation(allocation, careerSkills)
    expect(errors.some(e => e.includes('skill-1') && e.includes('11'))).toBe(true)
  })

  it('returns error when a skill is not in the career skills list', () => {
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'unlisted-skill', advances: 5 },
      { skillId: 'skill-2', advances: 5 },
      { skillId: 'skill-3', advances: 5 },
      { skillId: 'skill-4', advances: 5 },
      { skillId: 'skill-5', advances: 5 },
      { skillId: 'skill-6', advances: 5 },
      { skillId: 'skill-7', advances: 5 },
      { skillId: 'skill-8', advances: 5 },
    ]
    const errors = validateCareerSkillAllocation(allocation, careerSkills)
    expect(errors.some(e => e.includes('unlisted-skill'))).toBe(true)
  })

  it('returns per-skill cap error when all 40 advances are on one skill', () => {
    // Total is valid (40) but the single skill has 40 advances, far over the 10 cap.
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'skill-1', advances: 40 },
    ]
    const errors = validateCareerSkillAllocation(allocation, careerSkills)
    expect(errors.some(e => e.includes('skill-1') && e.includes('40'))).toBe(true)
  })

  it('returns no errors: 4 skills at 10 each = 40 total', () => {
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'skill-1', advances: 10 },
      { skillId: 'skill-2', advances: 10 },
      { skillId: 'skill-3', advances: 10 },
      { skillId: 'skill-4', advances: 10 },
    ]
    expect(validateCareerSkillAllocation(allocation, careerSkills)).toEqual([])
  })

  it('returns error for empty allocation — total is 0, not 40', () => {
    const errors = validateCareerSkillAllocation([], careerSkills)
    expect(errors.some(e => e.includes('40'))).toBe(true)
  })
})

// ── 5. Total Allocated Advances ───────────────────────────────────────────────

describe('getTotalAllocatedAdvances', () => {
  it('returns the correct sum for a normal allocation', () => {
    const allocation: CareerSkillAllocation[] = [
      { skillId: 'skill-1', advances: 5 },
      { skillId: 'skill-2', advances: 10 },
      { skillId: 'skill-3', advances: 3 },
    ]
    expect(getTotalAllocatedAdvances(allocation)).toBe(18)
  })

  it('returns 0 for an empty allocation array', () => {
    expect(getTotalAllocatedAdvances([])).toBe(0)
  })

  it('returns the single entry value when allocation has one entry', () => {
    const allocation: CareerSkillAllocation[] = [{ skillId: 'skill-1', advances: 7 }]
    expect(getTotalAllocatedAdvances(allocation)).toBe(7)
  })
})
