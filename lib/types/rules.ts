/**
 * WFRP 4e Rules Reference Data Types
 *
 * These types model the static game data: species, careers, skills, talents, spells,
 * and roll tables. They correspond to the JSON files in /data/ and represent the
 * "game rules" layer — data that does not change per character instance.
 *
 * Source: Warhammer Fantasy Roleplay 4th Edition Core Rulebook (Cubicle 7, 2018)
 */

// ── Characteristics ───────────────────────────────────────────────────────────

/**
 * The 10 core characteristic abbreviations used throughout the WFRP 4e rules.
 * Every character — player or NPC — is defined by these ten values.
 */
export type CharacteristicKey =
  | 'WS'  // Weapon Skill  — governs melee combat attack and defence
  | 'BS'  // Ballistic Skill — governs ranged combat
  | 'S'   // Strength      — physical power; governs melee damage bonus
  | 'T'   // Toughness     — hardiness; governs wound threshold and damage reduction
  | 'I'   // Initiative    — quickness of perception and reaction; governs turn order
  | 'Ag'  // Agility       — speed and coordination
  | 'Dex' // Dexterity     — fine motor skill and manual precision
  | 'Int' // Intelligence  — knowledge and reasoning
  | 'WP'  // Willpower     — mental fortitude; governs magic channelling
  | 'Fel' // Fellowship    — charisma and social aptitude

/**
 * A full set of values for all 10 characteristics.
 * Used both for racial starting bonuses and for full characteristic blocks.
 */
export type CharacteristicProfile = Record<CharacteristicKey, number>

// ── Species ───────────────────────────────────────────────────────────────────

/**
 * A single entry in a species' starting talent list.
 *
 * - `fixed`  — the talent is auto-granted; no player choice required.
 * - `choice` — the player must pick exactly one talent from the options array.
 * - `random` — the player rolls on the Random Talent Table this many times.
 *
 * Source: WFRP 4e Core Rulebook p.35.
 */
export type SpeciesTalentEntry =
  | { type: 'fixed'; talent: string }
  | { type: 'choice'; options: string[] }
  | { type: 'random'; count: number }

/**
 * Creature size categories per WFRP 4e Core Rulebook p.341.
 * Size affects combat hit location, concealment, and movement.
 */
export type SizeCategory =
  | 'Tiny'
  | 'Little'
  | 'Small'
  | 'Average'
  | 'Large'
  | 'Enormous'
  | 'Monstrous'

/**
 * A playable species entry (Human, Dwarf, Halfling, High Elf, Wood Elf, Gnome).
 *
 * Species determines:
 *   - Characteristic starting bonuses (racial base added to 2d10 at char gen)
 *   - Fate, Resilience, and Extra Wounds
 *   - Base movement in yards
 *   - Physical size
 *   - Starting skills and talents all members of the species begin with
 *
 * Source: WFRP 4e Core Rulebook, Chapter 2 (pp. 26–35)
 */
export interface Species {
  /** Unique identifier slug, e.g. "human", "wood-elf". */
  id: string

  /** Display name, e.g. "Human", "Wood Elf". */
  name: string

  /**
   * Racial characteristic starting bonuses.
   * At character creation the player rolls 2d10 for each characteristic
   * and adds the racial bonus to get the starting value.
   * These are NOT advances — they are the fixed starting baseline.
   * E.g., Dwarf WP bonus = 40: player rolls 2d10 and adds 40.
   */
  characteristics: CharacteristicProfile

  /**
   * Number of Fate points the character starts with.
   * Fate represents divine favour. Spending Fate permanently reduces the total
   * but avoids certain death. Humans start with 2; most other species start with 0.
   * Source: WFRP 4e Core Rulebook p.46.
   */
  fate: number

  /**
   * Number of Resilience points the character starts with.
   * Resilience represents inner strength — the will to endure.
   * Spending Resilience permanently reduces the total.
   * Source: WFRP 4e Core Rulebook p.46.
   */
  resilience: number

  /**
   * Extra Points — a pool of points the player can distribute freely
   * between Fate and Resilience at character creation.
   * Humans and Halflings get 3, Dwarves and Elves get 2.
   * Source: WFRP 4e Core Rulebook, Attributes Table p.26.
   */
  extraPoints: number

