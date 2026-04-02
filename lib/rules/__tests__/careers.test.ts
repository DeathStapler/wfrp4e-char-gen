/**
 * WFRP 4e Careers Rules Engine Tests
 *
 * TDD tests written against lib/rules/careers.ts. Bullock has implemented careers.ts;
 * these tests verify that implementation is rules-correct and flag any gaps.
 *
 * CONFIRMED RULES (WFRP 4e Core Rulebook p.58):
 *   "To complete a Career, you must have the number of Advances listed below in
 *   all your Career level's Characteristics and in eight of your Career level's
 *   available Skills. You must also have at least 1 Talent from your current
 *   Career level. Skills and Talents you have gained from advancement prior to
 *   entering your current Career count towards this."
 *
 *   Level 1 → 5 advances required in each characteristic & qualifying skill
 *   Level 2 → 10 advances required
 *   Level 3 → 15 advances required
 *   Level 4 → 20 advances required
 *
 *   - ALL listed characteristics must reach the level threshold.
 *   - EIGHT (or more) listed skills must reach the level threshold.
 *   - At least 1 talent from the level's talent list must be taken.
 *   - Advances from prior careers count toward all thresholds.
 *
 *   Talent XP: flat 100 XP per taking — confirmed no escalation (corebook p.230).
 *
 *   getTotalXpForCareerLevel returns MINIMUM COMPLETION COST:
 *   all characteristics to level threshold + 8 skills to level threshold + 1 talent.
 *
 * ⚠️  IMPLEMENTATION NOTE: canAdvanceCareerLevel tests for levels 1–4 thresholds
 *   and the "8 of N skills" rule will fail until Bullock updates the implementation
 *   to use level-appropriate thresholds and the 8-of-N skill count.
 *
 * Import contract (Bullock's implementation in lib/rules/careers.ts):
 *   getXpCostForCareerCharacteristic(currentAdvances: number): number
 *   getXpCostForCareerSkill(currentAdvances: number): number
 *   getXpCostForNonCareerSkill(currentAdvances: number): number
 *   getXpCostForTalent(timesTaken: number): number
 *   isCareerSkill(skillName: string, careerLevel: CareerLevel): boolean
 *   canAdvanceCareerLevel(character: Character, careerLevel: CareerLevel):
 *     { eligible: boolean; missing: string[] }
 *   getTotalXpForCareerLevel(careerLevel: CareerLevel): number
 *
 * Source: WFRP 4e Core Rulebook pp. 48–58.
 */

import { describe, it, expect } from 'vitest'
import type { CareerLevel } from '../../types/rules'
import type {
  Character,
  CharacteristicAdvances,
  CharacterSkill,
  CharacterTalent,
} from '../../types/character'

// ── Functions under test ──────────────────────────────────────────────────────
import {
  getXpCostForCareerCharacteristic,
  getXpCostForCareerSkill,
  getXpCostForNonCareerSkill,
  getXpCostForTalent,
  isCareerSkill,
  canAdvanceCareerLevel,
  getTotalXpForCareerLevel,
  getStartingTrappings,
} from '../careers'

// ── Test Fixtures ─────────────────────────────────────────────────────────────

/**
 * Soldier Level 1 (Recruit) — from data/careers.json.
 * Used as a concrete career level for integration-style tests.
 * Source: WFRP 4e Core Rulebook p.88.
 */
const soldierLevel1: CareerLevel = {
  level: 1,
  title: 'Recruit',
  status: { tier: 'Brass', standing: 3 },
  characteristics: ['WS', 'T', 'I', 'Ag'],
  skills: [
    { skill: 'Athletics' },
    { skill: 'Consume Alcohol' },
    { skill: 'Cool' },
    { skill: 'Dodge' },
    { skill: 'Endurance' },
    { skill: 'Intimidate' },
    { skill: 'Melee', specialisation: 'Basic' },
    { skill: 'Ranged', anySpecialisation: true },
    { skill: 'Perception' },
    { skill: 'Lore', specialisation: 'Local' },
  ],
  talents: [
    { talent: 'Combat Reflexes' },
    { talent: 'Drilled' },
    { talent: 'Rapid Reload' },
    { talent: 'Strike Mighty Blow' },
    { talent: 'Strike to Stun' },
    { talent: 'Sturdy' },
  ],
  trappings: ['Leather Jack', 'Hand Weapon', 'Shield or Bow'],
}

