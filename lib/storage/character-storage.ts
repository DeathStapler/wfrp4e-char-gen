/**
 * WFRP 4e Character Storage — localStorage persistence layer.
 *
 * Characters are stored individually under `wfrp-character-{id}` keys.
 * An index of all character IDs is maintained under `wfrp-characters-index`.
 * All JSON parse errors are caught and handled gracefully (corrupted data is
 * treated as missing rather than thrown to the caller).
 *
 * Usage:
 *   import { saveCharacter, loadCharacter, loadAllCharacters, deleteCharacter, generateCharacterId } from './character-storage'
 */

import type { Character } from '../types/character'

// ── Storage keys ──────────────────────────────────────────────────────────────

const INDEX_KEY = 'wfrp-characters-index'

function characterKey(id: string): string {
  return `wfrp-character-${id}`
}

// ── Index helpers ─────────────────────────────────────────────────────────────

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids))
}

function addToIndex(id: string): void {
  const ids = readIndex()
  if (!ids.includes(id)) {
    ids.push(id)
    writeIndex(ids)
  }
}

function removeFromIndex(id: string): void {
  const ids = readIndex().filter((existingId) => existingId !== id)
  writeIndex(ids)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a new, unique character ID using the Web Crypto API (UUID v4).
 * Falls back to a timestamp-based ID if crypto is unavailable (SSR/test environments).
 */
export function generateCharacterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + random suffix (not cryptographically unique, but sufficient for dev).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Saves a character to localStorage.
 *
 * - Sets `updatedAt` to the current ISO timestamp on every save.
 * - Sets `createdAt` to the current ISO timestamp only if not already present.
 * - Adds the character's `id` to the index if not already listed.
 *
 * @param character - The character to save. Must have a populated `id` field.
 */
export function saveCharacter(character: Character): void {
  const now = new Date().toISOString()
  const toSave: Character = {
    ...character,
    createdAt: character.createdAt || now,
    updatedAt: now,
  }
  localStorage.setItem(characterKey(toSave.id), JSON.stringify(toSave))
  addToIndex(toSave.id)
}

/**
 * Loads a single character by ID from localStorage.
 *
 * Returns `null` if the character does not exist or the stored data is corrupted.
 *
 * @param id - The character's unique ID.
 */
export function loadCharacter(id: string): Character | null {
  try {
    const raw = localStorage.getItem(characterKey(id))
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    // Minimal structural validation: must be an object with a matching id string.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('id' in parsed) ||
      typeof (parsed as Record<string, unknown>)['id'] !== 'string'
    ) {
      return null
    }
    return parsed as Character
  } catch {
    return null
  }
}

/**
 * Loads all saved characters from localStorage.
 *
 * Reads the index, then loads each character in order. Characters that fail
 * to load (missing or corrupted) are silently omitted — the index entry is
 * not removed automatically (use `deleteCharacter` for explicit removal).
 *
 * Returns an empty array if no characters exist or the index is empty/corrupted.
 */
export function loadAllCharacters(): Character[] {
  const ids = readIndex()
  const characters: Character[] = []
  for (const id of ids) {
    const character = loadCharacter(id)
    if (character !== null) {
      characters.push(character)
    }
  }
  return characters
}

/**
 * Deletes a character from localStorage and removes it from the index.
 *
 * Idempotent — calling with an ID that does not exist is a no-op.
 *
 * @param id - The character's unique ID.
 */
export function deleteCharacter(id: string): void {
  localStorage.removeItem(characterKey(id))
  removeFromIndex(id)
}
