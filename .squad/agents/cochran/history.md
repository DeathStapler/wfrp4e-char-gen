# Project Context

- **Owner:** Death_Stapler
- **Project:** Warhammer Fantasy Roleplay 4e Character Generator and repository
- **Stack:** Next.js 15 + TypeScript + Tailwind CSS v4
- **Created:** 2026-03-26

## Recent Work

📌 Team update (20260327T223814Z): Delivered 26 new tests for Step 4 & Step 9 rule validators (species skill selection, career skill allocation, career creation options). All 176 tests passing. Zero regressions. — Cochran

## Learnings

### 2026-03-28 — Talent Characteristic Bonus Tests Written

- **Task:** Added tests for `getTalentCharacteristicBonuses` (new function) and updated `getTotalCharacteristic` tests to cover the optional talent bonus parameter.
- **Test counts:** Added 8 new `getTalentCharacteristicBonuses` tests + 2 new `getTotalCharacteristic` tests (talent bonus of 0 and talent bonus of 5). Total suite went from 186 → 209 tests.
- **Bullock was already done:** By the time tests ran, Bullock had implemented `getTalentCharacteristicBonuses` in `characteristics.ts`, updated `getTotalCharacteristic` to accept `talentBonus?: number`, and populated `characteristicBonus` fields in `talents.json` for all 10 characteristic-bonus talents. All 10 new tests passed immediately on first run.
- **Talent type field confirmed:** `Talent.characteristicBonus?: { characteristic: CharacteristicKey; value: number }` — already existed in `lib/types/rules.ts`, just not yet populated in `data/talents.json` before Bullock's sprint.
- **Mock strategy:** Tests 1–6 use inline `Talent` mock objects (no JSON dependency) for isolation. Tests 7–8 import `talentsData from '../../../data/talents.json'` cast as `unknown as Talent[]` to verify against real data. This pattern mirrors `careers.test.ts` for JSON imports.
- **`getTotalCharacteristic` signature:** Extended to `(base, advances, talentBonus = 0)`. The two new tests confirm the third arg is optional (backward-compatible) and that it adds correctly to base + advances.

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-26 — Test Infrastructure Setup
- **Framework:** Vitest v4.x (not Jest). Config at `vitest.config.ts` in project root. No jsdom needed — pure node environment for rules engine logic.
- **Test location:** `lib/rules/__tests__/` — co-located with the rules engine stubs.
- **Test suites written:** `characteristics.test.ts` (21 tests) and `skills.test.ts` (15 tests). All 36 fail with `TypeError: X is not a function` — correct, stubs not yet implemented.
- **Import contract established:** Bullock's implementation must export these named functions from `lib/rules/characteristics.ts`: `getCharacteristicBonus`, `getTotalCharacteristic`, `getWoundThreshold`, `getXpCostForCharacteristicAdvance`, `rollStartingCharacteristic`. From `lib/rules/skills.ts`: `getSkillXpCost`, `getTotalSkillValue`, `getMaxSkillAdvances`.
- **`getWoundThreshold` expects an object arg:** `{ toughness: number, willpower: number, strength: number }` — Bullock must match this signature.
- **Rules flags:** Wound threshold formula has species variants (Halflings, Ogres). Career skill cost timing mid-career advancement needs corebook confirmation. Grouped skill advance caps need clarification. These are documented inline in the test files.

### 2026-03-26 — First Green Run: Bullock's Implementation Passes All Tests
- **Result:** 36/36 tests pass. Zero failures. Zero test bugs. Zero implementation gaps.
- **Verified rules (characteristics.ts):** `getCharacteristicBonus` (floor/10), `getTotalCharacteristic` (base + advances, 99-advance cap), `getWoundThreshold` (TB + 2×WPB + SB), `getXpCostForCharacteristicAdvance` (25 × (n+1)), `rollStartingCharacteristic` (base + roll).
- **Verified rules (skills.ts):** `getSkillXpCost` (career: 10×(n+1), non-career: 20×(n+1)), `getTotalSkillValue` (char + advances), `getMaxSkillAdvances` (10).
- **Export contract:** All 8 functions exported correctly from their respective modules — no missing exports, no signature mismatches.
- **Test gaps to fill next:** Species-specific wound thresholds (Halfling, Ogre), careers module tests (`lib/rules/careers.ts` exists, untested), wounds module tests (`lib/rules/wounds.ts` exists, untested). All blocked on Species/Career types landing.
- **No action required from Bullock.** Full results in `.squad/decisions/inbox/cochran-test-results.md`.