  /**
   * Bonus wounds added on top of the standard wound formula (TB + 2×WPB + SB).
   * Dwarves receive +2 extra wounds from their natural hardiness.
   * Most species have 0 here.
   */
  extraWounds: number

  /**
   * Base movement allowance in yards per round.
   * Half Move = Movement; Full Move = 2×Movement; Charge = 3×Movement;
   * Run = 4×Movement.
   * Source: WFRP 4e Core Rulebook p.167.
   */
  movement: number

  /** Physical size category. Affects combat, hiding, and detection. */
  size: SizeCategory

  /**
   * Skill names all characters of this species automatically start with.
   * These are in addition to any skills rolled on the species random tables.
   * E.g., Humans begin with Language (Reikspiel).
   */
  startingSkills: string[]

  /**
   * Talent entries all characters of this species automatically start with.
   * Each entry is either a fixed grant, a player choice, or a random roll.
   * Source: WFRP 4e Core Rulebook p.35.
   */
  startingTalents: SpeciesTalentEntry[]

  /** Optional flavour description of the species and its place in the Old World. */
  description?: string

  /** Physical appearance roll tables for this species. */
  appearance?: SpeciesAppearance
}

// ── Appearance Roll Tables ─────────────────────────────────────────────────────

/**
 * A single entry in a 2d10 appearance roll table.
 * Covers a contiguous range of results (min–max inclusive).
 *
 * Source: WFRP 4e Core Rulebook, Chapter 2 (pp. 26–35)
 */
export interface AppearanceRollEntry {
  /** Minimum 2d10 result (inclusive). Range: 2–20. */
  min: number
  /** Maximum 2d10 result (inclusive). Range: 2–20. */
  max: number
  /** The appearance result string for this range. */
  result: string
}

/**
 * Age roll formula for a species.
 * Final age = base + rollNd10(diceCount) years.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 2 (pp. 26–35)
 */
export interface AgeFormula {
  /** Base age in years (added to dice result). */
  base: number
  /** Number of d10s to roll. */
  diceCount: number
  /** Die size — always 10 for WFRP age tables. */
  diceSize: number
}

/**
 * Height roll formula for a species.
 * Final height in inches = baseInches + rollNd10(diceCount).
 *
 * Source: WFRP 4e Core Rulebook, Chapter 2 (pp. 26–35)
 */
export interface HeightFormula {
  /** Base height in inches (added to dice result). */
  baseInches: number
  /** Number of d10s to roll. */
  diceCount: number
  /** Die size — always 10 for WFRP height tables. */
  diceSize: number
}

/**
 * Full physical appearance data for a species, including age, height,
 * eye colour, and hair colour roll tables.
 *
 * Eye and hair colour use 2d10 tables (results 2–20).
 * Elves may roll twice for eye/hair colour due to their magical nature.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 2 (pp. 26–35)
 */
export interface SpeciesAppearance {
  /** Age generation formula. */
  age: AgeFormula
  /** Height generation formula (result in total inches). */
  height: HeightFormula
  /** Eye colour 2d10 roll table. */
  eyeColour: AppearanceRollEntry[]
  /** Hair colour 2d10 roll table. */
  hairColour: AppearanceRollEntry[]
  /** When true, roll eye colour twice and combine (Elves only). */
  canRollEyeTwice?: boolean
  /** When true, roll hair colour twice and combine (Elves only). */
  canRollHairTwice?: boolean
}

// ── Careers ───────────────────────────────────────────────────────────────────

/**
 * Career classes group all careers into broad social and professional categories.
 * They indicate the character's place in Old World society.
 * Source: WFRP 4e Core Rulebook p.56.
 */
export type CareerClass =
  | 'Academic'
  | 'Burghers'
  | 'Courtier'
  | 'Entertainer'
  | 'Guilder'
  | 'Hunter'
  | 'Peasant'
  | 'Ranger'
  | 'Riverfolk'
  | 'Rogue'
  | 'Scholar'
  | 'Warrior'

