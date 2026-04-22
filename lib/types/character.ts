/**
 * WFRP 4e Character Sheet Types
 *
 * These types model a living player character — the "character instance" layer.
 * They represent the mutable state of a character as they progress through careers,
 * gain advances, acquire talents, and accumulate experience.
 *
 * Reference the "game rules" layer in lib/types/rules.ts for static data types.
 *
 * Source: Warhammer Fantasy Roleplay 4th Edition Core Rulebook (Cubicle 7, 2018)
 */

import type { CharacteristicKey, StatusStanding } from './rules'
import type { 
  SpeciesChoiceMethod, 
  CareerChoiceMethod, 
  AttributeChoiceMethod 
} from '../rules/creation-xp'

// ── Characteristics ───────────────────────────────────────────────────────────

/**
 * Base characteristic values for all 10 characteristics.
 * Base = species racial bonus + 2d10 rolled at character creation.
 * These values do NOT include career advances and do not change after creation
 * except through magic, aging, or extraordinary circumstances.
 */
export type Characteristics = Record<CharacteristicKey, number>

/**
 * Characteristic advances purchased through career levels.
 *
 * At each career level, listed characteristics may be advanced using XP.
 * Each advance costs 25 × (current advance count + 1) XP.
 * Advances are capped at 99 per characteristic.
 *
 * Total characteristic value = base + advances.
 * Characteristic Bonus = Math.floor(total / 10).
 *
 * Source: WFRP 4e Core Rulebook p.49.
 */
export type CharacteristicAdvances = Record<CharacteristicKey, number>

// ── Skills ────────────────────────────────────────────────────────────────────

/**
 * A skill entry on a character sheet.
 *
 * Links a Skill definition from the rules layer with the character's investment.
 * Skill Total = governing characteristic total + advances.
 * Career skills cost 10 × target advance level XP to advance.
 * Non-career skills cost double (20 × target advance level XP).
 * Maximum advances per skill = 10.
 *
 * Source: WFRP 4e Core Rulebook p.47–48.
 */
export interface CharacterSkill {
  /**
   * References Skill.id from lib/types/rules.ts.
   * E.g., "athletics", "melee-basic".
   */
  skillId: string

  /**
   * For grouped skills, the specific specialisation this entry represents.
   * E.g., "Basic" for Melee (Basic), "Reikspiel" for Language (Reikspiel).
   * Each specialisation of a grouped skill advances independently.
   */
  specialisation?: string

  /**
   * Number of advances purchased in this skill (0–10).
   * Skill total = governing characteristic value + advances.
   */
  advances: number

  /**
   * Whether this skill is currently a career skill for the character.
   * Career skills advance at half the XP cost of non-career skills.
   * This flag updates when the character changes career or career level —
   * a skill that was non-career can become career if a new level lists it.
   */
  isCareerSkill: boolean
}

// ── Talents ───────────────────────────────────────────────────────────────────

/**
 * A talent entry on a character sheet.
 *
 * Talents provide special abilities or bonuses. Most can be taken only once,
 * but some (those with max > 1 or max = "bonus") may be taken multiple times
 * for additional effect.
 *
 * Source: WFRP 4e Core Rulebook p.230.
 */
export interface CharacterTalent {
  /**
   * References Talent.id from lib/types/rules.ts.
   * E.g., "combat-reflexes", "strike-mighty-blow".
   */
  talentId: string

  /**
   * How many times this talent has been taken.
   * For most talents this is 1. For talents with max > 1 or max = "bonus",
   * each additional take provides a further benefit.
   */
  timesTaken: number

  /**
   * Free-text note on where or how this talent was acquired.
   * E.g., "Human starting package", "Soldier Level 1".
   */
  source?: string
}

// ── Trappings & Spells ────────────────────────────────────────────────────────

/**
 * A specific item the character carries, referencing the rules trapping data.
 */
export interface CharacterTrapping {
  /**
   * References Trapping.id from rules data.
   * Null for improvised, custom, or unnamed items.
   */
  trappingId: string | null

  /**
   * Display name for this item.
   * May differ from the rules entry for named items (e.g., "Grandfather's Sword").
   */
  name: string

  /** Number of this item currently carried. */
  quantity: number

  /** Free-text notes (e.g., "slightly damaged", "looted from Chaos cultist"). */
  notes?: string
}

/**
 * A spell known by a character.
 * Applies to characters with the Language (Magick) skill — Wizards and some Priests.
 *
 * Source: WFRP 4e Core Rulebook p.235.
 */
