/**
 * WFRP 4e Character Builder Helpers
 *
 * Utilities for finalising a character built through the creation wizard.
 */
import { Character } from '../types/character';
import type { CreationAdvances } from '../types/character';
import { generateCharacterId } from '../storage/character-storage';

/**
 * Takes a partial character built up through the wizard and returns
 * a complete Character ready to save. Assigns id, createdAt, updatedAt.
 * Does NOT save to storage — caller handles that.
 */
export function finalizeCharacter(partial: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Character {
  const now = new Date().toISOString();
  return {
    ...partial,
    id: generateCharacterId(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Applies bonus XP advances purchased in Step 8 (Advancement) on top of a
 * pre-assembled character-in-progress.
 *
 * - Characteristic advances: added to characteristicAdvances[key]
 * - Skill advances: added to the matching CharacterSkill.advances (matched by
 *   display-name skillId used in wizard state) or appended as a new career
 *   skill entry if not already present
 * - Talents: appended to talents list if not already present (by talentId slug)
 *
 * Does not mutate the input object — returns a new object.
 *
 * Source: WFRP 4e Core Rulebook p.43.
 */
export function applyCreationAdvances(
  partial: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>,
  advances: CreationAdvances,
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  // Characteristics
  const characteristicAdvances = { ...partial.characteristicAdvances };
  for (const [key, extra] of Object.entries(advances.characteristics)) {
    if (extra > 0) {
      const k = key as keyof typeof characteristicAdvances;
      characteristicAdvances[k] = (characteristicAdvances[k] ?? 0) + extra;
    }
  }

  // Skills
  const skills = partial.skills.map((s) => ({ ...s }));
  for (const [skillName, extra] of Object.entries(advances.skills)) {
    if (extra <= 0) continue;
    const existing = skills.find((s) => s.skillId === skillName);
    if (existing) {
      existing.advances += extra;
    } else {
      skills.push({ skillId: skillName, advances: extra, isCareerSkill: true });
    }
  }

  // Talents
  function nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[()'"]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  const talentSet = new Set(partial.talents.map((t) => t.talentId));
  const talents = [...partial.talents];
  for (const talentName of advances.talents) {
    const slug = nameToSlug(talentName);
    if (!talentSet.has(slug)) {
      talents.push({ talentId: slug, timesTaken: 1, source: 'Creation XP' });
      talentSet.add(slug);
    }
  }

  return { ...partial, characteristicAdvances, skills, talents };
}