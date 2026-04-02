const fs = require('fs');
const path = require('path');

const careersPath = path.join(__dirname, '../data/careers.json');
const careers = JSON.parse(fs.readFileSync(careersPath, 'utf8'));

const issues = [];

careers.forEach(career => {
  if (career.levels && career.levels.length > 0) {
    const level1 = career.levels[0];
    const skillCount = level1.skills ? level1.skills.length : 0;
    
    if (skillCount !== 8) {
      issues.push({
        id: career.id,
        name: career.name,
        level1Title: level1.title,
        skillCount: skillCount,
        skills: level1.skills || []
      });
    }
  }
});

if (issues.length === 0) {
  console.log('✓ All careers have exactly 8 skills in level 1');
} else {
  console.log(`\n✗ ${issues.length} career(ies) with incorrect skill count in level 1:\n`);
  issues.forEach(issue => {
    console.log(`${issue.name} (${issue.id})`);
    console.log(`  Level: ${issue.level1Title}`);
    console.log(`  Skills: ${issue.skillCount} (should be 8)`);
    if (issue.skills.length > 0) {
      console.log(`  Skills listed:`, issue.skills.map(s => s.skill || s).join(', '));
    }
    console.log();
  });
}