export interface CharacterSpell {
  /** References Spell.id from rules data. */
  spellId: string

  /**
   * Whether the spell is currently memorised.
   * Memorised spells can be cast from memory at any time.
   * Non-memorised spells require the character to have the physical text at hand.
   */
  memorised: boolean
}

// ── Status & Conditions ───────────────────────────────────────────────────────

/**
 * Dynamic combat and condition status for the character.
 *
 * This reflects transient state that changes within a session or encounter.
 */
export interface CharacterStatus {
  /**
   * Current wounds remaining.
   * When wounds reach 0 the character is Seriously Wounded.
   * Negative wounds stack Serious Wounds (SWs). At –TB wounds = dead.
   *
   * Source: WFRP 4e Core Rulebook p.166.
   */
  currentWounds: number

  /**
   * Maximum wound threshold, calculated as: TB + (2 × WPB) + SB.
   * Dwarves add extraWounds from their species entry (+2).
   * Stored here for display convenience; recalculate if characteristics change.
   *
   * Source: WFRP 4e Core Rulebook p.165.
   */
  woundThreshold: number

  /**
   * Current Advantage points.
   * Gained by winning opposed tests in combat. Lost when taking damage or fleeing.
   * Each point of Advantage adds +10 to all tests until lost.
   *
   * Source: WFRP 4e Core Rulebook p.160.
   */
  advantage: number

  /**
   * Active psychological conditions (fear, hatred, frenzy, phobia, etc.).
   * Free-text list of current psychological states affecting the character.
   *
   * Source: WFRP 4e Core Rulebook pp. 190–199.
   */
  psychology: string[]

  /**
   * Active combat and environmental conditions (Ablaze, Blinded, Prone, etc.).
   * Free-text list matching condition names from the rulebook.
   *
   * Source: WFRP 4e Core Rulebook pp. 168–171.
   */
  conditions: string[]
}

// ── Career History ────────────────────────────────────────────────────────────

/**
 * A single entry in the character's career progression history.
 * Records each career the character has entered and how far they progressed.
 *
 * Characters may exit a career after completing any level (not just level 4)
 * but only claim the status of the highest level they completed.
 */
export interface CareerHistoryEntry {
  /** References Career.id from rules data. E.g., "soldier". */
  careerId: string

  /**
   * The highest level the character completed within this career (1–4).
   * "Completing" a level means purchasing all available advances and
   * acquiring the required trappings.
   */
  highestLevelCompleted: 1 | 2 | 3 | 4

  /**
   * The social status standing earned at the highest completed level.
   * This status can be claimed even after the character moves to a new career.
   */
  statusEarned: StatusStanding
}

// ── Experience ────────────────────────────────────────────────────────────────

/**
 * Experience point tracking.
 *
 * XP is the universal currency for advancement. Characteristics, skills, and
 * talents all cost XP. XP total never decreases — only the spent/current split changes.
 *
 * Source: WFRP 4e Core Rulebook p.49.
 */
export interface ExperiencePoints {
  /** Total XP earned over the character's lifetime. Never decremented. */
  total: number

  /** XP already spent on advances, skills, or talents. */
  spent: number

  /**
   * Unspent XP available for purchases. Always equals total − spent.
   * Stored explicitly for display convenience.
   */
  current: number
}

// ── Fate & Resilience ─────────────────────────────────────────────────────────

/**
 * Fate and Luck point tracking.
 *
 * Fate points represent the hand of destiny protecting the character.
 * Spending a Fate point permanently reduces the total (burned Fate cannot
 * be recovered). Luck points refresh each session up to the Remaining Fate value.
 *
 * Remaining Fate = total − burned.
 * Luck refreshes to Remaining Fate at the start of each session.
 *
 * Source: WFRP 4e Core Rulebook p.46.
 */
export interface FatePoints {
  /** Total Fate points at character creation (set by species). */
  total: number

  /**
   * Fate points permanently burned (spent on avoiding certain death).
   * Remaining Fate = total − burned.
   */
  burned: number

  /**
   * Current Luck points available to spend this session.
   * Spending a Luck point allows re-rolling any one test.
   * Resets to Remaining Fate at the start of each session.
   */
  luck: number
}

/**
 * Resilience and Resolve point tracking.
 *
 * Resilience mirrors Fate but governs enduring hardship rather than luck.
 * Spending Resilience permanently reduces the total.
 * Resolve refreshes to Remaining Resilience each session.
 *
 * Source: WFRP 4e Core Rulebook p.46.
 */
export interface ResiliencePoints {
  /** Total Resilience points at character creation (set by species). */
  total: number

