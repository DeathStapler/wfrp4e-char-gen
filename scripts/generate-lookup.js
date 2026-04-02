const fs = require('fs');
const path = require('path');

// Read the hammergen skill data
const skillPath = path.join(__dirname, '../docs/hammergen-skill.json');
const skillData = JSON.parse(fs.readFileSync(skillPath, 'utf8'));

// Build skill lookup
const lookup = {};
if (Array.isArray(skillData.data)) {
  skillData.data.forEach(item => {
    if (item.id && item.object?.name) {
      lookup[item.id] = item.object.name;
    }
  });
}

// Build characteristics map (1-indexed)
const characteristics = {
  '1': 'WS (Weapon Skill)',
  '2': 'BS (Ballistic Skill)',
  '3': 'S (Strength)',
  '4': 'T (Toughness)',
  '5': 'I (Intuition)',
  '6': 'Ag (Agility)',
  '7': 'Dex (Dexterity)',
  '8': 'Int (Intelligence)',
  '9': 'WP (Willpower)',
  '10': 'Fel (Fellowship)'
};

// Create reference file
const reference = {
  generated: new Date().toISOString(),
  description: 'Lookup reference for HammerGen IDs. Use these mappings to decode careers.json skill/talent IDs.',
  characteristics,
  skills: lookup,
  skillCount: Object.keys(lookup).length,
  note: 'Skills are indexed by their HammerGen UUID. To use: look up ID in this object to get the skill name.'
};

// Write the lookup file
const outPath = path.join(__dirname, '../docs/hammergen-lookup.json');
fs.writeFileSync(outPath, JSON.stringify(reference, null, 2));

console.log('✓ Created hammergen-lookup.json');
console.log('  Total skills mapped:', Object.keys(lookup).length);
console.log('\nCharacteristics mapping:');
Object.entries(characteristics).forEach(([id, char]) => {
  console.log(`  ${id}: ${char}`);
});
console.log('\nSample skills:');
Object.entries(lookup).slice(0, 5).forEach(([id, name]) => {
  console.log(`  ${id.substring(0, 12)}... → ${name}`);
});