### 2026-03-27 — canAdvanceCareerLevel Tests Updated to Confirmed Rules

- **Trigger:** Death_Stapler provided verbatim corebook text for career level completion (p.58). Rules are now confirmed and locked.
- **Confirmed rules:**
  - ALL listed characteristics must reach the level threshold (5/10/15/20).
  - EIGHT (or more) of the listed skills must reach the level threshold.
  - At least 1 talent from the level's list must be taken.
  - Advances from prior careers count toward all thresholds.
- **Tests updated:** Rewrote the `canAdvanceCareerLevel` describe block in `lib/rules/__tests__/careers.test.ts` with 9 targeted tests covering all 8 confirmed rule scenarios. Removed old fixture variables (characterMeetingAll, characterMissingWS, characterMissingAthletics, characterMissingAll) that were written under uncertain assumptions.
- **New fixtures added:** `soldierLevel2` (level 2, 5 chars, 10 skills) and `soldierLevel4` (level 4, 8 chars, 10 skills) for multi-level threshold tests.
- **`getTotalXpForCareerLevel` tests updated:** Now reflect confirmed Level 1 minimum cost: all chars to 5 (375 XP each) + 8 skills to 5 (150 XP each) + 1 talent. Expected value for Soldier Level 1: 2,800 XP (was 1,700).
- **Surprise discovery:** Bullock's `canAdvanceCareerLevel` implementation already uses `required = level * 5` and the 8-skills rule — the implementation was ahead of the tests. All 9 `canAdvanceCareerLevel` tests PASS immediately.
- **Failing tests (2):** `getTotalXpForCareerLevel` Soldier L1 (expects 2,800, gets 1,700) and minimal level (expects 1,150, gets 450). Waiting on Bullock to update `getTotalXpForCareerLevel` to use level-appropriate thresholds and 8-skills-minimum.
- **Test run result:** 94 pass, 2 fail (both `getTotalXpForCareerLevel` — awaiting Bullock). All other suites remain green.

### 2026-03-27 — Careers and Wounds Test Suites Written
- **Test suites written:** `careers.test.ts` (32 tests) and `wounds.test.ts` (25 tests). Total: 57 new tests.
- **Final run result:** 91/93 passing. 2 intentional failures (see below). The original 36 tests continue to pass — no regressions.
- **Discovery:** Both `careers.ts` and `wounds.ts` were already implemented by Bullock before these tests were written. Tests were reconciled against Bullock's actual interfaces after initial authoring exposed signature mismatches.
- **Verified rules (careers.ts):** XP cost formulae (25×(n+1) for characteristics, 10×(n+1) for career skills, 20×(n+1) for non-career), flat 100xp talents, `isCareerSkill` slug-matching with anySpecialisation support, `canAdvanceCareerLevel` (≥1 characteristic advance, ≥5 skill advances, ≥1 talent), `getTotalXpForCareerLevel` (minimum completion cost: 1 char × 25, 5 skill × 150, 1 talent × 100).
- **Verified rules (wounds.ts):** `getWoundThreshold` (TB + 2×WPB + SB, positional args), `getHalflingWoundThreshold` (TB + 2×WPB, no SB), `getDwarfWoundThreshold` (same as standard; +2 via Species.extraWounds by caller), `getCurrentWounds` (clamped at 0), `isSeriouslyWounded` (≤0), `getCriticalWoundMagnitude` (max(0, damage − currentWounds)).
- **⚠️  2 failing tests flagging bugs in Bullock's implementation:**
  1. `getXpCostForCareerSkill(10)` — returns 110 instead of throwing/returning 0. Skills cap at 10; function must guard.
  2. `getXpCostForNonCareerSkill(10)` — same issue. Bullock needs to add `if (currentAdvances >= 10) throw RangeError` or return 0.
- **Rules flagged for human verification (5 items):** See `.squad/decisions/inbox/cochran-careers-wounds-tests.md` for full detail.

### 2026-03-27 — Team Update: Career Rules Implementation Complete (Bullock)

📌 Session completed 2026-03-27 12:47:18Z. Career advancement rules fixed and verified. canAdvanceCareerLevel already compliant with confirmed rules; getTotalXpForCareerLevel corrected to use level×5 threshold and 8-skill minimum. All 96 tests passing (up from 36 baseline). See .squad/log/2026-03-27-career-rules-complete.md for session summary and .squad/orchestration-log/2026-03-27T12-47-18Z-*.md for per-agent deliverables.

