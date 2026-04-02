---
description: Reference guide for HammerGen WFRP 4e source data and lookup systems
applyTo: '{hammergen-*.json,*careers.json,*lookup.json}'
---

# HammerGen Documentation Reference

## Quick Overview

HammerGen is the authoritative source for WFRP 4e character data. This project uses:

- **`hammergen-career.json`** — Career definitions with numeric/UUID IDs
- **`hammergen-skill.json`** — Skill definitions (397 skills with IDs and attributes)
- **`careers.json`** — Human-readable working format (must stay in sync with HammerGen)
- **`hammergen-lookup.json`** — Characteristics mapping (ID → abbreviation)
- **`hammergen-skill-indexed.json`** — Fast lookups by ID, name, or attribute

## Characteristic ID Mapping ⚠️ CRITICAL

All characteristics in HammerGen use numeric IDs (0-10). Always convert using this table:

| ID | Abbr | Full Name |
|----|------|-----------|
| 0 | WS | Weapon Skill |
| 1 | BS | Ballistic Skill |
| 2 | S | Strength |
| 3 | T | Toughness |
| 4 | I | Intelligence |
| 5 | Ag | Agility |
| 6 | Dex | Dexterity |
| 7 | Int | Intelligence (alt) |
| 8 | WP | Willpower |
| 9 | Fel | Fellowship |
| 10 | Def | Defence |

**Example:** Career advancement `"attributes": [1, 4, 9]` → `[BS, I, Fel]`

## Data Consistency Rules

### 1. Characteristic Changes
- **Source:** HammerGen numeric IDs in `hammergen-career.json`
- **Target:** Abbreviations in `data/careers.json`
- **Process:**
  1. Find career in `hammergen-career.json` (use grep for "Career Name")
  2. Extract numeric attribute array from each level
  3. Map IDs using table above
  4. Update `data/careers.json` with abbreviation forms
  5. Never use plain text abbreviations without verifying against HammerGen first

### 2. Skill References
- **Source:** Skill UUIDs in `hammergen-career.json` levels
- **Lookup:** Use `hammergen-skill-indexed.json` → `byId[uuid]` for name
- **Target:** Human-readable name in `data/careers.json`
- **Process:** Map each UUID → skill name via indexed lookup

### 3. Talent References
- **Note:** Talents are referenced in HammerGen but talent definitions not yet indexed
- **Current:** Accept talent UUIDs/names as provided in hammergen-career.json
- **TODO:** Create `hammergen-talent-indexed.json` when talent definitions available

## File Structure Reference

### hammergen-career.json Format
```json
{
  "name": "Career Name",
  "levels": [
    {
      "name": "Level Title",
      "status": 1,           // 0=Brass, 1=Silver, 2=Gold
      "standing": 1,         // Numeric standing (1-7)
      "attributes": [1, 4],  // ← NUMERIC IDs, convert to abbr
      "skills": ["uuid1", "uuid2"],
      "talents": ["talent-uuid"],
      "trappings": "Item1, Item2"
    },
    ...
  ]
}
```

### careers.json Format (Target)
```json
{
  "name": "Career Name",
  "levels": [
    {
      "name": "Level Title",
      "tier": "Silver",      // Text conversion of status
      "standing": 1,
      "characteristics": ["BS", "I"],  // ← TEXT abbr from IDs
      "skills": ["Skill Name 1", "Skill Name 2"],
      "talents": ["Talent Name"],
      "trappings": "Item1, Item2"
    },
    ...
  ]
}
```

## Common Tasks

### Validate/Fix a Career's Characteristics
1. Open `hammergen-career.json`, find career (Ctrl+F "Career Name")
2. Note numeric IDs in first level's "attributes" array
3. Convert each ID using the table above
4. Check `data/careers.json` has matching abbreviations
5. If mismatch, update with corrections from HammerGen

**Example:**
```
HammerGen Recruit: "attributes": [1, 4, 9]
Should be in careers.json: "characteristics": ["BS", "I", "Fel"]
```

### Look Up a Skill by UUID
```typescript
import skillIndexed from '@/docs/hammergen-skill-indexed.json';

const uuid = "5cadddd3a48cc24ecc4eca99";
const skillName = skillIndexed.byId[uuid].name;
// → "Ride"
```

### Reverse Look Up: Find ID by Name
```typescript
const skillName = "Ride";
const uuid = skillIndexed.byName[skillName];
// → "5cadddd3a48cc24ecc4eca99"
```

### Find All Skills for an Attribute
```typescript
const wpSkills = skillIndexed.byAttribute[8];
// → [{ id: "...", name: "Secret Signs" }, { id: "...", name: "Lore - Witches" }, ...]
```

## Regenerating Lookup Files

If `hammergen-skill.json` or `hammergen-career.json` are updated:

```bash
# Regenerate skill lookup
node scripts/generate-lookup.js

# Regenerate skill index
node scripts/index-skills.js

# Or both:
npm run refresh-hammergen
```

## Status Code Conversion

HammerGen uses numeric status, display format uses text:

| HammerGen | Display |
|-----------|---------|
| 0 | Brass |
| 1 | Silver |
| 2 | Gold |

Example: Career level with `"status": 1` → display as `"tier": "Silver"`

## When to Update careers.json

Update `data/careers.json` when:
- ✅ HammerGen source data is corrected (characteristics, skills, talents)
- ✅ A career was added to HammerGen and needs human-readable version
- ❌ Do NOT manually change characteristics without verifying HammerGen first
- ❌ Do NOT add careers that don't exist in HammerGen

## Validation Checklist

Before committing changes to `data/careers.json`:

- [ ] All characteristics are abbreviations (WS, BS, S, etc.), not numeric IDs
- [ ] Characteristic abbreviations match HammerGen numeric ID mappings
- [ ] Skill names match lookups in `hammergen-skill-indexed.json`
- [ ] Career names exist in `hammergen-career.json`
- [ ] Tier names (Brass/Silver/Gold) match HammerGen status codes
- [ ] Standing values match HammerGen (typically 1, 3, 5, 7 per tier)
- [ ] No orphaned skill/talent UUIDs (all can be resolved via lookup)