const fs = require('fs');
const path = require('path');

// Read HammerGen career data
const careerFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/hammergen-career.json'), 'utf8'));
const careerData = careerFile.data || careerFile;

// Extract all talent IDs and try to find their names
const talentMap = {};

// Go through all careers and levels to find talent IDs
careerData.forEach(careerItem => {
  const hg = careerItem.object;
  if (!hg) return;

  for (let i = 1; i <= 5; i++) {
    const levelKey = `level${i}`;
    const level = hg[levelKey];
    if (!level || !level.talents) continue;

    level.talents.forEach(talentId => {
      // Try to find talent name in the career data (some talents might have metadata)
      // For now, just collect the IDs
      if (!talentMap[talentId]) {
        talentMap[talentId] = `TALENT:${talentId}`;
      }
    });
  }
});

console.log(`Found ${Object.keys(talentMap).length} unique talent IDs`);
console.log('\nSample talent IDs:');
Object.entries(talentMap).slice(0, 10).forEach(([id, name]) => {
  console.log(`  ${id}: ${name}`);
});

// Save talent lookup
const outPath = path.join(__dirname, '../docs/hammergen-talent-lookup.json');
fs.writeFileSync(outPath, JSON.stringify({
  generated: new Date().toISOString(),
  description: 'Talent ID lookups - these need to be mapped to talent names manually or from talent definitions',
  totalTalents: Object.keys(talentMap).length,
  talents: talentMap
}, null, 2));

console.log(`\n📝 Talent lookup saved to: docs/hammergen-talent-lookup.json`);
console.log(`\n⚠️  Note: Talent names are not available yet. You'll need to:`);
console.log(`  1. Find talent definitions in HammerGen source data`);
console.log(`  2. Map each talent ID to its name`);
console.log(`  3. Replace TALENT_ID: placeholders with actual names`);
