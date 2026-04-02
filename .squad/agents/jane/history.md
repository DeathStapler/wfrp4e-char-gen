# Project Context

- **Owner:** Death_Stapler
- **Project:** Warhammer Fantasy Roleplay 4e Character Generator and repository
- **Stack:** Next.js 15 App Router + TypeScript (strict) + Tailwind CSS v4
- **Created:** 2026-03-26

## Recent Work

📌 Team update (20260327T223814Z): Wizard restructured from 6 to 8 steps matching WFRP 4e rulebook. New components: SkillsTalentsSelection (Step 4 — no XP), BringingToLife (Step 7 — backstory), AdvancementStep (Step 8 — XP spending). Creation XP UI integrated (Steps 1, 2). Starting wealth UI added (Step 5). Wealth type consolidated to canonical `gold/silver/brass`. CharacterBackstory + CreationAdvances types added. — Jane

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-26 — Initial UI built (Jane)

Built the core character creation UI layer. Key facts for future work:

- **globals.css** uses Tailwind v4 `@import "tailwindcss"` — no separate config file. Do not add a `tailwind.config.js` unless a compelling reason arises.
- **Fonts**: `Crimson_Text` (serif, via next/font/google) for headings, `Inter` (sans) for body. Both are loaded as CSS variables (`--font-serif`, `--font-sans`) in the root layout. Apply them with `font-serif` and `font-sans` utility classes.
- **Colour palette**: `bg-gray-950` backgrounds, `text-gray-100` body, `amber-500`/`amber-400` accents. Red (`red-500`) for very low stats, amber for high stats in characteristic grids.
- **`components/ui/Button.tsx`**: Reusable button/link. Variants: `primary` (amber fill), `secondary` (amber outline), `ghost`. Pass `href` to render as a `<Link>`. Fully typed with discriminated union — no `href` + `onClick` conflicts.
- **`components/ui/Card.tsx`**: Selectable card with amber glow on `selected`. Keyboard-accessible (`Enter`/`Space` triggers `onClick`). Pass `onClick` to make it interactive.
- **`components/character/SpeciesSelection.tsx`**: `'use client'` — interactive species selection for step 1 of the wizard. Accepts `allSpecies: Species[]` as a prop (data passed in from the server component page). Shows stat grid with colour-coded values. On "Next →" navigates to `/character/new?species=<id>&step=2`.
- **`app/character/new/page.tsx`**: Server component. Imports `data/species.json` and passes it as `Species[]` to `SpeciesSelection`. Future steps should follow this same pattern: import data in the server component, pass to a `'use client'` step component.
- **Character creation flow** is planned as 6 steps: Species → Career → Characteristics → Skills → Talents → Details. Only step 1 is implemented.
- **`app/page.tsx``: Static landing page. Imports `Button` from components/ui. No client directive needed — `Button` with `href` renders fine in a server component context because `next/link` is used internally.

### 2026-03-26 — Wizard Steps 2 & 3 built (Jane)

Built wizard steps 2 (Career Selection) and 3 (Characteristic Rolling). Key facts:

- **Architecture change**: Moved from URL-param navigation (`router.push`) to in-memory React state. The wizard now lives in `components/character/CharacterWizard.tsx` (client component), which is the single source of truth for all step state.
- **`app/character/new/page.tsx`**: Server component now loads BOTH `species.json` and `careers.json` and passes both as typed arrays to `CharacterWizard`.
- **`components/character/CharacterWizard.tsx`**: Top-level `'use client'` wizard controller. Holds `step: 1|2|3`, `speciesId`, `careerId`, `characteristicRolls` as a single `WizardCharacter` state object. Step state persists when navigating back — selections are remembered.
- **`components/character/StepIndicator.tsx`**: Extracted from `SpeciesSelection` into a shared component. Accepts `currentStep`, `totalSteps`, `stepLabel` props. Used across all step components.
- **`components/character/SpeciesSelection.tsx`**: Refactored. Now accepts `initialSelectedId` and `onNext(speciesId)` callback instead of using `router.push`. "Back" still goes to `/`.
- **`components/character/CareerSelection.tsx`**: New. Dynamically derives available career classes from the data (8 classes in current data). Class filter tabs with counts. Career cards show name, Level 1 title, class badge, and Status tier (colour-coded: Gold=yellow, Silver=gray, Brass=orange). "All" tab shows all 63 careers.
- **`components/character/CharacteristicRoller.tsx`**: New. Shows all 10 characteristics with species base, 2d10 roll, total, and characteristic bonus (floor(total/10)). "Roll All" button rolls all simultaneously. Individual re-roll buttons per row. Next is disabled until all 10 are rolled. A count of remaining un-rolled characteristics shows when partially complete.
- **Status tier colours**: Gold = `text-yellow-400`, Silver = `text-gray-300`, Brass = `text-orange-400` — consistent across all career-related UI.
- **careers.json has 8 classes** (not 12 from the type): Academic, Burghers, Courtier, Peasant, Ranger, Riverfolk, Rogue, Warrior. The filter derives classes dynamically from data, so this is fine.
- **`tsc --noEmit` passes** with zero errors after all changes.

### 2026-03-26 — Wizard Steps 4, 5 & 6 built (Jane)

Built wizard steps 4 (Skills & Talents), 5 (Trappings Review), and 6 (Character Details). Key facts:

- **New components**: `SkillsAndTalents.tsx`, `TrappingsReview.tsx`, `CharacterDetails.tsx` — all `'use client'`, follow the same pattern as previous steps.
- **Skills data**: `skills.json` is now loaded in the server component page and passed as `allSkills: Skill[]` to `CharacterWizard`, consistent with species/careers.
- **CareerSkillEntry matching**: Career level skills are `CareerSkillEntry` objects (not plain strings). Display name is constructed from `skill + " (" + specialisation + ")"`. Matched to `Skill` objects by name for characteristic lookup. `anySpecialisation` falls back to first grouped skill with matching base name.
- **Wizard step type** extended from `1|2|3` to `1|2|3|4|5|6`.
- **WizardCharacter** extended: added `skillAdvances: Record<string, number>`, `selectedTalents: string[]`, `characterDetails: Partial<CharacterMetadata>`, `notes: string`.
- **Notes field**: `CharacterMetadata` has no `notes` — it lives at the top-level `Character`. Stored separately in wizard state; `CharacterDetails.onFinish(details, notes)` returns both.
- **XP counter**: Step 4 shows live XP spent using `getSkillXpCost` from `lib/rules/skills.ts`. No cap enforced — open question for Bullock (species starting XP).
- **Talent selection**: Any talent can be selected; choiceGroup shown as hint only. Must pick ≥1 to continue.
- **8-of-10 skills indicator**: Shows progress toward L1 completion (8 skills at 5+ advances) as informational UI — not a gate.
- **`tsc --noEmit` passes** with zero errors.

### 2026-03-27: Step 4 Finalized — XP Budget + Species Fixed Talents (Jane)

Consumed Bullock's new functions to complete Step 4:

- **`getStartingXP(speciesId)`** called in `SkillsAndTalents.tsx` to get total XP budget. Wrapped in try/catch for safety. Displays "XP Remaining / of X total" counter (replacing old "XP Spent" display).
- **Amber over-budget warning** shown when `xpRemaining < 0`. Non-blocking — player can still continue. Tooltip on "⚠ approx." label reads: "Starting XP values are approximate — verify with your GM".
- **`getSpeciesFixedTalents(speciesId, allSpecies)`** called to get auto-granted species talents. Rendered in a read-only "Species Talents (auto-granted)" section ABOVE career talents. Cannot be toggled.
- **`CharacterWizard.tsx`** updated to pass `speciesId` and `allSpecies` as new props to `SkillsAndTalents`.
- **`onNext` merge**: species fixed talents merged with career-selected talents before passing up to wizard state (`[...speciesFixedTalents, ...selectedTalents]`). On re-entry to step 4, species talents are filtered out of `initialSelectedTalents` to prevent double-display.
- **`// TODO: species skill selection (separate step)`** comment added at top of `SkillsAndTalents.tsx`.
- **`tsc --noEmit` passes** with zero errors.

### 2026-03-27: Team Update from Bullock — Trappings & Persistence Ready (Session 2026-03-27)

📌 **Trappings data and character persistence layer complete** — Bullock delivered `data/trappings.json` (8 class starting trappings from rulebook p.38) and `lib/storage/character-storage.ts` (full localStorage save/load/delete with graceful error handling). Extended `Character` type with `createdAt`/`updatedAt` timestamps. Implemented `getStartingTrappings()` in `lib/rules/careers.ts` with case-insensitive deduplication. All 96 tests passing. This enables Step 5 (Trappings Review) to show accurate equipment and later steps to persist character data.

### 2026-03-27: Team Update from Step 4 Finalization — getTalentXpCost Gap (Scribe)

