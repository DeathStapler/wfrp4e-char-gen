/**
 * Game Data Context Usage Examples
 *
 * This file shows how to use the GameData context for quick access to
 * static WFRP 4e rules data.
 */

import { GameData, SpeciesData, CareerData, SkillData, TalentData } from "@/lib/data/game-data";

// ── Basic Lookups (O(1) access) ──────────────────────────────────────────────

// Get by ID
const human = SpeciesData.get("human");
const soldier = CareerData.get("soldier");
const athletics = SkillData.get("athletics");

// Get by name (case-insensitive)
const accurateShot = TalentData.get("accurate shot"); // Works!
const accurateShot2 = TalentData.get("Accurate Shot"); // Also works!

// ── Bulk Access ───────────────────────────────────────────────────────────────

// All data of a type
const allTalents = TalentData.all;
const allBasicSkills = SkillData.basic;
const allAdvancedSkills = SkillData.advanced;

// ── Filtering ─────────────────────────────────────────────────────────────────

// Careers by class
const warriors = CareerData.byClass("Warrior");
const academics = CareerData.byClass("Academic");

// Careers by starting status tier
const highStatusCareers = CareerData.byStatus("Gold");

// Skills by characteristic
const agilitySkills = SkillData.byCharacteristic("Ag");

// Scalable talents (max = "bonus")
const scalableTalents = TalentData.scalable;

// ── Global Search ─────────────────────────────────────────────────────────────

// Search across all types at once
const results = GameData.search("combat");
// Returns: { species: [...], careers: [...], skills: [...], talents: [...] }

// ── Using in Components ───────────────────────────────────────────────────────

// Example: Career selection dropdown
function getCareerOptions(): { value: string; label: string }[] {
  return CareerData.all.map((career) => ({
    value: career.id,
    label: `${career.name} (${career.careerClass})`,
  }));
}

// Example: Validate talent exists
function isValidTalent(name: string): boolean {
  return TalentData.get(name) !== undefined;
}

// Example: Get talent description for tooltip
function getTalentDescription(name: string): string | undefined {
  return TalentData.get(name)?.description;
}

// ── Migration from JSON Imports ─────────────────────────────────────────────

// Before (scattered JSON imports):
// import talentsData from "@/data/talents.json";
// const talent = talentsData.find(t => t.name === talentName);

// After (centralized with O(1) lookup):
// import { TalentData } from "@/lib/data/game-data";
// const talent = TalentData.get(talentName); // Much faster!