/**
 * The three social status metal tiers in WFRP 4e.
 * Gold > Silver > Brass in terms of social standing.
 * Source: WFRP 4e Core Rulebook p.53.
 */
export type StatusTier = 'Gold' | 'Silver' | 'Brass'

/**
 * Social status earned at a career level.
 * E.g., { tier: 'Silver', standing: 2 } = "Silver 2".
 * Status affects social interactions, lifestyle costs, and certain talent access.
 */
export interface StatusStanding {
  /** The metal tier (Gold > Silver > Brass). */
  tier: StatusTier
  /**
   * The numeric standing within the tier (1–5).
   * Higher standing = more social influence within the tier.
   */
  standing: number
}

/**
 * A skill entry within a career level's skill list.
 *
 * Career levels list up to 10 skills the character may advance at reduced XP cost.
 * Some entries allow a free choice of specialisation ("Melee (any)") or offer
 * a choice between two different skills.
 */
export interface CareerSkillEntry {
  /**
   * The base skill name as it appears in the rulebook, e.g. "Melee", "Ranged",
   * "Athletics". For grouped skills this is the root without specialisation.
   */
  skill: string

  /**
   * Specific specialisation for grouped skills, e.g. "Basic" for "Melee (Basic)".
   * Omit for non-grouped skills like "Athletics" or "Dodge".
   */
  specialisation?: string

  /**
   * When true, the character may choose any valid specialisation for this grouped
   * skill. E.g., "Melee (any)" allows the player to pick any Melee specialisation.
   * Mutually exclusive with `specialisation`.
   */
  anySpecialisation?: boolean

  /**
   * Groups this entry into a mutually exclusive choice set.
   * All entries sharing the same `choiceGroup` string are alternatives;
   * the character picks ONE. E.g., "Combat Reflexes OR Combat Master" would
   * share choiceGroup "A".
   */
  choiceGroup?: string
}

/**
 * A talent entry within a career level's talent list.
 * Career levels list up to 6 talents the character may acquire.
 * Some entries are mutually exclusive choices.
 */
export interface CareerTalentEntry {
  /** The talent name as it appears in the rulebook, e.g. "Combat Reflexes". */
  talent: string

  /**
   * Groups this talent into a mutually exclusive choice set.
   * All entries sharing the same `choiceGroup` string are alternatives;
   * the character picks ONE.
   */
  choiceGroup?: string
}

/**
 * One of the four levels within a career.
 *
 * Each level unlocks a title, a set of characteristics and skills that can be
 * advanced at career rates, up to 6 talents, a social status, and trappings
 * the character is expected to own.
 *
 * A character must purchase ALL advances available in a level (or at least all
 * characteristics and skills to the required number) before advancing to the
 * next level within the same career.
 *
 * Source: WFRP 4e Core Rulebook p.58.
 */
export interface CareerLevel {
  /** Career level number: 1 = entry-level, 4 = master of the career. */
  level: 1 | 2 | 3 | 4

  /** The title awarded at this level, e.g. "Recruit", "Veteran", "Sergeant". */
  title: string

  /**
   * Social status earned at this career level.
   * This is the standing the character can legitimately claim when practising
   * their career.
   */
  status: StatusStanding

  /**
   * Characteristics the character may advance as career characteristics at
   * this level. Only listed characteristics benefit from the reduced XP rate
   * (25 XP per advance vs. the higher non-career rate).
   *
   * Source: WFRP 4e Core Rulebook p.49.
   */
  characteristics: CharacteristicKey[]

  /**
   * Skills available to advance as career skills at this level (up to 10).
   * Career skill advances cost 10 × target advance level XP;
   * non-career skills cost double.
   *
   * Source: WFRP 4e Core Rulebook p.48.
   */
  skills: CareerSkillEntry[]

  /**
   * Talents available for acquisition at this level (up to 6).
   * Talents may be mandatory or presented as choices (via choiceGroup).
   */
  talents: CareerTalentEntry[]

  /**
   * Equipment the character is expected to possess at this career level.
   * Trappings define the character's social credibility in the career.
   * They are not strictly required but validate the character's status.
   */
  trappings: string[]
}

