# Project Context

- **Owner:** Death_Stapler
- **Project:** Warhammer Fantasy Roleplay 4e Character Generator and repository
- **Stack:** Next.js 15 + TypeScript + Tailwind CSS v4
- **Created:** 2026-03-26

## Recent Work

📌 Team update (20260327T223814Z): Wizard restructured to 8-step flow. Added rule validators for species/career skill allocation + character advancement options. Creation XP tracking via choice methods (random/chosen/rolled) integrated. Wealth field names unified to canonical `gold/silver/brass`. — Bullock, Jane, Cochran

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### Skills data population (137 entries)

- **137 skills written** to `data/skills.json` covering the full WFRP 4e skills chapter.
- Breakdown: 20 basic non-grouped, 27 basic grouped, 10 advanced non-grouped, 80 advanced grouped.
- Edge cases flagged:
  - `Language (Thieves' Tongue)`: apostrophe preserved in name; id = `language-thieves-tongue`
  - `Language (Elthárin)`: accent preserved in name/specialisation; id = `language-eltharin`
  - `Channelling` is described in the doc as both grouped (with Wind of Magic specialisations) and ungrouped (for untrained magic users). Decision: only the grouped specialisations are modelled as separate entries; no bare "Channelling" entry was added. See decisions inbox for rationale.
  - `Language (Guilder)` appears in the specialisations list but not in the detailed language table. Included, as it is listed as an official specialisation.
  - `Sail (Ag*)` — the asterisk in the source doc is a PDF extraction artefact; characteristic confirmed as Ag.
  - `Melee (Pole-Arm)` — hyphen preserved in specialisation name and reflected in the id.

### 2026-03-26 (session 2): talents.json populated

- **167 talents written** from `docs/talents.md`, covering the complete WFRP 4e core rulebook talent list.
- **Edge case — "Max: None"**: Criminal, Magnum Opus, and Wealthy list "Max: None" (unlimited). The `Talent.max` type only supports `number | 'bonus'`. Used `99` as sentinel value; decisions/inbox file written.
- **Edge case — Chaos Magic max**: "Number of Spells available in chosen Chaos Magic Lore" does not map to the type. Used `99` as sentinel; documented in decisions inbox.
- **Grouped talents** (Acute Sense, Arcane Magic, Bless, Chaos Magic, Craftsman, Etiquette, Fearless, Hatred, Invoke, Master Tradesman, Resistance, Savant, Strider): one entry each with the group name. No `grouped` field on the Talent type — described as grouped in the `description` field. Examples from docs included.
- **`bonusCharacteristic`** omitted on all fixed-number and 99-sentinel entries; present on all `"bonus"` entries.
- **TypeScript check**: `npx tsc --noEmit` passes with zero errors.

### 2026-03-26: Type architecture for WFRP 4e rules layer

- **Two-layer type design**: `lib/types/rules.ts` is the static "game data" layer (Species, Career, Skill, Talent, Trapping, Spell, RollTable) — these types mirror the JSON files in `/data/`. `lib/types/character.ts` is the mutable "character instance" layer (Character, CharacterSkill, CharacterTalent, etc.) — these represent a player's sheet at runtime.
- **CharacteristicKey union type**: The 10 characteristics (WS, BS, S, T, I, Ag, Dex, Int, WP, Fel) are modelled as a string union used as `Record<CharacteristicKey, number>` for both `Characteristics` (base values) and `CharacteristicAdvances` (purchased advances). Total = base + advances; Bonus = floor(total / 10).
- **CareerLevel.characteristics is `CharacteristicKey[]`**: WFRP 4e career levels list which characteristics can be advanced — there is no per-characteristic-per-level advance cap in the rules. Using a flat array is more accurate than a `Record<Key, number>` max-advances map.
- **CareerSkillEntry choiceGroup pattern**: Career levels offer skill and talent choices (e.g., "Melee (any)", "Combat Reflexes OR Combat Master"). Modelled with `anySpecialisation?: boolean` for open-ended specialisation choices and `choiceGroup?: string` for mutually exclusive choice sets. All entries sharing a choiceGroup ID are alternatives.
- **Fate vs Luck / Resilience vs Resolve**: Fate total and burned are tracked separately. Remaining Fate = total − burned. Luck refreshes to Remaining Fate each session. Same pattern for Resilience/Resolve. This matches the WFRP 4e two-tier spend mechanic (p.46).
- **Wound threshold stored + computed**: `CharacterStatus.woundThreshold` stores the calculated max wounds for display convenience. It must be recalculated whenever characteristics change. The formula (TB + 2×WPB + SB) is implemented in `lib/rules/characteristics.ts:getWoundThreshold()`.
- **Rules engine implementations**: Implemented `lib/rules/characteristics.ts` and `lib/rules/skills.ts` stubs to satisfy existing test imports. All formulas derived from the existing test specs in `lib/rules/__tests__/`.

### 2026-03-26: Species data — all 5 core species populated

- **Five species populated**: Human, Dwarf, Halfling, High Elf, Wood Elf. All data sourced from `docs/rulebook.md` (Character Creation chapter, pp. 24–35).
- **Characteristics from the Attributes Table** (rulebook.md lines 405–421): Human all-20, Dwarf WS/T/Dex/WP elevated (30/30/30/40), Dwarf Ag/Fel lowered (10/10). Halfling WS/S low (10/10), BS/Dex/WP/Fel strong (30/30/30/30). Both Elf species share the same profile: I 40, BS/WS/Ag/Dex/Int/WP all 30, S/T/Fel 20. No separate column for High Elf vs Wood Elf in the rulebook table — they share identical characteristic bonuses.
- **Dwarf extraWounds: 2**: The `extraWounds` field comment in `rules.ts` explicitly documents Dwarfs receiving +2 extra wounds from natural hardiness. Set accordingly. Note: the Attributes Table does NOT show a separate "+2" row — this is a design rule captured by the type-level documentation.
- **Halfling wounds formula**: Halflings use `(2 × TB) + WPB` (no SB), not the standard `SB + (2 × TB) + WPB`. This is handled by the `Small` talent in `startingTalents`, not via a negative `extraWounds` value.
- **startingSkills is the full species skill pool**: Each species lists 12 skills in the rulebook to choose from (3×5 advances + 3×3 advances). These are stored in `startingSkills` since the Species type has no separate `skillPool` field. This overloads the "automatically start with" semantics somewhat but is the most useful representation for a character generator.
- **startingTalents excludes random talents**: Human lists "3 Random Talents" and Halfling lists "2 Random Talents" — these are intentionally omitted from `startingTalents` since they belong in a separate `RollTable` data entry (type `'talent'`). Fixed talent choices (e.g., "Savvy or Suave") are stored as a single "X or Y" string per the existing Human pattern.
- **Gnome**: Not present in the core rulebook (`docs/rulebook.md` or `docs/rulebook2.md`). Gnome appears in supplementary material only. Not added.
- **Halfling Stealth**: The rulebook lists "Stealth" (no specialisation) for Halflings. Stored as `"Stealth"` — the specialisation (Urban/Rural) is a player choice at character creation.
- **Extra Points (Fate/Resilience distribution)**: The Attributes Table has an "Extra Points" row (Human 3, Dwarf 2, Halfling 3, Elf 2) representing points freely allocated between Fate and Resilience at char-gen. The `Species` type has no `extraPoints` field. Base Fate and Resilience values (the table rows) are stored as-is; Extra Points allocation is a runtime character-creation concern not captured in this data layer.

