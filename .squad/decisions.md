# Squad Decisions

## Active Decisions

### 2026-03-25T23:35:41Z: User directive
**By:** Death_Stapler (via Copilot)
**What:** Do not commit to the repository without explicit user permission.
**Why:** User request — captured for team memory

### 2026-03-26: Tech stack proposal for WFRP Character Generator
**By:** Swearengen
**What:** Next.js (App Router) + TypeScript + Tailwind CSS + static JSON data files. Deploy to Vercel.
**Why:** WFRP 4e data (careers, skills, talents, species, trappings) is static reference data — it doesn't change at runtime. No database needed; typed JSON files co-located in the repo give you type safety, zero infrastructure, and instant refactoring when the data model shifts. Next.js gives you file-based routing, server components for heavy data loading, and Vercel deployment is literally one click. TypeScript is non-negotiable for a rules-heavy domain — the type system catches exactly the kind of bugs that plague "stat X derives from stat Y modified by talent Z" logic. Tailwind keeps styling fast and consistent without a component library tax. This is the leanest stack that doesn't compromise on the complexity of the domain.
**Status:** PROPOSED — awaiting Death_Stapler approval

### 2026-03-26: Type Architecture — Two-Layer Design (Rules + Character)
**By:** Bullock
**What:** Split type system into `lib/types/rules.ts` (static game data mirroring `/data/*.json` files) and `lib/types/character.ts` (mutable player sheet state). Never embed rules data in character data; reference by ID instead.
**Why:** Rules data (Species, Career, Skill, Talent) is immutable and shared. Character data (CharacterSkill, CharacterTalent, CharacterStatus) is player-specific and mutable. Separating them prevents data duplication and makes it trivial to update game data without touching character sheets. The two-layer approach also clarifies data ownership: rules logic operates on rules types, UI operates on character types, transformations happen at the boundary.
**Implications:**
- `CharacteristicKey` union (10 characteristics: WS, BS, S, T, I, Ag, Dex, Int, WP, Fel)
- `CareerLevel.characteristics: CharacteristicKey[]` — no per-level per-char cap in WFRP 4e rules
- Character wound threshold stored in `CharacterStatus.woundThreshold` for display but must be recalculated on characteristic change
- `Species.extraWounds` (e.g., Dwarf +2) is NOT included in wound threshold function — callers add it
- **Skill career status transition:** When a skill shifts from non-career→career across career levels, cost transition needs design decision (corebook p.48 ambiguous)

### 2026-03-26: Test Framework & Strategy
**By:** Cochran
**What:** Vitest v4.x with TypeScript support, node environment (no jsdom), tests co-located in `lib/rules/__tests__/`. Test files gate implementation.
**Why:** Native ESM + TS support, zero Babel config needed for Next.js project, Vite-powered speed. Tests define the contract that implementers must satisfy.
**Coverage:** 36 baseline tests established (characteristics & skills); careers & wounds test suites (57 tests) added in follow-up.
**Verification flags (5 items):**
1. Halfling wound formula (`TB + 2×WPB`, no SB) — need species-aware wrapper before Halfling support
2. Species starting characteristic bases — need to verify against corebook tables (p.26–29)
3. Grouped skill advance cap semantics — does 10-advance cap apply per group independently?
4. Career skill cost mid-tier transition — ambiguous when skill shifts non-career→career

### 2026-03-27: Career Level Advancement Rules — Confirmed from Corebook p.58
**By:** Bullock (implementation), Cochran (test validation)
**What:** Career level completion requires: (1) ALL listed characteristics at `level × 5` advances (L1→5, L2→10, L3→15, L4→20); (2) at least 8 skills at same threshold; (3) ≥1 talent from the level. Prior career advances count toward all thresholds.
**Why:** Corebook p.58 verbatim — Death_Stapler provided exact text for confirmation.
**Implementation:** `canAdvanceCareerLevel` — validates all gates, returns structured missing array with deficit messages. `getTotalXpForCareerLevel` — minimum-cost projection: characteristics at `level×5` (375 XP per char at L1), 8 skills at threshold (150 XP per skill at L1), 1 talent (100 XP flat).
**Status:** ✅ Implemented & tested. All 96 tests passing.
**Related decisions:**
- Skill advance cap guard: Both `getXpCostForCareerSkill` and `getXpCostForNonCareerSkill` throw on attempts to exceed 10-advance limit (corebook p.48)
- Characteristics gate: Uses slug-normalized matching for skill names and specialisations (handles "Melee (any)" → "Melee (Specific)" via `anySpecialisation` flag)

### 2026-03-26: UI Design — Dark Torchlit Theme with Amber Accents
**By:** Jane
**What:** Dark backgrounds (`bg-gray-950`/`bg-gray-900`), warm amber accents (`text-amber-500`), serif headings (Crimson Text), sans body (Inter). Character creation wizard: 6 steps, server component loads data, client component renders choices, URL query params track state.
**Why:** Aesthetic matches WFRP's grim dark fantasy. Readability with high contrast. Modular 6-step flow allows incremental feature delivery.
**Step 1 (SpeciesSelection):** Built. Steps 2–6 pending.
**Component library:** Button (primary/secondary/ghost variants, `href` or `onClick` discriminated), Card (selectable with amber glow).
**Integration needs:**
- Step 3 (Characteristics): Roll 2d10 + species racial base per characteristic, not 1d20
- Character persistence layer needed before step 5 (currently stateless URL params)
- Each step validates previous step before allowing advancement