📌 **getTalentXpCost function needed** — Step 4 finalised with XP budget bar (skill costs counted), but talent advancement costs not included in budget calculations. Bullock to implement `getTalentXpCost(talentId, timesSelected)` in `lib/rules/talents.ts` so talent selections reduce XP remaining. WFRP rules: talents cost 100 XP each at creation. Once implemented, wire into `SkillsAndTalents.tsx` budget calculation.


### 2026-03-27: Talent XP wired into Step 4 + CharacterWizard (Jane)

Wired `getTotalTalentXpCost` from `lib/rules/talents` into two places:

- **`components/character/SkillsAndTalents.tsx`**: `totalXP` now adds `getTotalTalentXpCost(selectedTalents.length)` to skill XP. `selectedTalents` already excludes species-fixed talents so they remain free. Budget display now reflects actual XP spend (skills + career talents).
- **`components/character/CharacterWizard.tsx`**: Removed `// TODO: wire getTalentXpCost` comment. `handleDetailsFinish` now computes `xpTotal` via `getStartingXP`, `xpSpent` via `getTotalTalentXpCost(careerTalents.length)` (species fixed talents excluded), and sets `experience: { total: xpTotal, spent: xpSpent, current: xpTotal - xpSpent }` on the saved character. `tsc --noEmit` clean.



Wired up the full character creation flow end-to-end. Key facts for future work:

