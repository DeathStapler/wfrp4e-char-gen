const fs = require('fs');
const path = require('path');

// Read both files
const careersPath = path.join(__dirname, '../data/careers.json');
const correctedPath = path.join(__dirname, '../data/careers-corrected.json');

const careers = JSON.parse(fs.readFileSync(careersPath, 'utf8'));
const corrected = JSON.parse(fs.readFileSync(correctedPath, 'utf8'));

// Create a map of corrected careers by ID
const correctedMap = {};
corrected.forEach(career => {
  correctedMap[career.id] = career;
});

// Update characteristics in careers
let updatedCount = 0;
careers.forEach((career, careerIdx) => {
  const correctedCareer = correctedMap[career.id];
  
  if (correctedCareer && career.levels && correctedCareer.levels) {
    career.levels.forEach((level, levelIdx) => {
      const correctedLevel = correctedCareer.levels[levelIdx];
      
      if (correctedLevel && correctedLevel.characteristics) {
        if (JSON.stringify(level.characteristics) !== JSON.stringify(correctedLevel.characteristics)) {
          level.characteristics = correctedLevel.characteristics;
          updatedCount++;
        }
      }
    });
  }
});

// Write back to careers.json
fs.writeFileSync(careersPath, JSON.stringify(careers, null, 2), 'utf8');

console.log(`✓ Updated characteristics for ${updatedCount} levels`);
console.log('File saved to:', careersPath);
