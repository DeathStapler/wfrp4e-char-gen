# HammerGen Lookup Reference

This directory contains tools to translate HammerGen's numeric/UUID ID system into human-readable names.

## Files

- **hammergen-lookup.json** - Static JSON reference file with all ID→name mappings
- **generate-lookup.js** - Script to regenerate lookup.json if source files change

## Usage

### In Code (TypeScript)

```typescript
import {
  getCharacteristic,
  getSkill,
  decodeCharacteristics,
  decodeSkills
} from '@/lib/utils/hammergen-lookup';

// Decode a single characteristic
const char = getCharacteristic(1); // "BS"

// Decode career characteristics array
const chars = decodeCharacteristics([1, 4, 9]); // ["BS", "I", "Fel"]

// Get a skill name
const skill = getSkill("5caddb56a48cc24ecc4eca90"); // "Secret Signs"

// Decode careers array
const skills = decodeSkills(careerObj.skills); // ["Skill1", "Skill2", ...]
```

### Manual Reference

Open **hammergen-lookup.json** in any editor:

```json
{
  "characteristics": {
    "1": "WS (Weapon Skill)",
    "2": "BS (Ballistic Skill)",
    ...
  },
  "skills": {
    "5caddb56a48cc24ecc4eca90": "Secret Signs",
    "5ce909813f5a...": "Lore - Witches",
    ...
  }
}
```

## Characteristic Mapping Quick Reference

| ID | Abbreviation | Full Name |
|----|--------------|-----------|
| 1 | WS | Weapon Skill |
| 2 | BS | Ballistic Skill |
| 3 | S | Strength |
| 4 | T | Toughness |
| 5 | I | Intuition |
| 6 | Ag | Agility |
| 7 | Dex | Dexterity |
| 8 | Int | Intelligence |
| 9 | WP | Willpower |
| 10 | Fel | Fellowship |

## Workflow

1. **Validate careers.json** - Use the lookup to verify skill/talent IDs match expected names
2. **Decode HammerGen exports** - When reviewing hammergen-career.json, look up IDs here
3. **Maintain alignment** - If hammergen-skill.json changes, regenerate lookup:
   ```bash
   node scripts/generate-lookup.js
   ```

## Example: Decoding a Career Level

From **hammergen-career.json** Soldier → Level 1:
```json
{
  "attributes": [1, 4, 9],
  "skills": ["5cadddd3a48c...", "5ce909813f5a...", ...],
  "talents": ["talent-id-1", "talent-id-2", ...]
}
```

Using lookup:
- Characteristics: [1, 4, 9] → [BS, I, Fel] ✓
- Skills: Look up each UUID in hammergen-lookup.json
- Talents: (TODO: add talents mapping)

This is exactly what **careers.json** should contain in human-readable form.
