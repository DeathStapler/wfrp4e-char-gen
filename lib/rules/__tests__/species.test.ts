/**
 * WFRP 4e Species Rules Engine Tests
 *
 * Tests for species skill selection validation and advance lookup.
 *
 * Source: WFRP 4e Core Rulebook p.35.
 *
 * Rules (p.35):
 *   "You may choose 3 Skills to gain 5 Advances each, and 3 Skills to gain
 *   3 Advances each" from the 12-skill species starting pool.
 *   Each skill may only be selected once across both tiers.
 *
 * Functions under test (lib/rules/species.ts):
 *   validateSpeciesSkillSelections(selections, pool): string[]
 *   getSpeciesSkillAdvances(skillId, selections): number
 */

import { describe, it, expect } from 'vitest'
import {
  validateSpeciesSkillSelections,
  getSpeciesSkillAdvances,
  getFixedSpeciesTalents,
  getChoiceSpeciesTalents,
  getRandomTalentCount,
  getRandomTalentPool,
} from '../species'
import type { SpeciesSkillSelection } from '../species'
import type { Species } from '../../types/rules'

// ── Human starting skills pool (12 skills) ───────────────────────────────────
// Source: data/species.json, species id: "human"
const humanPool: string[] = [
  'Animal Care',
  'Charm',
  'Cool',
  'Evaluate',
  'Gossip',
  'Haggle',
  'Language (Bretonnian)',
  'Language (Wastelander)',
  'Leadership',
  'Lore (Reikland)',
  'Melee (Basic)',
  'Ranged (Bow)',
]

// ── validateSpeciesSkillSelections ───────────────────────────────────────────

describe('validateSpeciesSkillSelections', () => {
  it('returns no errors: exactly 3 at +5 and 3 different skills at +3', () => {
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Animal Care', advances: 5 },
      { skillId: 'Charm', advances: 5 },
      { skillId: 'Cool', advances: 5 },
      { skillId: 'Evaluate', advances: 3 },
      { skillId: 'Gossip', advances: 3 },
      { skillId: 'Haggle', advances: 3 },
    ]
    expect(validateSpeciesSkillSelections(selections, humanPool)).toEqual([])
  })

  it('returns error when the same skill appears in both the +5 and +3 groups', () => {
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Animal Care', advances: 5 },
      { skillId: 'Charm', advances: 5 },
      { skillId: 'Cool', advances: 5 },
      { skillId: 'Animal Care', advances: 3 }, // duplicate across tiers
      { skillId: 'Gossip', advances: 3 },
      { skillId: 'Haggle', advances: 3 },
    ]
    const errors = validateSpeciesSkillSelections(selections, humanPool)
    expect(errors.some(e => e.toLowerCase().includes('once'))).toBe(true)
  })

  it('returns error when more than 3 skills are selected at +5 advances', () => {
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Animal Care', advances: 5 },
      { skillId: 'Charm', advances: 5 },
      { skillId: 'Cool', advances: 5 },
      { skillId: 'Evaluate', advances: 5 }, // 4th at +5
      { skillId: 'Gossip', advances: 3 },
      { skillId: 'Haggle', advances: 3 },
    ]
    const errors = validateSpeciesSkillSelections(selections, humanPool)
    expect(errors.some(e => e.includes('+5'))).toBe(true)
  })

  it('returns error when more than 3 skills are selected at +3 advances', () => {
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Animal Care', advances: 5 },
      { skillId: 'Charm', advances: 5 },
      { skillId: 'Cool', advances: 5 },
      { skillId: 'Evaluate', advances: 3 },
      { skillId: 'Gossip', advances: 3 },
      { skillId: 'Haggle', advances: 3 },
      { skillId: 'Leadership', advances: 3 }, // 4th at +3
    ]
    const errors = validateSpeciesSkillSelections(selections, humanPool)
    expect(errors.some(e => e.includes('+3'))).toBe(true)
  })

  it('returns error when a selected skill is not in the species pool', () => {
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Animal Care', advances: 5 },
      { skillId: 'Charm', advances: 5 },
      { skillId: 'Stealth (Rural)', advances: 5 }, // not in human pool
      { skillId: 'Evaluate', advances: 3 },
      { skillId: 'Gossip', advances: 3 },
      { skillId: 'Haggle', advances: 3 },
    ]
    const errors = validateSpeciesSkillSelections(selections, humanPool)
    expect(errors.some(e => e.includes('Stealth (Rural)'))).toBe(true)
  })

  it('returns error when fewer than 3 skills are selected at +5 advances', () => {
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Animal Care', advances: 5 },
      { skillId: 'Charm', advances: 5 },
      // Only 2 at +5
      { skillId: 'Cool', advances: 3 },
      { skillId: 'Evaluate', advances: 3 },
      { skillId: 'Gossip', advances: 3 },
    ]
    const errors = validateSpeciesSkillSelections(selections, humanPool)
    expect(errors.some(e => e.includes('+5'))).toBe(true)
  })

  it('returns errors for empty selections — both +5 and +3 counts are wrong', () => {
    const errors = validateSpeciesSkillSelections([], humanPool)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.includes('+5'))).toBe(true)
    expect(errors.some(e => e.includes('+3'))).toBe(true)
  })

  it('returns no errors for exactly 6 valid unique selections from the pool', () => {
    // Edge: uses the last 6 skills from the pool (all valid and unique)
    const selections: SpeciesSkillSelection[] = [
      { skillId: 'Lore (Reikland)', advances: 5 },
      { skillId: 'Melee (Basic)', advances: 5 },
      { skillId: 'Ranged (Bow)', advances: 5 },
      { skillId: 'Leadership', advances: 3 },
      { skillId: 'Language (Bretonnian)', advances: 3 },
      { skillId: 'Language (Wastelander)', advances: 3 },
    ]
    expect(validateSpeciesSkillSelections(selections, humanPool)).toEqual([])
  })
})