/**
 * A full career definition.
 *
 * Careers define a character's social role, advancement path, and professional
 * identity. Every character is in a career at all times. Each career has exactly
 * 4 levels with escalating social standing and available advances.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 3 (pp. 54–155).
 */
export interface Career {
  /** Unique identifier slug, e.g. "soldier", "physician", "rat-catcher". */
  id: string

  /** Display name of the career, e.g. "Soldier". */
  name: string

  /**
   * The career class determines the character's broad social grouping.
   * At character creation, species and class determine starting career options.
   */
  careerClass: CareerClass

  /**
   * The four career levels, in order from 1 (Recruit/Apprentice) to 4 (Master).
   * Must always contain exactly 4 levels.
   */
  levels: CareerLevel[]

  /**
   * Names of other careers this career can transition into after reaching
   * an appropriate level. These are suggestions from the rulebook, not hard locks.
   */
  careerExits?: string[]

  /** Flavour description of the career and its role in the Empire. */
  description?: string
}

// ── Skills ────────────────────────────────────────────────────────────────────

/**
 * A skill definition from the WFRP 4e rules.
 *
 * Skills are practical abilities linked to a governing characteristic.
 * Skill Total = governing characteristic value + skill advances.
 * Basic skills can be used untrained (at characteristic value with no advances).
 * Advanced skills cannot be used without at least 1 advance.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 4 (pp. 156–228).
 */
export interface Skill {
  /** Unique identifier slug, e.g. "athletics", "melee-basic". */
  id: string

  /**
   * Display name including specialisation if applicable,
   * e.g. "Athletics", "Melee (Basic)", "Language (Reikspiel)".
   */
  name: string

  /**
   * The characteristic this skill tests against.
   * Skill total = this characteristic's current value + advances in the skill.
   */
  characteristic: CharacteristicKey

  /**
   * Whether this is a grouped skill that requires a specialisation to use.
   * Grouped skills are purchased per specialisation; each specialisation
   * advances independently. E.g., Melee is grouped — a character must have
   * "Melee (Basic)", "Melee (Brawling)", etc. as separate skill entries.
   */
  grouped: boolean

  /**
   * The specialisation this entry represents, if the skill is grouped.
   * E.g., "Basic" for "Melee (Basic)".
   */
  specialisation?: string

  /**
   * Whether this is an Advanced skill.
   * Advanced skills may not be used untrained — the character must have at least
   * 1 advance to attempt the test. Basic skills default to the raw characteristic.
   *
   * Source: WFRP 4e Core Rulebook p.157.
   */
  advanced: boolean

  /** Full rules text description of the skill and its uses. */
  description?: string
}

// ── Talents ───────────────────────────────────────────────────────────────────

/**
 * A talent definition from the WFRP 4e rules.
 *
 * Talents are special abilities, knacks, or trained techniques that provide
 * bonuses or unlock new actions. Most are acquired through careers, though some
 * come from species starting packages.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 5 (pp. 229–272).
 */
export interface Talent {
  /** Unique identifier slug, e.g. "combat-reflexes", "strike-mighty-blow". */
  id: string

  /** Display name, e.g. "Combat Reflexes", "Strike Mighty Blow". */
  name: string

  /**
   * Maximum number of times this talent can be taken.
   * A number = fixed cap (e.g., 1 means only once).
   * "bonus" = the cap equals the character's bonus for bonusCharacteristic
   * (e.g., Marksman max = BSB, so a character with BS 45 can take it up to 4 times).
   *
   * Source: WFRP 4e Core Rulebook p.230.
   */
  max: number | 'bonus'

  /**
   * When max === "bonus", this characteristic's bonus determines the cap.
   * E.g., for Marksman this would be "BS".
   */
  bonusCharacteristic?: CharacteristicKey

  /**
   * Tests or actions this talent applies to or modifies.
   * Short descriptor, e.g. "Melee tests" or "Ranged tests".
   */
  tests?: string

  /** Full rules text describing the talent's mechanical effect. */
  description?: string

  /** Permanent characteristic bonus granted by this talent (does not count as Advances). */
  characteristicBonus?: { characteristic: CharacteristicKey; value: number }
}

// ── Trappings ─────────────────────────────────────────────────────────────────

/**
 * Broad equipment categories for organising and filtering trappings.
 */
