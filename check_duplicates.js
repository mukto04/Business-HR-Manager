const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n/dictionaries.ts', 'utf-8');

const enMatch = content.match(/en:\s*\{([\s\S]*?)\},\s*es:/);
if (enMatch) {
  const enStr = enMatch[1];
  const keys = new Set();
  const duplicates = new Set();
  
  const lines = enStr.split('\n');
  lines.forEach((line, index) => {
    const match = line.match(/^\s*"([^"]+)":/);
    if (match) {
      const key = match[1];
      if (keys.has(key)) {
        duplicates.add(key);
      } else {
        keys.add(key);
      }
    }
  });
  console.log("Duplicates in 'en':", Array.from(duplicates));
} else {
  console.log("Could not parse 'en' block.");
}