// ── getSpeciesSkillAdvances ───────────────────────────────────────────────────

describe('getSpeciesSkillAdvances', () => {
  const selections: SpeciesSkillSelection[] = [
    { skillId: 'Animal Care', advances: 5 },
    { skillId: 'Charm', advances: 5 },
    { skillId: 'Cool', advances: 5 },
    { skillId: 'Evaluate', advances: 3 },
    { skillId: 'Gossip', advances: 3 },
    { skillId: 'Haggle', advances: 3 },
  ]

  it('returns 5 for a skill selected in the +5 tier', () => {
    expect(getSpeciesSkillAdvances('Animal Care', selections)).toBe(5)
  })

  it('returns 3 for a skill selected in the +3 tier', () => {
    expect(getSpeciesSkillAdvances('Evaluate', selections)).toBe(3)
  })

  it('returns 0 for a skill that was not selected', () => {
    expect(getSpeciesSkillAdvances('Leadership', selections)).toBe(0)
  })

  it('returns 0 when selections array is empty', () => {
    expect(getSpeciesSkillAdvances('Animal Care', [])).toBe(0)
  })
})

// ── Shared test species fixtures ─────────────────────────────────────────────

const baseSpecies: Omit<Species, 'startingTalents'> = {
  id: 'human',
  name: 'Human',
  characteristics: { WS: 20, BS: 20, S: 20, T: 20, I: 20, Ag: 20, Dex: 20, Int: 20, WP: 20, Fel: 20 },
  fate: 2,
  resilience: 1,
  extraWounds: 0,
  movement: 4,
  size: 'Average',
  startingSkills: [],
}

const humanSpecies: Species = {
  ...baseSpecies,
  startingTalents: [
    { type: 'fixed', talent: 'Doomed' },
    { type: 'choice', options: ['Savvy', 'Suave'] },
    { type: 'random', count: 3 },
  ],
}