### 2026-03-26: Jane — Steps 4 & 6 Implementation Decisions
**By:** Jane (Frontend Dev)
**Related work:** Steps 4 (Skills & Talents) and 6 (Character Details) in the character creation wizard

**What:** Extended wizard to 6 steps. Step 4 combines Skills & Talents (matched from `CareerSkillEntry` to `Skill` data for characteristic lookup). Step 6 collects character details (name, gender, notes). Notes stored separately from `CharacterMetadata` at top-level `Character`. Skill selection shows live XP counter (via `getSkillXpCost`). Talent selection: pick ≥1 from career level, `choiceGroup` displayed as hint only (no enforcement). Skills data loaded in server component, passed to wizard.

**Why:**
- Step 4 combines Skills & Talents for shorter flow (WFRP naturally presents them together per career level)
- Skill matching: display name constructed from `skill + " (" + specialisation + ")"` or `skill + " (any)"`, matched to `Skill` objects by name. For `anySpecialisation`, find first grouped skill matching base name. If no match, degrade gracefully.
- Notes stored separately clarifies that they belong to the character record, not the metadata record
- Live XP counter without budget enforcement (pending `getStartingXP` implementation by Bullock)
- Talent choiceGroup shown as hint but not enforced — allows UI flexibility while respecting game intent

**Status:** ✅ Implemented. `tsc --noEmit` clean.

**Open Questions / Deferred:**
- **XP budget at creation:** Needs `getStartingXP(speciesId)` for enforcement
- **Species starting skills:** Not yet merged into career skill list
- **Character sheet output:** `handleDetailsFinish` currently logs to console; needs navigation/save integration

### 2026-03-27: Bullock — Trappings Data & Character Persistence
**By:** Bullock
**Status:** Implemented

**What:**
1. `data/trappings.json` — 8 class starting trappings (Academic, Burghers, Courtier, Peasant, Ranger, Riverfolk, Rogue, Warrior). Sourced directly from WFRP 4e Core Rulebook p.38. Container contents expanded to individual items. Dice-roll items stored verbatim. "Hood or Mask" stored as single choice string.
2. `lib/storage/character-storage.ts` — Full localStorage persistence: `generateCharacterId()` (crypto.randomUUID + fallback), `saveCharacter()` (sets updatedAt always, createdAt if missing), `loadCharacter()` (null on error), `loadAllCharacters()` (skips corrupted), `deleteCharacter()` (idempotent).
3. **Character type extensions:** Added `createdAt: string` and `updatedAt: string` (ISO 8601). Preserves creation timestamp across re-saves.
4. **`getStartingTrappings(career, levelIndex)`** in `lib/rules/careers.ts` — Combines class + career level trappings. Case-insensitive deduplication (class list first, career list follows).

**Why:**
- Trappings JSON mirrors rulebook structure; no invented defaults
- Container expansion matches `CharacterTrapping[]` runtime representation
- Dice expressions deferred to UI layer (character creation responsibility)
- localStorage chosen for simplicity (no backend needed for local character storage)
- `generateCharacterId()` fallback handles SSR/test environments
- Graceful degradation on corrupted data; no auto-cleanup prevents side effects in read operations
- Class trappings as base, career level extends ensures logical ordering

**Status:** ✅ Implemented & tested. 96/96 tests passing. `tsc --noEmit` clean.

**Ambiguities Flagged:**
- CareerClass type has extra values (Entertainer, Guilder, Hunter, Scholar) not in careers.json or rulebook 8-class trappings table. If supplementary careers added, trappings must be sourced from supplements.

### 2026-03-27: Step 4 Finalize — XP Budget & Species Fixed Talents
**By:** Jane (Frontend Dev)
**What:** Integrated `getStartingXP(speciesId)` and `getSpeciesFixedTalents(speciesId, allSpecies)` into Step 4. Displays "XP Remaining / of X total" counter with amber over-budget warning (non-blocking). Species auto-granted talents rendered in read-only section above career talents. Merged both into wizard state for downstream steps.
**Why:**
- XP budget provides meaningful constraint at creation without hard-blocking (WFRP GMs often adjust)
- Species fixed talents are mandatory by rules — should be pre-populated and non-interactive
- Merging into unified talent array keeps character state simple
**Limitations:**
- Species starting skills (12-skill selection pool) not yet integrated — marked TODO for future step
- Talent XP costs not counted in budget (pending `getTalentXpCost` implementation by Bullock)
- Character sheet output integration pending (currently logs to console)
**Status:** ✅ Implemented. `tsc --noEmit` clean.

### 2026-03-27: Bullock — Talent XP Cost & Character Finalization
**By:** Bullock
**Status:** Implemented