export type TrappingCategory =
  | 'weapon'
  | 'armour'
  | 'clothing'
  | 'tool'
  | 'trade-tool'
  | 'misc'

/**
 * A trapping (equipment item) entry from the rulebook.
 *
 * Trappings define items characters can carry. They have Encumbrance values
 * and may carry qualities or flaws that modify how they function in play.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 9 (pp. 275–311).
 */
export interface Trapping {
  /** Unique identifier slug, e.g. "hand-weapon", "leather-jack". */
  id: string

  /** Display name, e.g. "Hand Weapon", "Leather Jack". */
  name: string

  /**
   * Encumbrance value. A character can carry SB + 10 Encumbrance before
   * suffering Fatigued conditions.
   * Source: WFRP 4e Core Rulebook p.277.
   */
  encumbrance: number

  /**
   * Item qualities and flaws as rulebook keywords, e.g. ["Precise 1", "Slow"].
   * These provide mechanical modifiers described in the trappings chapter.
   */
  qualities?: string[]

  /** Broad category for display filtering and UI organisation. */
  category: TrappingCategory

  /** Optional flavour or rules description. */
  description?: string
}

// ── Spells ────────────────────────────────────────────────────────────────────

/**
 * A spell from one of the Lores of Magic.
 *
 * Spells are cast by Wizards (and some Priests) using Channelling tests.
 * The Casting Number (CN) is the target for the Language (Magick) test.
 *
 * Source: WFRP 4e Core Rulebook, Chapter 7 (pp. 234–261).
 */
export interface Spell {
  /** Unique identifier slug, e.g. "dart", "fireball". */
  id: string

  /** Display name, e.g. "Dart", "Fireball". */
  name: string

  /**
   * Casting Number — the minimum SL required to cast this spell successfully.
   * The caster must accumulate CN SL on their extended Channelling/Language (Magick)
   * test. Higher CN = rarer and more powerful spell.
   */
  cn: number

  /**
   * Maximum range at which the spell can be cast.
   * E.g., "48 yards", "Touch", "You", "Willpower Bonus yards".
   */
  range: string

  /**
   * What the spell affects.
   * E.g., "1 Target", "AoE (WPB yards)", "You".
   */
  target: string

  /**
   * How long the spell effect lasts.
   * E.g., "Instant", "1 Round/SL", "WPB minutes".
   */
  duration: string

  /** Full rules text describing the spell's mechanical effect. */
  effect: string

  /**
   * The Lore (school of magic) this spell belongs to.
   * E.g., "Lore of Fire", "Lore of Beasts", "Arcane".
   */
  lore?: string
}

// ── Equipment ─────────────────────────────────────────────────────────────────

/**
 * Weapon availability tiers.
 * Source: WFRP 4e Core Rulebook, Chapter 9 (p.292).
 */
export type AvailabilityTier = 'Common' | 'Scarce' | 'Rare' | 'Exotic'

/**
 * Melee weapon reach categories defining the effective engagement distance.
 * Source: WFRP 4e Core Rulebook p.295.
 */
export type WeaponReach = 'Very Short' | 'Short' | 'Average' | 'Long' | 'Very Long' | 'Massive'

/**
 * A weapon entry from the WFRP 4e equipment tables.
 *
 * Melee weapons have a `reach` field; ranged weapons have a `range` field.
 * Qualities and flaws are stored as separate arrays of keyword strings.
 *
 * Source: WFRP 4e Core Rulebook pp. 293–299, data/weapons.json.
 */
export interface Weapon {
  /** Display name, e.g. "Hand Weapon", "Repeater Pistol". */
  name: string

  /**
   * Item price in Old World currency notation.
   * E.g., "1GC" (gold crown), "12/–" (shillings), "3d" (brass pennies), "2/6" (mixed).
   */
  price: string

  /** Encumbrance value. Carried items' total Enc must not exceed SB+10. */
  enc: number

  /** Market availability category. Determines whether the item can be purchased. */
  availability: string

  /**
   * Melee reach category — how far the weapon extends in combat.
   * Present only for melee weapons; omit for ranged weapons.
   */
  reach?: string