### Session — Post-Parallel-Sprint Verification (Bullock + Jane)

- **Trigger:** Death_Stapler requested verification after Bullock added `data/trappings.json`, `lib/storage/character-storage.ts`, `id`/`createdAt`/`updatedAt` to Character type, and `getStartingTrappings()` to careers.ts; Jane built wizard steps 4–6.
- **Baseline on entry:** 96/96 tests passing — no regressions from parallel sprint.
- **Character type change impact:** None. The `makeCharacter` fixture in `careers.test.ts` already included `id`, `createdAt`, and `updatedAt` fields — no test fixes needed.
- **New tests added:**
  - `getStartingTrappings` (8 tests) in `careers.test.ts` — covers normal combine, deduplication (exact), case-insensitive deduplication, empty class trappings, empty career trappings, both empty, level index 3, and casing-preservation-of-first-occurrence.
  - `character-storage.test.ts` (21 tests, new file) — covers `generateCharacterId` (uniqueness, UUID format, crypto-unavailable fallback), `saveCharacter`/`loadCharacter` round-trip (updatedAt stamping, createdAt preservation, null-on-missing, null-on-corrupt, null-on-missing-id-field, index management, no-dupe-in-index), `loadAllCharacters` (empty, multiple, corrupted index, missing data silently omitted), `deleteCharacter` (removal, index cleanup, idempotent, no side-effects).
  - localStorage polyfill strategy: `vi.stubGlobal('localStorage', makeLocalStorage())` in `beforeEach` — in-memory Map, resets between tests.
- **Final count:** 125/125 passing (was 96/96).

---

📌 Team update (2026-03-27T08:59:56): Species helpers implementation complete (bullock-starting-xp) and test verification complete (cochran-verify-suite). All 154 tests passing (125 baseline + 8 trappings + 21 storage). XP values pending user confirmation. See .squad/log/2026-03-27-species-helpers-test-verification.md for session summary.

### 2026-03-27: Team Update — Bullock & Jane End-to-End Flow Complete (2026-03-27T09:17:40Z)

📌 **End-to-end character creation → save → view flow now operational** — Bullock completed getTalentXpCost() and finalizeCharacter() exports. Jane completed character sheet view and list, wired wizard save flow. All 125 tests remain passing (0 regressions). Next test targets: character sheet rendering edge cases, localStorage round-trip validation, talent XP cost integration in Step 4 budget. Species starting skills selection deferred to next sprint.


### 2026-03-27 — Wealth Test Suite Written (wealth.test.ts)

- **Trigger:** Death_Stapler requested wealth tests while Bullock implements lib/rules/wealth.ts in parallel.
- **File written:** lib/rules/__tests__/wealth.test.ts — 20 tests across 4 describe blocks.
- **Test run result:** 125/125 existing tests pass. wealth.test.ts fails with Cannot find module '../wealth' (0 tests run) — correct and expected; Bullock's implementation not yet landed.
- **Import contract established:** Bullock's lib/rules/wealth.ts must export:
  - wealthToBrass(wealth: Wealth): number
  - rassToWealth(totalBrass: number): Wealth
  - getStartingWealthFormula(status: string): StartingWealthFormula
  - ollStartingWealth(status: string): Wealth
- **Currency constants verified:** 1 GC = 240 BP, 1 SS = 12 BP.
- **Dice mocking strategy:** i.spyOn(Math, 'random') with i.restoreAllMocks() in fterEach — deterministic boundary testing for brass/silver rolls; gold tier needs no mock (deterministic by rule).
- **Key edge cases covered:** zero wallet, single-denomination round trips, greedy breakdown (GC→SS→BP), invalid status throws, Gold tier determinism, all-values-non-negative invariant.
- **getStartingWealthFormula note:** diceCount records per-level dice (2 for Brass, 1 for Silver, 0 for Gold); level multiplier is applied at roll time, not in the formula descriptor.


### 2026-03-28: Wealth Test Suite Delivery (Session 2026-03-27T10-10-07Z)

📌 Team update — Wealth test suite complete (bullock-wealth-equipment, cochran-wealth-tests merged into decisions.md).

**lib/rules/__tests__/wealth.test.ts delivered:**
- 20 tests across 4 describe blocks: wealthToBrass (3 tests), brassToWealth (4 tests), getStartingWealthFormula (6 tests), rollStartingWealth (7 tests)
- Import contract established and matched perfectly by Bullock's implementation
- Uses \i.spyOn(Math, 'random')\ for deterministic mocking
- Covers all edge cases: zero wallet, mixed denominations, greedy breakdown, unknown tiers, all 3 status tiers, deterministic vs. stochastic rolls