const dwarfSpecies: Species = {
  ...baseSpecies,
  id: 'dwarf',
  name: 'Dwarf',
  startingTalents: [
    { type: 'fixed',  talent: 'Magic Resistance' },
    { type: 'fixed',  talent: 'Night Vision' },
    { type: 'choice', options: ['Read/Write', 'Relentless'] },
    { type: 'choice', options: ['Resolute', 'Strong-minded'] },
    { type: 'fixed',  talent: 'Sturdy' },
  ],
}

const halflingSpecies: Species = {
  ...baseSpecies,
  id: 'halfling',
  name: 'Halfling',
  startingTalents: [
    { type: 'fixed',  talent: 'Acute Sense (Taste)' },
    { type: 'fixed',  talent: 'Night Vision' },
    { type: 'fixed',  talent: 'Resistance (Chaos)' },
    { type: 'fixed',  talent: 'Small' },
    { type: 'random', count: 2 },
  ],
}

// ── getFixedSpeciesTalents ────────────────────────────────────────────────────

describe('getFixedSpeciesTalents', () => {
  it('returns only fixed talents for Human (1 fixed)', () => {
    expect(getFixedSpeciesTalents(humanSpecies)).toEqual(['Doomed'])
  })

  it('returns 3 fixed talents for Dwarf and excludes choices', () => {
    expect(getFixedSpeciesTalents(dwarfSpecies)).toEqual([
      'Magic Resistance',
      'Night Vision',
      'Sturdy',
    ])
  })

  it('returns all 4 fixed talents for Halfling', () => {
    expect(getFixedSpeciesTalents(halflingSpecies)).toEqual([
      'Acute Sense (Taste)',
      'Night Vision',
      'Resistance (Chaos)',
      'Small',
    ])
  })

  it('returns empty array when species has no fixed talents', () => {
    const noFixed: Species = { ...baseSpecies, startingTalents: [{ type: 'random', count: 3 }] }
    expect(getFixedSpeciesTalents(noFixed)).toEqual([])
  })
})

// ── getChoiceSpeciesTalents ───────────────────────────────────────────────────

describe('getChoiceSpeciesTalents', () => {
  it('returns the one choice entry for Human', () => {
    expect(getChoiceSpeciesTalents(humanSpecies)).toEqual([
      { options: ['Savvy', 'Suave'] },
    ])
  })

  it('returns 2 choice entries for Dwarf', () => {
    expect(getChoiceSpeciesTalents(dwarfSpecies)).toEqual([
      { options: ['Read/Write', 'Relentless'] },
      { options: ['Resolute', 'Strong-minded'] },
    ])
  })

  it('returns empty array when species has no choice talents', () => {
    const noChoice: Species = { ...baseSpecies, startingTalents: [{ type: 'fixed', talent: 'Doomed' }] }
    expect(getChoiceSpeciesTalents(noChoice)).toEqual([])
  })
})

// ── getRandomTalentCount ──────────────────────────────────────────────────────

describe('getRandomTalentCount', () => {
  it('returns 3 for Human', () => {
    expect(getRandomTalentCount(humanSpecies)).toBe(3)
  })

  it('returns 2 for Halfling', () => {
    expect(getRandomTalentCount(halflingSpecies)).toBe(2)
  })

  it('returns 0 for Dwarf (no random entry)', () => {
    expect(getRandomTalentCount(dwarfSpecies)).toBe(0)
  })
})

// ── getRandomTalentPool ───────────────────────────────────────────────────────

describe('getRandomTalentPool', () => {
  it('returns a non-empty array', () => {
    expect(getRandomTalentPool().length).toBeGreaterThan(0)
  })

  it('contains expected canonical entries from the rulebook table', () => {
    const pool = getRandomTalentPool()
    expect(pool).toContain('Ambidextrous')
    expect(pool).toContain('Warrior Born')
    expect(pool).toContain('Luck')
    expect(pool).toContain('Sixth Sense')
  })

  it('returns a consistent array across repeated calls', () => {
    expect(getRandomTalentPool()).toStrictEqual(getRandomTalentPool())
  })
})

