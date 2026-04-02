const fs = require('fs');
const path = require('path');

// Read source files
const careersFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/careers.json'), 'utf8'));
const careerFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/hammergen-career.json'), 'utf8'));
const skillIndexed = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/hammergen-skill-indexed.json'), 'utf8'));

// Try to load talent lookup (will be empty if not available yet)
let talentLookup = {};
try {
  const talentLookupFile = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/hammergen-talent-lookup.json'), 'utf8'));
  talentLookup = talentLookupFile.talents || {};
} catch (e) {
  // Talent lookup not available yet
}

const careerData = careerFile.data || careerFile;

// Get list of career names to process from current careers.json
const careersToProcess = new Set(
  careersFile
    .filter(c => c.name)
    .map(c => c.name)
);

console.log(`\n📋 Processing ${careersToProcess.size} careers from careers.json\n`);

// Mapping (1-indexed)
const CHARACTERISTICS = {
  1: 'WS', 2: 'BS', 3: 'S', 4: 'T', 5: 'I', 6: 'Ag',
  7: 'Dex', 8: 'Int', 9: 'WP', 10: 'Fel'
};

const STATUS_MAP = { 0: 'Brass', 1: 'Silver', 2: 'Gold' };
const CLASS_MAP = { 0: 'Peasant', 1: 'Warrior', 2: 'Ranger', 3: 'Riverfolk', 4: 'Rogue' };

// Convert career from HammerGen format
function convertCareer(hammergenItem) {
  const hg = hammergenItem.object;
  if (!hg?.name) return null;

  // Only process careers that exist in current careers.json
  if (!careersToProcess.has(hg.name)) {
    return null;
  }

  const career = {
    id: hg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    name: hg.name,
    careerClass: CLASS_MAP[hg.class] || 'Unknown',
  };

  if (hg.description) {
    career.description = hg.description;
  }

  // Convert levels
  career.levels = [];
  
  for (let i = 1; i <= 4; i++) {
    const levelKey = `level${i}`;
    const hgLevel = hg[levelKey];
    
    if (!hgLevel || !hgLevel.exists) continue;

    const level = {
      level: i,
      title: hgLevel.name,
      status: {
        tier: STATUS_MAP[hgLevel.status] || 'Unknown',
        standing: hgLevel.standing
      },
      characteristics: hgLevel.attributes
        .map(id => CHARACTERISTICS[id])
        .filter(Boolean),
      skills: hgLevel.skills.map(skillId => {
        const skillInfo = skillIndexed.byId[skillId];
        // Return skill with name; specialisation will be merged from original if available
        return skillInfo ? { skill: skillInfo.name } : { skill: `UNKNOWN(${skillId})` };
      }),
      talents: hgLevel.talents.map(talentId => ({
        talent: talentLookup[talentId] || `TALENT_ID:${talentId}`
      })),
      trappings: hgLevel.items ? hgLevel.items.split(',').map(t => t.trim()) : []
    };

    // Try to merge specialisations and talent names from original careers.json
    const originalCareer = careersFile.find(c => c.name === hg.name);
    if (originalCareer && originalCareer.levels[i - 1]) {
      const originalLevel = originalCareer.levels[i - 1];
      
      // Merge skill specialisations from original
      if (originalLevel.skills && Array.isArray(originalLevel.skills)) {
        level.skills.forEach((skill, idx) => {
          const originalSkill = originalLevel.skills[idx];
          if (originalSkill && originalSkill.specialisation) {
            skill.specialisation = originalSkill.specialisation;
          }
        });
      }
      
      // Merge talent names from original
      if (originalLevel.talents && Array.isArray(originalLevel.talents)) {
        level.talents.forEach((talent, idx) => {
          const originalTalent = originalLevel.talents[idx];
          if (originalTalent && originalTalent.talent && !talent.talent.startsWith('TALENT_ID:')) {
            talent.talent = originalTalent.talent;
          }
        });
      }
    }

    career.levels.push(level);
  }

  return career;
}

// Convert only selected careers
const convertedCareers = careerData
  .map(convertCareer)
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(`✅ Converted ${convertedCareers.length} careers\n`);

if (convertedCareers.length > 0) {
  console.log('Careers to update:');
  convertedCareers.slice(0, 10).forEach(c => {
    console.log(`  • ${c.name} (${c.careerClass}): ${c.levels.length} levels`);
  });
  if (convertedCareers.length > 10) {
    console.log(`  ... and ${convertedCareers.length - 10} more`);
  }
}

// Write output
const outPath = path.join(__dirname, '../data/careers-corrected.json');
fs.writeFileSync(outPath, JSON.stringify(convertedCareers, null, 2));
console.log(`\n📝 Corrected careers saved to: data/careers-corrected.json`);
console.log(`\n⚠️  Review before replacing careers.json!`);
console.log(`\nTo apply changes:`);
console.log(`  mv data/careers-corrected.json data/careers.json`);