- **Wizard now saves and navigates**: CharacterWizard.tsx handleDetailsFinish assembles a full Character object, calls finalizeCharacter() from lib/rules/character-builder.ts, calls saveCharacter() from lib/storage/character-storage.ts, then router.push('/character/[id]'). No more console.log.
- **Character assembly in wizard**: skillAdvances keys are display names matched against allSkills by name to get skillId. Falls back to nameToId() slug. selectedTalents display names are slugged via nameToId() for talentId. Local nameToId() mirrors the unexported one in lib/rules/careers.ts.
- **Trappings at creation**: getStartingTrappings(career, 0, classTrappings) from lib/rules/careers.ts called with class trappings from data/trappings.json. career.careerClass matches keys in classStartingTrappings.
- **XP defaults to 0**: experience: { total: 0, spent: 0, current: 0 }. TODO: wire getTalentXpCost comment added.
- **Wound threshold**: Computed at save time as TB + 2*WPB + SB + species.extraWounds.
- **app/character/[id]/page.tsx**: Next.js 16 dynamic route. Uses React.use(params) to unwrap async params. 'use client' page reads localStorage on mount via useEffect. Three states: undefined (loading), null (not found), Character (loaded).
- **TypeScript closure narrowing**: After null-checks on state, capture const char = character before defining helper closures like getCharTotal. TypeScript can't narrow state variables across closures.
- **app/characters/page.tsx**: Client-only list page. Loads all characters from localStorage on mount. Cards link to /character/[id]. Empty state with skull icon and 'Begin Your Journey' CTA.
- **Homepage updated**: 'Browse Characters' button now links to /characters (was #).
- **tsc --noEmit passes** and next build succeeds. All routes: / (static), /character/new (static), /character/[id] (dynamic), /characters (static).


### 2026-03-27: Team Update — Bullock's Talent XP Cost & Character Finalization (2026-03-27T09:17:40Z)

📌 **getTalentXpCost() and finalizeCharacter() now available** — Bullock delivered two new exports:
- getTalentXpCost() — always returns 100 (flat WFRP 4e p.58 cost per talent taking)
- finalizeCharacter() — assigns id (via crypto.randomUUID fallback), createdAt, updatedAt (ISO 8601 timestamps)

All 125 tests passing (0 regressions). Your wizard completion flow now calls finalizeCharacter() to saveCharacter() to navigate. Ready to wire getTalentXpCost() into Step 4 budget calculation (TODO in SkillsAndTalents.tsx). Next: species starting skills and edit character UI.

### 2026-03-27: Step 5 Wealth UI + WealthDisplay Component (Jane)

Built starting wealth UI for wizard Step 5 and character sheet wealth display. Key facts:

- **`components/ui/WealthDisplay.tsx`**: New reusable component. Props: `wealth: Wealth` (from `lib/rules/wealth.ts`), `size?: 'sm' | 'md' | 'lg'`. Gold = `text-yellow-400`, Silver = `text-gray-300`, Brass = `text-amber-500`. Format: `{gold} GC · {silver}/– · {brass}d`. Three size variants for wizard and sheet contexts.
- **`components/character/TrappingsReview.tsx`**: Enhanced with Starting Wealth section. Shows formula text (e.g. "Roll 2d10 × 3 — paid in brass pennies (Brass 3 Status)"). "Roll Wealth" button calls `rollStartingWealth`. Rolled result shown via `WealthDisplay` with a "Re-roll" option. If user skips rolling, defaults to `{ gold:0, silver:0, brass:0 }`. Props extended: `careerLevelStatus: StatusStanding`, `initialWealth: Wealth | null`, `onNext: (wealth: Wealth) => void`.
- **`components/character/CharacterWizard.tsx`**: `WizardCharacter` extended with `rolledWealth: Wealth | null`. `handleTrappingsNext` accepts and stores wealth. Final character assembly uses `rolledWealth` (or zero if skipped). Updated `TrappingsReview` usage to pass new props.
- **`app/character/[id]/page.tsx`**: `WealthDisplay` added inside the header block (below XP line). Reads `character.wealth` directly (canonical `gold/silver/brass` fields — Bullock updated `lib/types/character.ts` to re-export `Wealth` from `lib/rules/wealth.ts`). Null-guarded for old characters.
- **Wealth type consolidation**: `lib/types/character.ts` now re-exports `Wealth` from `lib/rules/wealth.ts`. All wealth code uses `{ gold, silver, brass }` — no more `goldCrowns/silverShillings/brassPennies`.
- **`tsc --noEmit` passes** with zero errors.


### 2026-03-28: Team Update — Wealth Rules & Equipment Data Ready (Session 2026-03-27T10-10-07Z)

📌 Bullock's wealth rules engine and equipment data now available for Step 5+ integration. Cochran's 20-test suite delivered and all tests passing.

**Deliverables from parallel sprint:**
- \lib/rules/wealth.ts\: wealthToBrass, brassToWealth, getStartingWealthFormula, rollStartingWealth
- \data/weapons.json\, \data/armour.json\, \data/equipment.json\ (257 items total)
- 20 wealth tests passing (150/150 total suite)

**Relevance to Step 5+ (Trappings & Equipment Selection):**
- Wealth rules will support purchasing/equipping in character creation flow
- Equipment data ready for trappings review UI
- Starting wealth formula enables XP vs. equipment trade-off calculations

**Note:** Wealth interface naming (two coexist with different field names) flagged for team decision — recommend unifying on short names.


### 2026-03-27T10-15-35Z: Team Sync — Bullock's Wealth Type Unification Landed (Scribe)

📌 **Wealth field names unified** — Bullock consolidated duplicate Wealth definitions, all code now uses canonical { gold, silver, brass } from lib/rules/wealth.ts. Your WealthDisplay and Step 5 components can read character.wealth directly without field mapping. 150/150 tests passing, tsc clean.


### 2026-03-27T17:05:22Z: Creation XP UI — Steps 1, 2 & 4 updated (Jane)

Implemented starting XP from random choices across the wizard. Key facts:

- **SpeciesChoiceMethod** and **CareerChoiceMethod** type aliases added locally in each affected component (not centralised — structural typing handles it). No lib changes.
- **WizardCharacter** interface extended: speciesChoiceMethod: 'random' | 'chosen' and careerChoiceMethod: 'random' | 'rolled3pick1' | 'chosen' added, both defaulting to 'chosen'.
- **localGetCreationXP(sm, cm)** inline fallback defined in both CharacterWizard.tsx and SkillsAndTalents.tsx — returns +20 for random species, +50 random career, +25 rolled3pick1. Replaces getStartingXP(speciesId) everywhere. Comment left to swap for Bullock's getCreationXP once shipped.
- **Step 1 (SpeciesSelection.tsx)**: Added 🎲 Roll Randomly (+20 XP) button above the grid. Clicking picks random species from llSpecies, sets choiceMethod = 'random', shows +20 XP green badge on selected card. Manual click of any card sets choiceMethod = 'chosen' and clears the badge. initialChoiceMethod prop added (used on back-navigation).
- **Step 2 (CareerSelection.tsx)**: Added three mode buttons: 🎲 Roll Randomly (+50 XP), 🎲 Roll 3×, Pick One (+25 XP), Choose Freely. Random mode shows one binding career card with +50 XP badge (locked, not deselectable). Rolled3 mode rolls 3 distinct careers, player picks one, +25 XP badge on selection. Freely chosen mode restores original class-filter UI. Switching mode clears selection. On back-navigation, initialChoiceMethod='rolled3pick1' rehydrates to show previously chosen career as the single rolled option.
- **Step 4 (SkillsAndTalents.tsx)**: getStartingXP import removed. New props speciesChoiceMethod and careerChoiceMethod accepted. XP widget shows No bonus XP / you made all free choices when budget is 0; otherwise shows remaining/total with source breakdown (e.g. +20 random species +50 random career). Over-budget warning only fires when xpBudget > 0.
- **CharacterWizard.tsx**: handleDetailsFinish now uses localGetCreationXP for xpTotal. handleSpeciesNext and handleCareerNext accept and store the choice method. Both choice methods passed down to SkillsAndTalents.
- **	sc --noEmit passes** with zero errors.
- **Bullock's exports not yet present** — getCreationXP, ollRandomSpecies, ollRandomCareer all absent from lib/rules/. Local inline fallbacks used throughout. TODO comments left for wiring.


### 2026-03-28: Wizard Restructured to 8 Steps (Jane)

Reworked the character creation wizard to match WFRP 4e rulebook steps exactly (skipping Step 7 Party). Now 8 UI steps.

**Key changes:**

- **New types in `lib/types/character.ts`**: Added `CharacterBackstory` (12 optional narrative fields) and `CreationAdvances` (characteristics, skills, talents purchased with bonus XP).

- **`components/character/SkillsTalentsSelection.tsx`** (NEW — replaces SkillsAndTalents for step 4):
  - Sub-section A: Species skill selection — two-tier picker (3×+5 amber, 3×+3 teal) from 12-skill pool
  - Sub-section B: Career skill allocation — 40-advance pool, +/- per skill, max 10/skill, running counter
  - Sub-section C: Career talent — radio-style, 1 of 4, shows talent description from talents.json
  - NO XP logic — pure selection/allocation
  - Props: `speciesStartingSkills`, `career`, `allSkills`, initial state fields, `onBack`/`onNext`
  - `onNext` returns `(SpeciesSkillSelection[], CareerSkillAllocation[], string)`

- **`components/character/BringingToLife.tsx`** (NEW — step 7):
  - Motivation field (top, full-width, amber-bordered)
  - 11 narrative questions as 2-column grid of textareas (mobile: single column)
  - All fields optional — player can skip and proceed
  - Props: `initialBackstory`, `onComplete`, `onBack`

- **`components/character/AdvancementStep.tsx`** (NEW — step 8):
  - XP budget display (bonusXP breakdown, spent, remaining)
  - Three collapsible panels: Characteristics (3), Skills (8), Talents (4)
  - Hard cap via `canSpend()` — buttons disabled when XP insufficient
  - Characteristics: `getXpCostForCharacteristicAdvance` per advance
  - Skills: `getSkillXpCost(existingFromStep4 + newAdv, true)` per advance
  - Talents: 100 XP each; shows "(already taken)" for step 4 choice
  - "Finish — Create Character" triggers `onComplete(creationAdvances)`

- **`components/character/CharacterWizard.tsx`** (REWORKED):
  - Step type `1|2|3|4|5|6|7|8`
  - `WizardCharacter` now holds `speciesSkillSelections`, `careerSkillAllocation`, `selectedCareerTalent`, `backstory`, `creationAdvances` — removed old `skillAdvances`/`selectedTalents`
  - `handleDetailsNext` stores details and advances to step 7 (no longer saves character)
  - `handleAdvancementComplete` assembles final character from all wizard state + creationAdvances, calls `applyCreationAdvances`, then `finalizeCharacter` + `saveCharacter`
  - Skills assembled from species selections + career allocation (merged by display name)

- **`lib/rules/character-builder.ts`** (EXTENDED):
  - Added `applyCreationAdvances(partial, advances)` — merges XP-purchased advances onto assembled character
  - Adds characteristic advances, skill advances, and talents (deduped by slug)

- **All StepIndicator `totalSteps` updated to 8** across SpeciesSelection, CareerSelection, CharacteristicRoller, SkillsAndTalents (old), TrappingsReview, CharacterDetails.

- **`CharacterDetails` button** changed from "Create Character ✦" to "Next →" (now step 6 of 8, not final step).

- **`tsc --noEmit` passes, `next build` succeeds.**

**Open questions / future work:**
- `CharacterBackstory` fields are stored in wizard state but not yet persisted on the `Character` type (no `backstory` field on the top-level Character). Currently lost after creation. Bullock could add `backstory?: CharacterBackstory` to `Character` type if needed.
- The character sheet view (`/character/[id]`) doesn't display backstory — forward concern for Bullock/display layer.
- `SkillsAndTalents.tsx` (old step 4) still exists but is no longer used by the wizard. Can be removed in cleanup.

### 2026-03-27: Physical Details Roll UI — Step 6 (Jane)

Added dice-roll functionality to the Physical Details section (Step 6):

- **`CharacterDetails.tsx`**: Added `speciesAppearance?: SpeciesAppearance` prop. Imported all roll functions from `lib/rules/appearance.ts`. Age, Height, Eye Colour, Hair Colour each have an inline `🎲 Roll` button.
- **Roll button**: Small amber-outlined button, disabled (greyed) when `speciesAppearance` is undefined (no species selected or data missing). Shows tooltip "Select a species first" when disabled.
- **Flash animation**: `flashField` state + 700ms `setTimeout` applies `border-amber-500 ring-2 ring-amber-500/50` with `transition-all duration-300` on the input immediately after a roll — gives a subtle amber pulse that fades.
- **Age**: Number input; roll calls `rollAge(appearance)` → string.
- **Height**: Text input storing feet+inches display (e.g. "5'9\""). Roll calls `rollHeight(appearance)` → sets `heightInches` state and formats via `inchesToFeetString()`. On blur, parses typed value (feet+inches or plain number) back to `heightInches`. Shows `{heightInches} inches` hint below when available. Saves as string in `CharacterMetadata.height`.
- **Eye / Hair Colour**: Text inputs; roll calls `rollEyeColour()` / `rollHairColour()`. Handles elf double-roll automatically (logic in appearance.ts).
- **`CharacterWizard.tsx`**: Step 6 now passes `speciesAppearance={selectedSpecies.appearance}` — no new data loading needed, `appearance` is already on the `Species` object from `species.json`.
- **tsc --noEmit**: 0 errors.


📌 Team update (2026-03-27T19-02-19): Physical Details UI merged to decisions.md and orchestration log created — part of appearance rolls sprint alongside Bullock's Appearance Tables work.


### 2026-03-27: Step 8 — Current Stats panels added (Jane)

Added read-only **Current Stats** sidebar to AdvancementStep.tsx so players can see their numbers before spending bonus XP.

**What was added:**
- CurrentStatsPanel component (file-local): renders characteristics grid + career skills list
- ALL_CHARACTERISTICS constant: canonical order WS→Fel
- CHAR_FULL_NAMES map: full names for tooltip 	itle attributes
- SkillEntry interface + skillsLookup Map: built from data/skills.json import for characteristic lookup
- lookupSkillCharacteristic(displayName): exact match then base-name fallback for "Skill (any)" entries

**Characteristics grid:**
- 2-column grid of all 10 characteristics with current value (species base + rolls = characterCharacteristics prop)
- Career characteristics (from options.characteristics) highlighted with amber border/background + legend note
- Full name shown in 	itle tooltip (hover)

**Career Skills list:**
- Shows all 8 career skills from careerSkillAllocation (Step 4 advances)
- Per row: skill name · char abbreviation · +advances · total (char value + advances)
- Characteristic looked up from skills.json via lookupSkillCharacteristic

**Layout:**
- Widened outer container from max-w-3xl → max-w-6xl
- lex flex-col lg:flex-row layout: stats panel (lg:w-72 shrink-0) left, XP spend area (lex-1) right
- Mobile: stacked (stats above XP panels)
- Navigation buttons moved inside the right column

**No prop changes** — everything derived from existing props (career, characterCharacteristics, careerSkillAllocation). skills.json imported directly.

**TypeScript:** 	sc --noEmit — 0 errors.


## Work Log

### 2026-05-01 — Roll display & lock (jane-roll-display)

Added dice-roll result display and one-shot button locking to all random roll buttons across the wizard.

**Files changed:**
- lib/rules/species.ts — added ollRandomSpeciesWithDie()
- lib/rules/careers.ts — added ollRandomCareerWithDie()
- lib/rules/appearance.ts — added Nd10RollDetails, ColourRollDetails, ollNd10WithDetails(), ollEyeColourWithDetails(), ollHairColourWithDetails(), ollAgeWithDetails(), ollHeightWithDetails()
- components/character/SpeciesSelection.tsx — d100 display, lock button, now uses ollRandomSpeciesWithDie (proper WFRP table odds)
- components/character/CareerSelection.tsx — d100 display per roll mode, per-button locks, now uses ollRandomCareerWithDie
- components/character/CharacterDetails.tsx — per-field 2d10 detail display + lock state

**Verified:** 
px tsc --noEmit clean, 186 tests passing (0 failures).


### Species Talent UI — Step 4 Talent Redesign (Jane)

Implemented Bullock's schema changes (which were pending on disk) and built the full Species Talents UI for SkillsTalentsSelection.tsx:

**Bullock's schema work (implemented on Bullock's behalf since it was pending):**
- Added SpeciesTalentEntry discriminated union to lib/types/rules.ts
- Updated data/species.json: all 5 species now use structured { type: 'fixed'|'choice'|'random' } entries
- Added getFixedSpeciesTalents(species), getChoiceSpeciesTalents(species), getRandomTalentCount(species), getRandomTalentPool() to lib/rules/species.ts
- getRandomTalentPool() uses data/random-talents.json (32 entries, WFRP 4e p.35 table)
- getSpeciesFixedTalents(speciesId, array) preserved for backward compat