/**
 * Soldier Level 2 (Soldier) — from data/careers.json.
 * 5 characteristics; 10 skills. Completion threshold: 10 advances.
 * Source: WFRP 4e Core Rulebook p.88.
 */
const soldierLevel2: CareerLevel = {
  level: 2,
  title: 'Soldier',
  status: { tier: 'Brass', standing: 4 },
  characteristics: ['WS', 'S', 'T', 'Ag', 'Int'],
  skills: [
    { skill: 'Athletics' },
    { skill: 'Consume Alcohol' },
    { skill: 'Cool' },
    { skill: 'Dodge' },
    { skill: 'Endurance' },
    { skill: 'Intimidate' },
    { skill: 'Melee', specialisation: 'Basic' },
    { skill: 'Ranged', anySpecialisation: true },
    { skill: 'Perception' },
    { skill: 'Lore', specialisation: 'Local' },
  ],
  talents: [
    { talent: 'Combat Reflexes' },
    { talent: 'Drilled' },
    { talent: 'Rapid Reload' },
    { talent: 'Strike Mighty Blow' },
  ],
  trappings: [],
}

/**
 * Soldier Level 4 (Sergeant) — from data/careers.json.
 * 8 characteristics; 10 skills. Completion threshold: 20 advances.
 * Source: WFRP 4e Core Rulebook p.88.
 */
const soldierLevel4: CareerLevel = {
  level: 4,
  title: 'Sergeant',
  status: { tier: 'Silver', standing: 2 },
  characteristics: ['WS', 'BS', 'S', 'T', 'Ag', 'Int', 'WP', 'Fel'],
  skills: [
    { skill: 'Athletics' },
    { skill: 'Cool' },
    { skill: 'Dodge' },
    { skill: 'Endurance' },
    { skill: 'Intimidate' },
    { skill: 'Leadership' },
    { skill: 'Melee', specialisation: 'Basic' },
    { skill: 'Ranged', anySpecialisation: true },
    { skill: 'Perception' },
    { skill: 'Lore', specialisation: 'Local' },
  ],
  talents: [
    { talent: 'Combat Master' },
    { talent: 'Inspiring Aura' },
    { talent: 'Iron Jaw' },
    { talent: 'Menacing' },
    { talent: 'Rapid Reload' },
    { talent: 'Seasoned Traveller' },
  ],
  trappings: [],
}

/**
 * Minimal career level with a small skill/characteristic set — edge-case fixture
 * used for getTotalXpForCareerLevel tests. Has fewer than 8 skills; all available
 * skills count toward completion in this case.
 */
const minimalCareerLevel: CareerLevel = {
  level: 1,
  title: 'Apprentice',
  status: { tier: 'Brass', standing: 1 },
  characteristics: ['WS', 'T'],
  skills: [
    { skill: 'Athletics' },
    { skill: 'Dodge' },
  ],
  talents: [{ talent: 'Strike to Stun' }],
  trappings: [],
}

/**
 * Factory for minimal Character fixtures. Provides sensible defaults for all
 * required fields so individual tests only need to supply the relevant overrides.
 */
function makeCharacter(overrides: {
  characteristicAdvances?: Partial<CharacteristicAdvances>
  skills?: CharacterSkill[]
  talents?: CharacterTalent[]
}): Character {
  return {
    id: 'test-character',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    metadata: { name: 'Test Character', speciesId: 'human' },
    speciesChoiceMethod: 'chosen',
    careerChoiceMethod: 'chosen',
    attributeChoiceMethod: 'manual',
    characteristicBases: {
      WS: 20, BS: 20, S: 20, T: 20, I: 20, Ag: 20, Dex: 20, Int: 20, WP: 20, Fel: 20,
    },
    characteristicAdvances: {
      WS: 0, BS: 0, S: 0, T: 0, I: 0, Ag: 0, Dex: 0, Int: 0, WP: 0, Fel: 0,
      ...overrides.characteristicAdvances,
    },
    skills: overrides.skills ?? [],
    talents: overrides.talents ?? [],
    currentCareerId: 'soldier',
    currentCareerLevel: 1,
    careerHistory: [],
    experience: { total: 0, spent: 0, current: 0 },
    fate: { total: 2, burned: 0, luck: 2 },
    resilience: { total: 1, burned: 0, resolve: 1 },
    sinPoints: 0,
    corruption: { taint: 0, mutations: [] },
    status: { currentWounds: 10, woundThreshold: 10, advantage: 0, psychology: [], conditions: [] },
    wealth: { gold: 0, silver: 0, brass: 0 },
    trappings: [],
    spells: [],
  }
}