**What:**
1. `lib/rules/talents.ts` — new file with two exports:
   - `getTalentXpCost(): number` — always returns 100 (WFRP 4e p.58: every talent costs 100 XP per taking, no sliding scale, no career/non-career distinction).
   - `getTotalTalentXpCost(timesTaken: number): number` — returns `timesTaken * 100`; throws if `timesTaken < 0`.
2. `lib/rules/character-builder.ts` — new file with one export:
   - `finalizeCharacter(partial: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Character` — assigns `id` (via `generateCharacterId()`), `createdAt`, `updatedAt` (both current ISO timestamp). Does NOT save — caller must call `saveCharacter()`.

**Why:**
- Jane's Step 4 (Skills & Talents) XP bar needed `getTalentXpCost` to deduct talent XP from the budget.
- Wizard completion needs `finalizeCharacter` to stamp identity fields before handing to `saveCharacter`.
- Flat 100 XP per talent taking is verbatim from corebook p.58 — no ambiguity.

**Type status:**
- `Character.id`, `createdAt`, `updatedAt` — all present (prior session).
- `CharacterTalent.timesTaken` — present (pre-existing). No type changes required.

**Verification:**
- `npx tsc --noEmit` — 0 errors.
- `npx vitest run` — 125/125 tests passing.

**Constraints respected:**
- Only new exports added; no existing function signatures modified.
- No git operations performed.

### 2026-03-27: Jane — Character Sheet & Wizard Completion
**By:** Jane (Frontend Dev)
**Date:** 2026-03-27
**Related work:** Tasks 1–3 — wizard finish, character sheet view, characters list

---

## What Was Built

### Task 1: Wizard "Create Character" button
`CharacterWizard.tsx` `handleDetailsFinish` now assembles a full `Character` and saves it. The button already existed in `CharacterDetails.tsx` labeled "Create Character ✦" — no label change needed.

### Task 2: Character Sheet View (`app/character/[id]/page.tsx`)
Full read-only character sheet. Dynamic route, client component. All sections implemented: Header, Characteristics grid, Wounds & Status, Skills (career/other columns), Talents, Trappings, Character Details.

### Task 3: Characters List (`app/characters/page.tsx`)
Client-side list with card layout. Empty state. Homepage "Browse Characters" updated to link to `/characters`.

---

## Decisions Made

### Character Assembly at Wizard Completion
Skills are stored in `CharacterSkill[]` by looking up display-name keys in `allSkills` to get the correct `skillId`. Falls back to a `nameToId()` slug if no skill matches (handles "any specialisation" entries). This is best-effort — the `anySpecialisation` case (e.g. "Language (any)") will produce a slug like "language-any" which won't match any Skill definition. The character sheet handles this gracefully by formatting unknown IDs as title-cased display text.

**Implication**: If precise skill lookups are needed later (e.g. for XP recalculation), the wizard state should store `skillId` directly rather than display names. Deferred.

### `nameToId()` Duplicated from `lib/rules/careers.ts`
The `nameToId` helper is private in `careers.ts`. Duplicated locally in `CharacterWizard.tsx`. If behaviour diverges, skill/talent matching will break silently.

**Recommendation**: Export `nameToId` from `careers.ts` or move to a shared utility. Left as-is per "do not modify lib/rules/" constraint.

