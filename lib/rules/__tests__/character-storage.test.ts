/**
 * WFRP 4e Character Storage Tests
 *
 * Tests for lib/storage/character-storage.ts — the localStorage persistence layer.
 *
 * localStorage is a browser API unavailable in node/vitest's default environment.
 * We polyfill it here with a simple in-memory Map before each test, then restore
 * the global after each suite.
 *
 * Pure-logic functions (generateCharacterId, data shape invariants) are tested
 * without mocking. Storage functions are tested against the in-memory polyfill.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Character } from '../../types/character'

import {
  generateCharacterId,
  saveCharacter,
  loadCharacter,
  loadAllCharacters,
  deleteCharacter,
} from '../../storage/character-storage'

// ── localStorage polyfill ─────────────────────────────────────────────────────

/**
 * Minimal in-memory localStorage polyfill for the node/vitest environment.
 * Implements only the methods used by character-storage.ts.
 */
function makeLocalStorage(): Storage {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  } as Storage
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

// ── Fixture factory ───────────────────────────────────────────────────────────

/**
 * Builds a minimal but structurally complete Character for storage tests.
 * Only id/createdAt/updatedAt are varied between tests; other fields are stable.
 */
function makeCharacter(overrides: Partial<Pick<Character, 'id' | 'createdAt' | 'updatedAt'>> = {}): Character {
  return {
    id: overrides.id ?? 'char-001',
    createdAt: overrides.createdAt ?? '2024-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00.000Z',
    metadata: { name: 'Test Character', speciesId: 'human' },
    speciesChoiceMethod: 'chosen',
    careerChoiceMethod: 'chosen',
    attributeChoiceMethod: 'manual',
    characteristicBases: {
      WS: 20, BS: 20, S: 20, T: 20, I: 20, Ag: 20, Dex: 20, Int: 20, WP: 20, Fel: 20,
    },
    characteristicAdvances: {
      WS: 0, BS: 0, S: 0, T: 0, I: 0, Ag: 0, Dex: 0, Int: 0, WP: 0, Fel: 0,
    },
    skills: [],
    talents: [],
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

// ── generateCharacterId ───────────────────────────────────────────────────────

describe('generateCharacterId', () => {
  it('returns a non-empty string', () => {
    const id = generateCharacterId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns a different ID on each call (unique IDs)', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateCharacterId()))
    expect(ids.size).toBe(10)
  })

  it('returns a UUID v4 format when crypto.randomUUID is available', () => {
    // Node 18+ exposes crypto.randomUUID natively — validate the format.
    const id = generateCharacterId()
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    }
  })

  it('falls back to timestamp-based ID when crypto is unavailable', () => {
    // Temporarily hide crypto to exercise the fallback branch.
    const originalCrypto = globalThis.crypto
    vi.stubGlobal('crypto', undefined)
    const id = generateCharacterId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    vi.stubGlobal('crypto', originalCrypto)
  })
})

// ── saveCharacter / loadCharacter ─────────────────────────────────────────────

describe('saveCharacter and loadCharacter', () => {
  it('round-trips a character: save then load returns the same id and metadata', () => {
    const char = makeCharacter({ id: 'round-trip-001' })
    saveCharacter(char)
    const loaded = loadCharacter('round-trip-001')
    expect(loaded).not.toBeNull()
    expect(loaded!.id).toBe('round-trip-001')
    expect(loaded!.metadata.name).toBe('Test Character')
  })

  it('saveCharacter sets updatedAt to the current time on every save', () => {
    const before = Date.now()
    const char = makeCharacter({ id: 'updated-at-test', updatedAt: '1970-01-01T00:00:00.000Z' })
    saveCharacter(char)
    const loaded = loadCharacter('updated-at-test')
    const after = Date.now()
    expect(loaded).not.toBeNull()
    const savedAt = new Date(loaded!.updatedAt).getTime()
    expect(savedAt).toBeGreaterThanOrEqual(before)
    expect(savedAt).toBeLessThanOrEqual(after)
  })

  it('saveCharacter preserves createdAt if already set', () => {
    const original = '2024-03-01T10:00:00.000Z'
    const char = makeCharacter({ id: 'created-at-preserve', createdAt: original })
    saveCharacter(char)
    const loaded = loadCharacter('created-at-preserve')
    expect(loaded!.createdAt).toBe(original)
  })

  it('saveCharacter sets createdAt if not provided (empty string)', () => {
    const char = makeCharacter({ id: 'no-created-at', createdAt: '' })
    saveCharacter(char)
    const loaded = loadCharacter('no-created-at')
    expect(loaded!.createdAt).toBeTruthy()
    expect(loaded!.createdAt).not.toBe('')
  })

  it('loadCharacter returns null for an id that does not exist', () => {
    expect(loadCharacter('does-not-exist')).toBeNull()
  })

  it('loadCharacter returns null for corrupted JSON', () => {
    localStorage.setItem('wfrp-character-corrupted', 'not-valid-json{{{{')
    expect(loadCharacter('corrupted')).toBeNull()
  })

  it('loadCharacter returns null for stored data missing the id field', () => {
    localStorage.setItem('wfrp-character-no-id', JSON.stringify({ name: 'Missing ID' }))
    expect(loadCharacter('no-id')).toBeNull()
  })

  it('saveCharacter adds the character id to the index', () => {
    const char = makeCharacter({ id: 'index-test' })
    saveCharacter(char)
    const index = JSON.parse(localStorage.getItem('wfrp-characters-index') ?? '[]') as string[]
    expect(index).toContain('index-test')
  })

  it('saveCharacter does not duplicate the id in the index on multiple saves', () => {
    const char = makeCharacter({ id: 'no-dupe-index' })
    saveCharacter(char)
    saveCharacter(char)
    saveCharacter(char)
    const index = JSON.parse(localStorage.getItem('wfrp-characters-index') ?? '[]') as string[]
    expect(index.filter(id => id === 'no-dupe-index')).toHaveLength(1)
  })
})

// ── loadAllCharacters ─────────────────────────────────────────────────────────

describe('loadAllCharacters', () => {
  it('returns an empty array when no characters have been saved', () => {
    expect(loadAllCharacters()).toEqual([])
  })

  it('returns all saved characters', () => {
    const a = makeCharacter({ id: 'char-a' })
    const b = makeCharacter({ id: 'char-b' })
    saveCharacter(a)
    saveCharacter(b)
    const result = loadAllCharacters()
    const ids = result.map(c => c.id)
    expect(ids).toContain('char-a')
    expect(ids).toContain('char-b')
    expect(result).toHaveLength(2)
  })

  it('returns an empty array when the index is corrupted', () => {
    localStorage.setItem('wfrp-characters-index', 'CORRUPTED')
    expect(loadAllCharacters()).toEqual([])
  })

  it('silently omits characters whose data is corrupted (index entry present but data missing)', () => {
    // Add a valid character and a broken entry to the index.
    const good = makeCharacter({ id: 'char-good' })
    saveCharacter(good)
    // Manually corrupt the index to include an ID whose data doesn't exist.
    localStorage.setItem('wfrp-characters-index', JSON.stringify(['char-good', 'char-ghost']))
    const result = loadAllCharacters()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('char-good')
  })
})

// ── deleteCharacter ───────────────────────────────────────────────────────────

describe('deleteCharacter', () => {
  it('removes the character so loadCharacter returns null afterwards', () => {
    const char = makeCharacter({ id: 'to-delete' })
    saveCharacter(char)
    expect(loadCharacter('to-delete')).not.toBeNull()
    deleteCharacter('to-delete')
    expect(loadCharacter('to-delete')).toBeNull()
  })

  it('removes the id from the index after deletion', () => {
    const char = makeCharacter({ id: 'index-remove' })
    saveCharacter(char)
    deleteCharacter('index-remove')
    const index = JSON.parse(localStorage.getItem('wfrp-characters-index') ?? '[]') as string[]
    expect(index).not.toContain('index-remove')
  })

  it('is idempotent — deleting a non-existent id does not throw', () => {
    expect(() => deleteCharacter('phantom-id')).not.toThrow()
  })

  it('does not affect other characters when one is deleted', () => {
    const a = makeCharacter({ id: 'keep-me' })
    const b = makeCharacter({ id: 'delete-me' })
    saveCharacter(a)
    saveCharacter(b)
    deleteCharacter('delete-me')
    expect(loadCharacter('keep-me')).not.toBeNull()
    expect(loadCharacter('delete-me')).toBeNull()
  })
})