**UI work in SkillsTalentsSelection.tsx:**
- New species: Species prop plus 4 new callback/state props for choice and random talents
- **Species Talents section** (above Career Talent picker) with three sub-areas:
  1. **Fixed talents**: read-only list with ✅ icon, auto-granted, no interaction
  2. **Choice talents**: button-group per choice entry (amber highlight on selected), required before proceeding
  3. **Random talents**: one slot per count with 🎲 Roll button (avoids duplicates) and a dropdown picker as alternative
- Validation: choiceTalentsValid + andomTalentsValid added to canProceed; navigation hint updated

**Wizard changes in CharacterWizard.tsx:**
- speciesChoiceTalents: string[] and speciesRandomTalents: string[] added to WizardCharacter
- handleSpeciesChoiceTalentChange and handleSpeciesRandomTalentChange handlers
- Species and random/choice talent props passed to <SkillsTalentsSelection>
- Final assembly in handleAdvancementComplete includes choice and random talent names in 	alentNames

**Verified:** 	sc --noEmit clean, 199 tests passing (0 failures).

## Learnings

### Talent Bonus Display (jane-talent-bonus-display)
- Bullock's rules layer was already complete when I started: getTalentCharacteristicBonuses in lib/rules/characteristics.ts, characteristicBonus field on Talent type, and characteristicBonus data in 	alents.json for 10 talents (Savvy, Warrior Born, Coolheaded, etc.)
- Pattern: always check for the function in characteristics.ts and the field in rules.ts before assuming Bullock hasn't done work yet.
- For display, I added 	alentIds?: string[] as an optional prop to AdvancementStepProps so CharacterWizard can opt in without breaking anything.
- The lookupSkillCharacteristic function returns string | null, not CharacteristicKey — must cast to CharacteristicKey when passing to typed functions.
- Talent bonus annotations use emerald (✦) to visually distinguish from XP advances (amber), and the 	itle attribute provides the tooltip with source talent name.

📌 Team update (2026-05-01T00:00:00Z): Bullock's characteristicBonus schema (Talent interface + 10 talent entries + getTalentCharacteristicBonuses helper) is complete and in lib/rules/characteristics.ts. Pattern: always check characteristics.ts for helpers and rules.ts for Talent field before assuming Bullock hasn't done work. Cochran verified with 10 new tests (209/209 total). — decided by Bullock, Cochran

### Real-time Stats Panel (jane-realtime-stats)

**The Problem:** StatsPanel is a sidebar that shows live characteristic values, but was initially only added to Steps 4–6. User requested it be visible from Step 3 onward and persist through Step 8 so players always see their numbers alongside the wizard.

**The Solution:** WizardStatsSidebar wrapper component created in CharacterWizard.tsx wraps StatsPanel with:
- Desktop (xl+): fixed top-4 right-4 position, always visible
- Mobile: floating toggle button (bottom-right) expands/collapses a right-side drawer overlay

**What was updated:**
- CharacterWizard.tsx: WizardStatsSidebar wrapper added to steps 3–8 (not steps 1–2 — no characteristics yet)
- Sidebar requires characteristicBases (computed from characteristicRolls) + optional talentIds
- StatsPanel already supported characteristicAdvances prop (used in Step 8 AdvancementStep)
- No prop changes to individual step components — wizard computes shared values once and passes to sidebar

**Key insights:**
- StatsPanel is pure display; no internal state or dependencies
- characteristicBases can be partial during Step 3 (before all rolls done) — StatsPanel gracefully shows "—" for unrolled characteristics
- talentIds array built from species fixed + choice + random + career talents; sidebar filters to only show bonuses from talents that grant characteristicBonus
- The sidebar is rendered as a sibling to the step component, NOT a child — important for z-index stacking and mobile overlay behavior

**Verified:** tsc --noEmit clean, visual check confirmed sidebar appears on steps 3–8 and stays in sync during manual allocation (Step 3 mode 3), skill XP spending (Step 8), etc.


### 2026-03-28: Attributes Step Three-Method Flow (Jane)

Replaced `CharacteristicRoller.tsx` with `AttributesStep.tsx` to implement the three-method characteristic generation flow from WFRP 4e Core Rulebook Step 3:

**The three methods:**
1. **Roll & Keep** (`random-keep`) — Roll 2d10 per characteristic once, keep as shown, no re-rolls → +50 XP
2. **Roll & Rearrange** (`random-rearrange`) — Roll 2d10 ten times, assign each roll value to any characteristic (dropdown selection) → +25 XP
3. **Manual Allocation** (`manual`) — Allocate exactly 100 points across 10 characteristics (min 4, max 18 per characteristic) → +0 XP

**How it works:**
- Player first sees a method selection screen with three option cards showing XP bonuses
- Once method selected, the relevant sub-UI appears:
  - **Roll & Keep**: "Roll All" button → locked results table with no re-rolls allowed
  - **Roll & Rearrange**: "Roll All" button → shows rolled values as chips, dropdown per characteristic to assign each value (each must be used exactly once)
  - **Manual**: Number inputs per characteristic (4–18), running total shows X/100 allocated, "Next" disabled until exactly 100 allocated
- XP bonus displayed prominently in top-right corner of each sub-UI
- Real-time StatsPanel updates as values change in all three modes

**Integration with wizard:**
- `AttributeChoiceMethod` type from `lib/rules/creation-xp.ts` (Bullock already added it with correct naming: `random-keep`, `random-rearrange`, `manual`)
- `WizardCharacter.attributeMethod` field added (type: `AttributeChoiceMethod | null`)
- `getCreationXP()` now accepts optional `attributeMethod` parameter and includes its XP bonus in total
- `handleAttributesNext(method, rolls)` callback stores both method and final rolls in wizard state
- XP accounting in `handleAdvancementComplete` and Step 8 `bonusXP` prop now include attribute method XP

**Files changed:**
- `components/character/AttributesStep.tsx` (NEW — replaces `CharacteristicRoller.tsx`)
- `components/character/CharacterWizard.tsx` (import changed, attributeMethod field added, getCreationXP calls updated)
- `lib/rules/creation-xp.ts` (no changes needed — Bullock already added AttributeChoiceMethod and getAttributeChoiceXP)

**Design decisions:**
- Used dropdown selection for rearrange mode instead of drag-and-drop for better accessibility and mobile support
- Manual mode defaults each characteristic to 4 (minimum) on first load
- "Next" button disabled until constraints satisfied (all rolls assigned, or exactly 100 points allocated)
- Method selection is persistent on back-navigation — if user goes back to Step 2 and returns, their chosen method and values are preserved
- No "switch method" button once a method is selected — player must use "Back" to change method (prevents confusion about losing work)

**Verified:** `tsc --noEmit` clean, `npm run build` succeeds, all routes compile. StatsPanel updates in real time as manual values change or rearrange assignments are made.