  /**
   * Ranged weapon effective range in yards.
   * Present only for ranged weapons; omit for melee weapons.
   */
  range?: string

  /**
   * Damage formula relative to the wielder's Strength Bonus (SB).
   * E.g., "+SB+4" means Damage = SB + 4. "+9" is a flat value.
   */
  damage: string

  /**
   * Item quality keywords that provide mechanical benefits.
   * E.g., ["Fast", "Precise 1", "Penetrating"]. Empty array if none.
   */
  qualities: string[]

  /**
   * Item flaw keywords that impose mechanical penalties.
   * E.g., ["Tiring", "Slow"]. Empty array if none.
   */
  flaws: string[]

  /**
   * Weapon group (skill specialisation used to wield it).
   * E.g., "Basic", "Cavalry", "Fencing", "Blackpowder", "Bow".
   */
  group: string
}

/**
 * An armour piece entry from the WFRP 4e equipment tables.
 *
 * Armour protects one or more body locations and provides an Armour Points (AP)
 * value that reduces incoming damage.
 *
 * Source: WFRP 4e Core Rulebook pp. 299–301, data/armour.json.
 */
export interface Armour {
  /** Display name, e.g. "Leather Jack", "Full Plate Armour". */
  name: string

  /** Item price in Old World currency notation. */
  price: string

  /** Encumbrance value. */
  enc: number

  /** Market availability category. */
  availability: string

  /**
   * Test penalty imposed by wearing this armour, if any.
   * E.g., "–10 Stealth". Omit if no penalty.
   */
  penalty?: string

  /**
   * Body locations protected by this armour piece.
   * E.g., ["Arms", "Body"], ["Head"], ["Legs", "Body", "Arms"].
   */
  locations: string[]

  /** Armour Points value — reduces incoming damage at covered locations. */
  ap: number

  /** Item quality keywords. E.g., ["Flexible"]. Empty array if none. */
  qualities: string[]

  /** Item flaw keywords. E.g., ["Weakpoints 1"]. Empty array if none. */
  flaws: string[]
}

/**
 * A general equipment item entry from the WFRP 4e trappings lists.
 *
 * Covers all non-weapon, non-armour items: containers, clothing, food, tools,
 * books, animals, drugs, herbs, prosthetics, and miscellaneous trappings.
 *
 * Source: WFRP 4e Core Rulebook pp. 301–311, data/equipment.json.
 */
export interface EquipmentItem {
  /** Display name, e.g. "Backpack", "Lantern". */
  name: string

  /** Item price in Old World currency notation. */
  price: string

  /** Encumbrance value. Use 0 for items with negligible or unspecified weight. */
  enc: number

  /** Market availability category. */
  availability: string

  /**
   * Equipment category / trapping list section.
   * E.g., "Containers", "Clothing", "Food & Drink", "Tools", "Books",
   * "Trade Tools", "Animals", "Drugs & Poisons", "Herbs", "Prosthetics",
   * "Miscellaneous", "Hirelings".
   */
  category: string

  /** Brief rules or flavour description if present in the source document. */
  description?: string
}

// ── Roll Tables ───────────────────────────────────────────────────────────────

/**
 * A single row in a species random roll table.
 * Rows define what a character receives when they roll within a given d100 range.
 */
export interface RollTableRow {
  /** The low end of the d100 roll range (inclusive, 1–100). */
  rollMin: number

  /** The high end of the d100 roll range (inclusive, 1–100). */
  rollMax: number

  /**
   * The result(s) granted at this roll range.
   * A single string for one item; an array when the roll grants multiple items.
   */
  result: string | string[]
}

/**
 * A random roll table used at character creation for species starting packages.
 *
 * WFRP 4e uses d100 tables to randomise starting skills, talents, and trappings
 * by species. Characters roll once per table and receive the indicated result.
 *
 * Source: WFRP 4e Core Rulebook pp. 26–35.
 */
export interface RollTable {
  /** The species this table applies to (references Species.id). */
  speciesId: string

  /** What the table grants on a roll. */
  tableType: 'skill' | 'talent' | 'trapping'

  /** The rows of the table, sorted ascending by rollMin. */
  rows: RollTableRow[]
}
