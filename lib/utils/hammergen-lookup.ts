/**
 * HammerGen Lookup Reference
 * Converts numeric IDs from hammergen-career.json to human-readable names
 * Generated from hammergen-skill.json
 */

import skillData from '@/data/hammergen-skill.json';

// Build lookup tables at module load time
let skillLookup: Record<string, string> | null = null;
let talentLookup: Record<string, string> | null = null;
let characteristicMap: Record<number, string> | null = null;

/**
 * Characteristic ID → Abbreviation mapping
 * Matches HammerGen's numeric attribute IDs (1-indexed)
 */
const CHARACTERISTICS: Record<number, string> = {
  1: 'WS',   // Weapon Skill
  2: 'BS',   // Ballistic Skill
  3: 'S',    // Strength
  4: 'T',    // Toughness
  5: 'I',    // Intuition
  6: 'Ag',   // Agility
  7: 'Dex',  // Dexterity
  8: 'Int',  // Intelligence
  9: 'WP',   // Willpower
  10: 'Fel', // Fellowship
};

/**
 * Build skill lookup on first use
 */
function getSkillLookup(): Record<string, string> {
  if (skillLookup) return skillLookup;

  skillLookup = {};
  
  // The hammergen-skill.json structure has string IDs, not numeric
  // We'll store by string ID as that's how they appear in careers
  if (Array.isArray(skillData.data)) {
    skillData.data.forEach((item: any) => {
      if (item.id && item.object?.name) {
        skillLookup![item.id] = item.object.name;
      }
    });
  }

  return skillLookup;
}

/**
 * Build talent lookup (future: populate when talents data is available)
 */
function getTalentLookup(): Record<string, string> {
  if (talentLookup) return talentLookup;
  talentLookup = {};
  // TODO: Parse talents from hammergen data when available
  return talentLookup;
}

/**
 * Look up a characteristic by numeric ID
 */
export function getCharacteristic(id: number): string {
  return CHARACTERISTICS[id] || `UNKNOWN(${id})`;
}

/**
 * Look up a skill by ID (string or number)
 */
export function getSkill(id: string | number): string {
  const lookup = getSkillLookup();
  const key = String(id);
  return lookup[key] || `UNKNOWN_SKILL(${id})`;
}

/**
 * Look up a talent by ID
 */
export function getTalent(id: string | number): string {
  const lookup = getTalentLookup();
  const key = String(id);
  return lookup[key] || `UNKNOWN_TALENT(${id})`;
}

/**
 * Decode a characteristics array from numeric IDs
 */
export function decodeCharacteristics(ids: number[]): string[] {
  return ids.map(id => getCharacteristic(id));
}

/**
 * Decode a skills array from IDs
 */
export function decodeSkills(ids: (string | number)[]): string[] {
  return ids.map(id => getSkill(id));
}

/**
 * Decode a talents array from IDs
 */
export function decodeTalents(ids: (string | number)[]): string[] {
  return ids.map(id => getTalent(id));
}

/**
 * Export lookup data for inspection
 */
export const SkilLookupData = {
  characteristics: CHARACTERISTICS,
  skills: () => getSkillLookup(),
  talents: () => getTalentLookup(),
};
