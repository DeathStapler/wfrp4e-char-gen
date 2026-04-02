/**
 * WFRP 4e Talent XP Cost Rules
 *
 * Source: Warhammer Fantasy Roleplay 4th Edition Core Rulebook p.58
 */

/**
 * Returns the XP cost to take a talent once.
 * In WFRP 4e, every talent costs 100 XP per taking, regardless of
 * whether it is a career talent or not.
 * Source: WFRP 4e Core Rulebook p.58
 */
export function getTalentXpCost(): number {
  return 100;
}

/**
 * Returns the total XP cost to take a talent N times.
 * Each taking costs 100 XP independently — there is no sliding scale for talents.
 * Source: WFRP 4e Core Rulebook p.58
 */
export function getTotalTalentXpCost(timesTaken: number): number {
  if (timesTaken < 0) throw new Error('timesTaken must be >= 0');
  return timesTaken * 100;
}