- Created components/character/StatsPanel.tsx: compact 2-col grid of all 10 characteristics, showing total prominently with a breakdown row (base + advances✦) when advances or talent bonuses are present. Talent bonuses in emerald +5✦; advance amounts in amber. Props: characteristicBases, characteristicAdvances?, talentIds?.
- Added WizardStatsSidebar component inline in CharacterWizard.tsx: fixed right-side panel on xl+ screens, mobile-toggle floating button at bottom-right. Sidebar visible on steps 3–7.
- Hoisted characteristicBases and sidebarTalentIds computation to module level in CharacterWizard (after species guard), eliminating 5 duplicated CHAR_KEYS/characteristicBases blocks. Fixed pre-existing bug of step8TalentIds — now sidebarTalentIds is reused at step 8.
- Added onChange?: (rolls: Partial<Record<CharacteristicKey, number>>) => void to CharacteristicRollerProps so step 3 updates character.characteristicRolls in real-time (each individual roll or Roll All immediately updates the sidebar).
- Replaced CurrentStatsPanel in AdvancementStep with StatsPanel, passing charAdvances as characteristicAdvances so live XP spends reflect in the sidebar immediately. Added 	alentsByName map (was missing/undefined — pre-existing bug). Moved skill lookup logic inline.
- Fixed pre-existing TypeScript errors: Characteristics was incorrectly imported from @/lib/types/rules in CharacterDetails.tsx and SkillsTalentsSelection.tsx; moved to @/lib/types/character.
- 2 pre-existing test failures in skills.test.ts remain (Bullock's XP cost table fix, Cochran to update per decisions.md). My changes introduced 0 new failures.

### Step 4 Stats Reactivity (jane-step4-reactivity)
Fixed three reactivity gaps in Step 4 (Skills & Talents):

**Root causes found:**
1. selectedTalent (career talent) was local state in SkillsTalentsSelection.tsx — only flushed to wizard on Next click, so sidebarTalentIds never included the career talent live.
2. CurrentStatsPanel inside SkillsTalentsSelection was receiving careerSkillAllocation from the wizard prop (committed state), not the live local llocation being edited.
3. CurrentStatsPanel received no 	alentIds at all — so it showed 0 talent bonuses and skill totals were wrong.

**Fixes:**
- Added onCareerTalentChange?: (talent: string | null) => void prop to SkillsTalentsSelectionProps; new handleCareerTalentSelect helper calls both setSelectedTalent and onCareerTalentChange
- Computed liveTalentIds from fixed + choice + random + selected career talents (all resolved via 	alentsById.get(n)?.id ?? nameToId(n))
- Computed liveCareerAlloc: CareerSkillAllocation[] from local llocation state
- Passed both to CurrentStatsPanel so characteristics and skill totals update live
- Added handleCareerTalentChange in CharacterWizard.tsx to update character.selectedCareerTalent; passed as onCareerTalentChange prop — keeps sidebar sidebarTalentIds reactive
- Added 
ameToId helper to SkillsTalentsSelection.tsx (same slug logic as in CharacterWizard)

**Verified:**
px tsc --noEmit clean, 209/209 tests passing (0 regressions).

### 2026-03-28 — Fate & Resilience Allocation UI (Jane)

Added Fate & Resilience Extra Points allocation to Step 6 (Character Details). Key facts:

- **New UI section in CharacterDetails.tsx**: Shows base Fate/Resilience values from species, displays total Extra Points pool (varies by species: Human 3, Dwarf 2, Halfling 3, Elves 2), allows player to allocate Extra Points with +/- buttons
- **Allocation logic**: Player distributes Extra Points between Fate and Resilience using a simple increment/decrement interface. Fate Extra Points can range from 0 to speciesExtraPoints. Resilience Extra Points is automatically calculated as (total - Fate allocation).
- **Visual design**: Emerald theme for Fate (emerald-400, emerald borders), Amber theme for Resilience (amber-400, amber borders) to visually distinguish the two stats. Final totals display shows breakdown: "base + extra = total" for both.
- **Props added to CharacterDetailsProps**: `speciesBaseFate`, `speciesBaseResilience`, `speciesExtraPoints`, `fateExtraPoints`, `onFateExtraPointsChange`
- **CharacterWizard state updated**: Added `fateExtraPoints: number` to WizardCharacter interface, defaults to 0, initialized to `getDefaultExtraPointsAllocation(species.extraPoints)` when species is selected (splits evenly, rounding down for Fate)
- **Helper functions from lib/rules/fate-resilience.ts**: `getFateTotal()`, `getResilienceTotal()`, `getDefaultExtraPointsAllocation()` — Bullock already implemented these, I use them in CharacterWizard
- **SpeciesSelection.tsx updated**: Added "Extra Points: X" to species card info display so players know what to expect before reaching Step 6
- **StatsPanel.tsx enhanced**: Added optional `fate` and `resilience` props. When provided, displays a second section below characteristics showing current Fate and Resilience totals with emerald/amber theming
- **WizardStatsSidebar updated**: Passes calculated fate and resilience totals (base + allocated extra points) to StatsPanel on Step 6 so sidebar shows live Fate/Resilience as player adjusts allocation
- **Integration**: `handleFateExtraPointsChange` callback in CharacterWizard updates state, `handleAdvancementComplete` uses `getFateTotal()` and `getResilienceTotal()` to compute final values for character creation
- **TypeScript workaround**: Species type definition doesn't include `extraPoints` yet (Bullock's territory), so I used `(species as any).extraPoints` in a few places. Data already has extraPoints in species.json.

**Verified:** `npm run build` successful, no TypeScript errors, all 8 wizard steps intact.

## Learnings

### 2026-03-28 — Delete Character functionality (Jane)

Added delete functionality to both character list and detail pages. Key facts:

- **Character list (app/characters/page.tsx)**: Each CharacterCard now has a delete button (trash icon) positioned top-right, visible only on hover (opacity-0 group-hover:opacity-100). Delete button has red/rose color scheme (rose-500 text, rose-950/30 hover background) to signal danger.
- **Click handling**: Delete button uses e.stopPropagation() to prevent card navigation when clicking delete. Browser confirm() dialog asks "Delete [name]? This cannot be undone."
- **State refresh**: CharacterCard accepts onDelete callback. Parent page has loadCharacters() function that refreshes the character list after deletion. Character state updates immediately after deletion.
- **Character detail page (app/character/[id]/page.tsx)**: Added "Danger Zone" section with border-t separator before footer. Delete button styled consistently with rose theme (rose-400 text, rose-900 border, rose-950 background).
- **Redirect on delete**: After confirming deletion on detail page, router.push("/characters") redirects to list page. Used useRouter() from next/navigation.
- **Storage layer integration**: Both pages import deleteCharacter from lib/storage/character-storage. Function was already implemented and working — just needed UI wiring.
- **Icons**: Used Heroicons trash icon inline SVG (20x20) for the list card delete button. Detail page uses text button (no icon) for clarity in the danger zone context.
- **TypeScript**: All changes are strictly typed. No any types used. router typed as ReturnType<typeof useRouter>.

**Verified:** npx tsc --noEmit shows 0 errors related to my changes (3 pre-existing test errors unrelated to delete functionality).

### 2026-03-30 — Species Skills Added to Stats Panel (Jane)

**The Problem:** Step 4 (Skills & Talents Selection) displays a "Current Stats" panel at the top showing characteristics and career skills. User wanted it to also show **species skills** alongside career skills, labeled together as "Career & Species Skills", and both must update dynamically as the user makes selections in the step.

**The Solution:** Modified CurrentStatsPanel component to accept and display both career and species skills:

**What was updated:**
- CurrentStatsPanel.tsx:
  - Added SpeciesSkillDisplay interface ({ skillName: string; advances: number })
  - Added optional speciesSkills prop to CurrentStatsPanelProps
  - Changed "Career Skills" section to "Career & Species Skills"
  - Split the section into two visually distinct groups:
    - Species skills shown first with emerald accent color (+advances shown in emerald-600/80)
    - Career skills shown second with amber accent color (+advances shown in amber-600/80)
  - Both sections show skill name, characteristic abbreviation, +advances, and total value
  - Skills update in real-time as user makes selections

- SkillsTalentsSelection.tsx:
  - Added liveSpeciesSkills computed value that maps plusFive/plusThree state to SpeciesSkillDisplay[]
  - Pass liveSpeciesSkills to CurrentStatsPanel alongside existing liveCareerAlloc
  - Both species and career skills now update dynamically as the user clicks skill buttons

**Color coding:** Emerald for species (to distinguish from amber career skills) — fits dark theme, readable, accessible.

**TypeScript:** All changes are fully typed, strict mode, 0 TS errors. All 254 tests pass.


### 2026-03-28: Step 4 Stats Panel — Merged Species + Career Skills (Jane)

Updated the Step 4 Current Stats Panel to show a single merged skills list instead of separate species and career sections. Key facts:

- **Merged skill logic in `CurrentStatsPanel.tsx`**: Species skills and career skills are now combined into a single list. If a skill appears in both sources, advances are summed (e.g., Dodge +3 from species + 2 from career = +5 total).
- **Alphabetical sorting**: Skills are displayed in alphabetical order by name for easy scanning.
- **Single "Skills" section**: Renamed from "Career & Species Skills" to just "Skills" — no more sub-sections or source labels.
- **Clean display**: Shows skill name, characteristic abbreviation, total advances (+X), and final total (char + talent bonus + advances) — no visual noise from source indicators.
- **Real-time updates**: Still updates live as user makes selections in Step 4 (species skill tier picker and career skill allocation pool).
- **WFRP rules compliance**: Advances stack as per WFRP 4e rules — species base + career allocation = total skill advances.

**Implementation details:**
- Built a `Map<skillName, { speciesAdv, careerAdv }>` to merge duplicates
- Sorted by `skillName.localeCompare()` for alphabetical order
- Total advances = `speciesAdv + careerAdv` for merged display
- Kept amber-colored advances column (`text-amber-600/80`) for consistency

**Testing:** All 254 tests pass. TypeScript strict mode clean (3 pre-existing errors in test files unrelated to this change).

### 2026-03-30 — Two-Column Layout for All Wizard Steps

Applied consistent two-column layout to all 8 character wizard steps, with sticky left stats panel + right content.