  /**
   * Resilience points permanently burned.
   * Remaining Resilience = total − burned.
   */
  burned: number

  /**
   * Current Resolve points available this session.
   * Spending Resolve allows ignoring a Psychology test that would otherwise
   * be forced on the character.
   * Resets to Remaining Resilience at the start of each session.
   */
  resolve: number
}

// ── Corruption & Sin ──────────────────────────────────────────────────────────

/**
 * Chaos corruption and mutation tracking.
 *
 * Characters accumulate corruption points when exposed to Chaos magic, daemons,
 * or performing dark rituals. Reaching a threshold triggers a Dissolution of Self
 * test (WP); failure results in a mutation.
 *
 * Source: WFRP 4e Core Rulebook p.183.
 */
export interface Corruption {
  /**
   * Current corruption taint points.
   * Corruption threshold = TB + WPB.
   * Reaching the threshold forces a Dissolution of Self test.
   */
  taint: number

  /**
   * Mutations the character has acquired, as free-text descriptions.
   * E.g., "Extra Eye (Chaos Star)", "Scaly Skin".
   */
  mutations: string[]
}

// ── Wealth ────────────────────────────────────────────────────────────────────

// Canonical Wealth type lives in lib/rules/wealth.ts (fields: gold, silver, brass).
import type { Wealth } from '../rules/wealth'
export type { Wealth }

// ── Backstory ─────────────────────────────────────────────────────────────────

/**
 * Narrative backstory answers entered during Step 7 (Bringing to Life).
 * All fields are optional — the player may skip any question.
 * Source: WFRP 4e Core Rulebook p.43.
 */
export interface CharacterBackstory {
  whereFrom?: string;
  family?: string;
  childhood?: string;
  whyLeft?: string;
  friends?: string;
  greatestDesire?: string;
  bestMemory?: string;
  worstMemory?: string;
  religion?: string;
  loyalty?: string;
  whyAdventuring?: string;
  motivation?: string;
}

// ── Creation Advances ─────────────────────────────────────────────────────────

/**
 * XP advances spent during Step 8 (Advancement) at character creation.
 * These are added on top of the free advances from Steps 3–4.
 * Source: WFRP 4e Core Rulebook p.43.
 */
export interface CreationAdvances {
  /** Characteristic abbreviation → number of additional advances purchased with XP. */
  characteristics: Record<string, number>;
  /** Skill display name → number of additional advances purchased with XP. */
  skills: Record<string, number>;
  /** Talent names taken with XP (100 XP each). */
  talents: string[];
}

/**
 * Biographical and descriptive information about the character.
 * This is the "who they are" layer — background, appearance, and motivation.
 */
export interface CharacterMetadata {
  /** The character's given name and any titles or epithets. */
  name: string

  /**
   * The player's real name or handle who created / owns this character.
   * Displayed on the sheet and used to group shared characters.
   */
  playerName?: string

  /**
   * References Species.id from rules data.
   * E.g., "human", "dwarf", "halfling".
   */
  speciesId: string

  /** Character age in years. */
  age?: number

  /** Gender and/or pronouns. Free text to accommodate all descriptions. */
  gender?: string

  /** Eye colour description. */
  eyes?: string

  /** Hair colour and style description. */
  hair?: string

  /** Height, e.g. "5'10\"" or "178 cm". */
  height?: string

  /** Weight, e.g. "160 lbs" or "73 kg". */
  weight?: string

  /**
   * Distinguishing marks: scars, tattoos, birthmarks, unusual features.
   * These make the character recognisable and memorable.
   */
  distinctiveMarks?: string

  /**
   * The core drive that motivates the character to adventure and take risks.
   * Used in roleplay and as a criterion for some XP awards.
   * E.g., "Greed", "Vengeance against Chaos", "Protect the innocent".
   */
  motivation?: string

  /**
   * A concrete goal the character wants to achieve in the near future.
   * Shared with the GM; updates as arcs resolve.
   */
  shortTermAmbition?: string

  /**
   * A long-term life goal that drives the character across campaigns.
   */
  longTermAmbition?: string

  /**
   * The whole party's shared ambition, agreed upon by all players.
   * Accomplishing it can yield bonus XP for the group.
   */
  partyAmbition?: string
}

// ── Character (top-level) ─────────────────────────────────────────────────────

/**
 * The complete WFRP 4e character sheet.
 *
 * This is the top-level type for a player character. It assembles all the
 * sub-types into a single document that represents the full state of a character
 * at any point in their adventuring career.
 *
 * Derived values (characteristic totals, bonuses, wound threshold) should be
 * computed at render/use time from the stored base values and advances rather
 * than stored separately, except where noted.
 */
