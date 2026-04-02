const fs = require('fs');
const path = require('path');

// Read the original hammergen skill data
const skillPath = path.join(__dirname, '../docs/hammergen-skill.json');
const skillData = JSON.parse(fs.readFileSync(skillPath, 'utf8'));

// Build indexed structures
const byId = {};
const byName = {};
const byAttribute = {};

if (Array.isArray(skillData.data)) {
  skillData.data.forEach(item => {
    if (item.id && item.object) {
      const obj = item.object;
      const name = obj.name || 'Unknown';
      const attribute = obj.attribute;
      
      // Index by ID (full object)
      byId[item.id] = {
        name,
        attribute,
        description: obj.description,
        displayZero: obj.displayZero,
        group: obj.group || [],
        isGroup: obj.isGroup,
        type: obj.type,
        source: obj.source || {}
      };
      
      // Index by name (ID only)
      byName[name] = item.id;
      
      // Index by attribute for bulk lookups
      if (!byAttribute[attribute]) {
        byAttribute[attribute] = [];
      }
      byAttribute[attribute].push({
        id: item.id,
        name
      });
    }
  });
}

// Create indexed file
const indexed = {
  generated: new Date().toISOString(),
  description: 'Indexed HammerGen skills for O(1) lookups by ID, name, or attribute',
  stats: {
    totalSkills: Object.keys(byId).length,
    totalNames: Object.keys(byName).length,
    attributesIndexed: Object.keys(byAttribute).length
  },
  byId,
  byName,
  byAttribute
};

const outPath = path.join(__dirname, '../docs/hammergen-skill-indexed.json');
fs.writeFileSync(outPath, JSON.stringify(indexed, null, 2));

console.log('✓ Created hammergen-skill-indexed.json');
console.log(`  Total skills: ${Object.keys(byId).length}`);
console.log(`  Indexed by: ID, Name, Attribute`);
console.log('\nSample lookups:');
console.log(`  byId["5caddb56a48cc24ecc4eca90"] = ${JSON.stringify(byId['5caddb56a48cc24ecc4eca90'], null, 4)}`);
console.log(`  byName["Secret Signs"] = ${byName['Secret Signs']}`);
console.log(`  byAttribute[8] (WP skills) has ${byAttribute[8].length} skills`);