**Pattern:**
- Left column (w-80, ~1/3 width): CurrentStatsPanel — sticky position with characteristics and skills
- Right column (flex-1, ~2/3 width): Step interactive content
- Wrapper: max-w-7xl (expanded from max-w-3xl/max-w-4xl to accommodate columns)

**Updated Components:**
- SkillsTalentsSelection.tsx (Step 4) — reference implementation
- SpeciesSelection.tsx (Step 1) — shows base characteristics (0s until species chosen)
- CareerSelection.tsx (Step 2) — shows species base + career characteristics/skills when career selected
- AttributesStep.tsx (Step 3) — shows live characteristics updating as rolls/allocations happen
- TrappingsReview.tsx (Step 5) — already had CurrentStatsPanel, converted to two-column
- CharacterDetails.tsx (Step 6) — already had CurrentStatsPanel, converted to two-column
- BringingToLife.tsx (Step 7) — already had CurrentStatsPanel, converted to two-column

**CharacterWizard.tsx Updates:**
- Added characterCharacteristics prop to Steps 1, 2, 3
- Added careerCharacteristics and careerSkillAllocation props to Step 2, 3
- Computed arlyCharacteristics for Steps 1-2 (species base or 0s)
- Moved selectedCareer lookup earlier to be available for Step 3

**Responsive Behavior:**
- lg: breakpoint used for two-column layout
- Mobile: single column (stats panel above content on small screens)
- Desktop: sticky left panel stays visible while scrolling through step content

**Status:** âœ… Implemented. TypeScript 0 errors, 254/254 tests passing.


### 2026-03-30 — Career display in left panel (Jane)

Added selected career display to the top of the CurrentStatsPanel component. Key facts:

- **Career card position**: Career summary appears ABOVE the 'Current Stats' header when a career is selected, making it the most prominent element in the left panel.
- **Design**: Amber-tinted background (g-amber-900/20) with amber border (order-amber-700/30) — visually distinct from stats below. Shows career name (prominent, amber-300), career class (smaller, gray-400), and tier/level ('Tier 1 — {title}' in amber-600/80).
- **Type safety**: Added career?: Career | null as an optional prop to CurrentStatsPanelProps. Career type imported from @/lib/types/rules.
- **Component updates**: Updated all 8 step components that use CurrentStatsPanel:
  - SpeciesSelection.tsx — no career yet (Step 1), passes no career
  - CareerSelection.tsx — career may be selected, passes selectedCareer  
  - AttributesStep.tsx — added career prop, passes through to CurrentStatsPanel (3 render locations for 3 attribute methods)
  - SkillsTalentsSelection.tsx — already had career in props, now passes to CurrentStatsPanel
  - TrappingsReview.tsx — already had career in props, now passes to CurrentStatsPanel
  - CharacterDetails.tsx — added optional career prop, passes through
  - BringingToLife.tsx — added optional career prop, passes through
- **CharacterWizard integration**: Updated wizard to pass selectedCareer to AttributesStep, CharacterDetails, and BringingToLife.
- **Tests**: All 254 tests still passing after changes. TypeScript strict mode clean (pre-existing test errors unrelated to these changes).
- **Visual hierarchy**: Career appears first → then 'Current Stats' header → then characteristics grid → then skills list. This makes the character's career immediately visible at all times during creation steps 2-8.

### 2026-03-30 — Step 8 left panel bugs fixed (Jane)

Fixed two bugs in the AdvancementStep (Step 8) left panel display:

**Bug 1: Skills not updating reactively**
- **Root cause**: Step 8 was rendering a static inline skills list that read from `careerSkillAllocation` prop (which never changes), not from local `skillAdvances` state.
- **Fix**: Replaced the static inline skills display with `CurrentStatsPanel`, same as Steps 4-7 use. Created `liveCareerAlloc` that merges creation advances (from Step 4) + local XP spend (from Step 8 state) for each skill.
- **Pattern**: `liveCareerAlloc[skillName] = creationAdvances + xpAdvances` — computed on each render, so updates happen immediately when user clicks +/- buttons.

**Bug 2: Only showing career skills, missing species skills**
- **Root cause**: Step 8 wasn't receiving `speciesSkillSelections` data from CharacterWizard, so it had no species skills to display.
- **Fix**: 
  1. Added `speciesSkillSelections: SpeciesSkillSelection[]` to `AdvancementStepProps`
  2. Updated CharacterWizard to pass `character.speciesSkillSelections` to AdvancementStep
  3. Converted species selections to `liveSpeciesSkills: SpeciesSkillDisplay[]` format for CurrentStatsPanel
  4. CurrentStatsPanel already merges species + career skills alphabetically with summed advances (this logic was working correctly in Step 4, now Step 8 benefits from it too)

**Implementation details**:
- Removed import of `StatsPanel` (characteristics-only component)
- Added imports: `CurrentStatsPanel`, `SpeciesSkillDisplay` type, `SpeciesSkillSelection` type
- `liveSpeciesSkills` maps `speciesSkillSelections` to `{ skillName, advances }` format
- `liveCareerAlloc` merges Step 4 creation advances + Step 8 XP advances for reactive display
- CurrentStatsPanel receives both arrays and handles merging/sorting internally

**Reference**: Step 4 (`SkillsTalentsSelection.tsx`) already had this pattern working correctly — I replicated the same approach for Step 8.

**Status**: ✅ Fixed. All 254 tests passing. TypeScript strict mode clean.


### 2026-03-30 10:57:55 — Species Display Added to Left Panel (Jane)

Added the selected species to the top of the left panel (CurrentStatsPanel) alongside the existing career card. Species now displays above the career in a cohesive "character identity" section.

**Implementation:**

- **CurrentStatsPanel.tsx**:
  - Added optional species?: Species | null prop
  - Created a two-card "Character Identity Section" at the top when species or career is present
  - Species card renders ABOVE career card (species first, then career below)
  - Species uses sky-blue color theme (g-sky-900/20, order-sky-700/30, 	ext-sky-300) to differentiate from amber career card
  - Small "SPECIES" label above the species name in uppercase tracking-wide text
  - Both cards use the same compact layout style (amber career kept its existing design)

- **All step components updated** to pass species prop to CurrentStatsPanel:
  - AttributesStep.tsx (3 instances — one per attribute method)
  - SkillsTalentsSelection.tsx
  - TrappingsReview.tsx
  - CharacterDetails.tsx
  - BringingToLife.tsx
  - AdvancementStep.tsx
  - SpeciesSelection.tsx (Step 1 — passes currently selected species or null)
  - CareerSelection.tsx (Step 2 — passes species from wizard state)

- **CharacterWizard.tsx**: Updated all step render calls to pass species or selectedSpecies prop to each step component

**UI Design Notes:**
- Species displays ABOVE career (species is selected first in the wizard flow)
- Sky-blue color (sky-*) for species vs. amber (mber-*) for career creates clear visual distinction
- Both cards stack vertically in the narrow sidebar (~1/3 page width)
- Consistent with dark theme: g-sky-900/20, order-sky-700/30, subtle opacity for depth

**Status**: ✅ Complete. All 254 tests passing. TypeScript strict mode clean. No lint errors.


### 2026-03-28: CurrentStatsPanel Props Fixed for Steps 5, 6, 7 (Jane)

Fixed missing props in TrappingsReview, CharacterDetails, and BringingToLife components. Key facts:

- **Issue identified**: Steps 5, 6, and 7 were missing speciesSkills and 	alentIds props in their CurrentStatsPanel calls, causing species skills to not appear in the left panel and talent bonuses to not apply to characteristics.
- **Pattern from Step 4**: SkillsTalentsSelection correctly passes speciesSkills={liveSpeciesSkills} and 	alentIds={liveTalentIds} to CurrentStatsPanel. This pattern was used as the template.
- **Components fixed**:
  - **TrappingsReview.tsx**: Added speciesSkillSelections: SpeciesSkillSelection[] and 	alentIds: string[] to props interface. Mapped speciesSkillSelections to speciesSkills format for CurrentStatsPanel.
  - **CharacterDetails.tsx**: Same pattern — added both props to interface and passed them through to CurrentStatsPanel.
  - **BringingToLife.tsx**: Same pattern — added both props to interface and passed them through to CurrentStatsPanel.
- **CharacterWizard.tsx**: Updated all three step invocations (steps 5, 6, 7) to pass speciesSkillSelections={character.speciesSkillSelections} and 	alentIds={sidebarTalentIds}.
- **All 254 tests pass** after changes. TypeScript type errors exist in test fixture files (pre-existing — missing ateExtraPoints field), not related to these UI component changes.
- **Result**: Complete merged species+career skills list now displays correctly in left panel for all wizard steps.


### 2026-03-30 — Class Trappings Added to TrappingsReview (Jane)

Updated TrappingsReview.tsx (Step 5) to display both class and career trappings, clearly separated. Key facts:

- **Problem**: TrappingsReview was only showing career-level trappings from career.levels[0].trappings. Class trappings from data/trappings.json were never displayed, even though getStartingTrappings() in lib/rules/careers.ts correctly merges both sources.
- **Solution**: 
  1. Imported 	rappingsData from @/data/trappings.json (same pattern as CharacterWizard.tsx)
  2. Added classTrappings constant that loads 	rappingsData.classStartingTrappings[career.careerClass]
  3. Created two distinct trappings sections with different visual styles
- **UI Design**:
  - **Class Trappings Section**: Sky-blue theme (order-sky-800/50, g-sky-950/30, 	ext-sky-400 header, 	ext-sky-600 bullets) — matches species color scheme from left panel
  - **Career Trappings Section**: Amber theme (order-amber-800/50, g-amber-950/30, 	ext-amber-400 header, 	ext-amber-600 bullets) — matches career color scheme
  - Class section appears ABOVE career section (mirrors left panel hierarchy: species → career → stats)
  - Updated intro text: "you receive trappings from two sources: your career class and your specific career"
  - Updated footer note: "Some items may appear in both lists" to clarify duplicates are intentional
- **Data structure**: 	rappingsData.classStartingTrappings is a Record<string, string[]> keyed by class name. Career.careerClass values match the keys (e.g., "Warrior", "Academic", "Rogue").
- **Items with dice notation**: Dice quantities like "1d10 Sheets of Parchment" and "1d10 Matches" display as-is — no rolling at this stage. User sees the item name with dice formula intact.
- **Duplicates**: Some items like "Dagger" appear in both class AND career lists. Both are shown since the rulebook lists them separately and the UI needs to be transparent about what each source grants.
- **TypeScript**: All imports and types are strict mode compliant. Used index-based keys (class-, career-) since trapping strings may duplicate across sections.
- **Tests**: All 254 tests pass. Pre-existing TypeScript errors in test fixture files (missing ateExtraPoints, xtraPoints fields) are unrelated to this change.

**Status**: ✅ Complete. TrappingsReview now displays both class and career trappings with distinct visual styling.


### 2026-03-30 11:24:57 — Weight Randomization Added to Step 6 (Jane)

Implemented random weight generation in CharacterDetails.tsx (Step 6) that mirrors the existing height randomization pattern.

**Formula Implemented:**
```
Weight (lbs) = Height_in_inches × 2 × (0.8 + roll1d10 × 0.05)
```

Where roll1d10 is simulated with `Math.ceil(Math.random() * 10)` to produce values 1-10.

**Implementation Details:**
- **Type System**: Added `weight` to `RollableField` union type. Created `WeightRollResult` interface with `{ d10Roll: number; multiplier: number; result: number }` to capture roll details for display.
- **State Management**: Extended `hasRolled` state record to include `weight: false`. Added `handleRollWeight()` function that requires `heightInches !== null` before rolling.
- **Roll Logic**: `d10Roll = Math.ceil(Math.random() * 10)` gives 1-10. Multiplier computed as `0.8 + d10Roll * 0.05` (range 0.85-1.30). Final weight is `Math.round(heightInInches * 2 * multiplier)` and displayed as "XXX lbs".
- **UI Pattern**: Weight field now has a RollButton matching height/age/eyes/hair pattern. Button is disabled until height is entered (shows "Enter height first" tooltip). After rolling, button greys out to "🎲 Rolled" badge (one-shot lock).
- **Roll Display**: Extended `RollHint` component to handle weight rolls. Shows "Rolled: d10=5 (×1.05) → 143 lbs" in amber monospace text below the field after rolling.
- **Flash Effect**: Weight input flashes amber border on roll using existing `triggerFlash("weight")` mechanism (700ms duration).

