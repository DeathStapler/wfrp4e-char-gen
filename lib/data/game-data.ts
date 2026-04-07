/**
 * Game Data Context — Centralized access to static WFRP 4e rules data.
 *
 * This module imports all JSON data files and provides:
 * - Direct array access to all species, careers, skills, talents, etc.
 * - O(1) lookup Maps by id and name for quick access
 * - Utility functions for filtering and searching
 *
 * All data is loaded at import time and frozen for performance.
 */

import speciesData from "@/data/species.json";
import careersData from "@/data/careers.json";
import skillsData from "@/data/skills.json";
import talentsData from "@/data/talents.json";
import trappingsData from "@/data/trappings.json";
import weaponsData from "@/data/weapons.json";
import armourData from "@/data/armour.json";
import equipmentData from "@/data/equipment.json";
import randomTalentsData from "@/data/random-talents.json";

import type {
  Species,
  Career,
  Skill,
  Talent,
  Weapon,
  Armour,
  EquipmentItem,
  RollTable,
  CareerClass,
  RandomTalentsList,
} from "@/lib/types/rules";

// ── Raw Data Arrays (frozen to prevent accidental mutation) ──────────────────

export const gameData = Object.freeze({
  species: speciesData as Species[],
  careers: careersData as Career[],
  skills: skillsData as Skill[],
  talents: talentsData as Talent[],
  weapons: weaponsData as Weapon[],
  armour: armourData as Armour[],
  equipment: equipmentData as EquipmentItem[],
  randomTalents: randomTalentsData as RandomTalentsList,
});

// ── O(1) Lookup Maps ─────────────────────────────────────────────────────────

function createLookupMap<T extends { id: string; name: string }>(
  items: T[]
): { byId: Map<string, T>; byName: Map<string, T>; byNameLower: Map<string, T> } {
  const byId = new Map<string, T>();
  const byName = new Map<string, T>();
  const byNameLower = new Map<string, T>();

  for (const item of items) {
    byId.set(item.id, item);
    byName.set(item.name, item);
    byNameLower.set(item.name.toLowerCase(), item);
  }

  return { byId, byName, byNameLower };
}

const speciesLookup = createLookupMap(gameData.species);
const careersLookup = createLookupMap(gameData.careers);
const skillsLookup = createLookupMap(gameData.skills);
const talentsLookup = createLookupMap(gameData.talents);

// Weapons and armour use 'name' as their primary identifier (no id field)
const weaponsByName = new Map(gameData.weapons.map((w) => [w.name, w]));
const armourByName = new Map(gameData.armour.map((a) => [a.name, a]));
const equipmentByName = new Map(gameData.equipment.map((e) => [e.name, e]));

// ── Exports: Species ──────────────────────────────────────────────────────────

export const SpeciesData = {
  all: gameData.species,
  byId: speciesLookup.byId,
  byName: speciesLookup.byName,
  byNameLower: speciesLookup.byNameLower,

  get(idOrName: string): Species | undefined {
    return this.byId.get(idOrName) ?? this.byName.get(idOrName) ?? this.byNameLower.get(idOrName.toLowerCase());
  },
};

// ── Exports: Careers ─────────────────────────────────────────────────────────

export const CareerData = {
  all: gameData.careers,
  byId: careersLookup.byId,
  byName: careersLookup.byName,
  byNameLower: careersLookup.byNameLower,

  get(idOrName: string): Career | undefined {
    return this.byId.get(idOrName) ?? this.byName.get(idOrName) ?? this.byNameLower.get(idOrName.toLowerCase());
  },

  byClass(careerClass: CareerClass): Career[] {
    return gameData.careers.filter((c) => c.careerClass === careerClass);
  },

  byStatus(tier: "Gold" | "Silver" | "Brass"): Career[] {
    return gameData.careers.filter((c) => c.levels[0]?.status.tier === tier);
  },
};

// ── Exports: Skills ──────────────────────────────────────────────────────────