### XP Not Calculated at Creation
`experience: { total: 0, spent: 0, current: 0 }` defaults used. Talent XP cost requires `getTalentXpCost` (Bullock's upcoming export). Skill XP could be calculated now using `getSkillXpCost` but deferred to keep parity with Bullock's full XP work.

**TODO left in code**: `// TODO: wire getTalentXpCost — talent XP spend not counted here yet`

### `use(params)` for Next.js 16 Dynamic Routes
Next.js 15+ made `params` async. Client components use `React.use(params)` (React 19). TypeScript type for `params` prop is `Promise<{ id: string }>`.

### Character Sheet is Read-Only
"Edit" button rendered as placeholder (`href="#"`). Not functional. Editing is a future task.

### Fate/Resilience Initial Values
Set directly from `species.fate` and `species.resilience`. `burned: 0`, `luck = fate`, `resolve = resilience` (full at creation). This is correct per corebook.

### Trappings Stored Without `trappingId`
`CharacterTrapping.trappingId = null` for all starting trappings. The trappings data doesn't have individual item IDs — names are the only identifier. This is intentional.

---

## Open Items / Deferred

- **Skill ID mismatch for "any specialisation"**: `skillAdvances` keys like "Language (any)" produce slug "language-any" — no skill in the database has this ID. Display degrades gracefully but XP recalculation will be wrong.
- **XP tracking**: Not wired at creation. Needs `getTalentXpCost` from Bullock.
- **Edit character**: Placeholder only. Future sprint.
- **Wound threshold for special species**: Halfling uses different formula. Currently uses standard formula for all species. Needs species-aware wound calc wrapper (noted in existing decisions).
- **Character delete**: Characters list has no delete UI. The `deleteCharacter()` function exists in storage — just needs a UI trigger.

### 2026-03-28: Wealth Rules + Equipment Data Implementation (Bullock & Cochran)
**By:** Bullock (Implementation), Cochran (Testing)
**Status:** ✅ Implemented & Tested

**What:**
1. **Wealth Rules Engine** (`lib/rules/wealth.ts`):
   - `wealthToBrass(wealth: Wealth): number` — converts gold/silver/brass to total brass pennies (1 GC=240 BP, 1 SS=12 BP)
   - `brassToWealth(totalBrass: number): Wealth` — greedy inverse breakdown (maximize GC, then SS, remainder BP)
   - `getStartingWealthFormula(status: string): StartingWealthFormula` — returns formula descriptor for Brass/Silver/Gold tiers; throws on unknown tier
   - `rollStartingWealth(status: string): Wealth` — uses `Math.random()` for dice rolls; Gold tier deterministic (0 coins)

2. **Equipment Data Extraction** (from WFRP Consumers Guide):
   - `data/weapons.json` — 60 items across 17 groups (Basic, Cavalry, Fencing, Brawling, Flail, Parry, Polearm, Two-Handed, Blackpowder, Bow, Crossbow, Engineering, Entangling, Explosives, Sling, Throwing, Ammunition)
   - `data/armour.json` — 17 items across 5 tiers (Head, Body/Arms, Body/Legs, Body Full, Special)
   - `data/equipment.json` — 180 items across 12 categories (Containers, Clothing, Food & Drink, Tools, Books, Trade Tools, Animals, Drugs & Poisons, Herbs, Prosthetics, Miscellaneous, Hirelings)

3. **Type System** (new in `lib/types/rules.ts`):
   - `Wealth { gold: number, silver: number, brass: number }`
   - `StartingWealthFormula { tier: Brass|Silver|Gold, level: number, diceCount: number, diceSides: number, currency: string, description?: string }`
   - `Weapon`, `Armour`, `EquipmentItem`, `AvailabilityTier`, `WeaponReach`

4. **Test Suite** (Cochran):
   - 20 tests in `lib/rules/__tests__/wealth.test.ts` across 4 describe blocks
   - Covers wealthToBrass, brassToWealth, getStartingWealthFormula, rollStartingWealth
   - Uses `vi.spyOn(Math, 'random')` for deterministic mocking
   - All tests pass immediately on Bullock's implementation landing

**Why:**
- Wealth is core to starting equipment selection and character persistence
- Equipment data is static reference (mirrors rulebook p.x for weapons, armour, gear)
- Currency conversion (gold/silver/brass) must be bidirectional and precise
- Brass tier default starting wealth supports character creation flow

**Design Decisions:**
1. **Dual Wealth interfaces flagged for team decision:** `lib/types/character.ts` has `{ goldCrowns, silverShillings, brassPennies }` (character sheet display); `lib/rules/wealth.ts` has `{ gold, silver, brass }` (rules engine, aligned with status tier names). Recommend unifying to short names.
2. **StartingWealthFormula.description made optional:** Spec called required; pre-existing tests don't expect it. Made optional, not populated in `getStartingWealthFormula`, available for future UI (e.g., "Trader starting cash").
3. **Blackpowder & Engineering implicit qualities applied:** Consumers Guide footnote states both qualities auto-granted; applied to all entries in both groups.
4. **Non-standard field values preserved:** Improvised/non-purchasable items have "–" or "N/A" values; non-standard reach/availability preserved as strings (flexibility > normalization). Examples: Improvised weapon `enc: 0, availability: "N/A"`; Foil `reach: "Medium"`; Throwing Axe `availability: "Average"`.

**TypeScript & Tests:**
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 150/150 passing (125 baseline + 25 wealth)
- No regressions

**Blockers Resolved:** None. Bullock's implementation matched Cochran's test contract perfectly.

**Follow-Up Actions:**
- Team decision: Unify `Wealth` field names (recommend short names)
- Equipment data validation: Cross-check item counts/categories against rulebook
- Weapon qualities: Verify enum exhaustiveness if quality constraints needed later

### 2026-03-28: Creation XP & Species Skills — Random Method Bonus (Bullock)
**By:** Bullock  
**Date:** 2026-03-28  
**Status:** ✅ Implemented

**What:** Starting XP is NOT a fixed per-species amount — it is bonus XP earned exclusively by making **random choices** during character creation. The old `getStartingXP(speciesId)` values (Human 20, Dwarf 25, etc.) were unverified assumptions and have been deprecated.

**Source:** WFRP 4e Core Rulebook pp. 24–26 (confirmed in docs/rulebook.md).

**Confirmed XP Values:**
| Step | Method | Bonus XP |
|------|--------|----------|
| Species (Step 1) | Rolled d100 and accepted result | +20 XP |
| Species (Step 1) | Chosen freely | +0 XP |
| Career (Step 2) | Rolled once, kept first result | +50 XP |
| Career (Step 2) | Rolled 3×, player picked one | +25 XP |
| Career (Step 2) | Chosen freely | +0 XP |
| **Maximum possible** | random species + random career first roll | **+70 XP** |

**Code Delivered:**
- `lib/rules/creation-xp.ts` (new file): `SpeciesChoiceMethod`, `CareerChoiceMethod`, `getCreationXP()`, `getSpeciesChoiceXP()`, `getCareerChoiceXP()`
- `lib/rules/species.ts`: `rollRandomSpecies()` (d100 table), `getStartingXP()` deprecated
- `lib/rules/careers.ts`: `rollRandomCareer(allCareers)` added

**d100 Random Species Table (corebook p.24):**
| d100 | Species | Probability |
|------|---------|------------|
| 01–90 | Human | 90% |
| 91–94 | Halfling | 4% |
| 95–98 | Dwarf | 4% |
| 99 | High Elf | 1% |
| 00 | Wood Elf | 1% |

**Verification:** `npx tsc --noEmit` — 0 errors; `npx vitest run` — 150/150 tests passing.

### 2026-03-28: Canonical Wealth Field Names — Unified from Rules (Bullock)
**By:** Bullock  
**Status:** ✅ Implemented

**What:** The canonical `Wealth` interface uses **`gold`, `silver`, `brass`** (lowercase short forms). Previously `lib/types/character.ts` had a duplicate with `goldCrowns`, `silverShillings`, `brassPennies` — those names are now retired.

**Canonical source:** `lib/rules/wealth.ts` (single source of truth). `lib/types/character.ts` re-exports it.

**Why:** Short names match `StartingWealthFormula.currency` values (`'brass' | 'silver' | 'gold'`) and are less noisy in rules logic. Cochran's 25 wealth tests define the contract using `gold/silver/brass`.

**Files Updated:**
| File | Change |
|------|--------|
| `lib/types/character.ts` | Deleted duplicate Wealth; added re-export from `lib/rules/wealth.ts` |
| `lib/rules/__tests__/character-storage.test.ts` | Fixture: `{ gold: 0, silver: 0, brass: 0 }` |
| `lib/rules/__tests__/careers.test.ts` | Same fixture update |
| `components/character/CharacterWizard.tsx` | Default wealth initialiser updated |

**Verification:** `npx tsc --noEmit` — 0 errors; `npx vitest run` — 150/150 tests passing.

### 2026-03-28: Step 4 & Step 9 Rules Engine — Validators & Options (Bullock)
**By:** Bullock  
**Status:** ✅ Implemented — 150/150 tests passing

**What:** Three new validator functions + one options helper for character creation and bonus XP spending:

1. **`lib/rules/species.ts`**:
   - `SpeciesSkillSelection` interface (skillId + advances: 5 | 3)
   - `validateSpeciesSkillSelections(selections, speciesStartingSkills)` — ensures exactly 3 at +5 and 3 different at +3, no dupes
   - `getSpeciesSkillAdvances(skillId, selections)` — lookup helper

2. **`lib/rules/skills.ts`**:
   - `CareerSkillAllocation` interface (skillId + advances: 0–10)
   - `validateCareerSkillAllocation(allocation, careerSkills)` — ensures total 40 advances, max 10 per skill, all IDs in career list
   - `getTotalAllocatedAdvances(allocation)` — sum helper for UI counter

3. **`lib/rules/careers.ts`**:
   - `CareerCreationOptions` interface (characteristics, skills, talents arrays)
   - `getCareerCreationOptions(career, levelNumber)` — returns what's available at that career level

**Source:** WFRP 4e Core Rulebook pp. 35, 43. All exports validated. No existing signatures modified.

**Verification:** `npx tsc --noEmit` — 0 errors.

### 2026-03-28: Step 4 & Step 9 Test Coverage (Cochran)
**By:** Cochran  
**Status:** ✅ Implemented — 176 tests total

**What:** 26 new tests across 3 files covering Bullock's Step 4 and Step 9 rule functions.

**Test Files:**
- **`lib/rules/__tests__/species.test.ts`** (NEW, 12 tests): `validateSpeciesSkillSelections` (8) + `getSpeciesSkillAdvances` (4)
- **`lib/rules/__tests__/skills.test.ts`** (11 appended): `validateCareerSkillAllocation` (8) + `getTotalAllocatedAdvances` (3)
- **`lib/rules/__tests__/careers.test.ts`** (3 appended): `getCareerCreationOptions` using real Apothecary career data

**Results:** 176/176 passing (150 baseline + 26 new). Zero regressions.

### 2026-03-28: Creation XP UI Integration — Steps 1, 2 & 4 (Jane)
**By:** Jane (Frontend Dev)  
**Status:** ✅ Implemented. `tsc --noEmit` clean.

**What:** Integrated creation XP choice points into wizard UI:

**Step 1 (Species Selection):**
- 🎲 Roll Randomly button (+20 XP)
- Selected card shows green +20 XP badge when `choiceMethod === 'random'`
- Manual click sets `choiceMethod = 'chosen'` (XP badge clears)
- `initialChoiceMethod` prop preserves state on back-nav

**Step 2 (Career Selection):**
- Three mode buttons: Roll Randomly (+50 XP) / Roll 3× Pick One (+25 XP) / Choose Freely
- Random: auto-selects career, card locked, +50 XP badge
- Rolled3: 3 distinct careers, player picks, +25 XP badge
- Chosen: original class-filter + grid, no badge
- Mode switch clears selection
- State preserved via `initialChoiceMethod` and `initialSelectedId`

**Step 4 (Skills & Talents):**
- ~~`getStartingXP(speciesId)` removed~~ (was wrong — fixed values, not method-based)
- Replaced with inline `localGetCreationXP(speciesMethod, careerMethod)` fallback
- XP widget: shows budget remaining, total, and source breakdown (per method)
- Budget 0: "No bonus XP / you made all free choices"
- Over-budget warning only shows when budget > 0

**CharacterWizard.tsx Update:**
- `WizardCharacter` adds `speciesChoiceMethod` and `careerChoiceMethod` (default 'chosen')
- `handleSpeciesNext(id, method)` and `handleCareerNext(id, method)` updated
- `handleDetailsFinish` uses `localGetCreationXP` for `xpTotal`

**Design Note:** Type aliases defined locally per component (all structurally identical). Can be centralised after Bullock's exports land.

**Bullock Handoff Point:** When `getCreationXP`, `rollRandomSpecies`, `rollRandomCareer` are exported, replace inline fallbacks.

### 2026-03-28: Starting Wealth & Equipment UI (Jane)
**By:** Jane (Frontend Dev)  
**Status:** ✅ Implemented. `tsc --noEmit` clean.

**What:** Extended wizard and character sheet for starting wealth:

**Task 1 — Wizard Step 5 (Starting Wealth):**
- Formula description: e.g. "Roll 2d10 × 3 — paid in brass pennies (Brass 3 Status)". Gold tier shows deterministic text.
- "Roll Wealth" button calls `rollStartingWealth(statusString)`
- Rolled result shown via `WealthDisplay` component with "↻ Re-roll" ghost button
- Skip rolling → saves `{ gold: 0, silver: 0, brass: 0 }`
- State preserved on back-nav via `initialWealth` prop
- Props changed: added `careerLevelStatus: StatusStanding`, `initialWealth: Wealth | null`; `onNext: () => void` → `onNext: (wealth: Wealth) => void`

**CharacterWizard.tsx:**
- `WizardCharacter.rolledWealth: Wealth | null`
- `handleTrappingsNext(wealth)` stores it
- Final assembly: `wealth: character.rolledWealth ?? { gold: 0, silver: 0, brass: 0 }`

**Task 2 — Character Sheet Wealth Display:**
- `WealthDisplay` component in header below XP line
- Reads `character.wealth` directly (now unified from `lib/rules/wealth.ts`)
- Null-guarded for old characters saved before wealth tracking

**Task 3 — WealthDisplay Component:**
- Props: `wealth: Wealth`, `size?: 'sm' | 'md' | 'lg'`
- Format: `{gold} GC · {silver}/– · {brass}d`
- Colour coding: Gold (text-yellow-400), Silver (text-gray-300), Brass (text-amber-500)
- Three size presets (sm/md/lg)

**Design Decisions:**
- StatusStanding → string conversion: `` `${tier} ${standing}` `` inline in TrappingsReview
- Skip-roll → `{ gold: 0, silver: 0, brass: 0 }` (non-blocking, matches XP budget philosophy)
- Wealth field names: Now unified as short forms (`gold`, `silver`, `brass`) from Bullock's `lib/rules/wealth.ts`
- WealthDisplay placement: Inside header card below XP (top-of-mind resource in WFRP)

**Open Items:** Wealth not shown on character list cards yet (low priority).

### 2026-03-28: Wizard Restructure to 8 Steps Matching Rulebook (Jane)
**By:** Jane (Frontend Dev)  
**Status:** ✅ Implemented. `tsc --noEmit` clean. `next build` succeeds. 176/176 tests passing.

**What:** Restructured character creation wizard from 6 steps to 8 steps to match WFRP 4e rulebook creation sequence exactly. Step 7 (Party) intentionally skipped per spec.

**New Components (3):**
1. **`SkillsTalentsSelection.tsx`** (Step 4):
   - Species skill selection: 3×+5, 3×+3 advances from 12-skill pool
   - Career skill allocation: 8 skills, 40 total advances
   - Career talent: pick exactly 1 from level's talents
   - Validation gates with inline errors
   - **NO XP logic** (deferred to Step 8)

2. **`BringingToLife.tsx`** (Step 7):
   - 11 optional backstory questions + motivation
   - `CharacterBackstory` collected (not yet persisted to Character type)
   - All fields optional — player can skip freely

3. **`AdvancementStep.tsx`** (Step 8):
   - Bonus XP spending on characteristics, skills, talents
   - Restricted to Level 1 advances: 3 characteristics, 8 skills, 4 talents
   - Hard cap: buttons disabled when remaining XP < next cost
   - Uses `applyCreationAdvances()` helper from `character-builder.ts`

**Modified Components (6):**
- CharacterWizard.tsx (full rework for 8-step flow, new WizardCharacter shape, new assembly logic)
- CharacterDetails.tsx, CareerSelection.tsx, CharacteristicRoller.tsx, SpeciesSelection.tsx, TrappingsReview.tsx (totalSteps: 8)

**New Type Exports:**
- `CharacterBackstory` interface in `lib/types/character.ts`
- `CreationAdvances` interface in `lib/types/character.ts`

**New Rule Helper:**
- `applyCreationAdvances(character, advances)` in `lib/rules/character-builder.ts`

**Key Architectural Decisions:**
1. Step 4 has NO XP spending — all XP work deferred to Step 8
2. Step 8 XP hard cap enforced — no negative spending possible
3. Species skill selection uses display names (strings), matching validator contract
4. Career skill allocation uses display names, merged with species skills at finalization
5. Wizard state now separates concerns: creation data (species, career, skills, talents, backstory) vs. advancement data (XP spends)

**Open Questions for Team:**
1. Should `Character` type gain a `backstory?: CharacterBackstory` field for persistence? Backlog.
2. Old `SkillsAndTalents.tsx` is now unused — can be deleted in cleanup pass.
3. Species random talent selection (humans get 3 random talents, p.33) not yet implemented in Step 1 UI.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction

### 2026-03-27: Appearance Tables — SpeciesAppearance Type & Roll Utilities
**By:** Bullock
**What:** Added SpeciesAppearance type family to lib/types/rules.ts and populated all 5 species in data/species.json with age formulas, height formulas, and 2d10 eye/hair colour tables. Created lib/rules/appearance.ts with roll utilities: oll2d10(), ollNd10(n), lookupAppearanceRoll(), ollEyeColour(), ollHairColour(), ollAge(), ollHeight(), inchesToFeetString().
**Why:** Appearance rolls are foundational to Step 6 (Physical Details). Elf species require double rolls for eye and hair colour (flagged via canRollEyeTwice / canRollHairTwice). Height stored internally as total inches, displayed as feet+inches (e.g., 69 → "5'9\""). All species configured with per-level advancement caps matching WFRP 4e rules.
**Species Config:**
- Human: age 15 + 1d10, height 57" + 2d10
- Dwarf: age 15 + 10d10, height 51" + 1d10
- Halfling: age 15 + 5d10, height 37" + 1d10
- High Elf: age 30 + 10d10, height 71" + 1d10, 2× eye/hair rolls
- Wood Elf: age 30 + 10d10, height 71" + 1d10, 2× eye/hair rolls
**Status:** ✅ Implemented. TypeScript 0 errors, 176 tests passing (no regressions).

### 2026-03-27: Physical Details UI — Roll + Manual Entry in Step 6
**By:** Jane
**What:** Reworked CharacterDetails.tsx to support dice-roll + manual-entry for Age, Height, Eye Colour, Hair Colour. Added speciesAppearance?: SpeciesAppearance prop, inline RollButton component (amber-outlined, disabled when no appearance data), and 700ms field flash on roll. Height field accepts feet+inches ("5'9\""), plain inches ("69"), or "69 in" formats; parsed onBlur and stored as string. Eye colour / hair colour: elf double-roll handled transparently by lib/rules/appearance.ts functions.
**Why:** Roll is suggestion, not lock. All inputs editable after rolling. Elf species double-roll logic isolated in roll utilities, not duplicated in UI. Height display uses feet+inches (natural for human reading), but stored as string to avoid loss of precision on re-edit.
**Files Changed:**
- components/character/CharacterDetails.tsx — added roll support, field flash, height parsing
- components/character/CharacterWizard.tsx — passes speciesAppearance={selectedSpecies.appearance} prop
**Status:** ✅ Implemented. TypeScript 0 errors.
**Design Lock:** No lib/rules/ changes needed — all roll logic already complete in Bullock's appearance.ts.

### 2026-03-27: Species Talent Schema — SpeciesTalentEntry Discriminated Union
**By:** Bullock
**What:** Replaced Species.startingTalents: string[] with SpeciesTalentEntry[] discriminated union in lib/types/rules.ts. Three entry types: { type: 'fixed'; talent: string }, { type: 'choice'; options: string[] }, { type: 'random'; count: number }. All 5 species migrated in data/species.json. Created data/random-talents.json with 32 entries from WFRP 4e Random Talent Table (p.35). Added getFixedSpeciesTalents, getChoiceSpeciesTalents, getRandomTalentCount, getRandomTalentPool helpers to lib/rules/species.ts. getSpeciesFixedTalents(speciesId, array) retained for backward compatibility.
**Why:** Flat string[] couldn't represent choice talents (player picks one from options) or random talent rolls (Humans get 3, Halflings get 2). Discriminated union makes intent explicit and enables type-safe handling in the UI.
**Status:** ✅ Implemented. TSC clean, 199 tests passing.

### 2026-03-28: Species Talents UI — Step 4 SkillsTalentsSelection
**By:** Jane
**What:** Step 4 (SkillsTalentsSelection.tsx) now renders Species Talents section above Career Talent picker. Fixed talents shown read-only with ✅ icon. Choice talents shown as amber button groups (one per choice entry). Random talent slots each have a 🎲 Roll button (deduplicates against already-taken talents) plus a dropdown picker as alternative. canProceed validation extended with choiceTalentsValid and andomTalentsValid gates. CharacterWizard gains speciesChoiceTalents and speciesRandomTalents state arrays with slot-by-slot callbacks. Final talent assembly in handleAdvancementComplete includes choice and random talent names.
**Why:** Species talent selection (fixed grants, player choices, and random rolls) was missing from the wizard. Bullock's schema work made this tractable.
**Status:** ✅ Implemented. TSC clean, 199 tests passing.

### 2026-06-06: Correct XP Cost Table for Characteristics and Skills
**By:** Bullock
**What:** getXpCostForCharacteristicAdvance and getSkillXpCost now use the tier-based cost table from WFRP 4e Core Rulebook ("Characteristic and Skill Improvement XP Costs"), replacing incorrect linear formulas. Characteristics: 0–5→25, 6–10→30, 11–15→40, 16–20→50, 21–25→70, 26–30→90, 31–35→120, 36–40→150, 41–45→190, 46–50→230 per advance. Skills: 0–5→10, 6–10→15, 11–15→20, 16–20→30, 21–25→40, 26–30→60, 31–35→80, 36–40→110, 41–45→140, 46–50→180. No career vs. non-career cost difference — the table applies uniformly. isCareerSkill parameter on getSkillXpCost is now optional and ignored. 13 existing tests (4 characteristic, 9 skill) encoded the old wrong formulas — Cochran to update.
**Why:** Previous formulas (linear 25×(n+1) and career-split 10/20×(n+1)) did not match the rulebook. All XP costs must be sourced from the official table to ensure accurate character advancement.
**Status:** ✅ Implemented. Cochran to fix 13 tests.

### 2026-05-01: Talent Characteristic Bonus Schema
**By:** Bullock
**What:** Added characteristicBonus?: { characteristic: CharacteristicKey; value: number } to the Talent interface (lib/types/rules.ts). Populated 10 talents in data/talents.json: Savvy (Int+5), Suave (Fel+5), Coolheaded (WP+5), Sharp (I+5), Warrior Born (WS+5), Lightning Reflexes (Ag+5), Marksman (BS+5), Nimble Fingered (Dex+5), Very Resilient (T+5), Very Strong (S+5). Hardy and Strong-minded explicitly skipped (Hardy affects Wounds derived stat; Strong-minded increases Resolve Pool, not WP). Added getTalentCharacteristicBonuses(talentIds, characteristicKey, talentsData) to lib/rules/characteristics.ts. Updated getTotalCharacteristic to accept optional 	alentBonus: number = 0 (backward compatible). characteristicBonus is distinct from onusCharacteristic (max rank calculation field).
**Why:** Talents like Savvy grant permanent +5 characteristic bonuses that do not count as advances. Without this field and helper, the rules layer cannot compute correct characteristic totals for characters with such talents.
**Status:** ✅ Implemented. TSC clean, 199 tests passing.

### 2026-05-01: Talent Characteristic Bonus — Display Layer
**By:** Jane
**What:** pp/character/[id]/page.tsx: getCharTotal(key) now adds getTalentCharacteristicBonuses(talentIds, key, talentsData); helper getCharTalentBonusLabel(key) drives +5✦ emerald annotation with 	itle tooltip in the characteristics table; added ✦ = talent bonus legend. components/character/AdvancementStep.tsx: 	alentIds?: string[] added to props (optional, backward compatible); each characteristic row shows +5✦ emerald annotation; career skill totals include characteristic talent bonus. components/character/CharacterWizard.tsx: computes step8TalentIds from all talent sources and passes to <AdvancementStep>.
**Why:** Without the display layer, correct characteristic totals were not shown and players could not see the source of bonus values. Emerald + ✦ visually distinguishes talent bonuses from XP advances (amber) and base values (gray).
**Status:** ✅ Implemented. TSC clean, 209/209 tests passing.

### 2026-05-01: Roll Display & Lock — Wizard Roll Buttons
**By:** Jane
**What:** Added dice-roll result display and one-shot lock to all random roll buttons in the wizard. lib/rules/species.ts: ollRandomSpeciesWithDie() returns { roll, speciesId }. lib/rules/careers.ts: ollRandomCareerWithDie(allCareers) returns { roll, career }. lib/rules/appearance.ts: detail-returning variants for all four appearance rolls (ollNd10WithDetails, ollEyeColourWithDetails, ollHairColourWithDetails, ollAgeWithDetails, ollHeightWithDetails). SpeciesSelection.tsx: d100 result shown as Rolled: 47 → Human; button replaced with greyed-out 🎲 Rolled badge after use. CareerSelection.tsx: per-button locks for Roll Randomly and Roll 3× Pick One. CharacterDetails.tsx: per-field locks with RollButton and RollHint components; dice breakdown shown (e.g. Rolled: 3 + 8 = 11 → 23). Lock is UI-only, in component state, no persistence.
**Why:** Players need to see what they rolled. One-shot lock prevents accidental re-rolls that would change already-seen values. All original roll functions untouched (backward compatible).
**Status:** ✅ Implemented.
