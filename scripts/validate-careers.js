const fs = require('fs');
const path = require('path');

// Read source files
const careerPath = path.join(__dirname, '../docs/hammergen-career.json');
const careersPath = path.join(__dirname, '../data/careers.json');
const skillIndexPath = path.join(__dirname, '../docs/hammergen-skill-indexed.json');

const careerFile = JSON.parse(fs.readFileSync(careerPath, 'utf8'));
const careerData = careerFile.data || careerFile;
const careersData = JSON.parse(fs.readFileSync(careersPath, 'utf8'));
const skillIndex = JSON.parse(fs.readFileSync(skillIndexPath, 'utf8'));

// Characteristic ID → abbreviation mapping (1-indexed)
const CHARACTERISTICS = {
  1: 'WS', 2: 'BS', 3: 'S', 4: 'T', 5: 'I', 6: 'Ag',
  7: 'Dex', 8: 'Int', 9: 'WP', 10: 'Fel'
};

// Status code → tier mapping
const STATUS_MAP = { 0: 'Brass', 1: 'Silver', 2: 'Gold' };

// Build lookup by career name for easier matching
const careersLookup = {};
careersData.forEach(c => {
  careersLookup[c.name.toLowerCase()] = c;
});

const issues = [];
const fixes = [];

// Validate each career
careerData.forEach(hammergenCareerItem => {
  const hammergenCareer = hammergenCareerItem.object;
  if (!hammergenCareer || !hammergenCareer.name) return; // Skip invalid entries
  
  const careerName = hammergenCareer.name;
  const careersVersion = careersLookup[careerName.toLowerCase()];

  if (!careersVersion) {
    issues.push(`❌ MISSING: "${careerName}" in careers.json`);
    return;
  }

  // HammerGen stores levels as level1, level2, level3, level4, level5
  const hammergenLevels = [
    hammergenCareer.level1,
    hammergenCareer.level2,
    hammergenCareer.level3,
    hammergenCareer.level4,
    hammergenCareer.level5
  ].filter(l => l && l.exists !== false);

  // Compare levels
  hammergenLevels.forEach((hgLevel, levelIdx) => {
    if (!hgLevel.name) return; // Skip empty levels
    
    const dgLevel = careersVersion.levels[levelIdx];
    if (!dgLevel) {
      issues.push(`  ⚠️  ${careerName} L${levelIdx + 1}: Missing in careers.json`);
      return;
    }

    // Check characteristics
    const expectedChars = hgLevel.attributes
      .map(id => CHARACTERISTICS[id])
      .filter(Boolean);
    
    const actualChars = dgLevel.characteristics || [];
    
    if (JSON.stringify(expectedChars.sort()) !== JSON.stringify(actualChars.sort())) {
      issues.push(
        `  ❌ ${careerName} → ${hgLevel.name}\n` +
        `     Expected chars: [${expectedChars.join(', ')}]\n` +
        `     Got:           [${actualChars.join(', ')}]`
      );
      fixes.push({
        career: careerName,
        level: levelIdx,
        field: 'characteristics',
        expected: expectedChars,
        actual: actualChars
      });
    }

    // Check tier/standing
    const expectedTier = STATUS_MAP[hgLevel.status];
    const expectedStanding = hgLevel.standing;
    const actualTier = dgLevel.status?.tier;
    const actualStanding = dgLevel.status?.standing;

    if (expectedTier !== actualTier || expectedStanding !== actualStanding) {
      issues.push(
        `  ⚠️  ${careerName} → ${hgLevel.name} tier/standing\n` +
        `     Expected: ${expectedTier} ${expectedStanding}\n` +
        `     Got:      ${actualTier} ${actualStanding}`
      );
    }

    // Check skills (basic count)
    const expectedSkillCount = hgLevel.skills?.length || 0;
    const actualSkillCount = (dgLevel.skills || []).length;

    if (expectedSkillCount !== actualSkillCount) {
      issues.push(
        `  ⚠️  ${careerName} → ${hgLevel.name} skills\n` +
        `     Expected: ${expectedSkillCount}, Got: ${actualSkillCount}`
      );
    }
  });
});

// Report findings
console.log('\n=== VALIDATION REPORT ===\n');

if (issues.length === 0) {
  console.log('✅ All careers validated successfully!\n');
} else {
  console.log(`Found ${issues.length} issues:\n`);
  issues.forEach(issue => console.log(issue));
  console.log(`\n\nFixes needed: ${fixes.length}`);
  
  if (fixes.length > 0) {
    console.log('\nCharacteristic fixes required:');
    fixes.forEach(fix => {
      console.log(`  ${fix.career} Level ${fix.level + 1}: [${fix.expected.join(', ')}]`);
    });
  }
}

// Export fixes for use in correction script
fs.writeFileSync(
  path.join(__dirname, '../docs/validation-report.json'),
  JSON.stringify({ issues, fixes }, null, 2)
);
console.log('\n📋 Full report saved to docs/validation-report.json');