**Currency constants verified:** 1 GC = 240 BP, 1 SS = 12 BP

**Gold tier determinism:** Verified that Gold tier always yields 0 coins (no roll) per corebook

**Test status:** All 150 tests passing (125 baseline + 25 wealth). Zero failures on Bullock's implementation landing — contract was perfectly matched.

**Notes for future work:** \description\ field on \StartingWealthFormula\ is optional (spec called required; tests didn't use it). Dice count is per-level multiplier, applied at roll time.

### 2026-03-28 — XP Cost Tests Updated to Tiered Table

- **Trigger:** Bullock rewrote `getXpCostForCharacteristicAdvance` (characteristics.ts) and `getSkillXpCost` (skills.ts) to use the WFRP 4e tiered XP cost table. Old linear-formula tests were failing.
- **characteristics.test.ts:** Replaced 5 old tests (linear `25×(n+1)` formula) with 12 new tests covering all 10 tier boundaries. Old test descriptions removed: "costs 25xp for the first advance", "costs 50xp for the second advance", "costs 75xp for the third advance", "scales linearly: cost = 25 × (advances + 1)", "is expensive at high advance counts".
- **skills.test.ts:** Removed both `getSkillXpCost — career skill` (5 tests) and `getSkillXpCost — non-career skill` (5 tests) describe blocks. Replaced with a single `getSkillXpCost` block (13 tests) covering all 10 tier boundaries plus a test confirming `isCareerSkill` is ignored. The non-career double-cost behavior no longer exists.
- **Test counts:** Before: 176 tests (5 char XP tests + 10 skill XP tests). After: 186 tests (12 char XP tests + 13 skill XP tests). Net: +10 tests.
- **All 186 tests pass. Zero type errors (`npx tsc --noEmit` clean).**
- **Tiered table verified (both files):**
  - Characteristics: 0–5→25, 6–10→30, 11–15→40, 16–20→50, 21–25→70, 26–30→90, 31–35→120, 36–40→150, 41–45→190, 46–50→230
  - Skills: 0–5→10, 6–10→15, 11–15→20, 16–20→30, 21–25→40, 26–30→60, 31–35→80, 36–40→110, 41–45→140, 46–50→180


**New tests added — 26 tests across 3 files:**

**lib/rules/__tests__/species.test.ts (new file — 12 tests):**
- alidateSpeciesSkillSelections: 8 tests covering valid 3+3 selection, duplicate skill error, too many at +5 or +3, skill not in pool, too few at +5, empty selections, and exact 6-skill edge case.
- getSpeciesSkillAdvances: 4 tests covering +5 tier, +3 tier, unselected skill (→0), empty selections (→0).

**lib/rules/__tests__/skills.test.ts (11 new tests appended):**
- alidateCareerSkillAllocation: 8 tests — valid 8×5=40, total <40 error, total >40 error, single skill >10 cap error, skill not in career list error, 40 on one skill (cap violation), 4×10=40 valid, empty allocation error.
- getTotalAllocatedAdvances: 3 tests — normal sum, empty array →0, single entry.

**lib/rules/__tests__/careers.test.ts (3 new tests appended):**
- getCareerCreationOptions: Level 1 characteristics/skills/talents count+contents (Apothecary from real data), Level 2 returns L2 not L1 data, invalid level throws.

**Human pool used for species tests:** 12 skills from data/species.json species human.
**Apothecary career used for career tests:** First entry in data/careers.json, imported as real JSON.

**Test status: 176 tests passing (150 baseline + 26 new). Zero failures.**

📌 Team update (2026-05-01T00:00:00Z): Bullock added characteristicBonus field to Talent interface and 10 talent entries in data/talents.json; getTalentCharacteristicBonuses() + updated getTotalCharacteristic() in characteristics.ts. Jane updated display layer (AdvancementStep, character sheet, CharacterWizard). Test suite grew from 199 to 209 in this session. — decided by Bullock, Jane

📌 Team update (2026-05-01T00:00:00Z): XP cost fix (bullock-xp-cost-fix) requires Cochran to update 13 tests: 4 in characteristics.test.ts, 9 in skills.test.ts — all encoded old incorrect linear formulas. Correct values now in decisions.md under "Correct XP Cost Table". — decided by Bullock