### 2026-03-27: careers.json populated — 63 careers across 8 classes

- **63 careers written** to `data/careers.json` covering all careers in `docs/careers.md`.
- Breakdown by class: Academic (8), Burghers (8), Courtier (8), Peasant (8), Ranger (7), Riverfolk (8), Rogue (8), Warrior (8).
- The source file `docs/careers.md` is 5793 lines (not 2911 as initially measured — measurement artefact). Populated in two passes.
- **Edge cases and decisions:**
  - **WIZARD, WRECKER, RACKETEER, KNIGHT** careers use bold-only headers (`**CAREER**`) in the markdown rather than `## CAREER` headers — identified via targeted search and included.
  - **Ranger class has 7 careers** (not 8): Coachman, Entertainer, Flagellant, Messenger, Pedlar, Road Warden, Witch Hunter. The document does not list an 8th Ranger career.
  - **Advance scheme tables garbled in PDF extraction**: The WS/BS/S/T/I/Ag/Dex/Int/WP/Fel table format is lost in markdown. Characteristics were inferred from `h` mark positions and class-typical patterns (Warrior: WS/S/T; Ranger/Hunter: BS/I/Ag; Academic: Int/WP/Fel; Rogue: Ag/I/WP).
  - **"Agi" in doc → "Ag" in schema**: The document uses "Agi" as the column header for Agility; the CareerClass type uses "Ag". Normalized throughout.
  - **Lore (Local)** and similar open-ended specialisations (e.g., Lore (Any), Language (Any), Trade (Any)) mapped to `anySpecialisation: true` per the established CareerSkillEntry pattern.
  - **choiceGroup** applied for "X or Y" skill/talent choices within a level; letters A/B/C assigned sequentially per level.
  - **careerExits** included where listed in the document; omitted where not present.
  - **Characteristics are cumulative per level**: level 4 lists all characteristics available at that career (not just new additions). Each level adds one characteristic from the previous level.
  - **Status standing 0**: Brass 0 is technically valid per the rules (character hasn't met spending requirements). No careers in the document have standing 0 as a career-level status.
  - **`npx tsc --noEmit` passes** with zero errors on the complete 63-career dataset.

### 2026-03-27: Rules engine — `lib/rules/careers.ts` and `lib/rules/wounds.ts` implemented

#### `lib/rules/careers.ts`

- **`getXpCostForCareerCharacteristic`**: `25 × (currentAdvances + 1)`. Straightforward; note only characteristics _listed at the current career level_ may be advanced this way — non-career characteristics cannot be advanced at all (rule from p.49).
- **`getXpCostForCareerSkill`**: `10 × (currentAdvances + 1)`. Same formula as `skills.ts:getSkillXpCost(n, true)` — exported separately here for career-scoped call sites.
- **`getXpCostForNonCareerSkill`**: `10 × (currentAdvances + 1) × 2`. Double the career rate; identical result to `skills.ts:getSkillXpCost(n, false)`.
- **`getXpCostForTalent`**: **100 XP flat, always.** This was clarified in the task: WFRP 4e has no "free first talent". That was a WFRP 2e mechanic. The `timesTaken` parameter is accepted for signature completeness (future call sites may want to enforce per-talent max validation) but does not affect the cost. Source: p.49.
- **`isCareerSkill`**: Uses a `nameToId` slug-normaliser (lowercases, strips `()'"`, collapses spaces to hyphens) to compare the provided display name against each `CareerSkillEntry`. Entries with `anySpecialisation: true` match on root slug prefix; entries with a specific `specialisation` require an exact full-slug match.
  - **Edge case flagged**: `anySpecialisation` prefix matching could produce false positives if two root skill names share a prefix (e.g. a hypothetical "Lore" vs "Lore (Local)"). No such collision exists in the current `data/careers.json` data but callers should be aware.
- **`canAdvanceCareerLevel`**: Three-gate check — characteristics ≥ 1 advance, career skills ≥ 5 advances, ≥ 1 talent taken. Skill matching reuses the same slug-normaliser approach as `isCareerSkill`. Talent matching converts `CareerTalentEntry.talent` names to slugs and compares against `CharacterTalent.talentId`.
  - **Design decision**: "Advance all characteristics" is interpreted as "at least 1 advance in each listed characteristic" — the rule only requires _some_ investment, not exhausting all possible advances.
- **`getTotalXpForCareerLevel`**: Minimum-cost projection. Characteristics: 25 XP × count (1 advance each). Skills: 150 XP × count (sum of `10×1 + … + 10×5`). Talent: 100 XP flat. Documented that additional characteristic advances beyond the 1-advance minimum are NOT included.

#### `lib/rules/wounds.ts`

- **`getWoundThreshold`**: Standard `TB + (2×WPB) + SB` with flat parameters (not the object form used in `characteristics.ts`). Delegates to `getCharacteristicBonus` from that module to avoid duplicating bonus logic.
- **`getHalflingWoundThreshold`**: `TB + (2×WPB)` — omits SB. This is the Small size trait effect. Source: p.340.
- **`getDwarfWoundThreshold`**: **Same formula as standard**. The Dwarf +2 extra wounds is from the Resolute species talent, tracked via `Species.extraWounds`, and must be added by the caller. The wound formula itself does not differ for Dwarves. This is documented prominently in JSDoc with a `⚠️` note so callers do not forget to add `extraWounds`.
  - **Rules edge case flagged**: Several online discussions conflate the "Dwarf tough" flavour with a modified wound formula. The corebook (p.165, p.340) does not give Dwarves a different formula — the extra wounds come from species trait application. Cochran should verify.
- **`getCurrentWounds`**: `max(0, maxWounds − damageTaken)`. Floored at 0; overflow tracked separately.
- **`isSeriouslyWounded`**: Returns `currentWounds <= 0`. Uses `<=` not `=== 0` defensively, as corrupted state could produce a negative current wounds value.
- **`getCriticalWoundMagnitude`**: Returns `max(0, damage − currentWounds)`. Works correctly whether the character is already at 0 wounds or still has wounds remaining (overflow past 0 is the magnitude). Example in JSDoc covers both cases.

#### TypeScript verification

- `npx tsc --noEmit` produces zero errors in the rules files.
- One pre-existing error remains in `app/character/new/page.tsx` (missing `onNext` prop on `SpeciesSelection`) — unrelated to this session's work.

### 2026-03-27: Team Update from Jane — Wizard Steps 4–6 Complete (Session 2026-03-27)

📌 **Character creation wizard extended to 6 steps** — Jane completed Steps 4 (Skills & Talents), 5 (Trappings Review), and 6 (Character Details). Skills matched from `CareerSkillEntry` to `Skill` data for characteristic lookup. Live XP counter on Step 4 (awaiting your `getStartingXP()` for enforcement). Notes stored separately from `CharacterMetadata` at top-level `Character`. Step 5 now shows trappings via your data/trappings.json. Step 6 collects final details. Wizard operational end-to-end, `tsc --noEmit` clean. Next: XP budget enforcement, species auto-skills merge.


- **Bug**: The previous implementation required only 1 advance per characteristic (not `level × 5`) and required ALL career skills to have ≥5 advances (not just 8).
- **Fix**: `canAdvanceCareerLevel` now derives `required = careerLevel.level * 5` (Level 1 → 5, Level 2 → 10, Level 3 → 15, Level 4 → 20). ALL career characteristics must meet that threshold; at least 8 of the career level's skills must meet it. The talent gate is unchanged (≥1 talent from the level required).
- **`missing` messages updated**: Characteristics now report per-stat deficit ("WS needs 3 more advances (has 2, needs 5)"); skills now report aggregate shortfall ("Need 3 more skills at 5+ advances (5/8 required met)"); talent message unchanged.
- **Function signature unchanged**: `CareerLevel.level: 1 | 2 | 3 | 4` already present in the type — no new parameter needed.
- **Prior career advances count**: The function always used `character.characteristicAdvances[key]` (total advances), which is correct per the rules clarification.
- **Verification**: `npx tsc --noEmit` passes with zero errors. Cochran notified via decisions inbox.

### 2026-03-27: Bug fixes — `getXpCostForCareerSkill` and `getXpCostForNonCareerSkill` max-advances guard

- **Bug**: Both `getXpCostForCareerSkill` and `getXpCostForNonCareerSkill` had no guard when `currentAdvances >= 10`. Calling them with 10 would silently return a cost for a non-existent 11th advance, violating the WFRP 4e rule that skills cap at 10 advances.
- **Fix**: Added `if (currentAdvances >= 10) { throw new Error('Skill already at maximum advances (10)') }` at the top of both functions. This makes it explicit that callers must not request a cost for a maxed skill.
- **Reported by**: Cochran (test suite); requested by Death_Stapler.
- **Verification**: `npx vitest run` — 93/93 tests pass, all 32 career tests green.

### 2026-03-27 — Team Update: Career Rules Implementation Complete (Cochran)

📌 Session completed 2026-03-27 12:47:18Z. Career advancement rules validated and fixed by Bullock, verified by Cochran. All 96 tests passing. See `.squad/log/2026-03-27-career-rules-complete.md` for session summary and `.squad/orchestration-log/2026-03-27T12-47-18Z-*.md` for per-agent deliverables.


### 2026-03-27: Trappings data, character persistence, and getStartingTrappings

#### Task 1: data/trappings.json - Class Starting Trappings

- **Source**: WFRP 4e Core Rulebook p.38, 'Class Trappings' section (lines 652-672 of docs/rulebook.md).
- **All 8 class lists found verbatim in the rulebook**. No assumptions needed -- data is directly sourced.
- **Representation decisions**:
  - Container contents expanded to individual items alongside the container (e.g., 'Sling Bag' + 'Writing Kit' + '1d10 Sheets of Parchment' listed separately). This matches how CharacterTrapping objects work in character.ts.
  - Dice-roll quantities ('1d10 Sheets of Parchment', '1d10 Matches') retained as string literals with the dice expression. The character creation UI is responsible for rolling and replacing with an actual quantity.
  - 'Hood or Mask' (Rogues) stored as a single string; player chooses one at creation.
  - Pouch contents (Courtiers: Tweezers, Ear Pick, Comb) listed as individual items.
- **Ambiguity flagged**: CareerClass type in lib/types/rules.ts lists 12 values (including Entertainer, Guilder, Hunter, Scholar) that do NOT appear in data/careers.json and have no corresponding entry in the rulebook's 8-class trappings table. The classStartingTrappings object in data/trappings.json covers only the 8 classes that actually exist in careers.json. If supplementary careers for the extra class types are ever added, their starting trappings will need to be sourced from the relevant supplement.

#### Task 2: lib/storage/character-storage.ts - localStorage persistence

- **Character.id** already existed in the type. Added createdAt: string and updatedAt: string (ISO 8601) to Character in lib/types/character.ts.
- **Index key**: wfrp-characters-index holds string[] of all character IDs.
- **Character key**: wfrp-character-{id} per character.
- **generateCharacterId()**: Uses crypto.randomUUID() with a Date.now()+random fallback for SSR/test environments.
- **saveCharacter()**: Sets updatedAt always; sets createdAt only if absent (preserves original creation date on re-saves).
- **loadCharacter()**: Returns null on missing key, JSON parse failure, or non-object payload. Minimal structural guard checks for id: string.
- **loadAllCharacters()**: Reads index, loads each; silently skips any that fail (corrupted entries don't break the array).
- **deleteCharacter()**: Idempotent; removes localStorage key and splices from index.
- **Test fixture update**: lib/rules/__tests__/careers.test.ts makeCharacter() helper updated to include createdAt/updatedAt to satisfy the new type.

#### Task 3: getStartingTrappings in lib/rules/careers.ts

- Added import of Career type alongside existing CareerLevel.
- Deduplication is case-insensitive / whitespace-normalised to handle any inconsistencies between class list and career level list (e.g., 'Dagger' appearing in both).
- Class trappings come first in the output; career level trappings follow -- class equipment is the base, career equipment extends it.
- Uses career.levels[levelIndex]?.trappings ?? [] with optional chaining so an out-of-bounds levelIndex doesn't throw (defensive; callers should use valid 0-3 indices).

#### TypeScript verification

- npx tsc --noEmit passes with zero errors.
- npx vitest run passes: 96/96 tests (up from 93 -- 3 new passes from test fixture fix).

### 2026-03-27: lib/rules/species.ts — getStartingXP, getSpeciesFixedSkills, getSpeciesFixedTalents

#### Starting XP

- **docs/rulebook.md has no per-species starting XP table.** Only XP values found: +20 XP (accept random species), +50/+25 XP (accept random career). No fixed base XP per species exists in the extracted docs.
- **Implemented values** (from task brief, consistent with WFRP 4e elder-species experience design): Human 20, Dwarf 25, Halfling 20, High Elf 30, Wood Elf 30. Stored in STARTING_XP_BY_SPECIES constant in lib/rules/species.ts. Death_Stapler should verify against physical corebook.
- getStartingXP(speciesId) throws on unknown species ID.

#### Species Skills Shape

- startingSkills in data/species.json is a **12-skill selection pool**, not an auto-grant list.
- Rulebook p.35: player picks 3 skills for +5 advances and 3 skills for +3 advances from those 12.
- getSpeciesFixedSkills() always returns [] — documented in JSDoc with explanation.
- Jane's Step 4 UI should present the 12-skill pool as a selection interface.

#### Species Fixed Talents

- startingTalents in species.json mixes fixed entries (e.g., "Night Vision") and "X or Y" choices (e.g., "Savvy or Suave"). Random talents excluded from data at data-entry time.
- getSpeciesFixedTalents() filters entries that do NOT contain " or " — those are the auto-granted talents.
- Fixed talent counts: Human 1, Dwarf 3, Halfling 4, High Elf 3, Wood Elf 3.

#### Verification

- npx tsc --noEmit — 0 errors
- npx vitest run — 125/125 tests passing (all pre-existing)

---

📌 Team update (2026-03-27T08:59:56): Species helpers implementation complete (bullock-starting-xp) and test verification complete (cochran-verify-suite). All 154 tests passing (125 baseline + 8 trappings + 21 storage). XP values pending user confirmation. See .squad/log/2026-03-27-species-helpers-test-verification.md for session summary.

### 2026-03-27: Open Gap — getTalentXpCost Implementation Needed

Step 4 (Skills & Talents) finalized by Jane with XP budget bar. Current implementation counts skill advancement costs but does NOT count talent costs. WFRP 4e rules: talents cost 100 XP each at character creation. Implement \getTalentXpCost(talentId, timesSelected)\ in \lib/rules/talents.ts\ to enable full budget accounting. Once ready, Jane will wire it into \SkillsAndTalents.tsx\ budget calculation to deduct talent selections from XP remaining.


### 2026-03-27: getTalentXpCost, getTotalTalentXpCost, finalizeCharacter

#### Task 1: lib/rules/talents.ts - Talent XP cost functions

- getTalentXpCost(): Returns 100. Every talent costs 100 XP per taking in WFRP 4e, regardless of career or non-career status. Source: WFRP 4e Core Rulebook p.58.
- getTotalTalentXpCost(timesTaken): Returns timesTaken * 100. Throws on negative input. No sliding scale -- flat 100 XP per take.
- New file: lib/rules/talents.ts (no existing talents rules file existed).

#### Task 2: lib/rules/character-builder.ts - finalizeCharacter helper

- finalizeCharacter(partial): Accepts Omit<Character, 'id' | 'createdAt' | 'updatedAt'> and returns a complete Character. Assigns id via generateCharacterId(), sets createdAt and updatedAt to current ISO timestamp. Does NOT persist -- caller handles storage.
- New file: lib/rules/character-builder.ts.

#### Task 3: Type verification

- Character.id: string -- present (pre-existing).
- Character.createdAt: string -- present (added in prior session).
- Character.updatedAt: string -- present (added in prior session).
- CharacterTalent.timesTaken: number -- present (pre-existing).
- No changes required to lib/types/character.ts.

#### TypeScript verification

- npx tsc --noEmit -- 0 errors.
- npx vitest run -- 125/125 tests passing (all pre-existing; no new tests added this session).

### 2026-03-27: Team Update — Jane's Character Sheet & Save Flow Complete (2026-03-27T09:17:40Z)

📌 **End-to-end character creation flow now operational** — Jane completed character sheet view (pp/character/[id]/page.tsx), character list (pp/characters/page.tsx), and wired wizard completion to call inalizeCharacter() + saveCharacter(). Users can now:
1. Create a character through all 6 wizard steps
2. Save to localStorage with unique ID and timestamps
3. View saved character on dedicated sheet page
4. Browse all characters in a list view

Your getTalentXpCost() and inalizeCharacter() seamlessly integrated into Jane's save flow. All 125 tests remain passing (0 regressions). Next targets: talent XP cost wire in Step 4 budget, species starting skills integration, and edit character UI.

### 2026-03-28: Wealth rules engine + equipment data extraction

#### lib/rules/wealth.ts (new file)

- **Wealth interface**: Uses { gold, silver, brass } short field names (aligned with status tier names and formula currency values). Note: lib/types/character.ts has a separate legacy Wealth with goldCrowns/silverShillings/brassPennies field names — both coexist, the new one is used by the wealth rules engine. 
- **Currency constants**: BP_PER_GC = 240, BP_PER_SS = 12. Official exchange: 1 GC = 20 SS = 240 BP, 1 SS = 12 BP.
- **wealthToBrass**: gold×240 + silver×12 + brass. Zero-config conversion for price comparison.
- **rassToWealth**: Greedy denomination breakdown — floor to GC, then SS, remainder BP. No rounding needed since all values are integers.
- **StartingWealthFormula**: Encodes roll parameters without executing the roll. description field is optional (tests use exact 	oEqual matching without it). diceCount is per-level (not total); total dice = diceCount × level.
- **getStartingWealthFormula**: Parses "Tier Level" string. Throws on empty input, missing space, non-integer level, level ≤ 0, or unknown tier. Brass → 2d10/level, Silver → 1d10/level, Gold → 0 dice (deterministic).
- **ollStartingWealth**: Gold tier is deterministic (no Math.random call at all). Brass/Silver accumulate diceCount × level d10 rolls via Math.floor(Math.random() × 10) + 1.

#### TypeScript: lib/types/rules.ts additions

- **AvailabilityTier** union: 'Common' | 'Scarce' | 'Rare' | 'Exotic'
- **WeaponReach** union: 6 reach categories per corebook p.295
- **Weapon** interface: name, price, enc, availability, reach?, range?, damage, qualities[], flaws[], group
- **Armour** interface: name, price, enc, availability, penalty?, locations[], ap, qualities[], flaws[]
- **EquipmentItem** interface: name, price, enc, availability, category, description?

#### lib/rules/species.ts — unverified XP comment

- Added prominent ⚠️ UNVERIFIED warning to the STARTING_XP_BY_SPECIES constant JSDoc. The values (Human 20, Dwarf 25, etc.) were not found in any provided docs and are derived from design intent only.

#### Data files extracted from docs/consumers_guide.md

- **data/weapons.json**: 60 weapons across 17 groups (Basic, Cavalry, Fencing, Brawling, Flail, Parry, Polearm, Two-Handed, Blackpowder, Bow, Crossbow, Engineering, Entangling, Explosives, Sling, Throwing, Ammunition)
- **data/armour.json**: 17 armour pieces (Soft Leather, Boiled Leather, Mail, Plate, Quick Armour)
- **data/equipment.json**: 180 items across 12 categories (Containers 13, Clothing 21, Food & Drink 12, Tools 40, Books 13, Trade Tools 2, Animals 19, Drugs & Poisons 8, Herbs 8, Prosthetics 7, Miscellaneous 31, Hirelings 6)

#### Verification

- 
px tsc --noEmit passes with zero errors
- All 150 tests pass (wealth.test.ts: 25 new tests, existing 125 unchanged)


### 2026-03-28: Wealth Rules Engine Implementation (Session 2026-03-27T10-10-07Z)

📌 Team update — Wealth rules engine implementation and equipment data extraction complete (bullock-wealth-equipment, cochran-wealth-tests, jane-talent-xp-wired merged into decisions.md).

**lib/rules/wealth.ts delivered:**
- \wealthToBrass(wealth: Wealth): number\ — converts gold/silver/brass to brass pennies (1 GC=240 BP, 1 SS=12 BP, linear)
- \rassToWealth(totalBrass: number): Wealth\ — greedy inverse (maximize GC, then SS, remainder BP)
- \getStartingWealthFormula(status: string): StartingWealthFormula\ — returns formula for Brass/Silver/Gold tiers; throws on unknown
- \ollStartingWealth(status: string): Wealth\ — uses Math.random() for dice; Gold tier deterministic (0 coins per corebook)

**Equipment data:** 60 weapons (17 groups), 17 armour (5 tiers), 180 equipment (12 categories) extracted from Consumers Guide. Implicit qualities (Blackpowder/Engineering) applied per footnote. Non-standard values (–, N/A, "Medium" reach, "Average" availability) preserved for flexibility.

**Wealth interface flag:** Two interfaces now coexist with different field names — \lib/types/character.ts\ uses \{ goldCrowns, silverShillings, brassPennies }\ (display), \lib/rules/wealth.ts\ uses \{ gold, silver, brass }\ (rules). Team should decide: unify on short names (recommended) or establish naming convention per context.

**Test status:** 150/150 passing (125 baseline + 25 wealth). Cochran's tests established contract; Bullock's implementation matched perfectly on landing.

**TypeScript:** \	sc --noEmit\ clean. No regressions.


### 2026-03-27: Wealth interface unified — duplicate removed

**Requested by:** Death_Stapler (via Death_Stapler)

**Problem:** Two Wealth interfaces existed with incompatible field names:
- lib/types/character.ts: goldCrowns, silverShillings, rassPennies
- lib/rules/wealth.ts: gold, silver, rass

Cochran's 25 wealth tests (all passing) used gold/silver/brass, confirming the canonical form.

**Changes made:**
1. lib/types/character.ts — deleted the duplicate Wealth interface; replaced with import type { Wealth } from '../rules/wealth' + xport type { Wealth } to preserve external re-exports.
2. lib/rules/wealth.ts — removed the stale legacy note referencing the old field names.
3. lib/rules/__tests__/character-storage.test.ts — updated fixture wealth to { gold: 0, silver: 0, brass: 0 }.
4. lib/rules/__tests__/careers.test.ts — same fixture update.
5. components/character/CharacterWizard.tsx — updated default wealth object in handleDetailsFinish.

**Verification:**
- 
px tsc --noEmit — 0 errors.
- 
px vitest run — 150/150 tests passing.

**No git operations performed.**


### 2026-03-27T10-15-35Z: Team Sync — Wealth Type Unification Complete (Scribe)

📌 **Wealth interface unified** — Deleted duplicate Wealth definition from character.ts, now canonical re-export from lib/rules/wealth.ts. All wealth code uses { gold, silver, brass } field names. Updated 5 files (types, rules, tests, components). 150/150 tests passing, 0 type errors. Jane's WealthDisplay component and Step 5 integration now use unified interface without field mapping.


### 2026-03-27: Creation XP types, random species & career rollers

**Requested by:** Death_Stapler (via Death_Stapler)

#### New file: lib/rules/creation-xp.ts
- **SpeciesChoiceMethod** type: 'random' | 'chosen'
- **CareerChoiceMethod** type: 'random' | 'rolled3pick1' | 'chosen'
- **getSpeciesChoiceXP(method)**: random → +20 XP, chosen → +0 XP
- **getCareerChoiceXP(method)**: random → +50 XP, rolled3pick1 → +25 XP, chosen → +0 XP
- **getCreationXP(speciesMethod, careerMethod)**: sums both bonuses; max +70 XP
- All values verified from docs/rulebook.md (Character Creation chapter, pp. 24–26)

#### lib/rules/species.ts changes
- **getStartingXP** marked @deprecated — values are assumed/unverified per-species numbers,
  not canonical. Callers directed to use getCreationXP() instead. Function NOT deleted (Jane
  may still reference it).
- **rollRandomSpecies()** added — simulates d100 roll on Random Species Table (p.24):
  01–90 human, 91–94 halfling, 95–98 dwarf, 99 high-elf, 00 (=100) wood-elf.
  Table confirmed from docs/rulebook.md. Returns species id string matching data/species.json.

#### lib/rules/careers.ts changes
- **rollRandomCareer(allCareers: Career[])** added — picks a Career at random from the
  provided list. Caller pre-filters by species restrictions if needed. Throws if list is empty.
  Intended for character creation Step 2 (roll once for +50 XP, or call 3× for +25 XP).

#### d100 Species Table (confirmed from docs/rulebook.md p.24)
- Human: 01–90 (90%)
- Halfling: 91–94 (4%)
- Dwarf: 95–98 (4%)
- High Elf: 99 (1%)
- Wood Elf: 00 (1%)

#### Verification
- npx tsc --noEmit — 0 errors
- npx vitest run — 150/150 tests passing (all pre-existing; no new tests added this session)


### 2026-03-28: Step 4 & 9 Rules Engine (Species Skill Selection, Career Allocation, Career Creation Options)

**Requested by:** Death_Stapler (via Death_Stapler)

#### lib/rules/species.ts additions
- **SpeciesSkillSelection** interface: `{ skillId: string; advances: 5 | 3 }`
- **validateSpeciesSkillSelections(selections, speciesStartingSkills): string[]** — validates player picks exactly 3×+5 and 3×+3 advances from the species 12-skill pool; checks for duplicates and out-of-pool skills; returns array of error strings (empty = valid). Source: WFRP 4e p.35.
- **getSpeciesSkillAdvances(skillId, selections): number** — returns 5, 3, or 0 for a given skill based on the player's selections.

#### lib/rules/skills.ts additions
- **CareerSkillAllocation** interface: `{ skillId: string; advances: number }`
- **validateCareerSkillAllocation(allocation, careerSkills): string[]** — validates total = 40, no single skill > 10 advances, no negatives, all skills from career pool. Source: WFRP 4e p.35.
- **getTotalAllocatedAdvances(allocation): number** — sums all advances; useful for "X/40" UI counter.

#### lib/rules/careers.ts additions
- **CareerCreationOptions** interface: `{ characteristics: string[]; skills: string[]; talents: string[] }`
- **getCareerCreationOptions(career, levelNumber): CareerCreationOptions** — returns the 3 characteristics, 8 skills (as display strings), and 4 talents available for XP spending at character creation. Throws if level not found. Source: WFRP 4e p.43.

#### Task 4 — XP cost helpers verified (no changes needed)
- `getXpCostForCharacteristicAdvance` in `lib/rules/characteristics.ts` ✅ exported
- `getSkillXpCost` in `lib/rules/skills.ts` ✅ exported
- `getTalentXpCost` / `getTotalTalentXpCost` in `lib/rules/talents.ts` ✅ exported
- `getXpCostForCareerCharacteristic`, `getXpCostForCareerSkill`, `getXpCostForNonCareerSkill`, `getXpCostForTalent` in `lib/rules/careers.ts` ✅ exported

#### Verification
- npx tsc --noEmit — 0 errors
- npx vitest run — 150/150 tests passing (all pre-existing; no new tests added this session)

### 2026-03-28: Appearance Roll Tables — Species Data & Rules Engine

**Requested by:** Death_Stapler (via Death_Stapler)

#### lib/types/rules.ts additions
- **AppearanceRollEntry** interface: { min: number; max: number; result: string } — single row in a 2d10 appearance table
- **AgeFormula** interface: { base: number; diceCount: number; diceSize: number } — age = base + NdN years
- **HeightFormula** interface: { baseInches: number; diceCount: number; diceSize: number } — height = baseInches + NdN inches
- **SpeciesAppearance** interface: { age, height, eyeColour, hairColour, canRollEyeTwice?, canRollHairTwice? } — full appearance data for a species
- Species interface updated: added optional ppearance?: SpeciesAppearance field

#### data/species.json additions
- Added ppearance block to all 5 species: human, dwarf, halfling, high-elf, wood-elf
- All tables confirmed from docs/rulebook.md (Chapter 2, pp. 26–35)
- Age formulas: Human 15+1d10, Dwarf 15+10d10, Halfling 15+5d10, High Elf 30+10d10, Wood Elf 30+10d10
- Height formulas (base inches): Human 57+2d10, Dwarf 51+1d10, Halfling 37+1d10, High/Wood Elf 71+1d10
- Eye/hair colour: 2d10 tables (results 2–20), 10 entries each
- Elves: canRollEyeTwice=true, canRollHairTwice=true

#### lib/rules/appearance.ts (new file)
- **roll2d10()**: simulates 2d10 roll, returns 2–20
- **rollNd10(n)**: simulates Nd10 roll, returns N to N*10
- **lookupAppearanceRoll(roll, table)**: looks up result in AppearanceRollEntry[]; throws if no match
- **rollEyeColour(appearance)**: rolls eye colour; elves get "Colour1 / Colour2"
- **rollHairColour(appearance)**: rolls hair colour; elves get "Colour1 / Colour2"
- **rollAge(appearance)**: returns age in years (base + Nd10)
- **rollHeight(appearance)**: returns height in total inches (baseInches + Nd10)
- **inchesToFeetString(inches)**: converts total inches to e.g. "5'9\""

#### Verification
- npx tsc --noEmit — 0 errors
- npx vitest run — 176/176 tests passing (all pre-existing; no new tests added this session)


📌 Team update (2026-03-27T19-02-19): Appearance Tables merged to decisions.md and orchestration log created — part of appearance rolls sprint alongside Jane's Physical Details UI work.

---

## XP Cost Fix (2026-06-06) — requested by Death_Stapler

### Problem
Both XP cost functions implemented a wrong linear formula instead of the tier-based table from the WFRP 4e Core Rulebook.

- **characteristics.ts**: 25 * (currentAdvances + 1) — incorrect linear scaling
- **skills.ts**: 10/20 * (currentAdvances + 1) with career/non-career split — both wrong

### Changes

#### lib/rules/characteristics.ts
- Replaced getXpCostForCharacteristicAdvance with tier-table lookup using CHARACTERISTIC_XP_TIERS.
- Added source comment referencing the correct rulebook table.

#### lib/rules/skills.ts
- Replaced getSkillXpCost with tier-table lookup using SKILL_XP_TIERS.
- isCareerSkill parameter made optional and ignored (_isCareerSkill?): career/non-career status does not affect cost per the rulebook.
- Added source comment.

### Correct Tier Table
| Advances already taken | Characteristic cost | Skill cost |
|------------------------|--------------------:|----------:|
| 0–5                    | 25                  | 10         |
| 6–10                   | 30                  | 15         |
| 11–15                  | 40                  | 20         |
| 16–20                  | 50                  | 30         |
| 21–25                  | 70                  | 40         |
| 26–30                  | 90                  | 60         |
| 31–35                  | 120                 | 80         |
| 36–40                  | 150                 | 110        |
| 41–45                  | 190                 | 140        |
| 46–50                  | 230                 | 180        |

### Verification
- 
px tsc --noEmit — 0 errors
- 
pm test — 13 tests now fail (all in characteristics.test.ts and skills.test.ts); all failures are tests that encoded the OLD wrong formulas. **Cochran to fix.**
- No callers outside the test files use these functions — no other code changes needed.

---

## Session: 20260328T024301Z — Species Talent Schema Migration

### Work completed

- **lib/types/rules.ts**: Added SpeciesTalentEntry discriminated union type (ixed | choice | random). Updated Species.startingTalents from string[] to SpeciesTalentEntry[].
- **data/species.json**: Migrated all 5 species (Human, Dwarf, Halfling, High Elf, Wood Elf) to structured talent entries using the new schema.
- **data/random-talents.json**: Created with 32 entries from the official Random Talent Table (WFRP 4e Core Rulebook p.35).
- **lib/rules/species.ts**: 
  - Added import for andom-talents.json
  - Updated getSpeciesFixedTalents(speciesId, speciesData) to use new schema (type==='fixed' filter)
  - Added getFixedSpeciesTalents(species) — object-based API
  - Added getChoiceSpeciesTalents(species) — returns Array<{ options: string[] }>
  - Added getRandomTalentCount(species) — returns count sum from random entries
  - Added getRandomTalentPool() — returns full 32-entry random talent pool
- **lib/rules/__tests__/species.test.ts**: Added 13 new tests covering getFixedSpeciesTalents, getChoiceSpeciesTalents, getRandomTalentCount, getRandomTalentPool.

### Learnings

- components/character/SkillsTalentsSelection.tsx and CharacterWizard.tsx had already been updated by Jane to expect the new talent schema props before this session.
- TSC incremental cache (.next\tsconfig.tsbuildinfo) can give false positives; delete it for a clean check.
- JSON modules imported via esolveJsonModule: true don't guarantee reference equality between calls in hot-module-reload scenarios — use 	oStrictEqual not 	oBe for pool content tests.
- getSpeciesFixedTalents(speciesId, speciesData) retained for backward compat with existing callers in CharacterWizard.tsx and SkillsAndTalents.tsx.

### Verification

- 
px tsc --noEmit — clean (exit 0)
- 
pm test — **199 tests pass** (7 test files, including 25 species tests)

### Talent characteristicBonus schema (20260327T232217Z)

- Added `characteristicBonus?: { characteristic: CharacteristicKey; value: number }` field to Talent interface in lib/types/rules.ts.
- Updated 10 talents in data/talents.json: Savvy (Int+5), Suave (Fel+5), Coolheaded (WP+5), Sharp (I+5), Warrior Born (WS+5), Lightning Reflexes (Ag+5), Marksman (BS+5), Nimble Fingered (Dex+5), Very Resilient (T+5), Very Strong (S+5).
- Hardy skipped (affects Wounds derived stat, not a characteristic). Strong-minded skipped (increases Resolve Pool, not WP per API).
- `characteristicBonus` is distinct from `bonusCharacteristic` (max rank calculation field).
- Added getTalentCharacteristicBonuses(talentIds, characteristicKey, talentsData) helper to lib/rules/characteristics.ts.
- Updated getTotalCharacteristic to accept optional talentBonus: number = 0 (backward compatible).
- All 199 tests pass; TSC clean.

📌 Team update (2026-05-01T00:00:00Z): Jane wired talentIds through CharacterWizard step 8 and displays +5✦ annotations in AdvancementStep and character sheet — rules layer fully surfaced in UI. Cochran added 10 tests; suite now 209/209. — decided by Jane, Cochran

### 2026-03-27: Attribute Choice Method XP Tracking

#### Background

The WFRP 4e rulebook (p.26-27) describes three methods for assigning attribute values during character creation, each with different XP bonuses:

1. **Random Roll (keep as-is)**: Roll 2d10 for each of the 10 characteristics and keep results as-is (add to species base). Gain +50 XP.
2. **Rearrange rolls**: Roll 2d10 ten times, then freely rearrange the 10 values among the characteristics. Gain +25 XP.
3. **Manual allocation**: Either roll again with rearrangement (no XP), OR allocate 100 points manually across all 10 characteristics (min 4, max 18 per characteristic, before adding species modifiers). Gain 0 XP.

This XP is ADDITIVE with other character creation XP sources (species random choice = +20, career random = +50, career roll-3-pick-1 = +25).

#### Implementation

**Type layer (lib/rules/creation-xp.ts)**:

- Added AttributeChoiceMethod = 'random-keep' | 'random-rearrange' | 'manual' type export
- Added getAttributeChoiceXP(method: AttributeChoiceMethod): number — returns 50, 25, or 0
- Updated getCreationXP() to accept optional third parameter ttributeMethod?: AttributeChoiceMethod
- Updated maximum possible bonus XP in doc comment: 120 (was 70)
- Type is exported and used consistently throughout the codebase

**Character type layer (lib/types/character.ts)**:

- Added three required fields to Character interface:
  - speciesChoiceMethod: SpeciesChoiceMethod — documents how species was selected
  - careerChoiceMethod: CareerChoiceMethod — documents how career was selected  
  - ttributeChoiceMethod: AttributeChoiceMethod — documents how attributes were assigned
- These fields were previously tracked only in the wizard state; now persisted to the Character for history/display purposes
- All three methods contribute to the final xperience.total at character creation

**Wizard integration (components/character/CharacterWizard.tsx)**:

- Jane's AttributesStep component already imported and used my AttributeChoiceMethod type (aliased as AttributeMethod for UI exports)
- The wizard state field ttributeMethod: AttributeMethod | null stores the player's selection
- Updated handleAdvancementComplete() to map wizard's ttributeMethod to Character.attributeChoiceMethod
- Updated both getCreationXP() call sites to include attribute method (defaults to 'manual' if null for safety)
- The XP contribution is baked into xperience.total at finalization

**Test coverage (lib/rules/__tests__/creation-xp.test.ts)**:

- Created comprehensive test suite with 19 tests covering:
  - Individual XP functions: getSpeciesChoiceXP, getCareerChoiceXP, getAttributeChoiceXP
  - Combined XP: getCreationXP with all parameter combinations
  - Exhaustive validation: All 18 possible combinations (2 species × 3 career × 3 attribute methods)
  - Edge cases: Missing attribute parameter (backwards compatibility), range validation (0-120)
- All 228 tests in full suite pass

**Test fixture updates**:

- lib/rules/__tests__/careers.test.ts: Added speciesChoiceMethod, careerChoiceMethod, ttributeChoiceMethod to makeCharacter() fixture
- lib/rules/__tests__/character-storage.test.ts: Same fixture updates
- Both use 'chosen'/'manual' defaults (0 XP bonuses) to avoid affecting existing test expectations

#### Integration Notes

- Jane handles the UI for Step 3 (AttributesStep); I provide the backend types and XP calculation
- The attribute method selection already exists in Jane's UI; my changes integrated cleanly with her component's existing AttributeMethod type alias
- The three choice methods (species/career/attributes) are independent and additive
- Maximum creation XP is now 120 (random everything), minimum is 0 (chosen everything)
- TypeScript strict mode satisfied; 
px tsc --noEmit clean; all 228 tests pass


### 2026-03-30 09:20:53 : Fate and Resilience Extra Points System

#### Problem

The Fate and Resilience starting values were broken. The implementation was hardcoded to species base values only, ignoring the Extra Points system. Additionally, Halfling had incorrect base values (0 Fate, 2 Resilience — should be 2 Fate, 0 Resilience per WFRP 4e Attributes Table p.26).

#### Correct WFRP 4e Rules

Each species has three values for Fate/Resilience:
- **Base Fate**: Fixed starting Fate points
- **Base Resilience**: Fixed starting Resilience points  
- **Extra Points**: A pool the player distributes freely between Fate and Resilience at creation

| Species   | Base Fate | Base Resilience | Extra Points |
|-----------|-----------|-----------------|--------------|
| Human     | 2         | 1               | 3            |
| Dwarf     | 0         | 2               | 2            |
| Halfling  | 2         | 0               | 3            |
| High Elf  | 0         | 0               | 2            |
| Wood Elf  | 0         | 0               | 2            |

Final totals:
- Fate Total = species.fate + extraPointsToFate
- Resilience Total = species.resilience + (species.extraPoints - extraPointsToFate)

#### Implementation

**Data layer (data/species.json)**:
- Fixed Halfling: changed from `fate: 0, resilience: 2` to `fate: 2, resilience: 0`
- Added `extraPoints` field to all 5 species with correct values

**Type layer (lib/types/rules.ts)**:
- Added `extraPoints: number` to `Species` interface with full JSDoc

**Character type (lib/types/character.ts)**:
- Added `fateExtraPoints: number` field to `Character` interface
- Tracks how many Extra Points the player allocated to Fate at creation
- Remainder goes to Resilience: `species.extraPoints - fateExtraPoints`

**Rules engine (lib/rules/fate-resilience.ts)** — new module:
- `getFateTotal(speciesFate, extraPointsToFate): number` — calculates final Fate total
- `getResilienceTotal(speciesResilience, speciesExtraPoints, extraPointsToFate): number` — calculates final Resilience total
- `validateExtraPoints(extraPointsToFate, speciesExtraPoints): boolean` — validates allocation is within bounds (0 to speciesExtraPoints, integer)
- `getDefaultExtraPointsAllocation(speciesExtraPoints): number` — returns floor(extraPoints / 2) as default

**Wizard integration (components/character/CharacterWizard.tsx)**:
- Added `fateExtraPoints: number` to `WizardCharacter` state (default 0, initialized to default allocation when species selected)
- Added `handleFateExtraPointsChange(fateExtraPoints: number)` callback for UI to update allocation
- Updated `handleSpeciesNext()` to initialize `fateExtraPoints` with `getDefaultExtraPointsAllocation(species.extraPoints)`
- Updated `handleAdvancementComplete()` to use helpers for final totals:
  - `fate.total = getFateTotal(species.fate, character.fateExtraPoints)`
  - `resilience.total = getResilienceTotal(species.resilience, species.extraPoints, character.fateExtraPoints)`
- Updated Step 6 (CharacterDetails) rendering to:
  - Pass `speciesExtraPoints={selectedSpecies.extraPoints}` (removed `as any` cast — type now correct)
  - Pass `fateExtraPoints` and `onFateExtraPointsChange` callback
  - Updated WizardStatsSidebar to use helpers for calculated fate/resilience display

**Test coverage (lib/rules/__tests__/fate-resilience.test.ts)** — new test suite:
- 26 tests covering:
  - `getFateTotal()` with various species/allocations
  - `getResilienceTotal()` with various species/allocations  
  - `validateExtraPoints()` boundary cases (0, max, over-limit, negative, non-integer)
  - `getDefaultExtraPointsAllocation()` for all pool sizes
  - Integration tests for full species scenarios (Human, Dwarf, Halfling, Elf)
- All 254 tests in full suite pass (was 228, +26 new fate-resilience tests)

#### UI Integration Notes

- Jane owns `CharacterDetails.tsx` — did NOT modify that file per instructions
- CharacterWizard now provides:
  - `speciesExtraPoints`, `fateExtraPoints`, `onFateExtraPointsChange` props to CharacterDetails
  - These give Jane everything needed to build the allocation UI
- WizardStatsSidebar displays calculated totals using the helper functions

#### Design Decisions

- **Storage strategy**: Stored `fateExtraPoints` on Character, not the final totals. This preserves the player's choice explicitly and allows recalculating totals if rules change. The helpers are pure functions that can be called anywhere.
- **Default allocation**: When species is selected, Extra Points default to floor(extraPoints / 2) to Fate. This gives a balanced starting point (Fate 1, Resilience 1 for 2-point species; Fate 1, Resilience 2 for 3-point species).
- **Validation**: `validateExtraPoints()` enforces integer values in range [0, speciesExtraPoints]. The wizard state update handler should call this before accepting user input.

Source: WFRP 4e Core Rulebook, Attributes Table p.26.