export interface Character {
  /** Unique identifier (UUID or similar stable ID). */
  id: string

  /**
   * ISO 8601 timestamp of when this character was first created and saved.
   * E.g., "2024-03-27T10:00:00.000Z".
   */
  createdAt: string

  /**
   * ISO 8601 timestamp of the most recent save.
   * Updated by saveCharacter() on every write.
   */
  updatedAt: string

  /** Biographical and descriptive information. */
  metadata: CharacterMetadata

  /**
   * How the player chose their species during character creation.
   * Determines bonus XP: 'random' = +20 XP, 'chosen' = +0 XP.
   * Source: WFRP 4e Core Rulebook p.24.
   */
  speciesChoiceMethod: SpeciesChoiceMethod

  /**
   * How the player chose their career during character creation.
   * Determines bonus XP: 'random' = +50 XP, 'rolled3pick1' = +25 XP, 'chosen' = +0 XP.
   * Source: WFRP 4e Core Rulebook p.26.
   */
  careerChoiceMethod: CareerChoiceMethod

  /**
   * How the player assigned attribute values during character creation.
   * Determines bonus XP: 'random-keep' = +50 XP, 'random-rearrange' = +25 XP, 'manual' = +0 XP.
   * Source: WFRP 4e Core Rulebook p.26–27.
   */
  attributeChoiceMethod: AttributeChoiceMethod

  /**
   * Base characteristic values (species racial bonus + 2d10 rolled at creation).
   * These are the immutable starting values. Do NOT modify after character creation
   * except through aging rules or extraordinary narrative events.
   */
  characteristicBases: Characteristics

  /**
   * Characteristic advances purchased through career levels using XP.
   * Total characteristic = characteristicBases[key] + characteristicAdvances[key].
   * Characteristic Bonus = Math.floor(total / 10).
   */
  characteristicAdvances: CharacteristicAdvances

  /**
   * All skills the character has invested advances in, or career skills they
   * are tracking for XP cost purposes.
   */
  skills: CharacterSkill[]

  /** All talents the character has acquired across all career levels. */
  talents: CharacterTalent[]

  /**
   * References Career.id of the character's current career.
   * The current career determines which characteristics/skills are "career" rated.
   */
  currentCareerId: string

  /**
   * The career level (1–4) within the current career.
   * Determines which advances, skills, and talents are available.
   */
  currentCareerLevel: 1 | 2 | 3 | 4

  /**
   * Ordered history of all career levels the character has completed.
   * Most recent entries represent the character's most recent career history.
   * A character may appear in multiple entries for the same career if they
   * left and returned.
   */
  careerHistory: CareerHistoryEntry[]

  /** Experience point totals. */
  experience: ExperiencePoints

  /**
   * Number of Extra Points allocated to Fate at character creation.
   * The species has a pool of extraPoints that can be freely distributed
   * between Fate and Resilience. This field tracks how many went to Fate.
   * The remainder (species.extraPoints - fateExtraPoints) went to Resilience.
   * Range: 0 to species.extraPoints (inclusive).
   */
  fateExtraPoints: number

  /** Fate and Luck point tracking. */
  fate: FatePoints

  /** Resilience and Resolve point tracking. */
  resilience: ResiliencePoints

  /**
   * Sin points accumulated through morally compromised or evil acts.
   * At 0 the character has a clean soul; higher values attract Chaos attention.
   * Source: WFRP 4e Core Rulebook p.183.
   */
  sinPoints: number

  /** Chaos corruption taint and mutations. */
  corruption: Corruption

  /** Current combat and condition status. */
  status: CharacterStatus

  /** Coins and currency. */
  wealth: Wealth

  /** Items and equipment the character carries or owns. */
  trappings: CharacterTrapping[]

  /**
   * Spells known by the character.
   * Non-empty only for Wizards, Hedge Witches, Priests with divine lore, etc.
   */
  spells: CharacterSpell[]

  /** Free-text player notes for anything not covered by the structured schema. */
  notes?: string

  /** Backstory answers from Step 7 (Bringing to Life). */
  backstory?: CharacterBackstory

  /**
   * If this character was originally loaded from a shared link, this stores
   * the share ID so we can detect duplicates when re-saving.
   */
  sourceShareId?: string

  /**
   * The share ID assigned when this character was first shared to the server.
   * Used to prevent creating multiple share links for the same character.
   */
  shareId?: string
}
