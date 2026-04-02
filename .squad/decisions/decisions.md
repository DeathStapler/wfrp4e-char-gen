# Team Decisions

Shared decision log. Merged by Scribe. Read by all agents.

---

### 2026-03-26: Project scaffolded — Next.js + TypeScript + Tailwind
**By:** Swearengen  
**What:** Next.js App Router project initialized. Stack: Next.js, TypeScript (strict), Tailwind CSS. Folder structure: app/, components/character/, components/ui/, lib/rules/, lib/types/, data/. Static JSON for all WFRP reference data.  
**Why:** Stack approved by Death_Stapler. Static JSON keeps infrastructure minimal; rules engine in lib/rules/ keeps business logic separate from UI.  
**Status:** DECIDED

---

### 2026-03-27: Starting XP & Species Skills Data Shape
**By:** Bullock  
**Date:** 2026-03-27  
**Status:** IMPLEMENTED — for team review

#### Starting XP Values
Implemented per-species starting XP in `lib/rules/species.ts`:
- **Human:** 20 XP
- **Dwarf:** 25 XP
- **Halfling:** 20 XP
- **High-Elf:** 30 XP
- **Wood-Elf:** 30 XP

⚠️ **ACTION NEEDED:** Verify against physical corebook. No fixed XP table found in extracted docs; values sourced from task brief and WFRP 4e design principle (elder species start with more experience).

#### Species Skills Data Shape
- All five species have exactly 12 skills in `startingSkills`
- Skills are a **pool, not auto-grants** (player picks 3 for +5 advances, 3 for +3 advances per rulebook p.35)
- `getSpeciesFixedSkills()` returns `[]` for all species by design
- `startingTalents` mixes fixed talents and choice talents (X or Y format)

#### Fixed Talents Per Species
- **Human:** `["Doomed"]`
- **Dwarf:** `["Magic Resistance", "Night Vision", "Sturdy"]`
- **Halfling:** `["Acute Sense (Taste)", "Night Vision", "Resistance (Chaos)", "Small"]`
- **High-Elf:** `["Acute Sense (Sight)", "Night Vision", "Read/Write"]`
- **Wood-Elf:** `["Acute Sense (Sight)", "Night Vision", "Rover"]`

#### Functions Implemented
- `getStartingXP(speciesId)` — returns XP, throws on unknown species
- `getSpeciesFixedSkills(speciesId, speciesData)` — always returns `[]`
- `getSpeciesFixedTalents(speciesId, speciesData)` — returns non-choice talents

**Verification:** TypeScript 0 errors, 125/125 tests passing (pre-existing)

---

### 2026-03-27: Test Verification — Post Parallel Sprint (Bullock + Jane)
**By:** Cochran  
**Date:** 2026-03-27  
**Status:** VERIFIED — All tests passing

#### Summary
| Component | Tests | Status |
|-----------|-------|--------|
| Baseline  | 96    | ✅ All passing |
| New: getStartingTrappings | 8 | ✅ All passing |
| New: character-storage | 21 | ✅ All passing |
| **Total** | **125** | **✅ 100% pass rate** |

**Net new tests:** +29 (8 trappings + 21 storage)  
**Regressions:** 0 from Bullock + Jane parallel changes

#### getStartingTrappings Tests (8 tests)
- Normal combine (class + career, no overlap) → all items present, class first
- Deduplication — exact match, case-insensitive, both empty, career/class empty only
- Level index handling (Level 4 = index 3)
- Casing preservation: first occurrence wins

#### character-storage Tests (21 tests)
- `generateCharacterId`: non-empty, unique, UUID v4 format, crypto-unavailable fallback
- `saveCharacter` / `loadCharacter`: round-trip, `updatedAt` stamped, `createdAt` preserved, null on missing/corrupt, index populated, no duplication
- `loadAllCharacters`: empty store, multiple characters, corrupted index handling
- `deleteCharacter`: removes character, removes from index, idempotent

**localStorage strategy:** In-memory Map polyfill via `vi.stubGlobal`, resets cleanly between tests.

**TypeScript:** 0 errors  
**Overall:** No regressions, suite stable and ready for next features