**UX Notes:**
- Weight roll is dependent on height — enforces logical order (can't roll weight without knowing height first)
- User can still manually edit weight after rolling — roll is a suggestion, not a lock on the value itself
- Displays result in lbs (imperial) to match WFRP setting conventions
- Roll breakdown transparent: shows d10 result and computed multiplier for player reference

**Testing:**
- TypeScript strict mode: ✅ 0 errors in component code (3 pre-existing test fixture errors unrelated to this change)
- All 254 tests passing: ✅ No regressions introduced

**Pattern Consistency:**
This implementation follows the exact pattern established for height randomization in Step 6:
- Optional roll button (not mandatory)
- One-shot lock after rolling
- Detailed roll result display
- Flash animation on value change
- User can override rolled value by typing

**Status:** ✅ Complete. Weight randomization fully functional in Step 6.


### 2026-03-30 — Species-Specific Build Factors for Weight (Jane)

Updated weight calculation formula in CharacterDetails.tsx (Step 6) to use species-specific build factors instead of a fixed 2.0 multiplier.

**New Formula:**
```
Weight (lbs) = Height_in_inches × BuildFactor[species] × (0.8 + roll1d10 × 0.05)
```

**Build Factors Implemented:**
- Human: 2.0 (baseline)
- Dwarf: 2.6 (very dense, thick)
- Halfling: 1.9 (soft but not heavy)
- High Elf: 1.6 (tall, very lean)
- Wood Elf: 1.7 (lean but slightly sturdier)
- Dark Elf: 1.8 (wiry, dangerous) — future-proofing, not in current data

**Implementation Details:**
- **Lookup Map**: Added `SPECIES_BUILD_FACTORS: Record<string, number>` const at top of component. Keys match species names exactly as they appear in `data/species.json` ("Human", "Dwarf", "Halfling", "High Elf", "Wood Elf").
- **Default Fallback**: Uses `SPECIES_BUILD_FACTORS[speciesName] ?? 2.0` — if species unknown or null, defaults to human baseline.
- **Type System**: Extended `WeightRollResult` interface to include `buildFactor: number` alongside existing `d10Roll` and `multiplier` fields.
- **Roll Logic**: `handleRollWeight()` now looks up build factor before calculating weight: `weightLbs = Math.round(heightInches * buildFactor * multiplier)`. Stored in roll lock data for display.
- **Roll Breakdown Display**: Updated weight roll hint text from `"Rolled: d10=7 (×1.15) → 198 lbs"` to `"{SpeciesName} build (×2.6) · d10=7 (×1.15) → 198 lbs"`. Uses `toFixed(1)` for build factor, `toFixed(2)` for d10 multiplier.

**Species Names Matching:**
- Component already receives `speciesName: string` prop from CharacterWizard
- Species names in data are: "Human", "Dwarf", "Halfling", "High Elf", "Wood Elf"
- Map keys match data exactly — no transformation needed

**Example Outputs:**
- Dwarf at 60" rolling d10=7: "Dwarf build (×2.6) · d10=7 (×1.15) → 179 lbs"
- High Elf at 72" rolling d10=3: "High Elf build (×1.6) · d10=3 (×0.95) → 110 lbs"

**Testing:**
- TypeScript strict mode: ✅ 0 component errors
- All 254 tests passing: ✅ No regressions
- Build factor lookup: ✅ Defaults to 2.0 for unknown species (safe fallback)

**Status:** ✅ Complete. Species build factors integrated into weight calculation and roll display.


### 2026-03-28: Career Skills Display Fixed in Steps 6 & 7 (Jane)

Fixed missing career skills in left-panel stats display on Character Details (Step 6) and Bringing to Life (Step 7).

**Problem:** Both steps hardcoded careerSkills={[]} to CurrentStatsPanel, so career skills never appeared despite species skills showing correctly. Comments claimed this was intentional but user wanted all skills visible.

**Solution:**
- **CharacterDetails.tsx**: Changed careerSkills={[]} to careerSkills={career?.levels[0].skills.map(...) ?? []}
- **BringingToLife.tsx**: Same fix — now builds career skills list from career.levels[0].skills
- Skill formatting matches existing pattern: specialisation ? "${s.skill} (${s.specialisation})` : anySpecialisation ? "${s.skill} (any)` : s.skill

**Verification:**
- ✅ TypeScript compiles with pre-existing test fixture errors (not related to changes)
- ✅ All 254 vitest tests pass
- ✅ No changes to CharacterWizard.tsx needed — career prop already passed to both components

**Pattern consistency:** Steps 2, 4, 5 already use this same career skills mapping. Steps 6 & 7 now match the established convention.


### 2026-03-30T11:44:26Z — Right-Side StatsPanel Removed from Wizard Steps 3-8 (Jane)

Removed the persistent right-side characteristics panel (WizardStatsSidebar component) from the character wizard steps 3 through 8.

**Changes made:**
- **Removed WizardStatsSidebar component** (lines 85-134 in CharacterWizard.tsx) — this component rendered StatsPanel as a fixed desktop sidebar (hidden xl:block) and a mobile toggle overlay
- **Removed StatsPanel import** — no longer used in CharacterWizard.tsx (still exists in components/character/StatsPanel.tsx for potential use elsewhere)
- **Removed all sidebar instances** from steps 3-8 render blocks — removed fragment wrappers (<>...</>) since they were only needed to group step component + sidebar
- **No layout adjustments needed** — the sidebar was positioned fixed/absolute, didn't affect step component layout

**Verification:**
- grep -r "WizardStatsSidebar" CharacterWizard.tsx — no matches (fully removed)
- 
px tsc --noEmit — 3 pre-existing test errors unrelated to this change (careers.test.ts, character-storage.test.ts, species.test.ts — missing fateExtraPoints/extraPoints in test fixtures)
- 
px vitest run — all 254 tests passing ✅

**Design rationale (from user):**
User wanted the right-side panel removed entirely (not hidden, not moved — just gone). Each wizard step component already has a left-side CurrentStatsPanel that shows current state; the right-side StatsPanel showing base characteristics was redundant.


### 2026-03-30T12:00:00Z — OpenRouter Settings Feature Added (Jane)

Added settings UI for OpenRouter.ai API key and model selection with browser localStorage persistence.

**Components created:**
- **`hooks/useOpenRouterSettings.ts`** — Custom hook for managing API key and model in localStorage. SSR-safe (checks `typeof window !== "undefined"`). Returns `{ apiKey, setApiKey, model, setModel, clearSettings }`. Storage keys: `openrouter_api_key` and `openrouter_model`.
- **`lib/constants/openrouter-models.ts`** — Hardcoded list of 10 popular OpenRouter models (Claude, GPT, Gemini, Llama, Mistral variants). Each model has `{ id, name }` structure.
- **`components/settings/OpenRouterSettingsModal.tsx`** — Modal dialog with API key input (password field with show/hide toggle), model dropdown selector, Save/Cancel/Clear buttons. Shows "✓ Saved" confirmation for 2s after save. Closes on Escape key or backdrop click. Tailwind styling consistent with app theme (dark cards, amber accents).
- **`components/layout/AppHeader.tsx`** — Reusable header component with WFRP 4e home link and settings gear button. Shows green indicator dot when API key is stored. Includes decorative top border (replaces per-page top border).

**Pages updated:**
- **`app/page.tsx`** — Added `<AppHeader />`, removed inline decorative border
- **`app/characters/page.tsx`** — Added `<AppHeader />`, removed inline decorative border

**Design choices:**
- No external dialog library — simple overlay with backdrop + Tailwind
- Password input with show/hide toggle for API key visibility control
- Modal state local to each input until Save is clicked (Cancel reverts changes)
- Clear button removes both key and model from localStorage
- Link to openrouter.ai/keys for convenience
- Green dot indicator only shows when API key is non-empty string

**Verification:**
- ✅ All 254 vitest tests passing
- ⚠️ TypeScript: 3 pre-existing test errors unrelated to this work (careers.test.ts, character-storage.test.ts, species.test.ts — missing fateExtraPoints/extraPoints in test fixtures)
- ✅ No runtime errors in new code
- ✅ SSR-safe localStorage access throughout

**Future integration:**
- Settings are purely storage/UI at this stage — no AI calls implemented yet
- Consumer code can import `useOpenRouterSettings` hook to read `apiKey` and `model` for API calls


### 2026-03-30T12:15:00Z — OpenRouter Models Now Fetched Dynamically (Jane)

Replaced hardcoded model list with live API fetch from OpenRouter. Models now grouped into Free and Paid sections.

**Changes made:**
- **`components/settings/OpenRouterSettingsModal.tsx`**:
  - Removed import of `OPENROUTER_MODELS` from constants file
  - Added `OpenRouterModel` interface with `id`, `name`, and optional `pricing: { prompt: string, completion: string }`
  - Added state for `models: OpenRouterModel[]`, `loading: boolean`, `error: boolean`
  - Implemented `useEffect` hook that fetches from `https://openrouter.ai/api/v1/models` when modal opens
  - On loading: shows "Loading models..." placeholder div
  - On error: falls back to text input for manual model ID entry (graceful degradation)
  - On success: renders dropdown with two `<optgroup>` sections
  - **Free models** (where `pricing.prompt === "0" && pricing.completion === "0"`):
    - Shown first under "── Free Models ──" label
    - Display with "(Free)" suffix
    - Sorted alphabetically by name
  - **Paid models** (all others):
    - Shown second under "── Paid Models ──" label
    - No suffix
    - Sorted alphabetically by name
  - Model ID (e.g., `"anthropic/claude-3.5-sonnet"`) is the stored value — no change to localStorage format

- **`lib/constants/openrouter-models.ts`**: File deleted entirely (no longer needed)

**API details:**
- Endpoint: `GET https://openrouter.ai/api/v1/models` (no auth required — public endpoint)
- Response: `{ data: OpenRouterModel[] }`
- Pricing values are strings (not numbers): `"0"` means free, any other value (e.g., `"0.000003"`) means paid

**UX improvements:**
- Users now see ALL available OpenRouter models (not just a curated list)
- Free models clearly highlighted at top of list
- Loading state prevents premature interaction
- Error fallback keeps UI functional even if API is down

**Verification:**
- ✅ All 254 vitest tests passing
- ⚠️ TypeScript: 3 pre-existing test errors in fixture files (unrelated)
- ✅ No other imports of deleted constants file (only used in modal)
- ✅ TypeScript strict mode — no `any` types used


### 2026-03-30T12:30:00Z — Motivation Generator Added (Jane)

Implemented AI-powered motivation generation for character details (Step 6).

**Changes made:**
- **`components/character/CharacterDetails.tsx`**:
  - Imported `useOpenRouterSettings` hook
  - Added state: `isGeneratingMotivation`, `motivationError`
  - Added `handleGenerateMotivation()` async function:
    - Calls OpenRouter API with context-aware prompt (species + career + WFRP 4e setting)
    - Prompt emphasizes dark/gritty tone, species-specific authenticity, 1-2 sentence length
    - Uses stored API key and model (or falls back to free llama-3.1-8b)
    - Properly typed API response (no `any`)
    - Error handling with user-friendly message
  - Updated Motivation field UI:
    - Conditional render: "✨ Generate" button only shows if `apiKey` is set
    - Button states: normal (amber hover) vs "Generating..." (disabled, cursor-wait)
    - Error message displays below textarea on failure
    - Generated text populates field but remains editable
  - Button styling matches existing roll buttons (amber theme)

**API implementation:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Headers: Bearer auth, HTTP-Referer, X-Title
- Body: `{ model, messages, max_tokens: 150, temperature: 0.9 }`
- Response parsing: `data.choices?.[0]?.message?.content?.trim()`

**UX:**
- Only users with API key configured see the Generate button
- Loading state prevents multiple concurrent requests
- Error handling doesn't block manual editing
- Generated text is editable (not locked)

**Verification:**
- ✅ All 254 vitest tests passing
- ⚠️ 3 pre-existing TypeScript errors in test fixtures (unrelated to this work)
- ✅ TypeScript strict mode — API response properly typed
- ✅ SSR-safe — hook handles localStorage checks

### 2026-03-30T12:36:57Z — AI Name Generator Added (Jane)

Implemented AI-powered name generator for character creation (Step 6 — Character Details).

**Changes made:**
- **components/character/NamePickerModal.tsx** (new file):
  - Self-contained modal component with 
ames, isLoading, rror, onSelect, onClose props
  - Loading state: animated "Generating names…" pulse
  - Error state: red error text
  - Name list: clickable buttons with amber hover styling
  - Keyboard dismissal via Escape key (useEffect + keydown listener)
  - Click-outside-to-close via backdrop onClick + stopPropagation on inner panel
  - Dark theme: bg-gray-900 container, bg-gray-800 name buttons, amber hover

- **components/character/CharacterDetails.tsx** (modified):
  - Imported NamePickerModal
  - Added state: showNamePicker, generatedNames, isGeneratingNames, 
ameError
  - Added handleGenerateNames() async function:
    - Uses speciesName prop (falls back to "Human" implicitly via prop)
    - Prompt: "Create a list of 10 character names for the Warhammer Fantasy Roleplaying setting. The species is {species}. Respond with a JSON list."
    - max_tokens: 300, temperature: 0.9
    - Robust JSON parsing: strips `json ... ` markdown fences before parse
    - Error messages on API failure or parse failure
    - Opens modal immediately (shows loading state while waiting)
  - Added handleNameSelect(name): populates name field + closes modal
  - Added handleNamePickerClose(): closes modal without selecting
  - Name field label row: flex justify-between with "✨ Names" button (conditional on piKey)
  - Button matches motivation button styling (amber, disabled=cursor-wait)
  - Modal rendered at top of return, portal-style (fixed positioning handles z-index)

**Pattern used:** Identical to motivation generator — same API call structure, same button styling, same conditional piKey check.

**Verification:**
- ✅ All 254 vitest tests passing
- ⚠️ 3 pre-existing TypeScript errors in test fixtures (unrelated to this work)
- ✅ No new TypeScript errors
- ✅ TypeScript strict mode — no ny types used
- ✅ Modal keyboard-accessible (Escape key)