export const SkillData = {
  all: gameData.skills,
  byId: skillsLookup.byId,
  byName: skillsLookup.byName,
  byNameLower: skillsLookup.byNameLower,

  get(idOrName: string): Skill | undefined {
    return this.byId.get(idOrName) ?? this.byName.get(idOrName) ?? this.byNameLower.get(idOrName.toLowerCase());
  },

  basic: gameData.skills.filter((s) => !s.advanced),
  advanced: gameData.skills.filter((s) => s.advanced),
  grouped: gameData.skills.filter((s) => s.grouped),

  byCharacteristic(char: string): Skill[] {
    return gameData.skills.filter((s) => s.characteristic === char);
  },
};

// ── Exports: Talents ──────────────────────────────────────────────────────────

export const TalentData = {
  all: gameData.talents,
  byId: talentsLookup.byId,
  byName: talentsLookup.byName,
  byNameLower: talentsLookup.byNameLower,

  get(idOrName: string): Talent | undefined {
    return this.byId.get(idOrName) ?? this.byName.get(idOrName) ?? this.byNameLower.get(idOrName.toLowerCase());
  },

  /** Talents with max = "bonus" (scalable by characteristic bonus) */
  scalable: gameData.talents.filter((t) => t.max === "bonus"),

  /** Talents that can only be taken once */
  unique: gameData.talents.filter((t) => t.max === 1),

  byBonusCharacteristic(char: string): Talent[] {
    return gameData.talents.filter((t) => t.bonusCharacteristic === char);
  },

  /** Get all available random talents for character creation */
  randomTalentsList(): string[] {
    return gameData.randomTalents.talents;
  },

  /** Pick a random talent from the list */
  rollRandomTalent(): string | undefined {
    const talents = gameData.randomTalents.talents;
    if (talents.length === 0) return undefined;
    const index = Math.floor(Math.random() * talents.length);
    return talents[index];
  },
};

// ── Exports: Trappings (Class Starting Trappings) ─────────────────────────────

export const TrappingData = {
  /** Class starting trappings map by career class */
  classStarting: trappingsData.classStartingTrappings,

  getForClass(careerClass: string): string[] {
    return trappingsData.classStartingTrappings[careerClass as keyof typeof trappingsData.classStartingTrappings] ?? [];
  },
};

// ── Exports: Equipment (Weapons, Armour, General) ────────────────────────────

export const WeaponData = {
  all: gameData.weapons,
  byName: weaponsByName,

  get(name: string): Weapon | undefined {
    return this.byName.get(name);
  },

  byGroup(group: string): Weapon[] {
    return gameData.weapons.filter((w) => w.group === group);
  },

  melee: gameData.weapons.filter((w) => w.reach !== undefined),
  ranged: gameData.weapons.filter((w) => w.range !== undefined),
};

export const ArmourData = {
  all: gameData.armour,
  byName: armourByName,

  get(name: string): Armour | undefined {
    return this.byName.get(name);
  },

  byLocation(location: string): Armour[] {
    return gameData.armour.filter((a) => a.locations.includes(location));
  },
};

export const EquipmentData = {
  all: gameData.equipment,
  byName: equipmentByName,

  get(name: string): EquipmentItem | undefined {
    return this.byName.get(name);
  },

  byCategory(category: string): EquipmentItem[] {
    return gameData.equipment.filter((e) => e.category === category);
  },
};

// ── Combined Search ──────────────────────────────────────────────────────────

export const GameData = {
  species: SpeciesData,
  careers: CareerData,
  skills: SkillData,
  talents: TalentData,
  trappings: TrappingData,
  weapons: WeaponData,
  armour: ArmourData,
  equipment: EquipmentData,
  randomTalents: gameData.randomTalents,

  /**
   * Search across all data types by name (case-insensitive partial match).
   * Useful for global search UIs.
   */
  search(query: string): {
    species: Species[];
    careers: Career[];
    skills: Skill[];
    talents: Talent[];
  } {
    const lower = query.toLowerCase();
    return {
      species: gameData.species.filter((s) => s.name.toLowerCase().includes(lower)),
      careers: gameData.careers.filter((c) => c.name.toLowerCase().includes(lower)),
      skills: gameData.skills.filter((s) => s.name.toLowerCase().includes(lower)),
      talents: gameData.talents.filter((t) => t.name.toLowerCase().includes(lower)),
    };
  },
};

// Default export for convenience
export default GameData;