// ── 6. Career Level Advancement Eligibility ───────────────────────────────────
// Confirmed rules (WFRP 4e Core Rulebook p.58):
//   - ALL listed characteristics must reach the level's required advance count.
//   - At least EIGHT listed skills must reach the level's required advance count.
//   - At least 1 talent from those listed at the level must be taken.
//   - Advances from prior careers count toward all thresholds.
//
//   Level 1 → 5 advances  |  Level 2 → 10  |  Level 3 → 15  |  Level 4 → 20
//
// The 'missing' array returns human-readable strings describing unmet requirements.
// Tests use `some(m => m.includes('X'))` to avoid coupling to the exact string format.
//
// ⚠️  Tests for level thresholds (≥5 chars, 8-of-N skills) will FAIL until Bullock
//   updates canAdvanceCareerLevel to use level-appropriate thresholds and the
//   8-of-N skill count. See Bullock's implementation in lib/rules/careers.ts.
//
// Source: WFRP 4e Core Rulebook p.58
describe('canAdvanceCareerLevel', () => {
  // ── Level 1 completion (threshold: 5 advances) ─────────────────────────────
  it('Level 1 completion: eligible when all characteristics ≥5, 8+ skills ≥5, ≥1 talent', () => {
    // soldierLevel1: WS, T, I, Ag (4 chars) + 10 skills.
    // Provides all 4 chars at 5, 8 of 10 skills at 5 (2 below — only 8 required).
    const character = makeCharacter({
      characteristicAdvances: { WS: 5, T: 5, I: 5, Ag: 5 },
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        { skillId: 'ranged-bow',      advances: 5, isCareerSkill: true },
        { skillId: 'perception',      advances: 2, isCareerSkill: true }, // below threshold — OK, only 8 needed
        { skillId: 'lore-local',      advances: 1, isCareerSkill: true }, // below threshold — OK
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('Level 1 failure — characteristic short: not eligible when WS has 4 advances (needs 5)', () => {
    const character = makeCharacter({
      characteristicAdvances: { WS: 4, T: 5, I: 5, Ag: 5 }, // WS one short
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        { skillId: 'ranged-bow',      advances: 5, isCareerSkill: true },
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(false)
    expect(result.missing.some(m => m.includes('WS'))).toBe(true)
  })

  it('Level 1 failure — 7 skills at threshold: not eligible when only 7 of 10 skills reach ≥5', () => {
    const character = makeCharacter({
      characteristicAdvances: { WS: 5, T: 5, I: 5, Ag: 5 },
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        // Only 7 skills at threshold; 3 below — need 8.
        { skillId: 'ranged-bow',      advances: 4, isCareerSkill: true },
        { skillId: 'perception',      advances: 3, isCareerSkill: true },
        { skillId: 'lore-local',      advances: 2, isCareerSkill: true },
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(false)
  })

  // ── Level 2 completion (threshold: 10 advances) ────────────────────────────
  it('Level 2 completion: eligible when all characteristics ≥10, 8+ skills ≥10, ≥1 talent', () => {
    // soldierLevel2: WS, S, T, Ag, Int (5 chars) + 10 skills. 8 meet Level 2 threshold.
    const character = makeCharacter({
      characteristicAdvances: { WS: 10, S: 10, T: 10, Ag: 10, Int: 10 },
      skills: [
        { skillId: 'athletics',       advances: 10, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 10, isCareerSkill: true },
        { skillId: 'cool',            advances: 10, isCareerSkill: true },
        { skillId: 'dodge',           advances: 10, isCareerSkill: true },
        { skillId: 'endurance',       advances: 10, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 10, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 10, isCareerSkill: true },
        { skillId: 'ranged-bow',      advances: 10, isCareerSkill: true },
        { skillId: 'perception',      advances:  4, isCareerSkill: true }, // below Level 2 threshold — OK
        { skillId: 'lore-local',      advances:  2, isCareerSkill: true }, // below Level 2 threshold — OK
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel2)
    expect(result.eligible).toBe(true)
    expect(result.missing).toEqual([])
  })

  // ── Level 4 completion (threshold: 20 advances) ────────────────────────────
  it('Level 4 completion: eligible when all characteristics ≥20, 8+ skills ≥20, ≥1 talent', () => {
    // soldierLevel4: WS, BS, S, T, Ag, Int, WP, Fel (8 chars) + 10 skills.
    const character = makeCharacter({
      characteristicAdvances: { WS: 20, BS: 20, S: 20, T: 20, Ag: 20, Int: 20, WP: 20, Fel: 20 },
      skills: [
        { skillId: 'athletics',   advances: 20, isCareerSkill: true },
        { skillId: 'cool',        advances: 20, isCareerSkill: true },
        { skillId: 'dodge',       advances: 20, isCareerSkill: true },
        { skillId: 'endurance',   advances: 20, isCareerSkill: true },
        { skillId: 'intimidate',  advances: 20, isCareerSkill: true },
        { skillId: 'leadership',  advances: 20, isCareerSkill: true },
        { skillId: 'melee-basic', advances: 20, isCareerSkill: true },
        { skillId: 'ranged-bow',  advances: 20, isCareerSkill: true },
        { skillId: 'perception',  advances:  5, isCareerSkill: true }, // below Level 4 threshold — OK
        { skillId: 'lore-local',  advances:  5, isCareerSkill: true }, // below Level 4 threshold — OK
      ],
      talents: [{ talentId: 'combat-master', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel4)
    expect(result.eligible).toBe(true)
    expect(result.missing).toEqual([])
  })

  // ── No talent taken ──────────────────────────────────────────────────────
  it('not eligible when all characteristics and skills are met but 0 talents taken', () => {
    const character = makeCharacter({
      characteristicAdvances: { WS: 5, T: 5, I: 5, Ag: 5 },
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        { skillId: 'ranged-bow',      advances: 5, isCareerSkill: true },
      ],
      talents: [], // nothing taken
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(false)
    expect(result.missing.some(m => m.toLowerCase().includes('talent'))).toBe(true)
  })

  // ── Prior career advances count ──────────────────────────────────────────
  it('prior career advances count: isCareerSkill:false does not prevent a skill from counting toward the threshold', () => {
    // Rule (p.58): "Skills and Talents you have gained from advancement prior to
    // entering your current Career count towards this."
    // Athletics was taken at non-career rate in a prior career (isCareerSkill: false).
    // Its 5 total advances must still satisfy the Level 1 skill threshold.
    const character = makeCharacter({
      characteristicAdvances: { WS: 5, T: 5, I: 5, Ag: 5 },
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: false }, // prior career — must count
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        { skillId: 'ranged-bow',      advances: 5, isCareerSkill: true },
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(true)
    expect(result.missing).toEqual([])
  })

  // ── 8-skills boundary ────────────────────────────────────────────────────
  it('exactly 8 of 10 skills at threshold → eligible (8 is sufficient)', () => {
    // soldierLevel1 has 10 skills. Exactly 8 reach the Level 1 threshold (≥5); 2 do not.
    const character = makeCharacter({
      characteristicAdvances: { WS: 5, T: 5, I: 5, Ag: 5 },
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        { skillId: 'ranged-bow',      advances: 5, isCareerSkill: true },
        { skillId: 'perception',      advances: 4, isCareerSkill: true }, // 9th — below threshold
        { skillId: 'lore-local',      advances: 3, isCareerSkill: true }, // 10th — below threshold
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('exactly 7 of 10 skills at threshold → not eligible (8 required)', () => {
    // soldierLevel1 has 10 skills. Only 7 reach the Level 1 threshold; 3 do not.
    const character = makeCharacter({
      characteristicAdvances: { WS: 5, T: 5, I: 5, Ag: 5 },
      skills: [
        { skillId: 'athletics',       advances: 5, isCareerSkill: true },
        { skillId: 'consume-alcohol', advances: 5, isCareerSkill: true },
        { skillId: 'cool',            advances: 5, isCareerSkill: true },
        { skillId: 'dodge',           advances: 5, isCareerSkill: true },
        { skillId: 'endurance',       advances: 5, isCareerSkill: true },
        { skillId: 'intimidate',      advances: 5, isCareerSkill: true },
        { skillId: 'melee-basic',     advances: 5, isCareerSkill: true },
        // Only 7 at threshold — 3 below.
        { skillId: 'ranged-bow',      advances: 4, isCareerSkill: true },
        { skillId: 'perception',      advances: 3, isCareerSkill: true },
        { skillId: 'lore-local',      advances: 2, isCareerSkill: true },
      ],
      talents: [{ talentId: 'combat-reflexes', timesTaken: 1 }],
    })
    const result = canAdvanceCareerLevel(character, soldierLevel1)
    expect(result.eligible).toBe(false)
  })
})

// ── 1. XP Cost for Career Characteristic Advance ─────────────────────────────
// Formula: 25 × (currentAdvances + 1)
// Career characteristics can be advanced at this rate; non-career characteristics
// cannot be advanced at all (only career-listed ones are eligible).
// Source: WFRP 4e Core Rulebook p.49
describe('getXpCostForCareerCharacteristic', () => {
  it('costs 25xp for the first advance (0 → 1)', () => {
    expect(getXpCostForCareerCharacteristic(0)).toBe(25)
  })

  it('costs 50xp for the second advance (1 → 2)', () => {
    expect(getXpCostForCareerCharacteristic(1)).toBe(50)
  })

  it('costs 150xp for the sixth advance (5 → 6)', () => {
    expect(getXpCostForCareerCharacteristic(5)).toBe(150)
  })

  it('scales linearly: cost = 25 × (currentAdvances + 1)', () => {
    for (let i = 0; i < 10; i++) {
      expect(getXpCostForCareerCharacteristic(i)).toBe(25 * (i + 1))
    }
  })
})

// ── 2. XP Cost for Career Skill Advance ──────────────────────────────────────
// Formula: 10 × (currentAdvances + 1)
// Skills are capped at 10 advances — attempting to advance past 10 is an error.
// Source: WFRP 4e Core Rulebook p.48
describe('getXpCostForCareerSkill', () => {
  it('costs 10xp for the first advance (0 → 1)', () => {
    expect(getXpCostForCareerSkill(0)).toBe(10)
  })

  it('costs 60xp for the sixth advance (5 → 6)', () => {
    expect(getXpCostForCareerSkill(5)).toBe(60)
  })

  it('costs 100xp for the tenth advance (9 → 10) — the maximum useful advance', () => {
    expect(getXpCostForCareerSkill(9)).toBe(100)
  })

  it('throws or returns 0 when attempting to advance past 10 (already at max)', () => {
    // Skills cannot exceed 10 advances per the rules. Implementation must guard this.
    // Either a thrown RangeError or a returned 0 satisfies the contract.
    const result = (() => {
      try {
        return getXpCostForCareerSkill(10)
      } catch {
        return null
      }
    })()
    expect(result === null || result === 0).toBe(true)
  })

  it('scales linearly: cost = 10 × (currentAdvances + 1) for valid advance range', () => {
    for (let i = 0; i < 10; i++) {
      expect(getXpCostForCareerSkill(i)).toBe(10 * (i + 1))
    }
  })
})

// ── 3. XP Cost for Non-Career Skill Advance ───────────────────────────────────
// Formula: 20 × (currentAdvances + 1)  — double the career rate
// Source: WFRP 4e Core Rulebook p.48
describe('getXpCostForNonCareerSkill', () => {
  it('costs 20xp for the first advance (0 → 1)', () => {
    expect(getXpCostForNonCareerSkill(0)).toBe(20)
  })

  it('costs 120xp for the sixth advance (5 → 6)', () => {
    expect(getXpCostForNonCareerSkill(5)).toBe(120)
  })

  it('is always exactly double the career skill cost', () => {
    for (let i = 0; i < 10; i++) {
      expect(getXpCostForNonCareerSkill(i)).toBe(getXpCostForCareerSkill(i) * 2)
    }
  })

  it('throws or returns 0 when attempting to advance past 10 (already at max)', () => {
    const result = (() => {
      try {
        return getXpCostForNonCareerSkill(10)
      } catch {
        return null
      }
    })()
    expect(result === null || result === 0).toBe(true)
  })
})

// ── 4. XP Cost for Talent ─────────────────────────────────────────────────────
// Talents always cost a flat 100 XP per taking, regardless of how many times
// the character has already taken the talent.
//
// Confirmed: no XP escalation for multi-take talents (corebook p.230).
//
// Source: WFRP 4e Core Rulebook p.230
describe('getXpCostForTalent', () => {
  it('costs 100xp for the 1st taking of a talent (timesTaken = 0)', () => {
    expect(getXpCostForTalent(0)).toBe(100)
  })

  it('costs 100xp for the 2nd taking of a talent (flat, not escalating)', () => {
    // Talent XP is flat — unlike characteristics and skills which scale linearly.
    // timesTaken = 1 means the talent has been taken once before this purchase.
    expect(getXpCostForTalent(1)).toBe(100)
  })

  it('costs 100xp for the 3rd taking of a talent', () => {
    expect(getXpCostForTalent(2)).toBe(100)
  })
})

// ── 5. Career Skill Detection ─────────────────────────────────────────────────
// Determines whether a given skill name is listed in a career level's skills array.
// Used to determine XP rate: career skills cost half vs non-career skills.
//
// Matching rules (Bullock's nameToId slug strategy):
//   - Simple skills match by slug (e.g., "Athletics" → slug "athletics")
//   - Specialised skills match by full "Skill (Spec)" slug (e.g., "Melee (Basic)")
//   - anySpecialisation entries match any specialisation starting with the root slug
//     (e.g., "Ranged (Bow)" matches { skill: "Ranged", anySpecialisation: true })
//   - A skill not listed in the level at all → false
//
// Source: WFRP 4e Core Rulebook p.48
describe('isCareerSkill', () => {
  it('returns true for a simple skill directly listed in the career level', () => {
    // Athletics is explicitly listed in Soldier Level 1 (no specialisation)
    expect(isCareerSkill('Athletics', soldierLevel1)).toBe(true)
  })

  it('returns true for a full "Skill (Spec)" name matching a specialised entry', () => {
    // Melee (Basic) is listed with specialisation "Basic" in Soldier Level 1
    expect(isCareerSkill('Melee (Basic)', soldierLevel1)).toBe(true)
  })

  it('returns true for a specialisation of an anySpecialisation entry', () => {
    // Ranged (any) is listed in Soldier Level 1 — any Ranged specialisation qualifies
    expect(isCareerSkill('Ranged (Bow)', soldierLevel1)).toBe(true)
  })

  it('returns true for a root-only match against an anySpecialisation entry', () => {
    // Checking with just "Ranged" also matches — root name starts with "ranged"
    expect(isCareerSkill('Ranged', soldierLevel1)).toBe(true)
  })

  it('returns false for a skill NOT listed in the career level', () => {
    // Swim is not part of Soldier Level 1
    expect(isCareerSkill('Swim', soldierLevel1)).toBe(false)
  })

  it('returns false for a wrong specialisation of a specialised entry', () => {
    // Melee (Cavalry) is not listed — only Melee (Basic) is
    expect(isCareerSkill('Melee (Cavalry)', soldierLevel1)).toBe(false)
  })

  it('returns false for an empty career level', () => {
    const emptyLevel: CareerLevel = {
      level: 1,
      title: 'Empty',
      status: { tier: 'Brass', standing: 1 },
      characteristics: [],
      skills: [],
      talents: [],
      trappings: [],
    }
    expect(isCareerSkill('Athletics', emptyLevel)).toBe(false)
  })
})

// ── 7. Total XP for Career Level ─────────────────────────────────────────────
// Calculates the MINIMUM total XP required to satisfy the completion requirements
// for a career level (not the maximum / all-advances cost).
//
// Confirmed minimum completion cost (WFRP 4e Core Rulebook p.58):
//   All characteristics advanced to the level threshold (5/10/15/20).
//   Eight skills advanced to the level threshold.
//   One talent taken: 100 XP flat.
//
// Soldier Level 1 (Recruit) breakdown — confirmed rules:
//   Characteristic cost (0→5): 25×1 + 25×2 + 25×3 + 25×4 + 25×5 = 375 XP each
//   4 characteristics × 375 XP =  1,500 XP
//   Skill cost (0→5):           10×1 + 10×2 + 10×3 + 10×4 + 10×5 = 150 XP each
//   8 skills × 150 XP          =  1,200 XP
//   1 talent × 100 XP          =    100 XP
//   ─────────────────────────────────────
//   Total                       =  2,800 XP
//
// Source: WFRP 4e Core Rulebook pp. 48–58
describe('getTotalXpForCareerLevel', () => {
  it('calculates the minimum completion XP for Soldier Level 1 (Recruit) — confirmed rules', () => {
    // Level 1 threshold: 5 advances. 4 chars × 375 + 8 skills × 150 + 1 talent × 100 = 2800.
    expect(getTotalXpForCareerLevel(soldierLevel1)).toBe(2800)
  })

  it('calculates the minimum completion XP for a minimal career level (Level 1 rules)', () => {
    // minimalCareerLevel: level 1, 2 characteristics, 2 skills (< 8 listed → all count), 1 talent.
    // 2 chars × 375 (cost to 5 advances) = 750 XP
    // 2 skills × 150 (cost to 5 advances) = 300 XP
    // 1 talent × 100 = 100 XP
    // Total: 1,150 XP
    expect(getTotalXpForCareerLevel(minimalCareerLevel)).toBe(1150)
  })

  it('returns 0 for a career level with no characteristics, skills, or talents', () => {
    const emptyLevel: CareerLevel = {
      level: 1,
      title: 'Ghost',
      status: { tier: 'Brass', standing: 1 },
      characteristics: [],
      skills: [],
      talents: [],
      trappings: [],
    }
    expect(getTotalXpForCareerLevel(emptyLevel)).toBe(0)
  })
})

// ── 8. Starting Trappings ─────────────────────────────────────────────────────
// getStartingTrappings combines career-level trappings with the class trappings
// and deduplicates (case-insensitive, whitespace-normalised).
//
// Source: WFRP 4e Core Rulebook p.38 (Class Trappings), p.38 (Career Trappings).
describe('getStartingTrappings', () => {
  /**
   * Minimal Career fixture — only the fields getStartingTrappings cares about.
   * Warrior class trappings (from data/trappings.json): Clothing, Hand Weapon, Dagger, Pouch.
   */
  const warriorCareer: import('../../types/rules').Career = {
    id: 'soldier',
    name: 'Soldier',
    careerClass: 'Warrior',
    levels: [
      {
        level: 1,
        title: 'Recruit',
        status: { tier: 'Brass', standing: 3 },
        characteristics: ['WS', 'T', 'I', 'Ag'],
        skills: [],
        talents: [],
        trappings: ['Leather Jack', 'Shield'],
      },
      {
        level: 2,
        title: 'Soldier',
        status: { tier: 'Brass', standing: 4 },
        characteristics: ['WS', 'S', 'T', 'Ag', 'Int'],
        skills: [],
        talents: [],
        trappings: ['Great Weapon'],
      },
      {
        level: 3,
        title: 'Veteran',
        status: { tier: 'Silver', standing: 1 },
        characteristics: ['WS', 'BS', 'S', 'T', 'Ag'],
        skills: [],
        talents: [],
        trappings: [],
      },
      {
        level: 4,
        title: 'Sergeant',
        status: { tier: 'Silver', standing: 2 },
        characteristics: ['WS', 'BS', 'S', 'T', 'Ag', 'Int', 'WP', 'Fel'],
        skills: [],
        talents: [],
        trappings: ['Badge of Rank'],
      },
    ],
  }

  const warriorClassTrappings = ['Clothing', 'Hand Weapon', 'Dagger', 'Pouch']

  it('combines class trappings and career level trappings (no overlap)', () => {
    // Class: Clothing, Hand Weapon, Dagger, Pouch
    // Level 1 career: Leather Jack, Shield
    // Expected: all 6 items, class trappings first
    const result = getStartingTrappings(warriorCareer, 0, warriorClassTrappings)
    expect(result).toEqual(['Clothing', 'Hand Weapon', 'Dagger', 'Pouch', 'Leather Jack', 'Shield'])
  })

  it('deduplicates: item appearing in both class and career list appears only once', () => {
    // Career level contains "Dagger" which is also in the Warrior class trappings.
    const careerWithDagger: import('../../types/rules').Career = {
      ...warriorCareer,
      levels: [
        {
          ...warriorCareer.levels[0],
          trappings: ['Dagger', 'Shield'], // Dagger duplicates the class trapping
        },
        ...warriorCareer.levels.slice(1),
      ],
    }
    const result = getStartingTrappings(careerWithDagger, 0, warriorClassTrappings)
    // Dagger from class trappings should be kept; Dagger from career level should be dropped.
    expect(result.filter(t => t.toLowerCase() === 'dagger')).toHaveLength(1)
    expect(result).toContain('Shield')
  })

  it('deduplication is case-insensitive', () => {
    // "hand weapon" (lowercase) in the career level trappings duplicates "Hand Weapon" from class.
    const careerWithLowercase: import('../../types/rules').Career = {
      ...warriorCareer,
      levels: [
        {
          ...warriorCareer.levels[0],
          trappings: ['hand weapon', 'Shield'],
        },
        ...warriorCareer.levels.slice(1),
      ],
    }
    const result = getStartingTrappings(careerWithLowercase, 0, warriorClassTrappings)
    // Only one "hand weapon" / "Hand Weapon" should be in the result.
    const handWeaponCount = result.filter(t => t.toLowerCase() === 'hand weapon').length
    expect(handWeaponCount).toBe(1)
  })

  it('handles empty class trappings array — returns only career level trappings', () => {
    const result = getStartingTrappings(warriorCareer, 0, [])
    expect(result).toEqual(['Leather Jack', 'Shield'])
  })

  it('handles empty career level trappings — returns only class trappings', () => {
    // Level index 2 (Veteran) has an empty trappings array.
    const result = getStartingTrappings(warriorCareer, 2, warriorClassTrappings)
    expect(result).toEqual(warriorClassTrappings)
  })

  it('handles both arrays empty — returns empty array', () => {
    const result = getStartingTrappings(warriorCareer, 2, [])
    expect(result).toEqual([])
  })

  it('works for Level 4 (levelIndex 3) — uses the correct career level', () => {
    const result = getStartingTrappings(warriorCareer, 3, warriorClassTrappings)
    expect(result).toContain('Badge of Rank')
    expect(result).toContain('Clothing')
  })

  it('preserves original casing of the first occurrence (class trapping wins on duplicate)', () => {
    // "Hand Weapon" is in the class list. If "hand weapon" appears in the career level
    // list, the class trapping's casing ("Hand Weapon") should be preserved.
    const careerWithLowercase: import('../../types/rules').Career = {
      ...warriorCareer,
      levels: [
        {
          ...warriorCareer.levels[0],
          trappings: ['hand weapon'],
        },
        ...warriorCareer.levels.slice(1),
      ],
    }
    const result = getStartingTrappings(careerWithLowercase, 0, warriorClassTrappings)
    expect(result).toContain('Hand Weapon')
    expect(result).not.toContain('hand weapon')
  })
})

// ── getCareerCreationOptions ──────────────────────────────────────────────────
// Returns the characteristics, skills, and talents available for XP advancement
// at character creation for the given career level.
// Source: WFRP 4e Core Rulebook p.43.
import { getCareerCreationOptions } from '../careers'
import type { Career } from '../../types/rules'
import careersData from '../../../data/careers.json'

// Apothecary is the first career in data/careers.json
// L1: 3 characteristics (T, Dex, Int), 8 skills, 4 talents
// L2: 4 characteristics (T, I, Dex, Int), 6 skills, 4 talents
const apothecary = (careersData as Career[]).find(c => c.name === 'Apothecary')!

describe('getCareerCreationOptions', () => {
  it('returns correct characteristics, skills and talents for level 1', () => {
    const opts = getCareerCreationOptions(apothecary, 1)
    // Apothecary L1 characteristics: T, Dex, Int
    expect(opts.characteristics).toHaveLength(3)
    expect(opts.characteristics).toContain('T')
    expect(opts.characteristics).toContain('Dex')
    expect(opts.characteristics).toContain('Int')
    // 8 skills (including specialised ones like "Lore (Chemistry)")
    expect(opts.skills).toHaveLength(8)
    expect(opts.skills).toContain('Consume Alcohol')
    expect(opts.skills).toContain('Heal')
    expect(opts.skills).toContain('Language (Classical)')
    expect(opts.skills).toContain('Lore (Chemistry)')
    // 4 talents
    expect(opts.talents).toHaveLength(4)
    expect(opts.talents).toContain('Concoct')
    expect(opts.talents).toContain('Read/Write')
  })

  it('returns level 2 data — not level 1 — when levelNumber is 2', () => {
    const opts = getCareerCreationOptions(apothecary, 2)
    // L2 has 4 characteristics: T, I, Dex, Int
    expect(opts.characteristics).toHaveLength(4)
    expect(opts.characteristics).toContain('I')
    // L2 has 6 skills (different from L1's 8)
    expect(opts.skills).toHaveLength(6)
    expect(opts.skills).toContain('Charm')
    expect(opts.skills).toContain('Perception')
    // L2 does NOT include L1-only skills
    expect(opts.skills).not.toContain('Consume Alcohol')
    expect(opts.skills).not.toContain('Heal')
    // L2 talents
    expect(opts.talents).toContain('Dealmaker')
    expect(opts.talents).toContain('Pharmacist')
  })

  it('throws when the requested level does not exist on the career', () => {
    // Build a minimal career with only 1 level to force a missing-level scenario.
    const oneLevel: Career = {
      ...apothecary,
      levels: [apothecary.levels[0]],
    }
    expect(() => getCareerCreationOptions(oneLevel, 4)).toThrow()
  })
})
