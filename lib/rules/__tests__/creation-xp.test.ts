/**
 * WFRP 4e Character Creation XP Tests
 *
 * Tests the XP bonus system for character creation choices.
 * Written against WFRP 4e Core Rulebook pp. 24–27.
 */

import { describe, it, expect } from 'vitest'
import {
  getSpeciesChoiceXP,
  getCareerChoiceXP,
  getAttributeChoiceXP,
  getCreationXP,
  type SpeciesChoiceMethod,
  type CareerChoiceMethod,
  type AttributeChoiceMethod,
} from '../creation-xp'

// ── 1. Species Choice XP ──────────────────────────────────────────────────────
describe('getSpeciesChoiceXP', () => {
  it('returns +20 XP for random species roll', () => {
    expect(getSpeciesChoiceXP('random')).toBe(20)
  })

  it('returns +0 XP for chosen species', () => {
    expect(getSpeciesChoiceXP('chosen')).toBe(0)
  })
})

// ── 2. Career Choice XP ───────────────────────────────────────────────────────
describe('getCareerChoiceXP', () => {
  it('returns +50 XP for single random roll kept', () => {
    expect(getCareerChoiceXP('random')).toBe(50)
  })

  it('returns +25 XP for rolled 3 times, pick 1', () => {
    expect(getCareerChoiceXP('rolled3pick1')).toBe(25)
  })

  it('returns +0 XP for freely chosen career', () => {
    expect(getCareerChoiceXP('chosen')).toBe(0)
  })
})

// ── 3. Attribute Choice XP ────────────────────────────────────────────────────
describe('getAttributeChoiceXP', () => {
  it('returns +50 XP for random roll kept as-is', () => {
    expect(getAttributeChoiceXP('random-keep')).toBe(50)
  })

  it('returns +25 XP for random roll with rearrangement', () => {
    expect(getAttributeChoiceXP('random-rearrange')).toBe(25)
  })

  it('returns +0 XP for manual allocation', () => {
    expect(getAttributeChoiceXP('manual')).toBe(0)
  })
})

// ── 4. Total Creation XP ──────────────────────────────────────────────────────
describe('getCreationXP', () => {
  it('returns maximum XP: random species + random career + random attributes kept = +120', () => {
    expect(getCreationXP('random', 'random', 'random-keep')).toBe(120)
  })

  it('combines species and career XP correctly when attributes not provided', () => {
    expect(getCreationXP('random', 'random')).toBe(70)
  })

  it('returns +95 XP: random species + random career + rearranged attributes', () => {
    expect(getCreationXP('random', 'random', 'random-rearrange')).toBe(95)
  })

  it('returns +70 XP: random species + random career + manual attributes', () => {
    expect(getCreationXP('random', 'random', 'manual')).toBe(70)
  })

  it('returns +75 XP: chosen species + roll-3-pick-1 career + random attributes kept', () => {
    expect(getCreationXP('chosen', 'rolled3pick1', 'random-keep')).toBe(75)
  })

  it('returns +50 XP: chosen species + chosen career + random attributes kept', () => {
    expect(getCreationXP('chosen', 'chosen', 'random-keep')).toBe(50)
  })

  it('returns +25 XP: random species + chosen career + rearranged attributes', () => {
    expect(getCreationXP('random', 'chosen', 'random-rearrange')).toBe(45)
  })

  it('returns +0 XP: all choices made freely', () => {
    expect(getCreationXP('chosen', 'chosen', 'manual')).toBe(0)
  })

  it('handles missing attribute method gracefully (defaults to +0 attribute XP)', () => {
    expect(getCreationXP('random', 'rolled3pick1')).toBe(45)
    expect(getCreationXP('chosen', 'chosen')).toBe(0)
  })
})

// ── 5. Edge Cases & Exhaustive Combinations ───────────────────────────────────
describe('getCreationXP - exhaustive validation', () => {
  const speciesMethods: SpeciesChoiceMethod[] = ['random', 'chosen']
  const careerMethods: CareerChoiceMethod[] = ['random', 'rolled3pick1', 'chosen']
  const attributeMethods: AttributeChoiceMethod[] = ['random-keep', 'random-rearrange', 'manual']

  it('produces values in the range 0–120', () => {
    for (const species of speciesMethods) {
      for (const career of careerMethods) {
        for (const attribute of attributeMethods) {
          const xp = getCreationXP(species, career, attribute)
          expect(xp).toBeGreaterThanOrEqual(0)
          expect(xp).toBeLessThanOrEqual(120)
        }
      }
    }
  })

  it('matches expected values for all 18 combinations', () => {
    const expectedValues = [
      // species=random, career=random (20 + 50 = 70)
      { species: 'random', career: 'random', attribute: 'random-keep', expected: 120 },
      { species: 'random', career: 'random', attribute: 'random-rearrange', expected: 95 },
      { species: 'random', career: 'random', attribute: 'manual', expected: 70 },
      // species=random, career=rolled3pick1 (20 + 25 = 45)
      { species: 'random', career: 'rolled3pick1', attribute: 'random-keep', expected: 95 },
      { species: 'random', career: 'rolled3pick1', attribute: 'random-rearrange', expected: 70 },
      { species: 'random', career: 'rolled3pick1', attribute: 'manual', expected: 45 },
      // species=random, career=chosen (20 + 0 = 20)
      { species: 'random', career: 'chosen', attribute: 'random-keep', expected: 70 },
      { species: 'random', career: 'chosen', attribute: 'random-rearrange', expected: 45 },
      { species: 'random', career: 'chosen', attribute: 'manual', expected: 20 },
      // species=chosen, career=random (0 + 50 = 50)
      { species: 'chosen', career: 'random', attribute: 'random-keep', expected: 100 },
      { species: 'chosen', career: 'random', attribute: 'random-rearrange', expected: 75 },
      { species: 'chosen', career: 'random', attribute: 'manual', expected: 50 },
      // species=chosen, career=rolled3pick1 (0 + 25 = 25)
      { species: 'chosen', career: 'rolled3pick1', attribute: 'random-keep', expected: 75 },
      { species: 'chosen', career: 'rolled3pick1', attribute: 'random-rearrange', expected: 50 },
      { species: 'chosen', career: 'rolled3pick1', attribute: 'manual', expected: 25 },
      // species=chosen, career=chosen (0 + 0 = 0)
      { species: 'chosen', career: 'chosen', attribute: 'random-keep', expected: 50 },
      { species: 'chosen', career: 'chosen', attribute: 'random-rearrange', expected: 25 },
      { species: 'chosen', career: 'chosen', attribute: 'manual', expected: 0 },
    ]

    for (const { species, career, attribute, expected } of expectedValues) {
      expect(
        getCreationXP(
          species as SpeciesChoiceMethod,
          career as CareerChoiceMethod,
          attribute as AttributeChoiceMethod
        )
      ).toBe(expected)
    }
  })
})
